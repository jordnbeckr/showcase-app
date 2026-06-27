'use client'

import { addEvent, renameEvent, deleteEvent, addHeatToEvent, removeHeatFromEvent, setEventAmateur, setEventCompetitive, setCompRound, setCompRoundSizes } from '@/app/actions/admin'
import { useState, useTransition } from 'react'

type CompRoundInfo = { round: string; finalSize: number; semiSize: number } | null

type EventRow = {
  id: number
  name: string
  isAmateur: boolean
  isCompetitive: boolean
  compRound: CompRoundInfo
  heats: { id: number; number: number }[]
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

  function handleDelete(eventId: number, name: string) {
    if (!confirm(`Delete event "${name}"? This will unlink all its heats (not delete them).`)) return
    startTransition(async () => {
      await deleteEvent(eventId)
    })
  }

  function handleAdd2Event(heatId: number, eventId: number) {
    startTransition(async () => { await addHeatToEvent(heatId, eventId) })
  }

  function handleRemoveFromEvent(heatId: number, eventId: number) {
    startTransition(async () => { await removeHeatFromEvent(heatId, eventId) })
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
        <div
          className="text-sm px-3 py-2 flex justify-between"
          style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: 4, color: '#dc2626' }}
        >
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
          // Heats not yet in THIS event (may be in other events — that's now allowed)
          const addableHeats = allHeats.filter(h => !h.eventIds.includes(evt.id))
          return (
            <div key={evt.id} style={{ borderTop: i > 0 ? '1px solid var(--border)' : undefined }}>
              <div
                className="flex items-center gap-3 px-4 py-2.5"
                style={{ backgroundColor: isExpanded ? '#f5f5f5' : 'var(--card)' }}
              >
                {isRenaming ? (
                  <form action={fd => handleRename(evt.id, fd)} className="flex gap-2 flex-1">
                    <input
                      name="name"
                      defaultValue={evt.name}
                      autoFocus
                      required
                      className="field flex-1"
                      style={{ padding: '3px 8px', fontSize: '0.875rem' }}
                    />
                    <button type="submit" className="text-xs px-2 py-1 text-white" style={{ backgroundColor: '#333', borderRadius: 3 }}>Save</button>
                    <button type="button" onClick={() => setRenaming(null)} className="text-xs px-2 py-1" style={{ color: 'var(--muted)' }}>Cancel</button>
                  </form>
                ) : (
                  <>
                    <button
                      onClick={() => setExpanded(isExpanded ? null : evt.id)}
                      className="flex items-center gap-2 flex-1 text-left"
                    >
                      <span className="text-xs" style={{ color: 'var(--muted)', width: 12 }}>
                        {isExpanded ? '▾' : '›'}
                      </span>
                      <span className="font-medium text-sm">{evt.name}</span>
                      {evt.isAmateur && (
                        <span className="text-xs px-1.5 py-0.5" style={{ backgroundColor: '#dcfce7', border: '1px solid #86efac', borderRadius: 3, color: '#166534', fontWeight: 600 }}>Amateur</span>
                      )}
                      {evt.isCompetitive && (
                        <span className="text-xs px-1.5 py-0.5" style={{ backgroundColor: '#eff6ff', border: '1px solid #93c5fd', borderRadius: 3, color: '#1d4ed8', fontWeight: 600 }}>
                          Competitive · {evt.compRound?.round === 'semifinal' ? 'Semi' : 'Final'}
                        </span>
                      )}
                      <span className="text-xs" style={{ color: 'var(--muted)' }}>
                        {evt.heats.length} heat{evt.heats.length !== 1 ? 's' : ''}
                        {evt.heats.length > 0 && ` (#${evt.heats[0].number}–#${evt.heats[evt.heats.length - 1].number})`}
                      </span>
                    </button>
                    <button
                      onClick={() => handleToggleAmateur(evt.id, evt.isAmateur)}
                      disabled={pending}
                      className="text-xs px-2 py-0.5 mr-1"
                      style={{ border: '1px solid var(--border)', borderRadius: 3, color: evt.isAmateur ? '#166534' : 'var(--muted)', backgroundColor: evt.isAmateur ? '#dcfce7' : 'transparent' }}
                      title={evt.isAmateur ? 'Remove Amateur designation' : 'Mark as Amateur pairs event'}
                    >
                      {evt.isAmateur ? '✓ Amateur' : 'Amateur'}
                    </button>
                    <button
                      onClick={() => handleToggleCompetitive(evt.id, evt.isCompetitive)}
                      disabled={pending}
                      className="text-xs px-2 py-0.5 mr-1"
                      style={{ border: '1px solid var(--border)', borderRadius: 3, color: evt.isCompetitive ? '#1d4ed8' : 'var(--muted)', backgroundColor: evt.isCompetitive ? '#eff6ff' : 'transparent' }}
                      title={evt.isCompetitive ? 'Remove Competitive designation' : 'Mark as competitive event (1–6 placement)'}
                    >
                      {evt.isCompetitive ? '✓ Comp' : 'Comp'}
                    </button>
                    <button onClick={() => setRenaming(evt.id)} className="text-xs" style={{ color: 'var(--muted)' }}>Rename</button>
                    <button onClick={() => handleDelete(evt.id, evt.name)} disabled={pending} className="text-xs ml-1" style={{ color: '#dc2626' }}>Delete</button>
                  </>
                )}
              </div>

              {isExpanded && (
                <div className="px-5 py-4 space-y-5" style={{ backgroundColor: '#f9f9f9', borderTop: '1px solid var(--border)' }}>
                  {/* Competitive round settings */}
                  {evt.isCompetitive && evt.compRound && (
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: '#1d4ed8' }}>Competitive Settings</div>
                      <div className="flex flex-wrap gap-3 items-start">
                        <div>
                          <div className="text-xs font-medium mb-1" style={{ color: 'var(--muted)' }}>Active Round</div>
                          <div className="flex gap-1">
                            {(['final', 'semifinal'] as const).map(r => (
                              <button
                                key={r}
                                onClick={() => handleSetRound(evt.id, r)}
                                disabled={pending}
                                className="text-xs px-3 py-1 font-medium"
                                style={{
                                  borderRadius: 3,
                                  border: '1px solid var(--border)',
                                  backgroundColor: evt.compRound?.round === r ? '#1d4ed8' : 'transparent',
                                  color: evt.compRound?.round === r ? 'white' : 'var(--muted)',
                                }}
                              >
                                {r === 'final' ? 'Final' : 'Semifinal'}
                              </button>
                            ))}
                          </div>
                        </div>
                        <form action={fd => handleRoundSizes(evt.id, fd)} className="flex gap-2 items-end">
                          <div>
                            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--muted)' }}>Final size</label>
                            <input name="finalSize" type="number" min={1} max={20} defaultValue={evt.compRound.finalSize}
                              className="field" style={{ width: 70, padding: '3px 8px', fontSize: '0.875rem' }} />
                          </div>
                          <div>
                            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--muted)' }}>Semi size</label>
                            <input name="semiSize" type="number" min={1} max={30} defaultValue={evt.compRound.semiSize}
                              className="field" style={{ width: 70, padding: '3px 8px', fontSize: '0.875rem' }} />
                          </div>
                          <button type="submit" disabled={pending} className="text-xs px-3 py-1.5 text-white" style={{ backgroundColor: '#333', borderRadius: 3 }}>
                            Save
                          </button>
                        </form>
                      </div>
                    </div>
                  )}

                  <div className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--muted)' }}>
                    Heats in this Event
                  </div>
                  <p className="text-xs mb-3" style={{ color: 'var(--muted)' }}>
                    A heat can be in multiple events simultaneously (e.g., the Waltz heat can belong to both Pre-Scholarship B and Scholarship A).
                  </p>

                  {/* Currently assigned heats */}
                  {evt.heats.length > 0 && (
                    <div className="mb-3">
                      <div className="text-xs font-medium mb-1.5">Currently in this event:</div>
                      <div className="flex flex-wrap gap-1.5">
                        {evt.heats.map(h => {
                          const heatInfo = allHeats.find(ah => ah.id === h.id)
                          const alsoInOtherEvents = (heatInfo?.eventIds.filter(id => id !== evt.id).length ?? 0) > 0
                          return (
                            <span
                              key={h.id}
                              className="inline-flex items-center gap-1.5 text-xs px-2 py-1"
                              style={{
                                backgroundColor: alsoInOtherEvents ? '#fff8e0' : '#e8e8e8',
                                border: `1px solid ${alsoInOtherEvents ? '#d4b800' : 'var(--border)'}`,
                                borderRadius: 3,
                              }}
                            >
                              #{h.number} {heatInfo?.dance}
                              {alsoInOtherEvents && <span title="Shared with another event" style={{ color: '#b08800', fontSize: 10 }}>⇌</span>}
                              <button
                                onClick={() => handleRemoveFromEvent(h.id, evt.id)}
                                disabled={pending}
                                style={{ color: '#dc2626', fontWeight: 700, fontSize: 11 }}
                              >
                                ×
                              </button>
                            </span>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* All heats not yet in this event */}
                  <div>
                    <div className="text-xs font-medium mb-1.5">
                      Add heats:
                      <span className="ml-1 font-normal" style={{ color: 'var(--muted)' }}>
                        heats already in another event are marked ⇌
                      </span>
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
                            const otherEventNames = h.eventIds
                              .filter(id => id !== evt.id)
                              .map(id => events.find(e => e.id === id)?.name ?? '')
                              .filter(Boolean)
                            return (
                              <tr key={h.id} style={{ backgroundColor: otherEventNames.length > 0 ? '#fffdf0' : undefined }}>
                                <td style={{ fontFamily: 'monospace' }}>#{h.number}</td>
                                <td>{h.dance}</td>
                                <td style={{ fontSize: '0.7rem', color: '#b08800' }}>
                                  {otherEventNames.length > 0 ? `⇌ ${otherEventNames.join(', ')}` : ''}
                                </td>
                                <td>
                                  <button
                                    onClick={() => handleAdd2Event(h.id, evt.id)}
                                    disabled={pending}
                                    className="text-xs px-2 py-0.5 text-white"
                                    style={{ backgroundColor: '#333', borderRadius: 3 }}
                                  >
                                    Add
                                  </button>
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
              <input
                name="name"
                placeholder='e.g. "Scholarship Smooth A"'
                required
                className="field flex-1"
              />
              <button type="submit" className="text-sm px-4 py-1.5 font-medium text-white" style={{ backgroundColor: '#333', borderRadius: 4 }}>
                Add
              </button>
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
