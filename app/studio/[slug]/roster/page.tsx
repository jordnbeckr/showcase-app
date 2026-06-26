import { db } from '@/lib/db'
import { getSession } from '@/lib/session'
import RosterManager from './RosterManager'

export default async function RosterPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const session = await getSession()
  if (session?.role !== 'studio') return null

  const studio = await db.studio.findUnique({
    where: { slug },
    include: { students: { orderBy: [{ role: 'asc' }, { lastName: 'asc' }] } },
  })

  if (!studio) return <p>Studio not found</p>

  return (
    <div className="max-w-2xl space-y-4">
      <h1 className="text-2xl font-bold">Student Roster</h1>
      <p className="text-sm text-gray-500">{studio.students.length} students</p>
      <RosterManager slug={slug} students={studio.students} />
    </div>
  )
}
