import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export default async function AdminShowsPage() {
  const [studios, proShows, studentShows] = await Promise.all([
    db.studio.findMany({ orderBy: { order: 'asc' } }),
    db.proShow.findMany({
      include: { studio: true },
      orderBy: [{ studio: { order: 'asc' } }, { order: 'asc' }],
    }),
    db.studentShow.findMany({
      include: {
        studio: true,
        students: { orderBy: { lastName: 'asc' } },
        instructors: { orderBy: { name: 'asc' } },
      },
      orderBy: [{ studio: { order: 'asc' } }, { order: 'asc' }],
    }),
  ])

  const totalPro = proShows.length
  const totalStudent = studentShows.length

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-center flex-1">All Shows</h1>
        <span className="text-sm" style={{ color: 'var(--muted)' }}>
          {totalPro} pro · {totalStudent} student
        </span>
      </div>

      {/* Pro Shows */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--muted)' }}>
          Pro Shows ({totalPro})
        </h2>
        {totalPro === 0 ? (
          <p className="text-sm italic" style={{ color: 'var(--muted)' }}>No pro show entries yet.</p>
        ) : (
          <div className="card overflow-hidden">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Studio</th>
                  <th>Partnership / Group</th>
                  <th>Dance(s)</th>
                  <th>Song</th>
                  <th>Artist</th>
                  <th>Music</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {proShows.map(s => (
                  <tr key={s.id}>
                    <td style={{ whiteSpace: 'nowrap', color: 'var(--muted)', fontSize: '0.78rem' }}>{s.studio.name}</td>
                    <td className="font-medium">{s.partnership}</td>
                    <td>{s.dances}</td>
                    <td>{s.songTitle ?? <span style={{ color: 'var(--muted)', fontStyle: 'italic' }}>—</span>}</td>
                    <td>{s.artist ?? <span style={{ color: 'var(--muted)', fontStyle: 'italic' }}>—</span>}</td>
                    <td>
                      {s.musicLink
                        ? <a href={s.musicLink} target="_blank" rel="noreferrer" className="text-xs" style={{ color: '#2563eb' }}>Link ↗</a>
                        : <span style={{ color: 'var(--muted)', fontStyle: 'italic' }}>—</span>}
                    </td>
                    <td style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>{s.notes ?? ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Student Shows */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--muted)' }}>
          Student Shows ({totalStudent})
        </h2>
        {totalStudent === 0 ? (
          <p className="text-sm italic" style={{ color: 'var(--muted)' }}>No student show entries yet.</p>
        ) : (
          <div className="card overflow-hidden">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Studio</th>
                  <th>Student(s)</th>
                  <th>Instructor(s)</th>
                  <th>Dance(s)</th>
                  <th>Song</th>
                  <th>Artist</th>
                  <th>Music</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {studentShows.map(s => (
                  <tr key={s.id}>
                    <td style={{ whiteSpace: 'nowrap', color: 'var(--muted)', fontSize: '0.78rem' }}>{s.studio.name}</td>
                    <td className="font-medium">
                      {s.students.length > 0
                        ? s.students.map(st => `${st.firstName} ${st.lastName}`).join(', ')
                        : <span style={{ color: 'var(--muted)', fontStyle: 'italic' }}>—</span>}
                    </td>
                    <td>
                      {s.instructors.length > 0
                        ? s.instructors.map(i => i.name).join(', ')
                        : <span style={{ color: 'var(--muted)', fontStyle: 'italic' }}>—</span>}
                    </td>
                    <td>{s.dances}</td>
                    <td>{s.songTitle ?? <span style={{ color: 'var(--muted)', fontStyle: 'italic' }}>—</span>}</td>
                    <td>{s.artist ?? <span style={{ color: 'var(--muted)', fontStyle: 'italic' }}>—</span>}</td>
                    <td>
                      {s.musicLink
                        ? <a href={s.musicLink} target="_blank" rel="noreferrer" className="text-xs" style={{ color: '#2563eb' }}>Link ↗</a>
                        : <span style={{ color: 'var(--muted)', fontStyle: 'italic' }}>—</span>}
                    </td>
                    <td style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>{s.notes ?? ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
