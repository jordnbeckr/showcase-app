'use client'

import { addHeatEntry, removeHeatEntry, addEventEntry, removeEventEntry, addAmateurEventEntry, removeAmateurEventEntry } from '@/app/actions/studio'
import { useState, useTransition, useMemo, useEffect, useRef, Fragment } from 'react'

type HeatEntry = {
  id: number
  studentId: number
  studentName: string
  instructorId: number | null
}

type AmateurPair = {
  eventId: number
  leaderId: number
  leaderName: string
  followerId: number
  followerName: string
}

type HeatRow = {
  id: number
  number: number
  dance: string
  maxCapacity: number
  totalEntries: number
  myEntries: HeatEntry[]
  eventIds: number[]
}

type EventInfo = {
  id: number
  name: string
  heatIds: number[]
  isAmateur: boolean
}

type Student = { id: number; firstName: string; lastName: string; role: string }
type Instructor = { id: number; name: string }

function capacityLabel(count: number, max: number) {
  if (count >= max) return { text: 'Full', bg: '#fee2e2', fg: '#991b1b' }
  if (count >= Math.floor(max * 0.75)) return { text: 'Filling Up', bg: '#ffedd5', fg: '#9a3412' }
  if (count >= Math.floor(max / 2)) return { text: 'Half Full', bg: '#fef9c3', fg: '#92400e' }
  return { text: 'Open', bg: '#dcfce7', fg: '#166534' }
}

export default function HeatSignUp({
  slug,
  students,
  instructors,
  heats,
  events,
  enrolledEvents,
  amateurPairs,
}: {
  slug: string
  studio: { id: number; name: string }
  students: Student[]
  instructors: Instructor[]
  heats: HeatRow[]
  events: EventInfo[]
  enrolledEvents: { studentId: number; eventId: number }[]
  amateurPairs: AmateurPair[]
}) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [filterText, setFilterText] = useState('')
  const [selectedStudentId, setSelectedStudentId] = useState('')
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const [dropdownSearch, setDropdownSearch] = useState('')
  const [amateurFormEventId, setAmateurFormEventId] = useState<number | null>(null)
  const [amateurLeaderId, setAmateurLeaderId] = useState('')
  const [amateurFollowerId, setAmateurFollowerId] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)

  const selectedStudent = students.find(s => s.id.toString() === selectedStudentId)

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpenDropdown(null)
      }
    }
    if (openDropdown) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [openDropdown])

  const heatInAnyEvent = useMemo(() => new Set(events.flatMap(e => e.heatIds)), [events])

  const filteredHeats = useMemo(() => {
    const q = filterText.toLowerCase()
    if (!q) return heats
    return heats.filter(h => {
      if (h.dance.toLowerCase().includes(q) || h.number.toString().includes(q)) return true
      return h.eventIds.some(eid => events.find(e => e.id === eid)?.name.toLowerCase().includes(q))
    })
  }, [heats, filterText, events])

  const filteredHeatIds = useMemo(() => new Set(filteredHeats.map(h => h.id)), [filteredHeats])

  type Segment =
    | { type: 'event'; event: EventInfo; heats: HeatRow[] }
    | { type: 'heat'; heat: HeatRow }

  const segments = useMemo((): Segment[] => {
    const result: Segment[] = []
    const processedEventIds = new Set<number>()
    const claimedHeatIds = new Set<number>()

    for (const heat of filteredHeats) {
      if (claimedHeatIds.has(heat.id)) continue

      const eventsStartingHere = events.filter(evt => {
        if (processedEventIds.has(evt.id)) return false
        const sortedHeatNums = evt.heatIds
          .map(id => heats.find(h => h.id === id)?.number ?? 9999)
          .sort((a, b) => a - b)
        return sortedHeatNums[0] === heat.number
      })

      if (eventsStartingHere.length > 0) {
        for (const evt of eventsStartingHere) {
          processedEventIds.add(evt.id)
          const eventHeats = heats
            .filter(h => evt.heatIds.includes(h.id) && filteredHeatIds.has(h.id))
            .sort((a, b) => a.number - b.number)
          evt.heatIds.forEach(id => claimedHeatIds.add(id))
          result.push({ type: 'event', event: evt, heats: eventHeats })
        }
      } else if (!heatInAnyEvent.has(heat.id)) {
        result.push({ type: 'heat', heat })
      }
    }

    return result
  }, [filteredHeats, filteredHeatIds, events, heats, heatInAnyEvent])

  function handleAddSingle(heatId: number, instructorId: number, studentId?: number) {
    const sid = studentId ?? (selectedStudentId ? parseInt(selectedStudentId) : null)
    if (!sid) { setError('Select a student first'); return }
    startTransition(async () => {
      const result = await addHeatEntry(slug, heatId, sid, instructorId)
      if (result?.error) setError(result.error)
      else setError(null)
    })
    setOpenDropdown(null)
  }

  function handleAddEvent(eventId: number, instructorId: number, studentId?: number) {
    const sid = studentId ?? (selectedStudentId ? parseInt(selectedStudentId) : null)
    if (!sid) { setError('Select a student first'); return }
    startTransition(async () => {
      const result = await addEventEntry(slug, eventId, sid, instructorId)
      if (result?.error) setError(result.error)
      else setError(null)
    })
    setOpenDropdown(null)
  }

  function handleRemoveSingle(entryId: number) {
    startTransition(async () => {
      const result = await removeHeatEntry(slug, entryId)
      if (result?.error) setError(result.error)
    })
  }

  function handleRemoveEvent(eventId: number, studentId: number) {
    if (!confirm('Remove this student from all heats in this event?')) return
    startTransition(async () => {
      const result = await removeEventEntry(slug, eventId, studentId)
      if (result?.error) setError(result.error)
    })
  }

  function handleAddAmateurPair(eventId: number) {
    const lid = parseInt(amateurLeaderId)
    const fid = parseInt(amateurFollowerId)
    if (!lid || !fid) { setError('Select both a leader and a follower'); return }
    startTransition(async () => {
      const result = await addAmateurEventEntry(slug, eventId, lid, fid)
      if (result?.error) setError(result.error)
      else { setAmateurFormEventId(null); setAmateurLeaderId(''); setAmateurFollowerId('') }
    })
  }

  function handleRemoveAmateurPair(eventId: number, leaderId: number) {
    if (!confirm('Remove this amateur pair from the event?')) return
    startTransition(async () => {
      await removeAmateurEventEntry(slug, eventId, leaderId)
    })
  }

  const totalMyEntries = heats.reduce((s, h) => s + h.myEntries.length, 0)

  function studentEnrolledInEvent(eventId: number): boolean {
    if (!selectedStudentId) return false
    const sid = parseInt(selectedStudentId)
    return enrolledEvents.some(e => e.studentId === sid && e.eventId === eventId)
  }

  function renderInstructorCell(
    heat: HeatRow,
    inst: Instructor,
    opts: { isEvent: boolean; eventId?: number }
  ) {
    const dropKey = opts.isEvent && opts.eventId != null
      ? `event-${opts.eventId}-heat-${heat.id}-${inst.id}`
      : `heat-${heat.id}-${inst.id}`

    const allCellEntries = heat.myEntries.filter(e => e.instructorId === inst.id)
    const cellEntries = opts.isEvent && opts.eventId != null
      ? allCellEntries.filter(e => enrolledEvents.some(ev => ev.studentId === e.studentId && ev.eventId === opts.eventId))
      : allCellEntries

    const studId = selectedStudentId ? parseInt(selectedStudentId) : null

    const studentInThisContext = studId
      ? opts.isEvent && opts.eventId != null
        ? enrolledEvents.some(e => e.studentId === studId && e.eventId === opts.eventId)
        : heat.myEntries.some(e => e.studentId === studId)
      : false

    const isFull = heat.totalEntries >= heat.maxCapacity
    const studentInHeat = studId ? heat.myEntries.some(e => e.studentId === studId) : false
    const cellOccupied = cellEntries.length > 0
    const canAddSelected = opts.isEvent
      ? !!studId && !isFull && !studentInThisContext && !cellOccupied
      : !!studId && !isFull && !studentInHeat && !cellOccupied

    // Students available in the per-cell dropdown, sorted by last name
    const addableStudents = isFull ? [] : students
      .filter(s => {
        if (opts.isEvent && opts.eventId != null) {
          return !enrolledEvents.some(ev => ev.studentId === s.id && ev.eventId === opts.eventId)
        }
        return !heat.myEntries.some(e => e.studentId === s.id)
      })
      .sort((a, b) => a.lastName.localeCompare(b.lastName))

    const isOpen = openDropdown === dropKey

    return (
      <td
        key={inst.id}
        style={{
          textAlign: 'center',
          backgroundColor: canAddSelected ? '#f0fff4' : undefined,
          cursor: canAddSelected ? 'pointer' : undefined,
          padding: '3px 6px',
          verticalAlign: 'middle',
          position: 'relative',
        }}
        onClick={() => {
          if (!canAddSelected) return
          if (opts.isEvent && opts.eventId != null) {
            handleAddEvent(opts.eventId, inst.id)
          } else {
            handleAddSingle(heat.id, inst.id)
          }
        }}
        title={canAddSelected ? `Add ${selectedStudent?.firstName} with ${inst.name}` : undefined}
      >
        <div className="flex flex-col gap-0.5 items-center">
          {cellEntries.map(entry => {
            const isSelectedStudent = selectedStudent?.id === entry.studentId
            return (
              <span
                key={entry.id}
                className="inline-flex items-center gap-1 text-xs px-1.5 py-0.5"
                style={{
                  backgroundColor: '#e8e8e8',
                  borderRadius: 3,
                  border: '1px solid var(--border)',
                  whiteSpace: 'nowrap',
                }}
              >
                {isSelectedStudent
                  ? <strong>{selectedStudent.firstName}</strong>
                  : entry.studentName.split(' ')[0]}
                <button
                  onClick={ev => {
                    ev.stopPropagation()
                    if (opts.isEvent && opts.eventId != null) {
                      handleRemoveEvent(opts.eventId, entry.studentId)
                    } else {
                      handleRemoveSingle(entry.id)
                    }
                  }}
                  disabled={pending}
                  style={{ color: '#999', fontSize: 11, fontWeight: 700, lineHeight: 1 }}
                >×</button>
              </span>
            )
          })}

          {canAddSelected && (
            <span className="text-xs" style={{ color: '#ccc', pointerEvents: 'none' }}>+ add</span>
          )}

          {/* Per-cell dropdown trigger — absolute bottom-right so it doesn't add height */}
          {!isFull && !cellOccupied && addableStudents.length > 0 && (
            <div style={{ position: 'absolute', bottom: 2, right: 3 }}>
              <button
                onClick={e => {
                  e.stopPropagation()
                  if (!isOpen) setDropdownSearch('')
                  setOpenDropdown(isOpen ? null : dropKey)
                }}
                disabled={pending}
                className="text-xs px-1.5 py-0.5 mt-0.5"
                style={{
                  color: isOpen ? '#333' : '#aaa',
                  border: `1px solid ${isOpen ? '#bbb' : '#ddd'}`,
                  borderRadius: 3,
                  backgroundColor: isOpen ? '#f0f0f0' : 'transparent',
                  lineHeight: 1,
                }}
                title="Add a student…"
              >
                ▾
              </button>

              {isOpen && (
                <div
                  ref={dropdownRef}
                  onClick={e => e.stopPropagation()}
                  style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    zIndex: 50,
                    backgroundColor: 'white',
                    border: '1px solid var(--border)',
                    borderRadius: 4,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
                    minWidth: 180,
                    textAlign: 'left',
                  }}
                >
                  <div style={{ padding: '6px 6px 4px', borderBottom: '1px solid #eee' }}>
                    <input
                      autoFocus
                      value={dropdownSearch}
                      onChange={e => setDropdownSearch(e.target.value)}
                      onClick={e => e.stopPropagation()}
                      placeholder="Search…"
                      style={{
                        width: '100%',
                        fontSize: '0.75rem',
                        padding: '3px 6px',
                        border: '1px solid #ddd',
                        borderRadius: 3,
                        outline: 'none',
                      }}
                    />
                  </div>
                  <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                  {addableStudents.filter(s =>
                    dropdownSearch === '' ||
                    `${s.lastName} ${s.firstName}`.toLowerCase().includes(dropdownSearch.toLowerCase())
                  ).map(s => (
                    <button
                      key={s.id}
                      onClick={() => {
                        if (opts.isEvent && opts.eventId != null) {
                          handleAddEvent(opts.eventId, inst.id, s.id)
                        } else {
                          handleAddSingle(heat.id, inst.id, s.id)
                        }
                      }}
                      className="w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50"
                      style={{ borderBottom: '1px solid #f0f0f0' }}
                    >
                      {s.lastName}, {s.firstName}
                    </button>
                  ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </td>
    )
  }

  return (
    <div className="space-y-3">
      {/* Controls */}
      <div className="flex flex-wrap gap-4 items-end px-4 py-3 card">
        <div>
          <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--muted)' }}>ACTIVE STUDENT</label>
          <select
            value={selectedStudentId}
            onChange={e => setSelectedStudentId(e.target.value)}
            className="field"
            style={{ width: 230 }}
          >
            <option value="">— select to place in heats —</option>
            {(['Leader', 'Follower'] as const).map(role => (
              <optgroup key={role} label={role + 's'}>
                {students.filter(s => s.role === role).map(s => (
                  <option key={s.id} value={s.id}>{s.firstName} {s.lastName}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        {selectedStudent && (
          <div className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium" style={{ backgroundColor: '#f0f0f0', borderRadius: 4, border: '1px solid var(--border)' }}>
            Placing: <strong>{selectedStudent.firstName} {selectedStudent.lastName}</strong>
            <button onClick={() => setSelectedStudentId('')} className="text-xs" style={{ color: 'var(--muted)' }}>✕</button>
          </div>
        )}

        <div className="ml-auto flex items-center gap-3">
          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--muted)' }}>FILTER</label>
            <input value={filterText} onChange={e => setFilterText(e.target.value)} placeholder="Dance, heat #, or event…" className="field" style={{ width: 190 }} />
          </div>
          <div className="text-sm text-right" style={{ paddingBottom: 2 }}>
            <div className="font-bold text-base">{totalMyEntries}</div>
            <div className="text-xs" style={{ color: 'var(--muted)' }}>entries</div>
          </div>
        </div>
      </div>

      {error && (
        <div className="text-sm px-3 py-2 flex justify-between" style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: 4, color: '#dc2626' }}>
          {error}<button onClick={() => setError(null)} className="font-bold">×</button>
        </div>
      )}

      {/* Legend */}
      <div className="flex gap-4 text-xs" style={{ color: 'var(--muted)' }}>
        <span>Capacity (all studios):</span>
        {[
          { label: 'Open', color: '#16a34a' },
          { label: 'Half Full', color: '#d97706' },
          { label: 'Filling Up', color: '#ea580c' },
          { label: 'Full', color: '#dc2626' },
        ].map(({ label, color }) => (
          <span key={label} className="flex items-center gap-1">
            <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
            {label}
          </span>
        ))}
        <span style={{ marginLeft: 8, borderLeft: '2px solid #ccc', paddingLeft: 8, color: '#aaa' }}>
          EVENT heats are grouped — click ▾ or select a student above then click cell
        </span>
      </div>

      {/* Single table — heats in order, events grouped inline */}
      {(() => {
        const colW = 145
        const baseW = 300 + instructors.length * colW
        const colSpan = 4 + instructors.length

        return (
          <div style={{ overflow: 'auto', maxHeight: 'calc(100vh - 180px)' }}>
            <table className="data-table" style={{ minWidth: baseW }}>
              <thead>
                <tr>
                  <th style={{ width: 6, padding: 0, position: 'sticky', top: 0, zIndex: 10, backgroundColor: 'var(--card)' }}></th>
                  <th style={{ width: 40, position: 'sticky', top: 0, zIndex: 10, backgroundColor: 'var(--card)' }}>#</th>
                  <th style={{ width: 145, position: 'sticky', top: 0, zIndex: 10, backgroundColor: 'var(--card)' }}>Dance</th>
                  <th style={{ width: 95, position: 'sticky', top: 0, zIndex: 10, backgroundColor: 'var(--card)' }}>Status</th>
                  {instructors.map(inst => (
                    <th key={inst.id} style={{ width: colW, textAlign: 'center', position: 'sticky', top: 0, zIndex: 10, backgroundColor: 'var(--card)' }}>{inst.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {segments.length === 0 && (
                  <tr><td colSpan={colSpan} style={{ textAlign: 'center', padding: 24, color: 'var(--muted)', fontSize: '0.875rem' }}>No heats match your filter.</td></tr>
                )}
                {segments.map(seg => {
                  if (seg.type === 'heat') {
                    const heat = seg.heat
                    const { text: statusText, bg: statusBg, fg: statusFg } = capacityLabel(heat.totalEntries, heat.maxCapacity)
                    return (
                      <tr key={`heat-${heat.id}`}>
                        <td style={{ padding: 0, width: 6 }}></td>
                        <td style={{ color: 'var(--muted)', fontFamily: 'monospace', textAlign: 'center', fontSize: '0.72rem' }}>{heat.number}</td>
                        <td style={{ fontSize: '0.82rem' }}>{heat.dance}</td>
                        <td>
                          <span style={{ background: statusBg, color: statusFg, fontSize: '0.68rem', fontWeight: 500, padding: '2px 6px', borderRadius: 20, whiteSpace: 'nowrap' }}>
                            {statusText} · {heat.totalEntries}/{heat.maxCapacity}
                          </span>
                        </td>
                        {instructors.map(inst => renderInstructorCell(heat, inst, { isEvent: false }))}
                      </tr>
                    )
                  }

                  // Event segment — banner row + amateur pairs row + one row per heat
                  const { event, heats: eventHeats } = seg
                  const isStudentEnrolled = studentEnrolledInEvent(event.id)
                  const eventPairs = amateurPairs.filter(p => p.eventId === event.id)
                  const isAmateurFormOpen = amateurFormEventId === event.id
                  const leaders = students.filter(s => s.role === 'Leader')
                  const followers = students.filter(s => s.role === 'Follower')
                  return (
                    <Fragment key={`event-${event.id}`}>
                      <tr>
                        <td colSpan={colSpan} style={{ backgroundColor: '#2c2c2c', color: 'white', fontWeight: 700, fontSize: '0.75rem', letterSpacing: '0.06em', padding: '5px 10px', borderTop: '2px solid #1a1a1a', textTransform: 'uppercase' }}>
                          ◆ {event.name}
                          <span style={{ fontWeight: 400, opacity: 0.6, marginLeft: 10, fontSize: '0.7rem', textTransform: 'none' }}>
                            {event.heatIds.length} dances — sign up for all at once
                          </span>
                          {isStudentEnrolled && (
                            <span style={{ marginLeft: 12, fontWeight: 400, opacity: 0.85, fontSize: '0.7rem', color: '#86efac', textTransform: 'none' }}>
                              ✓ {selectedStudent?.firstName} enrolled
                            </span>
                          )}
                        </td>
                      </tr>
                      {/* Amateur pairs sub-row — only for events designated as amateur */}
                      {!event.isAmateur ? null : <tr>
                        <td colSpan={colSpan} style={{ backgroundColor: '#1e1e1e', padding: '4px 10px 5px', borderBottom: '1px solid #333' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            <span style={{ color: '#888', fontSize: '0.68rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', flexShrink: 0 }}>Amateur Pairs</span>
                            {eventPairs.map(pair => (
                              <span key={`${pair.leaderId}-${pair.followerId}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, backgroundColor: '#2d4a35', border: '1px solid #3d6b47', borderRadius: 3, padding: '1px 6px', fontSize: '0.71rem', color: '#86efac' }}>
                                <span>{pair.leaderName}</span>
                                <span style={{ opacity: 0.55 }}>+</span>
                                <span>{pair.followerName}</span>
                                <button
                                  onClick={() => handleRemoveAmateurPair(event.id, pair.leaderId)}
                                  disabled={pending}
                                  style={{ color: '#888', fontWeight: 700, marginLeft: 2, fontSize: 10 }}
                                >×</button>
                              </span>
                            ))}
                            {!isAmateurFormOpen && (
                              <button
                                onClick={() => { setAmateurFormEventId(event.id); setAmateurLeaderId(''); setAmateurFollowerId('') }}
                                style={{ color: '#6b7280', fontSize: '0.68rem', border: '1px dashed #444', borderRadius: 3, padding: '1px 7px', backgroundColor: 'transparent', cursor: 'pointer' }}
                              >+ Add Pair</button>
                            )}
                            {isAmateurFormOpen && (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                                <select
                                  value={amateurLeaderId}
                                  onChange={e => setAmateurLeaderId(e.target.value)}
                                  style={{ fontSize: '0.72rem', padding: '1px 4px', borderRadius: 3, border: '1px solid #555', backgroundColor: '#2a2a2a', color: 'white' }}
                                >
                                  <option value="">Leader…</option>
                                  {leaders.map(s => <option key={s.id} value={s.id}>{s.firstName} {s.lastName}</option>)}
                                </select>
                                <span style={{ color: '#666' }}>+</span>
                                <select
                                  value={amateurFollowerId}
                                  onChange={e => setAmateurFollowerId(e.target.value)}
                                  style={{ fontSize: '0.72rem', padding: '1px 4px', borderRadius: 3, border: '1px solid #555', backgroundColor: '#2a2a2a', color: 'white' }}
                                >
                                  <option value="">Follower…</option>
                                  {followers.map(s => <option key={s.id} value={s.id}>{s.firstName} {s.lastName}</option>)}
                                </select>
                                <button
                                  onClick={() => handleAddAmateurPair(event.id)}
                                  disabled={pending || !amateurLeaderId || !amateurFollowerId}
                                  style={{ fontSize: '0.68rem', padding: '2px 8px', borderRadius: 3, backgroundColor: '#166534', color: 'white', border: 'none', cursor: 'pointer', opacity: pending || !amateurLeaderId || !amateurFollowerId ? 0.5 : 1 }}
                                >Add</button>
                                <button
                                  onClick={() => setAmateurFormEventId(null)}
                                  style={{ color: '#666', fontSize: '0.68rem' }}
                                >Cancel</button>
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>}
                      {eventHeats.map(heat => {
                        const { text: statusText, bg: statusBg, fg: statusFg } = capacityLabel(heat.totalEntries, heat.maxCapacity)
                        return (
                          <tr key={`event-heat-${heat.id}`} style={{ backgroundColor: '#7ecfa0' }}>
                            <td style={{ padding: 0, width: 6, borderLeft: '3px solid #555' }}></td>
                            <td style={{ color: '#aaa', fontFamily: 'monospace', textAlign: 'center', fontSize: '0.72rem' }}>{heat.number}</td>
                            <td style={{ fontSize: '0.8rem' }}>{heat.dance}</td>
                            <td>
                              <span style={{ background: statusBg, color: statusFg, fontSize: '0.68rem', fontWeight: 500, padding: '2px 6px', borderRadius: 20, whiteSpace: 'nowrap' }}>
                                {statusText} · {heat.totalEntries}/{heat.maxCapacity}
                              </span>
                            </td>
                            {instructors.map(inst => renderInstructorCell(heat, inst, { isEvent: true, eventId: event.id }))}
                          </tr>
                        )
                      })}
                    </Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>
        )
      })()}
    </div>
  )
}
