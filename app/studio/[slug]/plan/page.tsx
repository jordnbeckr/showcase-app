import { db } from '@/lib/db'
import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'
import PlanGrid from './PlanGrid'

export const dynamic = 'force-dynamic'

export default async function PlanPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const session = await getSession()
  if (session?.role !== 'studio' || session.studioSlug !== slug) redirect('/login/studio')

  const studio = await db.studio.findUnique({
    where: { slug },
    include: {
      instructors: { orderBy: { name: 'asc' } },
      students: { orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }] },
    },
  })
  if (!studio) redirect('/login/studio')

  const danceTypes = await db.danceType.findMany({ orderBy: { order: 'asc' } })

  // Count available heats per dance+category so the grid shows only real slots
  const heatCounts = await db.heat.groupBy({
    by: ['danceTypeId', 'category'],
    _count: { id: true },
    where: { category: { in: ['closed', 'open'] } },
  })

  const planEntries = await db.planEntry.findMany({
    where: { studioId: studio.id },
    include: {
      student: true,
      instructor: true,
      danceType: true,
    },
    orderBy: { createdAt: 'asc' },
  })

  return (
    <PlanGrid
      slug={slug}
      instructors={studio.instructors.map(i => ({ id: i.id, name: i.name }))}
      students={studio.students.map(s => ({
        id: s.id,
        firstName: s.firstName,
        lastName: s.lastName,
      }))}
      danceTypes={danceTypes.map(d => ({ id: d.id, name: d.name }))}
      heatCounts={heatCounts.map(h => ({ danceTypeId: h.danceTypeId, category: h.category as 'closed' | 'open', count: h._count.id }))}
      planEntries={planEntries.map(e => ({
        id: e.id,
        instructorId: e.instructorId,
        studentId: e.studentId,
        danceTypeId: e.danceTypeId,
        category: e.category as 'closed' | 'open',
        slotIndex: e.slotIndex,
        isPublished: e.isPublished,
      }))}
    />
  )
}
