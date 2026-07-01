import { db } from '@/lib/db'
import LeadersManager from './LeadersManager'

export const dynamic = 'force-dynamic'

export default async function LeadersPage() {
  const [studios, students] = await Promise.all([
    db.studio.findMany({
      include: {
        instructors: { orderBy: { name: 'asc' } },
      },
      orderBy: { name: 'asc' },
    }),
    db.student.findMany({
      where: { role: 'Leader' },
      include: { studio: true },
      orderBy: [{ leaderNumber: 'asc' }, { lastName: 'asc' }],
    }),
  ])

  const instructors = studios.flatMap(s =>
    s.instructors.map(i => ({
      id: i.id,
      name: i.name,
      studioName: s.name,
      role: i.role,
      leaderNumber: i.leaderNumber,
    }))
  )

  const studentLeaders = students.map(s => ({
    id: s.id,
    name: `${s.firstName} ${s.lastName}`,
    studioName: s.studio.name,
    leaderNumber: s.leaderNumber,
  }))

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div>
        <h1 className="text-xl font-bold text-center">Leader Numbers</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--muted)' }}>
          Mark instructor roles, then auto-assign numbers: instructors start at 100, Leader students start at 200 — both sorted alphabetically by last name across <em>all</em> studios.
        </p>
      </div>
      <LeadersManager instructors={instructors} studentLeaders={studentLeaders} />
    </div>
  )
}
