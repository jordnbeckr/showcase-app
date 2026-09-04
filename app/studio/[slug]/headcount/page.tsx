import { db } from '@/lib/db'
import { getSession } from '@/lib/session'
import HeadCountView from './HeadCountView'

export const dynamic = 'force-dynamic'

export default async function HeadCountPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const session = await getSession()
  if (session?.role !== 'studio') return null

  const studio = await db.studio.findUnique({
    where: { slug },
    include: {
      students: true,
      instructors: true,
      lunchGuests: { orderBy: { id: 'asc' } },
    },
  })
  if (!studio) return <p>Studio not found</p>

  const [heatEntryCount, studentsWithHeats] = await Promise.all([
    db.heatEntry.count({ where: { student: { studioId: studio.id } } }),
    db.student.findMany({
      where: { studioId: studio.id, heatEntries: { some: {} } },
      select: { id: true, firstName: true, lastName: true },
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    }),
  ])

  return (
    <>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-center mb-1">Head Count — {studio.name}</h1>
        <p className="text-sm text-center" style={{ color: 'var(--muted)' }}>
          Track participants and spectators for the showcase.
        </p>
      </div>
      <HeadCountView
        slug={slug}
        studentCount={studio.students.length}
        instructorCount={studio.instructors.length}
        heatEntryCount={heatEntryCount}
        lunchGuests={studio.lunchGuests}
        studentsWithHeats={studentsWithHeats}
      />
    </>
  )
}
