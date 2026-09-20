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

type DanceInfo = { heatId: number; heatNumber: number; dance: string }
type CoupleInfo = {
  studentId: number
  leaderNumber: number | null
  personA: string
  personB: string
  scores: { judgeId: number; heatId: number; place: number }[]
  semiCalled: { judgeId: number; heatId: number; called: boolean }[]
  callbackCount: number
}

export type CompEventData = {
  id: number
  name: string
  isSemi: boolean
  finalSize: number
  judgeCount: number
  // For non-semi events: dances = all heats, finalCouples = couples
  // For semi events: semiDances + all couples for callbacks; finalDances + finalCouples for final
  dances: DanceInfo[]
  couples: CoupleInfo[]
  semiDances: DanceInfo[]
  finalDances: DanceInfo[]
  finalCouples: CoupleInfo[]
}

export type BoBDance = { dance: string; students: { studentId: number; name: string; studioName: string }[] }
export type TeacherAward = { id: number; name: string; studioName: string; totalEntries: number; closedEntries: number; goldCount: number; silverCount: number; bronzeCount: number }
export type StudioAward = { id: number; name: string; totalEntries: number; studentsInClosed: number; goldStudents: number; silverStudents: number; bronzeStudents: number; goldPct: number; silverPct: number; bronzePct: number }

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
            const showSemi = evt.isSemi
            const showFinal = true

            // Semi uses semiDances + all couples; final uses finalDances + finalCouples
            const semiDances = evt.isSemi ? evt.semiDances : []
            const finalDances = evt.isSemi ? evt.finalDances : evt.dances
            const finalCouples = evt.isSemi ? evt.finalCouples : evt.couples

            const ND_semi = semiDances.length
            const ND_final = finalDances.length
            const NC_final = finalCouples.length

            // Per-dance judge-sum totals for FINAL couples on FINAL dances
            const danceJudgeSum: number[][] = finalDances.map(dance =>
              finalCouples.map(c =>
                c.scores.filter(s => s.heatId === dance.heatId).reduce((sum, s) => sum + s.place, 0)
              )
            )
            const dancePlacement: (number | null)[][] = danceJudgeSum.map(sums => {
              const order = sums.map((s, ci) => ({ ci, s })).filter(x => x.s > 0).sort((a, b) => a.s - b.s)
              const ranks: (number | null)[] = new Array(NC_final).fill(null)
              order.forEach((x, i) => { ranks[x.ci] = i + 1 })
              return ranks
            })
            const finalTotals: number[] = finalCouples.map((_, ci) =>
              dancePlacement.reduce((sum, dp) => sum + (dp[ci] ?? 0), 0)
            )
            const finalPlaces: (number | null)[] = new Array(NC_final).fill(null)
            ;[...finalCouples.map((_, ci) => ci).filter(ci => finalTotals[ci] > 0)]
              .sort((a, b) => finalTotals[a] - finalTotals[b])
              .forEach((ci, i) => { finalPlaces[ci] = i + 1 })

            const JUDGE_COLORS = [
              { bg: '#f3eeff', fg: '#4c1d95', dot: '#c084fc' },
              { bg: '#e0f2fe', fg: '#0c4a6e', dot: '#38bdf8' },
              { bg: '#d1fae5', fg: '#064e3b', dot: '#34d399' },
              { bg: '#fff7ed', fg: '#7c2d12', dot: '#fb923c' },
              { bg: '#fdf4ff', fg: '#701a75', dot: '#e879f9' },
            ]

            // Judges who appear in this event's marks/scores
            const compJudgeIds = new Set([
              ...evt.couples.flatMap(c => c.scores.map(s => s.judgeId)),
              ...evt.couples.flatMap(c => c.semiCalled.map(m => m.judgeId)),
            ])
            const eventJudges = judges.filter(j => compJudgeIds.has(j.id))

            // Callback rows: by leader number; totalCbs used for cutoff/IN/OUT
            const semiHeatIds = new Set(semiDances.map(d => d.heatId))
            const callbackRows = [...evt.couples]
              .map(c => ({ ...c, totalCbs: c.semiCalled.filter(m => m.called && semiHeatIds.has(m.heatId)).length }))
              .sort((a, b) => (a.leaderNumber ?? 9999) - (b.leaderNumber ?? 9999))
            const maxCallbacks = eventJudges.length * ND_semi
            const cutoffCount = [...callbackRows].sort((a, b) => b.totalCbs - a.totalCbs)[evt.finalSize - 1]?.totalCbs ?? 0
            const hasTie = callbackRows.filter(c => c.totalCbs >= cutoffCount).length > evt.finalSize &&
              callbackRows.filter(c => c.totalCbs === cutoffCount).length > 1

            // Final rows: by leader number
            const couplesSortedFinal = finalCouples
              .map((c, ci) => ({ ...c, ci, ft: finalTotals[ci], fp: finalPlaces[ci] }))
              .sort((a, b) => (a.leaderNumber ?? 9999) - (b.leaderNumber ?? 9999))

            const cell = { borderRight: '1px solid var(--border)', borderBottom: '1px solid var(--border)', verticalAlign: 'middle' as const }
            const thBase = { padding: '5px 8px', fontSize: '0.72rem' as const, fontWeight: 700 as const, textAlign: 'center' as const, letterSpacing: '0.04em', textTransform: 'uppercase' as const, borderRight: '1px solid var(--border)', borderBottom: '2px solid var(--border)' }

            const medalStyle: Record<number, { bg: string; color: string; border: string }> = {
              1: { bg: '#fbbf24', color: '#78350f', border: '#d97706' },
              2: { bg: '#cbd5e1', color: '#1e293b', border: '#94a3b8' },
              3: { bg: '#fb923c', color: '#431407', border: '#ea580c' },
            }

            const rankedForBanner = couplesSortedFinal
              .filter(c => c.fp !== null)
              .map(c => ({ ...c, rank: c.fp! }))

            return (
              <div key={evt.id} className="card overflow-hidden">
                {/* Header */}
                <div className="px-4 py-2.5 flex items-center gap-2" style={{ backgroundColor: '#f3e8ff', borderBottom: '1px solid #d8b4fe' }}>
                  <span className="font-bold text-sm" style={{ color: '#6b21a8' }}>◆ {evt.name}</span>
                  <span className="text-xs ml-auto" style={{ color: '#6b21a8' }}>
                    {evt.isSemi ? 'Semifinal + Final' : `Final — 1–${finalCouples.length}`}
                  </span>
                </div>

                {/* Judge color legend */}
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', padding: '7px 14px', background: '#f9f5ff', borderBottom: '1px solid #e9d5ff', fontSize: '0.72rem', color: '#6b21a8', alignItems: 'center' }}>
                  {eventJudges.map((j, ji) => {
                    const jc = JUDGE_COLORS[ji % JUDGE_COLORS.length]
                    return (
                      <span key={j.id} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <span style={{ width: 10, height: 10, borderRadius: '50%', background: jc.dot, display: 'inline-block', flexShrink: 0 }} />
                        {j.name}
                      </span>
                    )
                  })}
                  {showFinal && <>
                    <span style={{ color: '#c4b5fd' }}>·</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ width: 12, height: 10, borderRadius: 2, background: '#ede9fb', border: '1px solid #a78bfa', display: 'inline-block' }} />
                      Dance total → placement
                    </span>
                  </>}
                </div>

                {/* SEMI: row-per-dance table */}
                {showSemi && (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 480 }}>
                      <thead>
                        <tr>
                          <th style={{ ...thBase, textAlign: 'left', minWidth: 130, background: '#f3e8ff', color: '#6b21a8', borderRight: '2px solid var(--border)' }}>Couple</th>
                          <th style={{ ...thBase, textAlign: 'left', minWidth: 70, background: '#f3e8ff', color: '#6b21a8' }}>Dance</th>
                          {eventJudges.map((j, ji) => {
                            const jc = JUDGE_COLORS[ji % JUDGE_COLORS.length]
                            return <th key={j.id} style={{ ...thBase, background: jc.bg, color: jc.fg, borderBottom: `2px solid ${jc.dot}` }}>{j.name}</th>
                          })}
                          <th style={{ ...thBase, background: '#1e1030', color: '#f0e6ff', borderRight: '1px solid #3d2560', borderBottom: '2px solid #3d2560' }}>Callbacks</th>
                          <th style={{ ...thBase, background: '#1e1030', color: '#f0e6ff', borderRight: 'none', borderBottom: '2px solid #3d2560' }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {callbackRows.flatMap((couple) => {
                          const isIn = couple.totalCbs >= cutoffCount && cutoffCount > 0
                          return semiDances.map((dance, di) => {
                            const isFirst = di === 0
                            return (
                              <tr key={`${couple.studentId}-${di}`} style={{ borderTop: isFirst ? '3px solid #7c3aed' : undefined }}>
                                {isFirst && (
                                  <td rowSpan={ND_semi} style={{ ...cell, borderLeft: '3px solid #7c3aed', borderRight: '2px solid var(--border)', padding: '0 10px', minWidth: 130, height: ND_semi * 30 }}>
                                    <div style={{ fontFamily: 'monospace', fontSize: '0.72rem', color: 'var(--muted)', lineHeight: 1 }}>{couple.leaderNumber ?? '—'}</div>
                                    <div style={{ fontWeight: 600, fontSize: '0.85rem', lineHeight: 1.3 }}>{couple.personA}</div>
                                    {couple.personB && <div style={{ fontSize: '0.78rem', color: 'var(--muted)', lineHeight: 1.2 }}>&amp; {couple.personB}</div>}
                                  </td>
                                )}
                                <td style={{ ...cell, padding: '4px 8px', fontSize: '0.78rem', fontStyle: 'italic', color: 'var(--muted)', fontWeight: 500, whiteSpace: 'nowrap' }}>{dance.dance}</td>
                                {eventJudges.map((j, ji) => {
                                  const mark = couple.semiCalled.find(m => m.judgeId === j.id && m.heatId === dance.heatId)
                                  const jc = JUDGE_COLORS[ji % JUDGE_COLORS.length]
                                  return (
                                    <td key={j.id} style={{ ...cell, textAlign: 'center', padding: '4px 8px', background: mark?.called ? jc.bg : 'var(--surface)' }}>
                                      <span style={{ display: 'inline-block', width: 11, height: 11, borderRadius: '50%', background: mark?.called ? jc.dot : 'var(--border)', verticalAlign: 'middle' }} />
                                    </td>
                                  )
                                })}
                                {isFirst && <>
                                  <td rowSpan={ND_semi} style={{ ...cell, textAlign: 'center', fontFamily: 'monospace', fontWeight: 700, fontSize: '0.95rem', background: '#1e1030', color: '#f0e6ff', borderRight: '1px solid #3d2560' }}>
                                    {couple.totalCbs}/{maxCallbacks}
                                  </td>
                                  <td rowSpan={ND_semi} style={{ ...cell, textAlign: 'center', background: isIn ? '#dcfce7' : '#fee2e2', borderRight: 'none' }}>
                                    <span style={{ fontWeight: 800, fontSize: '0.8rem', letterSpacing: '0.08em', color: isIn ? '#14532d' : '#7f1d1d' }}>{isIn ? 'IN' : 'OUT'}</span>
                                  </td>
                                </>}
                              </tr>
                            )
                          })
                        })}
                        {callbackRows.length === 0 && (
                          <tr><td colSpan={3 + eventJudges.length} style={{ color: 'var(--muted)', fontStyle: 'italic', textAlign: 'center', padding: 12 }}>No couples enrolled</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                {hasTie && showSemi && (
                  <div className="px-4 py-2 text-xs" style={{ backgroundColor: '#fef9c3', borderTop: '1px solid #fde68a', color: '#713f12' }}>
                    ⚠ Tie at cutoff — adjust Final size in Config → Events to include tied couples.
                  </div>
                )}

                {/* FINAL: row-per-dance table */}
                {showFinal && (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 600 }}>
                      <thead>
                        <tr>
                          <th style={{ ...thBase, textAlign: 'left', minWidth: 130, background: '#f3e8ff', color: '#6b21a8', borderRight: '2px solid var(--border)' }}>Couple</th>
                          <th style={{ ...thBase, textAlign: 'left', minWidth: 70, background: '#f3e8ff', color: '#6b21a8' }}>Dance</th>
                          {eventJudges.map((j, ji) => {
                            const jc = JUDGE_COLORS[ji % JUDGE_COLORS.length]
                            return <th key={j.id} style={{ ...thBase, background: jc.bg, color: jc.fg, borderBottom: `2px solid ${jc.dot}` }}>{j.name}</th>
                          })}
                          <th style={{ ...thBase, background: '#ede9fb', color: '#4c1d95', borderRight: '1px solid #a78bfa', borderBottom: '2px solid #a78bfa' }}>∑ Judges</th>
                          <th style={{ ...thBase, background: '#ede9fb', color: '#4c1d95', borderRight: '2px solid #a78bfa', borderBottom: '2px solid #a78bfa' }}>Placement</th>
                          <th style={{ ...thBase, background: '#1e1030', color: '#f0e6ff', borderRight: '1px solid #3d2560', borderBottom: '2px solid #3d2560' }}>Final Total</th>
                          <th style={{ ...thBase, background: '#1e1030', color: '#f0e6ff', borderRight: 'none', borderBottom: '2px solid #3d2560' }}>Final Place</th>
                        </tr>
                      </thead>
                      <tbody>
                        {couplesSortedFinal.flatMap(couple => {
                          const { ci, ft, fp } = couple
                          const fpBg = fp === 1 ? '#fef3c7' : fp === 2 ? '#e2e8f0' : fp === 3 ? '#ffedd5' : '#1e1030'
                          const fpFg = fp !== null && fp <= 3 ? (fp === 1 ? '#92400e' : fp === 2 ? '#334155' : '#7c2d12') : '#f0e6ff'
                          return finalDances.map((dance, di) => {
                            const isFirst = di === 0
                            const djSum = danceJudgeSum[di][ci]
                            const dp = dancePlacement[di][ci]
                            return (
                              <tr key={`${couple.studentId}-${di}`} style={{ borderTop: isFirst ? '3px solid #7c3aed' : undefined }}>
                                {isFirst && (
                                  <td rowSpan={ND_final} style={{ ...cell, borderLeft: '3px solid #7c3aed', borderRight: '2px solid var(--border)', padding: '0 10px', minWidth: 130, height: ND_final * 30 }}>
                                    <div style={{ fontFamily: 'monospace', fontSize: '0.72rem', color: 'var(--muted)', lineHeight: 1 }}>{couple.leaderNumber ?? '—'}</div>
                                    <div style={{ fontWeight: 600, fontSize: '0.85rem', lineHeight: 1.3 }}>{couple.personA}</div>
                                    {couple.personB && <div style={{ fontSize: '0.78rem', color: 'var(--muted)', lineHeight: 1.2 }}>&amp; {couple.personB}</div>}
                                  </td>
                                )}
                                <td style={{ ...cell, padding: '4px 8px', fontSize: '0.78rem', fontStyle: 'italic', color: 'var(--muted)', fontWeight: 500, whiteSpace: 'nowrap' }}>{dance.dance}</td>
                                {eventJudges.map((j, ji) => {
                                  const score = couple.scores.find(s => s.judgeId === j.id && s.heatId === dance.heatId)
                                  const jc = JUDGE_COLORS[ji % JUDGE_COLORS.length]
                                  return (
                                    <td key={j.id} style={{ ...cell, textAlign: 'center', padding: '4px 8px', background: score ? jc.bg : 'var(--surface)', color: jc.fg, fontFamily: 'monospace', fontWeight: 600, fontSize: '0.88rem' }}>
                                      {score ? score.place : <span style={{ color: 'var(--muted)' }}>—</span>}
                                    </td>
                                  )
                                })}
                                <td style={{ ...cell, textAlign: 'center', padding: '4px 8px', background: '#ede9fb', color: '#4c1d95', fontFamily: 'monospace', fontWeight: 700, fontSize: '0.85rem', borderRight: '1px solid #a78bfa' }}>
                                  {djSum > 0 ? djSum : <span style={{ color: 'var(--muted)' }}>—</span>}
                                </td>
                                <td style={{ ...cell, textAlign: 'center', padding: '4px 8px', background: '#ede9fb', borderRight: '2px solid #a78bfa' }}>
                                  {dp !== null
                                    ? <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.95rem', color: dp === 1 ? '#92400e' : dp === 2 ? '#475569' : dp === 3 ? '#7c2d12' : 'var(--muted)' }}>{dp}</span>
                                    : <span style={{ color: 'var(--muted)' }}>—</span>}
                                </td>
                                {isFirst && <>
                                  <td rowSpan={ND_final} style={{ ...cell, textAlign: 'center', fontFamily: 'monospace', fontWeight: 700, fontSize: '1rem', background: '#1e1030', color: '#f0e6ff', borderRight: '1px solid #3d2560' }}>
                                    {ft > 0 ? ft : <span style={{ opacity: 0.4 }}>—</span>}
                                  </td>
                                  <td rowSpan={ND_final} style={{ ...cell, textAlign: 'center', fontFamily: 'monospace', fontWeight: 700, fontSize: '1rem', background: fpBg, color: fpFg, borderRight: 'none' }}>
                                    {fp ?? <span style={{ opacity: 0.4 }}>—</span>}
                                  </td>
                                </>}
                              </tr>
                            )
                          })
                        })}
                        {couplesSortedFinal.length === 0 && (
                          <tr><td colSpan={5 + eventJudges.length} style={{ color: 'var(--muted)', fontStyle: 'italic', textAlign: 'center', padding: 12 }}>No couples enrolled</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Final standings banner */}
                {showFinal && rankedForBanner.length > 0 && (
                  <div style={{ borderTop: '4px solid #1a1a2e', backgroundColor: '#1a1a2e', padding: '14px 16px' }}>
                    <div className="flex items-center gap-2 mb-3">
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#a78bfa' }}>Final Standings</span>
                      <span style={{ fontSize: '0.68rem', color: '#6b7280', marginLeft: 4 }}>announced last → first</span>
                    </div>
                    {(() => {
                      const items = [...rankedForBanner].sort((a, b) => b.rank - a.rank)
                      const rem = items.length % 4
                      const mainItems = rem > 0 ? items.slice(0, items.length - rem) : items
                      const lastItems = rem > 0 ? items.slice(items.length - rem) : []
                      const pill = (c: typeof items[number]) => {
                        const ms = medalStyle[c.rank]
                        const rankLabel = c.rank === 1 ? '1st' : c.rank === 2 ? '2nd' : c.rank === 3 ? '3rd' : `${c.rank}th`
                        return (
                          <div key={c.studentId} style={{ display: 'flex', alignItems: 'center', gap: 8, flex: '1 1 0', padding: '8px 12px', borderRadius: 8, backgroundColor: ms ? ms.bg : '#2d2d4e', border: `2px solid ${ms ? ms.border : '#4c1d95'}` }}>
                            <div style={{ fontSize: '1.4rem', lineHeight: 1, flexShrink: 0 }}>
                              {c.rank === 1 ? '🥇' : c.rank === 2 ? '🥈' : c.rank === 3 ? '🥉' : <span style={{ fontSize: '0.85rem', fontWeight: 900, color: '#a78bfa', fontFamily: 'monospace' }}>{rankLabel}</span>}
                            </div>
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontFamily: 'monospace', fontSize: '0.7rem', color: ms ? ms.color : '#a78bfa', opacity: 0.7, lineHeight: 1 }}>{c.leaderNumber ?? '—'}</div>
                              <div style={{ fontWeight: 700, fontSize: '0.82rem', color: ms ? ms.color : '#e2e8f0', lineHeight: 1.3 }}>{c.personA}</div>
                              {c.personB && <div style={{ fontWeight: 700, fontSize: '0.82rem', color: ms ? ms.color : '#e2e8f0', lineHeight: 1.2 }}>&amp; {c.personB}</div>}
                            </div>
                          </div>
                        )
                      }
                      return (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {mainItems.length > 0 && <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>{mainItems.map(pill)}</div>}
                          {lastItems.length > 0 && <div style={{ display: 'flex', gap: 8 }}>{lastItems.map(pill)}</div>}
                        </div>
                      )
                    })()}
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
            : <>
              {eligibleTeachers.length >= 1 && (() => {
                const podiumStyle: Record<number, { bg: string; color: string; border: string }> = {
                  0: { bg: '#fbbf24', color: '#78350f', border: '#d97706' },
                  1: { bg: '#cbd5e1', color: '#1e293b', border: '#94a3b8' },
                  2: { bg: '#fb923c', color: '#431407', border: '#ea580c' },
                }
                const top = eligibleTeachers.slice(0, 3)
                return (
                  <div style={{ backgroundColor: '#1a1a2e', borderRadius: 8, padding: '14px 16px', marginBottom: 8 }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#a78bfa', marginBottom: 10 }}>Top Teacher Standings</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                      {top.map((t, i) => ({ t, i })).reverse().map(({ t, i }) => {
                        const ms = podiumStyle[i]
                        return (
                          <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 8, backgroundColor: ms.bg, border: `2px solid ${ms.border}` }}>
                            <div style={{ fontSize: '1.4rem', lineHeight: 1, flexShrink: 0 }}>{i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}</div>
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontWeight: 700, fontSize: '0.82rem', color: ms.color, lineHeight: 1.3 }}>{t.name}</div>
                              <div style={{ fontSize: '0.72rem', color: ms.color, opacity: 0.75, lineHeight: 1.2 }}>{t.studioName} · {t.closedEntries > 0 ? `${Math.round(t.goldCount / t.closedEntries * 100)}%` : '—'} gold</div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })()}
              <div className="card overflow-hidden"><table className="data-table">
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
            </>
          }
        </div>

        <div className="space-y-2">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>Top Studio</h3>
            <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>Eligible: ≥200 total entries. Ranked by Gold % → Silver % → Bronze % of closed-heat entries (multiple awards per student each count).</p>
          </div>
          {eligibleStudios.length === 0
            ? <p className="text-sm italic" style={{ color: 'var(--muted)' }}>No eligible studios yet.</p>
            : <>
              {eligibleStudios.length >= 1 && (() => {
                const studioMedalStyle: Record<number, { bg: string; color: string; border: string }> = {
                  0: { bg: '#fbbf24', color: '#78350f', border: '#d97706' },
                  1: { bg: '#cbd5e1', color: '#1e293b', border: '#94a3b8' },
                  2: { bg: '#fb923c', color: '#431407', border: '#ea580c' },
                }
                const top = eligibleStudios.slice(0, 3)
                return (
                  <div style={{ backgroundColor: '#1a1a2e', borderRadius: 8, padding: '14px 16px', marginBottom: 8 }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#a78bfa', marginBottom: 10 }}>Top Studio Standings</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                      {top.map((s, i) => ({ s, i })).reverse().map(({ s, i }) => {
                        const ms = studioMedalStyle[i]
                        return (
                          <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 8, backgroundColor: ms.bg, border: `2px solid ${ms.border}` }}>
                            <div style={{ fontSize: '1.4rem', lineHeight: 1, flexShrink: 0 }}>{i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}</div>
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontWeight: 700, fontSize: '0.82rem', color: ms.color, lineHeight: 1.3 }}>{s.name}</div>
                              <div style={{ fontSize: '0.72rem', color: ms.color, opacity: 0.75, lineHeight: 1.2 }}>{Math.round(s.goldPct * 100)}% gold</div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })()}
              <div className="card overflow-hidden"><table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: 40, textAlign: 'center' }}>Rank</th>
                    <th>Studio</th>
                    <th style={{ textAlign: 'center', width: 100 }}>Total entries</th>
                    <th style={{ textAlign: 'center', width: 100 }}>Closed entries</th>
                    <th style={{ textAlign: 'center', width: 64, backgroundColor: '#fef9c3' }}><span style={{ color: '#713f12', fontWeight: 900 }}>Gold</span></th>
                    <th style={{ textAlign: 'center', width: 64, backgroundColor: '#fef9c3' }}><span style={{ color: '#713f12', fontWeight: 900 }}>Gold %</span></th>
                    <th style={{ textAlign: 'center', width: 64 }}><span style={{ color: '#475569' }}>Silver</span></th>
                    <th style={{ textAlign: 'center', width: 60 }}><span style={{ color: '#475569' }}>Silver %</span></th>
                    <th style={{ textAlign: 'center', width: 64 }}><span style={{ color: '#7c2d12' }}>Bronze</span></th>
                    <th style={{ textAlign: 'center', width: 60 }}><span style={{ color: '#7c2d12' }}>Bronze %</span></th>
                  </tr>
                </thead>
                <tbody>
                  {eligibleStudios.map((s, i) => (
                    <tr key={s.id} style={{ backgroundColor: i === 0 ? '#fffbeb' : i === 1 ? '#f8fafc' : i === 2 ? '#fff7ed' : undefined }}>
                      <td style={{ textAlign: 'center', fontWeight: 700 }}>{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}</td>
                      <td className="font-semibold">{s.name}</td>
                      <td style={{ textAlign: 'center' }}>{s.totalEntries}</td>
                      <td style={{ textAlign: 'center' }}>{s.studentsInClosed}</td>
                      <td style={{ textAlign: 'center', fontWeight: 900, color: '#713f12', backgroundColor: '#fef9c3' }}>{s.goldStudents || '—'}</td>
                      <td style={{ textAlign: 'center', fontWeight: 900, color: '#713f12', backgroundColor: '#fef9c3', fontSize: '1rem' }}>{s.studentsInClosed > 0 ? `${Math.round(s.goldPct * 100)}%` : '—'}</td>
                      <td style={{ textAlign: 'center', fontWeight: 700, color: '#475569' }}>{s.silverStudents || '—'}</td>
                      <td style={{ textAlign: 'center', fontWeight: 900, color: '#475569' }}>{s.studentsInClosed > 0 ? `${Math.round(s.silverPct * 100)}%` : '—'}</td>
                      <td style={{ textAlign: 'center', fontWeight: 700, color: '#7c2d12' }}>{s.bronzeStudents || '—'}</td>
                      <td style={{ textAlign: 'center', fontWeight: 900, color: '#7c2d12' }}>{s.studentsInClosed > 0 ? `${Math.round(s.bronzePct * 100)}%` : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table></div>
            </>
          }
        </div>
      </section>
    </div>
  )
}
