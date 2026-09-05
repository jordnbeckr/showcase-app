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
  isSemi: boolean   // round === 'semifinal'
  phase: string     // 'semi' | 'final'
  finalSize: number
  judgeCount: number
  couples: {
    studentId: number
    leaderNumber: number | null
    personA: string
    personB: string
    scores: { judgeId: number; place: number }[]
    semiCalled: { judgeId: number; called: boolean }[]
    callbackCount: number
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

function HeatHeader({ number, dance, entryCount, open, onToggle, variant }: { number: number; dance: string; entryCount: number; open: boolean; onToggle: () => void; variant: 'closed' | 'open' }) {
  const themes = {
    closed: { bg: '#fef9c3', numBg: '#fde047', numColor: '#713f12', border: '#fde68a', text: '#78350f' },
    open:   { bg: '#eff6ff', numBg: '#93c5fd', numColor: '#1e3a8a', border: '#bfdbfe', text: '#1e40af' },
  }
  const t = themes[variant]
  return (
    <button
      onClick={onToggle}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 0,
        border: 'none', cursor: 'pointer', textAlign: 'left',
        backgroundColor: t.bg, borderBottom: open ? `1px solid ${t.border}` : 'none',
      }}
    >
      <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '0.85rem', minWidth: 48, padding: '8px 10px', backgroundColor: t.numBg, color: t.numColor, textAlign: 'center', flexShrink: 0 }}>#{number}</span>
      <span style={{ fontWeight: 600, fontSize: '0.85rem', flex: 1, padding: '8px 12px', color: t.text }}>{dance}</span>
      <span style={{ fontSize: '0.75rem', color: t.text, opacity: 0.7, paddingRight: 6 }}>{entryCount} {entryCount === 1 ? 'couple' : 'couples'}</span>
      <span style={{ color: t.text, fontSize: '0.75rem', paddingRight: 12, opacity: 0.7 }}>{open ? '▲' : '▼'}</span>
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
                <HeatHeader number={heat.number} dance={heat.dance} entryCount={heat.entries.length} open={isOpen} onToggle={() => toggle(openClosed, heat.id, setOpenClosed)} variant="closed" />
                {isOpen && (
                  heat.entries.length === 0
                    ? <p className="px-4 py-3 text-sm italic" style={{ color: 'var(--muted)' }}>No entries</p>
                    : <table className="data-table">
                        <thead>
                          <tr>
                            <th style={{ width: 36 }}>#</th>
                            <th>Couple</th>
                            {judges.map(j => <th key={j.id} style={{ textAlign: 'center', width: 52 }}>{j.name}</th>)}
                          </tr>
                        </thead>
                        <tbody>
                          {heat.entries.map(row => (
                            <tr key={row.studentId}>
                              <td style={{ fontFamily: 'monospace', fontWeight: 700, color: '#555', fontSize: '0.8rem' }}>{row.num ?? '—'}</td>
                              <td style={{ whiteSpace: 'nowrap' }}>
                                <span style={{ fontWeight: 600 }}>{row.personA}</span>
                                {row.personB && <span style={{ color: 'var(--muted)', fontSize: '0.82rem' }}> &amp; {row.personB}</span>}
                              </td>
                              {row.byJudge.map(({ judgeId, placement }) => (
                                <td key={judgeId} style={{ textAlign: 'center' }}>
                                  {placement
                                    ? <span style={{ display: 'inline-block', padding: '1px 6px', borderRadius: 4, fontSize: '0.8rem', backgroundColor: placementColor[placement] ?? '#e2e8f0', color: '#1e1e1e', fontWeight: 700 }}>{placement[0]}</span>
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
                <HeatHeader number={heat.number} dance={heat.dance} entryCount={heat.entries.length} open={isOpen} onToggle={() => toggle(openOpen, heat.id, setOpenOpen)} variant="open" />
                {isOpen && (
                  heat.entries.length === 0
                    ? <p className="px-4 py-3 text-sm italic" style={{ color: 'var(--muted)' }}>No entries</p>
                    : <table className="data-table" style={{ tableLayout: 'fixed', width: '100%' }}>
                        <colgroup>
                          <col style={{ width: 36 }} />
                          <col style={{ width: 160 }} />
                          <col />
                        </colgroup>
                        <thead>
                          <tr>
                            <th>#</th>
                            <th>Couple</th>
                            <th>Feedback</th>
                          </tr>
                        </thead>
                        <tbody>
                          {heat.entries.map(row => (
                            <tr key={row.studentId}>
                              <td style={{ fontFamily: 'monospace', fontWeight: 700, color: '#555', fontSize: '0.8rem', verticalAlign: 'top', paddingTop: 10 }}>{row.num ?? '—'}</td>
                              <td style={{ verticalAlign: 'top', lineHeight: 1.4 }}>
                                <div style={{ fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{row.personA}</div>
                                {row.personB && <div style={{ color: 'var(--muted)', fontSize: '0.82rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>&amp; {row.personB}</div>}
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
          <h2 className="text-sm font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>Competitive Events</h2>
          {events.map(evt => {
            const showSemi = evt.isSemi && evt.phase === 'semi'
            const showFinal = !evt.isSemi || evt.phase === 'final'

            const couplesSorted = [...evt.couples].map(c => ({
              ...c,
              _total: c.scores.reduce((s, x) => s + x.place, 0),
              _scored: c.scores.length,
            })).sort((a, b) => {
              if (showFinal && a._scored > 0 && b._scored > 0)
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

            // Callback tabulation (sorted by count desc)
            const callbackRows = [...evt.couples]
              .map(c => ({ ...c, count: c.callbackCount }))
              .sort((a, b) => b.count - a.count || (a.leaderNumber ?? 9999) - (b.leaderNumber ?? 9999))
            const cutoffCount = callbackRows[evt.finalSize - 1]?.count ?? 0
            const atCutoff = callbackRows.filter(c => c.count === cutoffCount)
            const hasTie = atCutoff.length > 1 && callbackRows.filter(c => c.count >= cutoffCount).length > evt.finalSize

            return (
              <div key={evt.id} className="card overflow-hidden">
                <div className="px-4 py-2.5 flex items-center gap-2" style={{ backgroundColor: '#f3e8ff', borderBottom: '1px solid #d8b4fe' }}>
                  <span className="font-bold text-sm" style={{ color: '#6b21a8' }}>◆ {evt.name}</span>
                  <span className="text-xs ml-auto" style={{ color: '#6b21a8' }}>
                    {showSemi ? 'Semifinal callbacks' : `Final — 1–${evt.couples.length}`}
                  </span>
                </div>

                {/* SEMI PHASE: callback tabulation */}
                {showSemi && (
                  <>
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th style={{ width: 44 }}>#</th>
                          <th style={{ minWidth: 160 }}>Couple</th>
                          {judges.map(j => <th key={j.id} style={{ textAlign: 'center' }}>{j.name}</th>)}
                          <th style={{ textAlign: 'center', fontWeight: 900, color: '#6b21a8', width: 80 }}>Callbacks</th>
                          <th style={{ width: 80 }}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {callbackRows.map((couple, idx) => {
                          const isIn = idx < evt.finalSize
                          const isTiedOut = !isIn && couple.count === cutoffCount && hasTie
                          return (
                            <tr key={couple.studentId} style={{ backgroundColor: isIn ? '#faf5ff' : undefined }}>
                              <td style={{ fontFamily: 'monospace', fontWeight: 700, color: '#555', fontSize: '0.8rem' }}>{couple.leaderNumber ?? '—'}</td>
                              <td style={{ whiteSpace: 'normal', lineHeight: 1.4 }}>
                                <span style={{ fontWeight: 600 }}>{couple.personA}</span>
                                {couple.personB && <><br /><span style={{ color: 'var(--muted)', fontSize: '0.82rem' }}>&amp; {couple.personB}</span></>}
                              </td>
                              {judges.map(judge => {
                                const mark = couple.semiCalled.find(m => m.judgeId === judge.id)
                                return <td key={judge.id} style={{ textAlign: 'center' }}>
                                  {mark?.called
                                    ? <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 26, height: 26, borderRadius: '50%', backgroundColor: '#dcfce7', color: '#15803d', fontWeight: 900, fontSize: '0.95rem', border: '2px solid #16a34a' }}>✓</span>
                                    : <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 26, height: 26, borderRadius: '50%', backgroundColor: 'var(--surface)', color: 'var(--muted)', fontWeight: 400, fontSize: '1rem', border: '1px solid var(--border)' }}>–</span>
                                  }
                                </td>
                              })}
                              <td style={{ textAlign: 'center' }}>
                                <span style={{ fontWeight: 900, fontSize: '1rem', color: couple.count > 0 ? '#6b21a8' : 'var(--muted)' }}>{couple.count}</span>
                                <span style={{ color: 'var(--muted)', fontSize: '0.75rem' }}>/{evt.judgeCount}</span>
                              </td>
                              <td style={{ textAlign: 'center' }}>
                                {isIn
                                  ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 9px', borderRadius: 6, backgroundColor: '#16a34a', color: '#fff', fontWeight: 800, fontSize: '0.75rem', border: '2px solid #14532d', letterSpacing: '0.01em' }}>✓ In final</span>
                                  : isTiedOut
                                    ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 9px', borderRadius: 6, backgroundColor: '#f59e0b', color: '#1c1917', fontWeight: 800, fontSize: '0.75rem', border: '2px solid #b45309' }}>⚠ Tie</span>
                                    : <span style={{ display: 'inline-flex', alignItems: 'center', padding: '4px 9px', borderRadius: 6, backgroundColor: 'var(--surface)', color: 'var(--muted)', fontWeight: 600, fontSize: '0.75rem', border: '1px solid var(--border)' }}>Out</span>}
                              </td>
                            </tr>
                          )
                        })}
                        {callbackRows.length === 0 && (
                          <tr><td colSpan={3 + judges.length + 2} style={{ color: 'var(--muted)', fontStyle: 'italic', textAlign: 'center' }}>No couples enrolled</td></tr>
                        )}
                      </tbody>
                    </table>
                    {hasTie && (
                      <div className="px-4 py-2 text-xs" style={{ backgroundColor: '#fef9c3', borderTop: '1px solid #fde68a', color: '#713f12' }}>
                        ⚠ Tie at cutoff — adjust Final size in Config → Events to include tied couples.
                      </div>
                    )}
                  </>
                )}

                {/* FINAL PHASE: placement table */}
                {showFinal && (
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th style={{ width: 36 }}>#</th>
                        <th>Couple</th>
                        {judges.map(j => <th key={j.id} style={{ textAlign: 'center', width: 52 }}>{j.name}</th>)}
                        <th style={{ textAlign: 'center', fontWeight: 900, color: '#6b21a8', width: 60 }}>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {couplesSorted.map(couple => {
                        const total = couple._total
                        const rankEntry = ranked.find(r => r.studentId === couple.studentId)
                        const rankNum = rankEntry?.rank
                        const totalBg = rankNum === 1 ? '#fde68a' : rankNum === 2 ? '#cbd5e1' : rankNum === 3 ? '#fed7aa' : 'transparent'
                        const totalColor = rankNum === 1 ? '#78350f' : rankNum === 2 ? '#1e293b' : rankNum === 3 ? '#7c2d12' : '#6b21a8'
                        return (
                          <tr key={couple.studentId}>
                            <td style={{ fontFamily: 'monospace', fontWeight: 700, color: '#555', fontSize: '0.8rem' }}>{couple.leaderNumber ?? '—'}</td>
                            <td style={{ whiteSpace: 'nowrap' }}>
                              <span style={{ fontWeight: 600 }}>{couple.personA}</span>
                              {couple.personB && <span style={{ color: 'var(--muted)', fontSize: '0.82rem' }}> &amp; {couple.personB}</span>}
                            </td>
                            {judges.map(judge => {
                              const score = couple.scores.find(s => s.judgeId === judge.id)
                              return <td key={judge.id} style={{ textAlign: 'center' }}>
                                {score
                                  ? <span style={{ display: 'inline-block', padding: '1px 5px', borderRadius: 4, backgroundColor: '#f3e8ff', color: '#6b21a8', fontSize: '0.85rem', fontWeight: 700 }}>{score.place}</span>
                                  : <span style={{ color: 'var(--muted)' }}>—</span>}
                              </td>
                            })}
                            <td style={{ textAlign: 'center', padding: '4px 6px' }}>
                              {couple._scored > 0
                                ? <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 6, backgroundColor: totalBg, fontWeight: 900, fontSize: '0.95rem', color: totalColor }}>{total}</span>
                                : <span style={{ color: 'var(--muted)' }}>—</span>}
                            </td>
                          </tr>
                        )
                      })}
                      {couplesSorted.length === 0 && (
                        <tr><td colSpan={3 + judges.length} style={{ color: 'var(--muted)', fontStyle: 'italic', textAlign: 'center' }}>No couples enrolled</td></tr>
                      )}
                    </tbody>
                  </table>
                )}

                {showFinal && ranked.length > 0 && (
                  <div style={{ borderTop: '4px solid #1a1a2e', backgroundColor: '#1a1a2e', padding: '14px 16px' }}>
                    <div className="flex items-center gap-2 mb-3">
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#a78bfa' }}>Final Standings</span>
                      <span style={{ fontSize: '0.68rem', color: '#6b7280', marginLeft: 4 }}>announced last → first</span>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {[...ranked].reverse().map(c => {
                        const ms = medalStyle[c.rank]
                        const rankLabel = c.rank === 1 ? '1st' : c.rank === 2 ? '2nd' : c.rank === 3 ? '3rd' : `${c.rank}th`
                        return (
                          <div key={c.studentId} style={{
                            display: 'flex', alignItems: 'center', gap: 8,
                            padding: '8px 12px', borderRadius: 8,
                            backgroundColor: ms ? ms.bg : '#2d2d4e',
                            border: `2px solid ${ms ? ms.border : '#4c1d95'}`,
                            minWidth: 160, flex: '1 1 160px',
                          }}>
                            <div style={{ fontSize: '1.4rem', lineHeight: 1, flexShrink: 0 }}>
                              {c.rank === 1 ? '🥇' : c.rank === 2 ? '🥈' : c.rank === 3 ? '🥉' : <span style={{ fontSize: '0.85rem', fontWeight: 900, color: '#a78bfa', fontFamily: 'monospace' }}>{rankLabel}</span>}
                            </div>
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontFamily: 'monospace', fontSize: '0.7rem', color: ms ? ms.color : '#a78bfa', opacity: 0.7, lineHeight: 1 }}>{c.leaderNumber ?? '—'}</div>
                              <div style={{ fontWeight: 700, fontSize: '0.82rem', color: ms ? ms.color : '#e2e8f0', lineHeight: 1.3 }}>{c.personA}</div>
                              {c.personB && <div style={{ fontWeight: 700, fontSize: '0.78rem', color: ms ? ms.color : '#e2e8f0', lineHeight: 1.2 }}>&amp; {c.personB}</div>}
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
            <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>Eligible: ≥200 total entries. Ranked by % of closed-heat entries that earned Gold (multiple Golds per student count separately).</p>
          </div>
          {eligibleStudios.length === 0
            ? <p className="text-sm italic" style={{ color: 'var(--muted)' }}>No eligible studios yet.</p>
            : <div className="card overflow-hidden"><table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: 40, textAlign: 'center' }}>Rank</th>
                    <th>Studio</th>
                    <th style={{ textAlign: 'center', width: 100 }}>Total entries</th>
                    <th style={{ textAlign: 'center', width: 120 }}>Closed entries</th>
                    <th style={{ textAlign: 'center', width: 100 }}>Gold entries</th>
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
