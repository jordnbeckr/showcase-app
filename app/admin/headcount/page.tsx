import { db } from '@/lib/db'
import { getSession } from '@/lib/session'

export const dynamic = 'force-dynamic'

export default async function AdminHeadCountPage() {
  const session = await getSession()
  if (session?.role !== 'admin') return null

  const [studios, allEntries] = await Promise.all([
    db.studio.findMany({
      orderBy: { name: 'asc' },
      include: {
        students: { select: { id: true } },
        instructors: { select: { id: true } },
        lunchGuests: { orderBy: { id: 'asc' } },
      },
    }),
    db.heatEntry.findMany({
      select: { studentId: true, instructorId: true, student: { select: { studioId: true } } },
    }),
  ])

  const studioRows = studios.map(studio => {
    const entries = allEntries.filter(e => e.student.studioId === studio.id)
    const participantStudentIds = new Set(entries.map(e => e.studentId))
    const participantInstructorIds = new Set(entries.filter(e => e.instructorId != null).map(e => e.instructorId!))
    return {
      id: studio.id,
      name: studio.name,
      studentCount: studio.students.length,
      instructorCount: studio.instructors.length,
      participantCount: participantStudentIds.size + participantInstructorIds.size,
      heatEntryCount: entries.length,
      lunchGuests: studio.lunchGuests,
    }
  })

  const totalStudents = studioRows.reduce((s, r) => s + r.studentCount, 0)
  const totalInstructors = studioRows.reduce((s, r) => s + r.instructorCount, 0)
  const totalParticipants = studioRows.reduce((s, r) => s + r.participantCount, 0)
  const totalSpectators = studioRows.reduce((s, r) => s + r.lunchGuests.length, 0)

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-center">Head Count</h1>
        <p className="text-sm mt-0.5 text-center" style={{ color: 'var(--muted)' }}>
          Participants and spectators across all studios.
        </p>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Students', value: totalStudents },
          { label: 'Instructors', value: totalInstructors },
          { label: 'Participants (in heats)', value: totalParticipants },
          { label: 'Spectators', value: totalSpectators, accent: true },
        ].map(stat => (
          <div key={stat.label} className="card p-4 text-center">
            <div
              className="text-3xl font-bold"
              style={{ color: stat.accent ? 'var(--accent)' : 'var(--text)' }}
            >
              {stat.value}
            </div>
            <div className="text-xs mt-1" style={{ color: 'var(--muted)' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      <div
        className="card p-4 flex items-center justify-between"
        style={{ borderLeft: '4px solid var(--accent)' }}
      >
        <span className="text-sm font-medium" style={{ color: 'var(--muted)' }}>Total Head Count</span>
        <span className="text-2xl font-bold" style={{ color: 'var(--text)' }}>
          {totalStudents + totalInstructors + totalSpectators}
          <span className="text-xs font-normal ml-2" style={{ color: 'var(--muted)' }}>
            {totalStudents + totalInstructors} participants + {totalSpectators} spectators
          </span>
        </span>
      </div>

      {/* Per-studio breakdown */}
      <div className="space-y-4">
        {studioRows.map(studio => (
          <div key={studio.id} className="card overflow-hidden">
            <div
              className="px-4 py-3 flex items-center justify-between"
              style={{ backgroundColor: '#1a2744', color: 'white' }}
            >
              <span className="font-semibold">{studio.name}</span>
              <div className="flex items-center gap-4 text-sm">
                <span style={{ opacity: 0.75 }}>
                  {studio.studentCount} students · {studio.instructorCount} instructors · {studio.lunchGuests.length} spectators
                </span>
                <span
                  className="text-lg font-bold"
                  style={{ fontVariantNumeric: 'tabular-nums' }}
                >
                  {studio.studentCount + studio.instructorCount + studio.lunchGuests.length}
                </span>
              </div>
            </div>

            {studio.lunchGuests.length > 0 ? (
              <table className="data-table" style={{ fontSize: '0.85rem' }}>
                <thead>
                  <tr>
                    <th>Spectator Name</th>
                    <th>Guest Of</th>
                    <th>Lunch Tickets</th>
                  </tr>
                </thead>
                <tbody>
                  {studio.lunchGuests.map(g => (
                    <tr key={g.id}>
                      <td>{g.name}</td>
                      <td style={{ color: g.guestOf ? 'var(--text)' : 'var(--muted)' }}>
                        {g.guestOf ?? '—'}
                      </td>
                      <td>{g.lunchTickets}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="px-4 py-3 text-sm" style={{ color: 'var(--muted)' }}>No spectators entered.</p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
