import { db } from '@/lib/db'
import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'
import StudentsTab from './StudentsTab'

export const dynamic = 'force-dynamic'

export default async function StudentsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const session = await getSession()
  if (session?.role !== 'studio' || session.studioSlug !== slug) redirect('/login/studio')

  const studio = await db.studio.findUnique({
    where: { slug },
    include: {
      students: { orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }] },
      studentBillings: true,
      lunchGuests: { orderBy: { id: 'asc' } },
    },
  })
  if (!studio) redirect('/login/studio')

  // Heat counts per student for this studio
  const studentIds = studio.students.map(s => s.id)
  const heatEntries = studentIds.length > 0 ? await db.heatEntry.findMany({
    where: {
      studentId: { in: studentIds },
      instructorId: { not: null },
    },
    select: { studentId: true },
  }) : []

  const heatCountByStudent: Record<number, number> = {}
  for (const e of heatEntries) {
    heatCountByStudent[e.studentId] = (heatCountByStudent[e.studentId] ?? 0) + 1
  }

  return (
    <StudentsTab
      slug={slug}
      config={{
        depositAmount: studio.depositAmount,
        requiresDeposit: studio.requiresDeposit,
        heatPrice: studio.heatPrice,
        lunchTicketPrice: studio.lunchTicketPrice,
        maxFreeHeats: studio.maxFreeHeats,
      }}
      students={studio.students.map(s => ({
        id: s.id,
        firstName: s.firstName,
        lastName: s.lastName,
        heatCount: heatCountByStudent[s.id] ?? 0,
        billing: studio.studentBillings.find(b => b.studentId === s.id) ?? null,
      }))}
      lunchGuests={studio.lunchGuests}
    />
  )
}
