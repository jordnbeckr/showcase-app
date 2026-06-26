import { db } from '@/lib/db'
import { getSession } from '@/lib/session'
import ShowsManager from './ShowsManager'

export default async function ShowsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const session = await getSession()
  if (session?.role !== 'studio') return null

  const studio = await db.studio.findUnique({
    where: { slug },
    include: {
      students: { orderBy: { lastName: 'asc' } },
      instructors: { orderBy: { name: 'asc' } },
      proShows: { orderBy: { createdAt: 'asc' } },
      studentShows: {
        include: { students: true },
        orderBy: { createdAt: 'asc' },
      },
    },
  })

  if (!studio) return <p>Studio not found</p>

  return (
    <div className="max-w-3xl space-y-8">
      <h1 className="text-2xl font-bold">Shows</h1>
      <ShowsManager
        slug={slug}
        students={studio.students.map(s => ({ id: s.id, name: `${s.firstName} ${s.lastName}` }))}
        instructors={studio.instructors.map(i => ({ id: i.id, name: i.name }))}
        proShows={studio.proShows}
        studentShows={studio.studentShows.map(ss => ({
          ...ss,
          students: ss.students.map(s => `${s.firstName} ${s.lastName}`),
        }))}
      />
    </div>
  )
}
