'use client'

import { useState } from 'react'

export type JudgeInfo = { id: number; name: string }

export type ClosedHeatData = {
  id: number
  number: number
  dance: string
  entries: {
    studentId: number
    num: number | null
    personA: string
    personB: string
    byJudge: { judgeId: number; placement: string | null }[]
  }[]
}

export type OpenHeatData = {
  id: number
  number: number
  dance: string
  entries: {
    studentId: number
    num: number | null
    personA: string
    personB: string
    feedbackLines: { judgeId: number; judgeName: string; text: string }[]
  }[]
}

export type CompEventData = {
  id: number
  name: string
  isSemi: boolean
  finalSize: number
  couples: {
    studentId: number
    leaderNumber: number | null
    personA: string
    personB: string
    scores: { judgeId: number; place: number }[]
    semiCalled: { judgeId: number; called: boolean }[]
  }[]
}

export type BoBDance = { dance: string; students: { studentId: number; name: string; studioName: string }[] }
export type TeacherAward = { id: number; name: string; studioName: string; totalEntries: number; closedEntries: number; goldCount: number; silverCount: number; bronzeCount: number }
export type StudioAward = { id: number; name: string; totalEntries: number; studentsInClosed: number; goldStudents: number; goldPct: number }

const placementColor: Record<string, string> = {
  Gold: '#fde047',
  Silver: '#cbd5e1',
  Bronze: '#fdba74',
}

function HeatHeader({ number, dance, entryCount, open, onToggle }: { number: number; dance: string; entryCount: number; open: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 10,
        padding: '8px 12px', border: 'none', cursor: 'pointer', textAlign: 'left',
        background: 'var(--surface)', borderBottom: open ? '1px solid var(--border)' : 'none',
      }}
    >
      <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.85rem', minWidth: 36 }}>#{number}</span>
      <span style={{ fontWeight: 600, fontSize: '0.85rem', flex: 1 }}>{dance}</span>
      <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{entryCount} {entryCount === 1 ? 'couple' : 'couples'}</span>
      <span style={{ color: 'var(--muted)', fontSize: '0.75rem', marginLeft: 4 }}>{open ? '▲' : '▼'}</span>
    </button>
  )
}

export default function ResultsView({
  judges,
  closedHeats,
  openHeats,
  events,
  bobDances,
  eligibleTeachers,
  eligibleStudios,
}: {
  judges: JudgeInfo[]
  closedHeats: ClosedHeatData[]
  openHeats: OpenHeatData[]
  events: CompEventData[]
  bobDances: BoBDance[]
  eligibleTeachers: TeacherAward[]
  eligibleStudios: StudioAward[]
}) {
  const [openClosed, setOpenClosed] = useState<Set<number>>(new Set())
  const [openOpen, setOpenOpen] = useState<Set<number>>(new Set())

  function toggle(set: Set<number>, id: number, setter: (s: Set<number>) => void) {
    const next = new Set(set)
    if (next.has(id)) next.delete(id); else next.add(id)
    setter(next)
  }

  return (
    <div className="max-w-5xl mx-auto space-y-10">
      <h1 className="text-xl font-bold text-center">Judge Results</h1>

      {/* CLOSED HEATS */}
      {closedHeats.length > 0 && (
        <section className="space-y-2">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-sm font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>Closed Heats — Placements</h2>
            <div className="flex gap-2">
              <button onClick={() => setOpenClosed(new Set(closedHeats.map(h => h.id)))} className="text-xs px-2 py-1" style={{ color: 'var(--muted)' }}>Expand all</button>
              <button onClick={() => setOpenClosed(new Set())} className="text-xs px-2 py-1" style={{ color: 'var(--muted)' }}>Collapse all</button>
            </div>
          </div>
          {closedHeats.map(heat => {
            const isOpen = openClosed.has(heat.id)
            return (
              <div key={heat.id} className="card overflow-hidden">
                <HeatHeader number={heat.number} dance={heat.dance} entryCount={heat.entries.length} open={isOpen} onToggle={() => toggle(openClosed, heat.id, setOpenClosed)} />
                {isOpen && (
                  heat.entries.length === 0
                    ? <p className="px-4 py-3 text-sm italic" style={{ color: 'var(--muted)' }}>No entries</p>
                    : <table className="data-table">
                        <thead>
                          <tr>
                            <th style={{ width: 36 }}>#</th>
                            <th style={{ minWidth: 180 }}>Couple</th>
                            {judges.map(j => <th key={j.id} style={{ textAlign: 'center', minWidth: 60 }}>{j.name}</th>)}
                          </tr>
                        </thead>
                        <tbody>
                          {heat.entries.map(row => (
                            <tr key={row.studentId}>
                              <td style={{ fontFamily: 'monospace', fontWeight: 700, color: '#555', fontSize: '0.8rem' }}>{row.num ?? '—'}</td>
                              <td style={{ whiteSpace: 'normal', lineHeight: 1.4 }}>
                                <span style={{ fontWeight: 600 }}>{row.personA}</span>
                                {row.personB && <><br /><span style={{ color: 'var(--muted)', fontSize: '0.82rem' }}>&amp; {row.personB}</span></>}
                              </td>
                              {row.byJudge.map(({ judgeId, placement }) => (
                                <td key={judgeId} style={{ textAlign: 'center' }}>
                                  {placement
                                    ? <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 4, fontSize: '0.8rem', backgroundColor: placementColor[placement] ?? '#e2e8f0', color: '#1e1e1e', fontWeight: 700 }}>{placement[0]}</span>
                                    : <span style={{ color: 'var(--muted)' }}>—</span>}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                )}
              </div>
            )
          })}
        </section>
      )}

      {/* OPEN HEATS */}
      {openHeats.length > 0 && (
        <section className="space-y-2">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-sm font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>Open Heats — Feedback</h2>
            <div className="flex gap-2">
              <button onClick={() => setOpenOpen(new Set(openHeats.map(h => h.id)))} className="text-xs px-2 py-1" style={{ color: 'var(--muted)' }}>Expand all</button>
              <button onClick={() => setOpenOpen(new Set())} className="text-xs px-2 py-1" style={{ color: 'var(--muted)' }}>Collapse all</button>
            </div>
          </div>
          {openHeats.map(heat => {
            const isOpen = openOpen.has(heat.id)
            return (
              <div key={heat.id} className="card overflow-hidden">
                <HeatHeader number={heat.number} dance={heat.dance} entryCount={heat.entries.length} open={isOpen} onToggle={() => toggle(openOpen, heat.id, setOpenOpen)} />
                {isOpen && (
                  heat.entries.length === 0
                    ? <p className="px-4 py-3 text-sm italic" style={{ color: 'var(--muted)' }}>No entries</p>
                    : <table className="data-table">
                        <thead>
                          <tr>
                            <th style={{ width: 36 }}>#</th>
                            <th style={{ minWidth: 160 }}>Couple</th>
                            <th>Feedback</th>
                          </tr>
                        </thead>
                        <tbody>
                          {heat.entries.map(row => (
                            <tr key={row.studentId}>
                              <td style={{ fontFamily: 'monospace', fontWeight: 700, color: '#555', fontSize: '0.8rem', verticalAlign: 'top', paddingTop: 10 }}>{row.num ?? '—'}</td>
                              <td style={{ verticalAlign: 'top', whiteSpace: 'normal', lineHeight: 1.4 }}>
                                <span style={{ fontWeight: 600 }}>{row.personA}</span>
                                {row.personB && <><br /><span style={{ color: 'var(--muted)', fontSize: '0.82rem' }}>&amp; {row.personB}</span></>}
                              </td>
                              <td style={{ fontSize: '0.8rem', verticalAlign: 'top' }}>
                                {row.feedbackLines.length === 0
                                  ? <span style={{ color: 'var(--muted)', fontStyle: 'italic' }}>No feedback yet</span>
                                  : row.feedbackLines.map((line, i) => (
                                      <div key={i} style={{ lineHeight: 1.6, color: '#444' }}>
                                        <span style={{ fontWeight: 700, color: '#1a2744', marginRight: 4 }}>{line.judgeName}:</span>{line.text}
                                      </div>
                                    ))
                                }
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                )}
              </div>
            )
          })}
        </section>
      )}

      {/* COMPETITIVE EVENTS */}
      {events.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>Competitive Events — Placements</h2>
          {events.map(evt => {
            const couplesSorted = [...evt.couples].map(c => ({
              ...c,
              _total: c.scores.reduce((s, x) => s + x.place, 0),
              _scored: c.scores.length,
            })).sort((a, b) => {
              if (!evt.isSemi && a._scored > 0 && b._scored > 0)
                return a._total !== b._total ? a._total - b._total : (a.leaderNumber ?? 9999) - (b.leaderNumber ?? 9999)
              return (a.leaderNumber ?? 9999) - (b.leaderNumber ?? 9999)
            })

            const scoredCouples = couplesSorted.map(c => ({ ...c, total: c._total, judgeCount: c._scored }))
              .filter(c => c.judgeCount > 0)
              .sort((a, b) => a.total !== b.total ? a.total - b.total : (a.leaderNumber ?? 9999) - (b.leaderNumber ?? 9999))

            type Ranked = typeof scoredCouples[number] & { rank: number }
            const ranked: Ranked[] = []
            for (let i = 0; i < scoredCouples.length; i++) {
              const rank = i === 0 ? 1 : scoredCouples[i].total === scoredCouples[i - 1].total ? ranked[i - 1].rank : i + 1
              ranked.push({ ...scoredCouples[i], rank })
            }

            const medalStyle: Record<number, { bg: string; color: string; border: string }> = {
              1: { bg: '#fbbf24', color: '#78350f', border: '#d97706' },
              2: { bg: '#cbd5e1', color: '#1e293b', border: '#94a3b8' },
              3: { bg: '#fb923c', color: '#431407', border: '#ea580c' },
            }

            return (
              <div key={evt.id} className="card overflow-hidden">
                <div className="px-4 py-2.5 flex items-center gap-2" style={{ backgroundColor: '#f3e8ff', borderBottom: '1px solid #d8b4fe' }}>
                  <span className="font-bold text-sm" style={{ color: '#6b21a8' }}>◆ {evt.name}</span>
                  <span className="text-xs ml-auto" style={{ color: '#6b21a8' }}>
                    {evt.isSemi ? 'Semifinal callbacks' : `Final — 1–${evt.finalSize}`}
                  </span>
                </div>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th style={{ minWidth: 160 }}>Couple</th>
                      {judges.map(j => <th key={j.id} style={{ textAlign: 'center' }}>{j.name}</th>)}
                      {!evt.isSemi && <th style={{ textAlign: 'center', fontWeight: 900, color: '#6b21a8' }}>Total</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {couplesSorted.map(couple => {
                      const total = couple._total
                      return (
                        <tr key={couple.studentId}>
                          <td style={{ fontFamily: 'monospace', fontWeight: 700, color: '#555', fontSize: '0.8rem' }}>{couple.leaderNumber ?? '—'}</td>
                          <td style={{ whiteSpace: 'normal', lineHeight: 1.4 }}>
                            <span style={{ fontWeight: 600 }}>{couple.personA}</span>
                            {couple.personB && <><br /><span style={{ color: 'var(--muted)', fontSize: '0.82rem' }}>&amp; {couple.personB}</span></>}
                          </td>
                          {judges.map(judge => {
                            if (evt.isSemi) {
                              const mark = couple.semiCalled.find(m => m.judgeId === judge.id)
                              return <td key={judge.id} style={{ textAlign: 'center' }}>
                                {mark?.called ? <span style={{ color: '#16a34a', fontWeight: 700 }}>✓</span> : <span style={{ color: 'var(--muted)' }}>—</span>}
                              </td>
                            } else {
                              const score = couple.scores.find(s => s.judgeId === judge.id)
                              return <td key={judge.id} style={{ textAlign: 'center' }}>
                                {score
                                  ? <span style={{ display: 'inline-block', padding: '1px 6px', borderRadius: 4, backgroundColor: '#f3e8ff', color: '#6b21a8', fontSize: '0.85rem', fontWeight: 700 }}>{score.place}</span>
                                  : <span style={{ color: 'var(--muted)' }}>—</span>}
                              </td>
                            }
                          })}
                          {!evt.isSemi && (
                            <td style={{ textAlign: 'center', fontWeight: 900, color: couple._scored > 0 ? '#6b21a8' : 'var(--muted)' }}>
                              {couple._scored > 0 ? total : '—'}
                            </td>
                          )}
                        </tr>
                      )
                    })}
                    {couplesSorted.length === 0 && (
                      <tr><td colSpan={2 + judges.length + (evt.isSemi ? 0 : 1)} style={{ color: 'var(--muted)', fontStyle: 'italic', textAlign: 'center' }}>No couples enrolled</td></tr>
                    )}
                  </tbody>
                </table>

                {!evt.isSemi && ranked.length > 0 && (
                  <div style={{ borderTop: '4px solid #7c3aed', background: 'linear-gradient(180deg,#ede9fe 0%,#faf5ff 100%)' }}>
                    <div className="px-5 py-3 flex items-center gap-3" style={{ borderBottom: '2px solid #c4b5fd' }}>
                      <span style={{ fontSize: '1.5rem', lineHeight: 1 }}>🏆</span>
                      <div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#4c1d95', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Final Standings</div>
                        <div style={{ fontSize: '0.7rem', color: '#7c3aed', fontWeight: 600, letterSpacing: '0.06em' }}>Read from bottom ↑ — 1st place announced last</div>
                      </div>
                    </div>
                    <div className="divide-y" style={{ borderColor: '#ddd6fe' }}>
                      {[...ranked].reverse().map(c => {
                        const ms = medalStyle[c.rank]
                        const isTop3 = c.rank <= 3
                        return (
                          <div key={c.studentId} className="flex items-center gap-4"
                            style={{ padding: isTop3 ? '14px 20px' : '10px 20px', backgroundColor: ms ? ms.bg : '#f5f3ff', borderLeft: `6px solid ${ms ? ms.border : '#c4b5fd'}` }}>
                            <div style={{ fontSize: isTop3 ? '2.2rem' : '1.1rem', fontWeight: 900, fontFamily: 'monospace', color: ms ? ms.color : '#6b21a8', minWidth: 48, textAlign: 'center', lineHeight: 1 }}>
                              {c.rank === 1 ? '🥇' : c.rank === 2 ? '🥈' : c.rank === 3 ? '🥉' : c.rank}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: isTop3 ? '1.05rem' : '0.9rem', fontWeight: isTop3 ? 800 : 600, color: ms ? ms.color : '#1e1e1e', lineHeight: 1.3 }}>
                                <span style={{ fontFamily: 'monospace', marginRight: 8, opacity: 0.7 }}>{c.leaderNumber ?? '—'}</span>
                                {c.personA}{c.personB ? ` & ${c.personB}` : ''}
                              </div>
                            </div>
                            <div style={{ textAlign: 'right', flexShrink: 0 }}>
                              <div style={{ fontSize: isTop3 ? '1.1rem' : '0.95rem', fontWeight: 900, color: ms ? ms.color : '#6b21a8' }}>{c.total} pts</div>
                              <div style={{ fontSize: '0.68rem', color: ms ? ms.color : '#7c3aed', opacity: 0.75 }}>{c.judgeCount} judge{c.judgeCount !== 1 ? 's' : ''}</div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </section>
      )}

      {closedHeats.length === 0 && openHeats.length === 0 && events.length === 0 && (
        <p className="text-sm italic" style={{ color: 'var(--muted)' }}>No heats or events have been assigned categories yet. Set heat categories in Config → Heat Order &amp; Categories.</p>
      )}

      {/* BEST OF THE BEST */}
      {bobDances.length > 0 && (
        <section className="space-y-4 pt-4" style={{ borderTop: '2px solid var(--border)' }}>
          <div>
            <h2 className="text-lg font-bold">Best of the Best</h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>Students who earned Gold in any closed heat, grouped by dance.</p>
          </div>
          <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
            {bobDances.map(({ dance, students }) => (
              <div key={dance} className="card overflow-hidden">
                <div className="px-4 py-2 font-semibold text-sm" style={{ backgroundColor: '#fef9c3', borderBottom: '1px solid #fde68a' }}>{dance}</div>
                <table className="data-table">
                  <tbody>
                    {students.map(s => (
                      <tr key={s.studentId}>
                        <td>
                          <span className="font-medium">{s.name}</span>
                          <span className="text-xs ml-1.5" style={{ color: 'var(--muted)' }}>{s.studioName}</span>
                        </td>
                        <td style={{ textAlign: 'right', width: 40 }}>🥇</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* AWARDS */}
      <section className="space-y-6 pt-4" style={{ borderTop: '2px solid var(--border)' }}>
        <h2 className="text-lg font-bold">Awards</h2>

        <div className="space-y-2">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>Top Teacher</h3>
            <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>Eligible: ≥30 total entries AND ≥40% in closed heats. Ranked by Gold %, then Silver %, then Bronze %.</p>
          </div>
          {eligibleTeachers.length === 0
            ? <p className="text-sm italic" style={{ color: 'var(--muted)' }}>No eligible teachers yet.</p>
            : <div className="card overflow-hidden"><table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: 40, textAlign: 'center' }}>Rank</th>
                    <th>Teacher</th>
                    <th>Studio</th>
                    <th style={{ textAlign: 'center', width: 80 }}>Total</th>
                    <th style={{ textAlign: 'center', width: 80 }}>Closed</th>
                    <th style={{ textAlign: 'center', width: 52 }}><span style={{ color: '#713f12' }}>G</span></th>
                    <th style={{ textAlign: 'center', width: 52 }}><span style={{ color: '#475569' }}>S</span></th>
                    <th style={{ textAlign: 'center', width: 52 }}><span style={{ color: '#7c2d12' }}>B</span></th>
                    <th style={{ textAlign: 'center', width: 80 }}>Gold %</th>
                  </tr>
                </thead>
                <tbody>
                  {eligibleTeachers.map((t, i) => (
                    <tr key={t.id} style={{ backgroundColor: i === 0 ? '#fffbeb' : i === 1 ? '#f8fafc' : i === 2 ? '#fff7ed' : undefined }}>
                      <td style={{ textAlign: 'center', fontWeight: 700 }}>{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}</td>
                      <td className="font-semibold">{t.name}</td>
                      <td style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>{t.studioName}</td>
                      <td style={{ textAlign: 'center' }}>{t.totalEntries}</td>
                      <td style={{ textAlign: 'center' }}>{t.closedEntries}</td>
                      <td style={{ textAlign: 'center', fontWeight: 700, color: '#713f12' }}>{t.goldCount || '—'}</td>
                      <td style={{ textAlign: 'center', fontWeight: 700, color: '#475569' }}>{t.silverCount || '—'}</td>
                      <td style={{ textAlign: 'center', fontWeight: 700, color: '#7c2d12' }}>{t.bronzeCount || '—'}</td>
                      <td style={{ textAlign: 'center', fontWeight: 900 }}>{t.closedEntries > 0 ? `${Math.round(t.goldCount / t.closedEntries * 100)}%` : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table></div>
          }
        </div>

        <div className="space-y-2">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>Top Studio</h3>
            <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>Eligible: ≥200 total entries. Ranked by % of students in closed heats who earned at least one Gold.</p>
          </div>
          {eligibleStudios.length === 0
            ? <p className="text-sm italic" style={{ color: 'var(--muted)' }}>No eligible studios yet.</p>
            : <div className="card overflow-hidden"><table className="data-table">
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
                      <td style={{ textAlign: 'center', fontWeight: 700 }}>{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}</td>
                      <td className="font-semibold">{s.name}</td>
                      <td style={{ textAlign: 'center' }}>{s.totalEntries}</td>
                      <td style={{ textAlign: 'center' }}>{s.studentsInClosed}</td>
                      <td style={{ textAlign: 'center', fontWeight: 700, color: '#713f12' }}>{s.goldStudents}</td>
                      <td style={{ textAlign: 'center', fontWeight: 900 }}>{s.studentsInClosed > 0 ? `${Math.round(s.goldPct * 100)}%` : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table></div>
          }
        </div>
      </section>
    </div>
  )
}
