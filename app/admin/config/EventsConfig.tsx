'use client'

import { addEvent, renameEvent, deleteEvent, addHeatToEvent, removeHeatFromEvent, setEventAmateur, setEventCompetitive, setCompRound, setCompRoundSizes, setCompPhase } from '@/app/actions/admin'
import { useState, useTransition } from 'react'

type CompRoundInfo = { round: string; phase: string; finalSize: number; semiSize: number } | null

type Couple = { studentId: number; leaderNumber: number | null; personA: string; personB: string }
type SemiMark = { eventId: number; studentId: number; judgeId: number; called: boolean }

type EventRow = {
  id: number
  name: string
  isAmateur: boolean
  isCompetitive: boolean
  compRound: CompRoundInfo
  heats: { id: number; number: number }[]
  couples: Couple[]
  semiMarks: SemiMark[]
  judgeCount: number
}

type HeatOption = {
  id: number
  number: number
  dance: string
  eventIds: number[]
}

export default function EventsConfig({
  events,
  allHeats,
}: {
  events: EventRow[]
  allHeats: HeatOption[]
}) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<number | null>(null)
  const [renaming, setRenaming] = useState<number | null>(null)

  function handleAdd(formData: FormData) {
    startTransition(async () => {
      const result = await addEvent(formData)
      if (result?.error) setError(result.error)
    })
  }

  function handleRename(eventId: number, formData: FormData) {
    startTransition(async () => {
      const result = await renameEvent(eventId, formData)
      if (result?.error) setError(result.error)
      else setRenaming(null)
    })
  }

  function handleToggleAmateur(eventId: number, current: boolean) {
    startTransition(async () => { await setEventAmateur(eventId, !current) })
  }

  function handleToggleCompetitive(eventId: number, current: boolean) {
    startTransition(async () => { await setEventCompetitive(eventId, !current) })
  }

  function handleSetRound(eventId: number, round: 'final' | 'semifinal') {
    startTransition(async () => { await setCompRound(eventId, round) })
  }

  function handleRoundSizes(eventId: number, formData: FormData) {
    const finalSize = parseInt(formData.get('finalSize') as string)
    const semiSize = parseInt(formData.get('semiSize') as string)
    if (isNaN(finalSize) || isNaN(semiSize)) return
    startTransition(async () => { await setCompRoundSizes(eventId, finalSize, semiSize) })
  }

  function handleSetPhase(eventId: number, phase: 'semi' | 'final') {
    startTransition(async () => { await setCompPhase(eventId, phase) })
  }

  function handleDelete(eventId: number, name: string) {
    if (!confirm(`Delete event "${name}"? This will unlink all its heats (not delete them).`)) return
    startTransition(async () => { await deleteEvent(eventId) })
  }

  function handleAdd2Event(heatId: number, eventId: number) {
    startTransition(async () => { await addHeatToEvent(heatId, eventId) })
  }

  function handleRemoveFromEvent(heatId: number, eventId: number) {
    startTransition(async () => {
      const result = await removeHeatFromEvent(heatId, eventId)
      if (result?.error) setError(result.error)
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs" style={{ color: 'var(--muted)' }}>
            Events group heats danced together. A heat can belong to multiple events (e.g., shared heats between Scholarship A &amp; Pre-Scholarship B). Sign-up for one event enrolls in all its heats.
          </p>
        </div>
      </div>

      {error && (
        <div className="text-sm px-3 py-2 flex justify-between" style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: 4, color: '#dc2626' }}>
          {error}
          <button onClick={() => setError(null)} className="font-bold">×</button>
        </div>
      )}

      <div className="card overflow-hidden">
        {events.length === 0 && (
          <p className="px-4 py-3 text-sm italic" style={{ color: 'var(--muted)' }}>No events yet</p>
        )}
        {events.map((evt, i) => {
          const isExpanded = expanded === evt.id
          const isRenaming = renaming === evt.id
          const addableHeats = allHeats.filter(h => !h.eventIds.includes(evt.id))
          const isSemiEvent = evt.isCompetitive && evt.compRound?.round === 'semifinal'
          const phase = evt.compRound?.phase ?? 'semi'

          // Callback tabulation
          const callbackCounts = evt.couples.map(c => {
            const marks = evt.semiMarks.filter(m => m.studentId === c.studentId)
            const count = marks.filter(m => m.called).length
            return { ...c, count, total: evt.judgeCount }
          }).sort((a, b) => b.count - a.count || (a.leaderNumber ?? 9999) - (b.leaderNumber ?? 9999))

          const finalSize = evt.compRound?.finalSize ?? 6
          const cutoffCount = callbackCounts[finalSize - 1]?.count ?? 0
          const atCutoff = callbackCounts.filter(c => c.count === cutoffCount)
          const hasTieAtCutoff = atCutoff.length > 1 && callbackCounts.filter(c => c.count >= cutoffCount).length > finalSize

          return (
            <div key={evt.id} style={{ borderTop: i > 0 ? '1px solid var(--border)' : undefined }}>
              <div className="flex items-center gap-3 px-4 py-2.5" style={{ backgroundColor: isExpanded ? '#f5f5f5' : 'var(--card)' }}>
                {isRenaming ? (
                  <form action={fd => handleRename(evt.id, fd)} className="flex gap-2 flex-1">
                    <input name="name" defaultValue={evt.name} autoFocus required className="field flex-1" style={{ padding: '3px 8px', fontSize: '0.875rem' }} />
                    <button type="submit" className="text-xs px-2 py-1 text-white" style={{ backgroundColor: '#333', borderRadius: 3 }}>Save</button>
                    <button type="button" onClick={() => setRenaming(null)} className="text-xs px-2 py-1" style={{ color: 'var(--muted)' }}>Cancel</button>
                  </form>
                ) : (
                  <>
                    <button onClick={() => setExpanded(isExpanded ? null : evt.id)} className="flex items-center gap-2 flex-1 text-left">
                      <span className="text-xs" style={{ color: 'var(--muted)', width: 12 }}>{isExpanded ? '▾' : '›'}</span>
                      <span className="font-medium text-sm">{evt.name}</span>
                      {evt.isAmateur && (
                        <span className="text-xs px-1.5 py-0.5" style={{ backgroundColor: '#dcfce7', border: '1px solid #86efac', borderRadius: 3, color: '#166534', fontWeight: 600 }}>Amateur</span>
                      )}
                      {evt.isCompetitive && (
                        <span className="text-xs px-1.5 py-0.5" style={{ backgroundColor: '#eff6ff', border: '1px solid #93c5fd', borderRadius: 3, color: '#1d4ed8', fontWeight: 600 }}>
                          Competitive · {isSemiEvent ? (phase === 'final' ? 'Final (from Semi)' : 'Semifinal') : 'Final'}
                        </span>
                      )}
                      <span className="text-xs" style={{ color: 'var(--muted)' }}>
                        {evt.heats.length} heat{evt.heats.length !== 1 ? 's' : ''}
                        {evt.heats.length > 0 && ` (#${evt.heats[0].number}–#${evt.heats[evt.heats.length - 1].number})`}
                      </span>
                    </button>
                    <button onClick={() => handleToggleAmateur(evt.id, evt.isAmateur)} disabled={pending} className="text-xs px-2 py-0.5 mr-1"
                      style={{ border: '1px solid var(--border)', borderRadius: 3, color: evt.isAmateur ? '#166534' : 'var(--muted)', backgroundColor: evt.isAmateur ? '#dcfce7' : 'transparent' }}
                      title={evt.isAmateur ? 'Remove Amateur designation' : 'Mark as Amateur pairs event'}>
                      {evt.isAmateur ? '✓ Amateur' : 'Amateur'}
                    </button>
                    <button onClick={() => handleToggleCompetitive(evt.id, evt.isCompetitive)} disabled={pending} className="text-xs px-2 py-0.5 mr-1"
                      style={{ border: '1px solid var(--border)', borderRadius: 3, color: evt.isCompetitive ? '#1d4ed8' : 'var(--muted)', backgroundColor: evt.isCompetitive ? '#eff6ff' : 'transparent' }}
                      title={evt.isCompetitive ? 'Remove Competitive designation' : 'Mark as competitive event (1–6 placement)'}>
                      {evt.isCompetitive ? '✓ Comp' : 'Comp'}
                    </button>
                    <button onClick={() => setRenaming(evt.id)} className="text-xs" style={{ color: 'var(--muted)' }}>Rename</button>
                    <button onClick={() => handleDelete(evt.id, evt.name)} disabled={pending} className="text-xs ml-1" style={{ color: '#dc2626' }}>Delete</button>
                  </>
                )}
              </div>

              {isExpanded && (
                <div className="px-5 py-4 space-y-5" style={{ backgroundColor: '#f9f9f9', borderTop: '1px solid var(--border)' }}>
                  {evt.isCompetitive && evt.compRound && (
                    <div className="space-y-4">
                      <div className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#1d4ed8' }}>Competitive Settings</div>

                      {/* Round type + sizes */}
                      <div className="flex flex-wrap gap-3 items-start">
                        <div>
                          <div className="text-xs font-medium mb-1" style={{ color: 'var(--muted)' }}>Round type</div>
                          <div className="flex gap-1">
                            {(['final', 'semifinal'] as const).map(r => (
                              <button key={r} onClick={() => handleSetRound(evt.id, r)} disabled={pending} className="text-xs px-3 py-1 font-medium"
                                style={{ borderRadius: 3, border: '1px solid var(--border)', backgroundColor: evt.compRound?.round === r ? '#1d4ed8' : 'transparent', color: evt.compRound?.round === r ? 'white' : 'var(--muted)' }}>
                                {r === 'final' ? 'Final only' : 'Starts with Semi'}
                              </button>
                            ))}
                          </div>
                        </div>
                        <form action={fd => handleRoundSizes(evt.id, fd)} className="flex gap-2 items-end">
                          <div>
                            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--muted)' }}>Final size</label>
                            <input name="finalSize" type="number" min={1} max={20} defaultValue={evt.compRound.finalSize} className="field" style={{ width: 70, padding: '3px 8px', fontSize: '0.875rem' }} />
                          </div>
                          {isSemiEvent && (
                            <div>
                              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--muted)' }}>Semi size</label>
                              <input name="semiSize" type="number" min={1} max={30} defaultValue={evt.compRound.semiSize} className="field" style={{ width: 70, padding: '3px 8px', fontSize: '0.875rem' }} />
                            </div>
                          )}
                          {!isSemiEvent && <input type="hidden" name="semiSize" value={evt.compRound.semiSize} />}
                          <button type="submit" disabled={pending} className="text-xs px-3 py-1.5 text-white" style={{ backgroundColor: '#333', borderRadius: 3 }}>Save</button>
                        </form>
                      </div>

                      {/* Semifinal tabulation + phase toggle */}
                      {isSemiEvent && (
                        <div className="rounded-lg overflow-hidden" style={{ border: '1px solid #d8b4fe' }}>
                          {/* Phase toggle header */}
                          <div className="px-4 py-2.5 flex items-center gap-3" style={{ backgroundColor: '#f5f3ff', borderBottom: '1px solid #ddd6fe' }}>
                            <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#6b21a8' }}>Live Phase</span>
                            <div className="flex gap-1 ml-auto">
                              {(['semi', 'final'] as const).map(p => (
                                <button key={p} onClick={() => handleSetPhase(evt.id, p)} disabled={pending}
                                  className="text-xs px-3 py-1 font-semibold"
                                  style={{
                                    borderRadius: 3, border: '1px solid',
                                    borderColor: phase === p ? '#7c3aed' : 'var(--border)',
                                    backgroundColor: phase === p ? '#7c3aed' : 'transparent',
                                    color: phase === p ? 'white' : 'var(--muted)',
                                  }}>
                                  {p === 'semi' ? 'Semifinal' : '→ Final'}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Callback tabulation */}
                          {callbackCounts.length === 0 ? (
                            <p className="px-4 py-3 text-sm italic" style={{ color: 'var(--muted)' }}>No couples enrolled yet.</p>
                          ) : (
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                              <thead>
                                <tr style={{ backgroundColor: '#ede9fe' }}>
                                  <th style={{ padding: '6px 12px', textAlign: 'left', fontWeight: 600, color: '#4c1d95' }}>#</th>
                                  <th style={{ padding: '6px 12px', textAlign: 'left', fontWeight: 600, color: '#4c1d95' }}>Couple</th>
                                  <th style={{ padding: '6px 12px', textAlign: 'center', fontWeight: 600, color: '#4c1d95' }}>Callbacks</th>
                                  <th style={{ padding: '6px 12px', textAlign: 'center', fontWeight: 600, color: '#4c1d95' }}>Status</th>
                                </tr>
                              </thead>
                              <tbody>
                                {callbackCounts.map((c, idx) => {
                                  const isIn = idx < finalSize
                                  const isTiedOut = !isIn && c.count === cutoffCount && hasTieAtCutoff
                                  return (
                                    <tr key={c.studentId} style={{ borderTop: '1px solid #ede9fe', backgroundColor: isIn ? '#faf5ff' : 'white' }}>
                                      <td style={{ padding: '6px 12px', fontFamily: 'monospace', fontWeight: 700, color: '#555' }}>{c.leaderNumber ?? '—'}</td>
                                      <td style={{ padding: '6px 12px' }}>
                                        <span style={{ fontWeight: 600 }}>{c.personA}</span>
                                        {c.personB && <span style={{ color: 'var(--muted)', marginLeft: 4 }}>& {c.personB}</span>}
                                      </td>
                                      <td style={{ padding: '6px 12px', textAlign: 'center' }}>
                                        <span style={{ fontWeight: 700, fontSize: '1rem', color: c.count > 0 ? '#6b21a8' : 'var(--muted)' }}>
                                          {c.count}
                                        </span>
                                        <span style={{ color: 'var(--muted)', fontSize: '0.75rem' }}>/{c.total}</span>
                                      </td>
                                      <td style={{ padding: '6px 12px', textAlign: 'center' }}>
                                        {isIn ? (
                                          <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 4, backgroundColor: '#dcfce7', color: '#14532d', fontWeight: 700, fontSize: '0.75rem' }}>In final</span>
                                        ) : isTiedOut ? (
                                          <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 4, backgroundColor: '#fef9c3', color: '#713f12', fontWeight: 700, fontSize: '0.75rem' }}>⚠ Tie</span>
                                        ) : (
                                          <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 4, backgroundColor: '#f1f5f9', color: 'var(--muted)', fontSize: '0.75rem' }}>Out</span>
                                        )}
                                      </td>
                                    </tr>
                                  )
                                })}
                              </tbody>
                            </table>
                          )}
                          {hasTieAtCutoff && (
                            <div className="px-4 py-2 text-xs" style={{ backgroundColor: '#fef9c3', borderTop: '1px solid #fde68a', color: '#713f12' }}>
                              ⚠ Tie at cutoff — bump <strong>Final size</strong> above to include tied couples.
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--muted)' }}>Heats in this Event</div>
                  <p className="text-xs mb-3" style={{ color: 'var(--muted)' }}>
                    A heat can be in multiple events simultaneously (e.g., the Waltz heat can belong to both Pre-Scholarship B and Scholarship A).
                  </p>

                  {evt.heats.length > 0 && (
                    <div className="mb-3">
                      <div className="text-xs font-medium mb-1.5">Currently in this event:</div>
                      <div className="flex flex-wrap gap-1.5">
                        {evt.heats.map(h => {
                          const heatInfo = allHeats.find(ah => ah.id === h.id)
                          const alsoInOtherEvents = (heatInfo?.eventIds.filter(id => id !== evt.id).length ?? 0) > 0
                          return (
                            <span key={h.id} className="inline-flex items-center gap-1.5 text-xs px-2 py-1"
                              style={{ backgroundColor: alsoInOtherEvents ? '#fff8e0' : '#e8e8e8', border: `1px solid ${alsoInOtherEvents ? '#d4b800' : 'var(--border)'}`, borderRadius: 3 }}>
                              #{h.number} {heatInfo?.dance}
                              {alsoInOtherEvents && <span title="Shared with another event" style={{ color: '#b08800', fontSize: 10 }}>⇌</span>}
                              <button onClick={() => handleRemoveFromEvent(h.id, evt.id)} disabled={pending} style={{ color: '#dc2626', fontWeight: 700, fontSize: 11 }}>×</button>
                            </span>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  <div>
                    <div className="text-xs font-medium mb-1.5">
                      Add heats:
                      <span className="ml-1 font-normal" style={{ color: 'var(--muted)' }}>heats already in another event are marked ⇌</span>
                    </div>
                    <div style={{ maxHeight: 220, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 4 }}>
                      <table className="data-table" style={{ fontSize: '0.75rem' }}>
                        <thead>
                          <tr>
                            <th style={{ width: 50 }}>Heat</th>
                            <th>Dance</th>
                            <th style={{ width: 90 }}>Events</th>
                            <th style={{ width: 60 }}></th>
                          </tr>
                        </thead>
                        <tbody>
                          {addableHeats.map(h => {
                            const otherEventNames = h.eventIds.filter(id => id !== evt.id).map(id => events.find(e => e.id === id)?.name ?? '').filter(Boolean)
                            return (
                              <tr key={h.id} style={{ backgroundColor: otherEventNames.length > 0 ? '#fffdf0' : undefined }}>
                                <td style={{ fontFamily: 'monospace' }}>#{h.number}</td>
                                <td>{h.dance}</td>
                                <td style={{ fontSize: '0.7rem', color: '#b08800' }}>{otherEventNames.length > 0 ? `⇌ ${otherEventNames.join(', ')}` : ''}</td>
                                <td>
                                  <button onClick={() => handleAdd2Event(h.id, evt.id)} disabled={pending} className="text-xs px-2 py-0.5 text-white" style={{ backgroundColor: '#333', borderRadius: 3 }}>Add</button>
                                </td>
                              </tr>
                            )
                          })}
                          {addableHeats.length === 0 && (
                            <tr><td colSpan={4} style={{ color: 'var(--muted)', textAlign: 'center', padding: 8 }}>All heats already in this event</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}

        <div className="px-5 py-4" style={{ borderTop: events.length > 0 ? '1px solid var(--border)' : undefined, backgroundColor: '#fafafa' }}>
          <div className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--muted)' }}>Add Event</div>
          <form action={handleAdd} className="space-y-2">
            <div className="flex gap-2">
              <input name="name" placeholder='e.g. "Scholarship Smooth A"' required className="field flex-1" />
              <button type="submit" className="text-sm px-4 py-1.5 font-medium text-white" style={{ backgroundColor: '#333', borderRadius: 4 }}>Add</button>
            </div>
            <label className="flex items-center gap-2 text-xs cursor-pointer" style={{ color: 'var(--muted)' }}>
              <input type="checkbox" name="isAmateur" style={{ accentColor: '#166534' }} />
              Amateur pairs event (students dance without an instructor)
            </label>
            <label className="flex items-center gap-2 text-xs cursor-pointer" style={{ color: 'var(--muted)' }}>
              <input type="checkbox" name="isCompetitive" style={{ accentColor: '#1d4ed8' }} />
              Competitive event (judges give 1–6 placements)
            </label>
          </form>
        </div>
      </div>
    </div>
  )
}
