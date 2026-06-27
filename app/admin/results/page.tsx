import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export default async function AdminResultsPage() {
  const [judges, heats, events, allEntries, closedScoresAll, studios] = await Promise.all([
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
    // For awards: ALL heat entries (all categories) with instructor and heat category
    db.heatEntry.findMany({
      include: {
        heat: true,
        student: { include: { studio: true } },
        instructor: { include: { studio: true } },
      },
    }),
    // All closed scores (for awards computation)
    db.closedScore.findMany({
      include: {
        student: { include: { studio: true } },
        heat: true,
      },
    }),
    db.studio.findMany({ orderBy: { order: 'asc' } }),
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

  // ── Awards computation ──────────────────────────────────────────────────────

  // Index: heatId → category
  const heatCategory = new Map<number, string>()
  for (const h of heats) heatCategory.set(h.id, h.category)
  // Also need ALL heats (not just scored ones) for entry counts
  const allHeatIds = new Set(allEntries.map(e => e.heatId))

  // TOP TEACHER
  // Group entries by instructor
  type InstructorAwardData = {
    id: number
    name: string
    studioName: string
    totalEntries: number
    closedEntries: number
    totalPlacements: number  // all G+S+B across all their students' closed heat entries
    goldCount: number
    silverCount: number
    bronzeCount: number
  }

  const instructorMap = new Map<number, InstructorAwardData>()
  for (const entry of allEntries) {
    if (!entry.instructorId || !entry.instructor) continue
    const iid = entry.instructorId
    if (!instructorMap.has(iid)) {
      instructorMap.set(iid, {
        id: iid,
        name: entry.instructor.name,
        studioName: entry.instructor.studio.name,
        totalEntries: 0,
        closedEntries: 0,
        totalPlacements: 0,
        goldCount: 0,
        silverCount: 0,
        bronzeCount: 0,
      })
    }
    const rec = instructorMap.get(iid)!
    rec.totalEntries++
    const cat = heatCategory.get(entry.heatId) ?? 'none'
    if (cat === 'closed') rec.closedEntries++
  }

  // Count placements per instructor (via closed scores on entries they taught)
  for (const score of closedScoresAll) {
    const cat = heatCategory.get(score.heatId) ?? 'none'
    if (cat !== 'closed') continue
    // Find the entry for this student in this heat to get the instructor
    const entry = allEntries.find(e => e.studentId === score.studentId && e.heatId === score.heatId)
    if (!entry?.instructorId) continue
    const rec = instructorMap.get(entry.instructorId)
    if (!rec) continue
    rec.totalPlacements++
    if (score.placement === 'Gold') rec.goldCount++
    else if (score.placement === 'Silver') rec.silverCount++
    else if (score.placement === 'Bronze') rec.bronzeCount++
  }

  const eligibleTeachers = [...instructorMap.values()]
    .filter(t => t.totalEntries >= 30 && t.closedEntries / t.totalEntries >= 0.4)
    .sort((a, b) => {
      const goldPctA = a.closedEntries > 0 ? a.goldCount / a.closedEntries : 0
      const goldPctB = b.closedEntries > 0 ? b.goldCount / b.closedEntries : 0
      if (goldPctB !== goldPctA) return goldPctB - goldPctA
      const silverPctA = a.closedEntries > 0 ? a.silverCount / a.closedEntries : 0
      const silverPctB = b.closedEntries > 0 ? b.silverCount / b.closedEntries : 0
      if (silverPctB !== silverPctA) return silverPctB - silverPctA
      const bronzePctA = a.closedEntries > 0 ? a.bronzeCount / a.closedEntries : 0
      const bronzePctB = b.closedEntries > 0 ? b.bronzeCount / b.closedEntries : 0
      return bronzePctB - bronzePctA
    })

  // TOP STUDIO
  type StudioAwardData = {
    id: number
    name: string
    totalEntries: number
    studentsInClosed: number       // unique students who appeared in ≥1 closed heat
    goldStudents: number           // unique students who earned ≥1 Gold in a closed heat
    goldPct: number
  }

  const studioAwardMap = new Map<number, StudioAwardData>()
  for (const s of studios) {
    studioAwardMap.set(s.id, { id: s.id, name: s.name, totalEntries: 0, studentsInClosed: 0, goldStudents: 0, goldPct: 0 })
  }

  // Count total entries per studio
  for (const entry of allEntries) {
    const sid = entry.student.studio.id
    const rec = studioAwardMap.get(sid)
    if (rec) rec.totalEntries++
  }

  // Find unique students per studio in closed heats
  const studioClosedStudents = new Map<number, Set<number>>() // studioId → Set<studentId>
  const studioGoldStudents = new Map<number, Set<number>>()   // studioId → Set<studentId>

  for (const entry of allEntries) {
    const cat = heatCategory.get(entry.heatId) ?? 'none'
    if (cat !== 'closed') continue
    const studioId = entry.student.studio.id
    if (!studioClosedStudents.has(studioId)) studioClosedStudents.set(studioId, new Set())
    studioClosedStudents.get(studioId)!.add(entry.studentId)
  }

  for (const score of closedScoresAll) {
    if (score.placement !== 'Gold') continue
    const cat = heatCategory.get(score.heatId) ?? 'none'
    if (cat !== 'closed') continue
    const studioId = score.student.studio.id
    if (!studioGoldStudents.has(studioId)) studioGoldStudents.set(studioId, new Set())
    studioGoldStudents.get(studioId)!.add(score.studentId)
  }

  for (const [studioId, rec] of studioAwardMap) {
    rec.studentsInClosed = studioClosedStudents.get(studioId)?.size ?? 0
    rec.goldStudents = studioGoldStudents.get(studioId)?.size ?? 0
    rec.goldPct = rec.studentsInClosed > 0 ? rec.goldStudents / rec.studentsInClosed : 0
  }

  const eligibleStudios = [...studioAwardMap.values()]
    .filter(s => s.totalEntries >= 200)
    .sort((a, b) => b.goldPct !== a.goldPct ? b.goldPct - a.goldPct : b.goldStudents - a.goldStudents)

  // ────────────────────────────────────────────────────────────────────────────

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

      {/* AWARDS */}
      <section className="space-y-6 pt-4" style={{ borderTop: '2px solid var(--border)' }}>
        <h2 className="text-lg font-bold">Awards</h2>

        {/* TOP TEACHER */}
        <div className="space-y-2">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>Top Teacher</h3>
            <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
              Eligible: ≥30 total entries AND ≥40% of entries in closed heats.
              Ranked by Gold % of closed entries, then Silver %, then Bronze %.
            </p>
          </div>

          {eligibleTeachers.length === 0 ? (
            <p className="text-sm italic" style={{ color: 'var(--muted)' }}>No eligible teachers yet.</p>
          ) : (
            <div className="card overflow-hidden">
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: 40, textAlign: 'center' }}>Rank</th>
                    <th>Teacher</th>
                    <th>Studio</th>
                    <th style={{ textAlign: 'center', width: 80 }}>Total entries</th>
                    <th style={{ textAlign: 'center', width: 80 }}>Closed entries</th>
                    <th style={{ textAlign: 'center', width: 60 }}>Closed %</th>
                    <th style={{ textAlign: 'center', width: 52 }}>
                      <span style={{ color: '#713f12' }}>G</span>
                    </th>
                    <th style={{ textAlign: 'center', width: 52 }}>
                      <span style={{ color: '#475569' }}>S</span>
                    </th>
                    <th style={{ textAlign: 'center', width: 52 }}>
                      <span style={{ color: '#7c2d12' }}>B</span>
                    </th>
                    <th style={{ textAlign: 'center', width: 80 }}>Gold %</th>
                  </tr>
                </thead>
                <tbody>
                  {eligibleTeachers.map((t, i) => (
                    <tr key={t.id} style={{ backgroundColor: i === 0 ? '#fffbeb' : i === 1 ? '#f8fafc' : i === 2 ? '#fff7ed' : undefined }}>
                      <td style={{ textAlign: 'center', fontWeight: 700 }}>
                        {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                      </td>
                      <td className="font-semibold">{t.name}</td>
                      <td style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>{t.studioName}</td>
                      <td style={{ textAlign: 'center' }}>{t.totalEntries}</td>
                      <td style={{ textAlign: 'center' }}>{t.closedEntries}</td>
                      <td style={{ textAlign: 'center', fontSize: '0.8rem' }}>
                        {Math.round(t.closedEntries / t.totalEntries * 100)}%
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: 700 }}>
                        <span style={{ color: '#713f12' }}>{t.goldCount || '—'}</span>
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: 700 }}>
                        <span style={{ color: '#475569' }}>{t.silverCount || '—'}</span>
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: 700 }}>
                        <span style={{ color: '#7c2d12' }}>{t.bronzeCount || '—'}</span>
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: 900, fontSize: '1rem' }}>
                        {t.closedEntries > 0 ? `${Math.round(t.goldCount / t.closedEntries * 100)}%` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* TOP STUDIO */}
        <div className="space-y-2">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>Top Studio</h3>
            <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
              Eligible: ≥200 total entries.
              Ranked by % of students in closed heats who earned at least one Gold (highest first).
            </p>
          </div>

          {eligibleStudios.length === 0 ? (
            <p className="text-sm italic" style={{ color: 'var(--muted)' }}>No eligible studios yet.</p>
          ) : (
            <div className="card overflow-hidden">
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: 40, textAlign: 'center' }}>Rank</th>
                    <th>Studio</th>
                    <th style={{ textAlign: 'center', width: 100 }}>Total entries</th>
                    <th style={{ textAlign: 'center', width: 120 }}>Students in closed</th>
                    <th style={{ textAlign: 'center', width: 100 }}>Gold students</th>
                    <th style={{ textAlign: 'center', width: 100 }}>Gold %</th>
                  </tr>
                </thead>
                <tbody>
                  {eligibleStudios.map((s, i) => (
                    <tr key={s.id} style={{ backgroundColor: i === 0 ? '#fffbeb' : i === 1 ? '#f8fafc' : i === 2 ? '#fff7ed' : undefined }}>
                      <td style={{ textAlign: 'center', fontWeight: 700 }}>
                        {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                      </td>
                      <td className="font-semibold">{s.name}</td>
                      <td style={{ textAlign: 'center' }}>{s.totalEntries}</td>
                      <td style={{ textAlign: 'center' }}>{s.studentsInClosed}</td>
                      <td style={{ textAlign: 'center', fontWeight: 700, color: '#713f12' }}>{s.goldStudents}</td>
                      <td style={{ textAlign: 'center', fontWeight: 900, fontSize: '1rem' }}>
                        {s.studentsInClosed > 0 ? `${Math.round(s.goldPct * 100)}%` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
