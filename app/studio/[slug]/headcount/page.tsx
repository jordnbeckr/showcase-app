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
      spectators: { orderBy: { createdAt: 'asc' } },
    },
  })
  if (!studio) return <p>Studio not found</p>

  const heatEntryCount = await db.heatEntry.count({
    where: { student: { studioId: studio.id } },
  })

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
        spectators={studio.spectators.map(s => ({ id: s.id, name: s.name, guestOf: s.guestOf }))}
      />
    </>
  )
}
