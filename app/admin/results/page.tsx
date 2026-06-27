import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export default async function AdminResultsPage() {
  const [judges, heats, events] = await Promise.all([
    db.judge.findMany({ orderBy: { name: 'asc' } }),
    db.heat.findMany({
      where: { category: { not: 'none' } },
      orderBy: { number: 'asc' },
      include: {
        danceType: true,
        closedScores: {
          include: {
            judge: true,
            student: { include: { studio: true } },
          },
        },
        openThumbs: {
          include: {
            judge: true,
            student: { include: { studio: true } },
            category: true,
          },
        },
        openNotes: {
          include: {
            judge: true,
            student: { include: { studio: true } },
          },
        },
        entries: {
          include: {
            student: { include: { studio: true } },
            instructor: true,
            partnerStudent: true,
          },
        },
      },
    }),
    db.event.findMany({
      where: { isCompetitive: true },
      orderBy: { order: 'asc' },
      include: {
        compRound: true,
        compScores: { include: { judge: true, student: { include: { studio: true } } } },
        semiMarks: { include: { judge: true, student: { include: { studio: true } } } },
        studentEvents: {
          include: {
            student: { include: { studio: true } },
            instructor: true,
          },
        },
      },
    }),
  ])

  if (judges.length === 0) {
    return (
      <div className="max-w-4xl">
        <h1 className="text-xl font-bold mb-4">Judge Results</h1>
        <p className="text-sm italic" style={{ color: 'var(--muted)' }}>No judges configured yet.</p>
      </div>
    )
  }

  function getEntryDisplay(entry: { student: { firstName: string; lastName: string; role: string; leaderNumber: number | null }; instructor: { name: string; role: string; leaderNumber: number | null } | null; partnerStudent: { firstName: string; lastName: string } | null }) {
    const { student, instructor, partnerStudent } = entry
    if (instructor) {
      const instRole = instructor.role
      const stuRole = student.role
      if (instRole === 'Leader' && stuRole !== 'Leader') {
        return { num: instructor.leaderNumber, personA: instructor.name, personB: `${student.firstName} ${student.lastName}` }
      } else {
        return { num: student.leaderNumber, personA: `${student.firstName} ${student.lastName}`, personB: instructor.name }
      }
    } else if (partnerStudent) {
      return { num: student.leaderNumber, personA: `${student.firstName} ${student.lastName}`, personB: `${partnerStudent.firstName} ${partnerStudent.lastName}` }
    }
    return { num: student.leaderNumber, personA: `${student.firstName} ${student.lastName}`, personB: '' }
  }

  const closedHeats = heats.filter(h => h.category === 'closed')
  const openHeats = heats.filter(h => h.category === 'open')

  return (
    <div className="max-w-5xl space-y-10">
      <h1 className="text-xl font-bold">Judge Results</h1>

      {/* CLOSED HEATS */}
      {closedHeats.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>Closed Heats — Placements</h2>
          {closedHeats.map(heat => {
            const allPlacements = ['Gold', 'Silver', 'Bronze']
            // Group placements by student
            const byStudent = heat.entries.map(entry => {
              const display = getEntryDisplay(entry)
              const scores = heat.closedScores.filter(s => s.studentId === entry.studentId)
              const byJudge = judges.map(j => ({
                judge: j.name,
                placement: scores.find(s => s.judgeId === j.id)?.placement ?? null,
              }))
              return { ...display, studentId: entry.studentId, byJudge }
            })

            return (
              <div key={heat.id} className="card overflow-hidden">
                <div className="px-4 py-2.5 flex items-center gap-2" style={{ backgroundColor: '#fef9c3', borderBottom: '1px solid #fde68a' }}>
                  <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#555' }}>#{heat.number}</span>
                  <span className="font-semibold text-sm">{heat.danceType.name}</span>
                </div>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Couple</th>
                      {judges.map(j => <th key={j.id} style={{ textAlign: 'center' }}>{j.name}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {byStudent.map(row => (
                      <tr key={row.studentId}>
                        <td>
                          <span style={{ fontFamily: 'monospace', fontWeight: 700, marginRight: 8, color: '#555' }}>{row.num ?? '—'}</span>
                          {row.personA}{row.personB ? ` & ${row.personB}` : ''}
                        </td>
                        {row.byJudge.map(({ judge, placement }) => (
                          <td key={judge} style={{ textAlign: 'center', fontWeight: placement ? 700 : 400 }}>
                            {placement
                              ? <span style={{
                                  display: 'inline-block',
                                  padding: '1px 8px',
                                  borderRadius: 4,
                                  fontSize: '0.8rem',
                                  backgroundColor: placement === 'Gold' ? '#fde047' : placement === 'Silver' ? '#cbd5e1' : '#fdba74',
                                  color: '#1e1e1e',
                                }}>{placement[0]}</span>
                              : <span style={{ color: 'var(--muted)' }}>—</span>
                            }
                          </td>
                        ))}
                      </tr>
                    ))}
                    {heat.entries.length === 0 && (
                      <tr><td colSpan={1 + judges.length} style={{ color: 'var(--muted)', fontStyle: 'italic', textAlign: 'center' }}>No entries</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )
          })}
        </section>
      )}

      {/* OPEN HEATS */}
      {openHeats.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>Open Heats — Feedback</h2>
          {openHeats.map(heat => (
            <div key={heat.id} className="card overflow-hidden">
              <div className="px-4 py-2.5 flex items-center gap-2" style={{ backgroundColor: '#eff6ff', borderBottom: '1px solid #93c5fd' }}>
                <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#555' }}>#{heat.number}</span>
                <span className="font-semibold text-sm">{heat.danceType.name}</span>
              </div>
              {heat.entries.map(entry => {
                const display = getEntryDisplay(entry)
                const thumbs = heat.openThumbs.filter(t => t.studentId === entry.studentId)
                const notes = heat.openNotes.filter(n => n.studentId === entry.studentId)
                const allCategories = [...new Set(thumbs.map(t => t.category.name))].sort()

                return (
                  <div key={entry.studentId} className="px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
                    <div className="font-semibold text-sm mb-2">
                      <span style={{ fontFamily: 'monospace', marginRight: 8, color: '#555' }}>{display.num ?? '—'}</span>
                      {display.personA}{display.personB ? ` & ${display.personB}` : ''}
                    </div>
                    {thumbs.length === 0 && notes.length === 0 ? (
                      <p className="text-xs italic" style={{ color: 'var(--muted)' }}>No feedback yet</p>
                    ) : (
                      <div className="space-y-2">
                        {judges.map(judge => {
                          const judgeThumbsForEntry = thumbs.filter(t => t.judgeId === judge.id)
                          const judgeNote = notes.find(n => n.judgeId === judge.id)
                          if (judgeThumbsForEntry.length === 0 && !judgeNote) return null
                          return (
                            <div key={judge.id}>
                              <div className="text-xs font-semibold mb-1" style={{ color: '#555' }}>{judge.name}</div>
                              <div className="flex flex-wrap gap-2 mb-1">
                                {judgeThumbsForEntry.map(t => (
                                  <span key={t.categoryId} className="text-xs px-2 py-0.5" style={{
                                    borderRadius: 4,
                                    backgroundColor: t.sentiment === 'up' ? '#dcfce7' : '#fee2e2',
                                    color: t.sentiment === 'up' ? '#14532d' : '#7f1d1d',
                                    border: `1px solid ${t.sentiment === 'up' ? '#86efac' : '#fca5a5'}`,
                                  }}>
                                    {t.sentiment === 'up' ? '▲' : '▼'} {t.category.name}
                                  </span>
                                ))}
                              </div>
                              {judgeNote && (
                                <p className="text-xs italic" style={{ color: '#444' }}>"{judgeNote.note}"</p>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ))}
        </section>
      )}

      {/* COMPETITIVE EVENTS */}
      {events.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>Competitive Events — Placements</h2>
          {events.map(evt => {
            const isSemi = evt.compRound?.round === 'semifinal'
            const couples = evt.studentEvents
              .filter(se => se.partnerStudentId !== null ? se.student.role === 'Leader' : true)
              .map(se => {
                const student = se.student
                const instructor = se.instructor
                let leaderNumber: number | null = null
                let personA = ''
                let personB = ''
                if (instructor) {
                  if (instructor.role === 'Leader' && student.role !== 'Leader') {
                    leaderNumber = instructor.leaderNumber; personA = instructor.name; personB = `${student.firstName} ${student.lastName}`
                  } else {
                    leaderNumber = student.leaderNumber; personA = `${student.firstName} ${student.lastName}`; personB = instructor.name
                  }
                } else {
                  leaderNumber = student.leaderNumber; personA = `${student.firstName} ${student.lastName}`
                  const partner = evt.studentEvents.find(x => x.studentId === se.partnerStudentId)
                  if (partner) personB = `${partner.student.firstName} ${partner.student.lastName}`
                }
                return { studentId: student.id, leaderNumber, personA, personB }
              })
              .sort((a, b) => (a.leaderNumber ?? 9999) - (b.leaderNumber ?? 9999))

            return (
              <div key={evt.id} className="card overflow-hidden">
                <div className="px-4 py-2.5 flex items-center gap-2" style={{ backgroundColor: '#f3e8ff', borderBottom: '1px solid #d8b4fe' }}>
                  <span className="font-bold text-sm" style={{ color: '#6b21a8' }}>◆ {evt.name}</span>
                  <span className="text-xs ml-auto" style={{ color: '#6b21a8' }}>
                    {isSemi ? 'Semifinal callbacks' : `Final — 1–${evt.compRound?.finalSize ?? 6}`}
                  </span>
                </div>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Couple</th>
                      {judges.map(j => <th key={j.id} style={{ textAlign: 'center' }}>{j.name}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {couples.map(couple => (
                      <tr key={couple.studentId}>
                        <td>
                          <span style={{ fontFamily: 'monospace', fontWeight: 700, marginRight: 8, color: '#555' }}>{couple.leaderNumber ?? '—'}</span>
                          {couple.personA}{couple.personB ? ` & ${couple.personB}` : ''}
                        </td>
                        {judges.map(judge => {
                          if (isSemi) {
                            const mark = evt.semiMarks.find(m => m.judgeId === judge.id && m.studentId === couple.studentId)
                            return (
                              <td key={judge.id} style={{ textAlign: 'center' }}>
                                {mark?.called
                                  ? <span style={{ color: '#16a34a', fontWeight: 700 }}>✓</span>
                                  : <span style={{ color: 'var(--muted)' }}>—</span>
                                }
                              </td>
                            )
                          } else {
                            const score = evt.compScores.find(s => s.judgeId === judge.id && s.studentId === couple.studentId)
                            return (
                              <td key={judge.id} style={{ textAlign: 'center', fontWeight: score ? 700 : 400 }}>
                                {score
                                  ? <span style={{ display: 'inline-block', padding: '1px 6px', borderRadius: 4, backgroundColor: '#f3e8ff', color: '#6b21a8', fontSize: '0.85rem' }}>{score.place}</span>
                                  : <span style={{ color: 'var(--muted)' }}>—</span>
                                }
                              </td>
                            )
                          }
                        })}
                      </tr>
                    ))}
                    {couples.length === 0 && (
                      <tr><td colSpan={1 + judges.length} style={{ color: 'var(--muted)', fontStyle: 'italic', textAlign: 'center' }}>No couples enrolled</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )
          })}
        </section>
      )}

      {closedHeats.length === 0 && openHeats.length === 0 && events.length === 0 && (
        <p className="text-sm italic" style={{ color: 'var(--muted)' }}>No heats or events have been assigned categories yet. Set heat categories in Config → Heat Order & Categories.</p>
      )}
    </div>
  )
}
