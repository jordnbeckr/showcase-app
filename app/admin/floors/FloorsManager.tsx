'use client'

import { useState, useTransition, useMemo } from 'react'
import { addFloor, deleteFloor, autoAssignFloors, setHeatFloorAssignment } from '@/app/actions/floors'

type Floor = { id: number; label: string; order: number }

type HeatEntry = {
  studentId: number
  name: string
  leaderNumber: number | null
  studioName: string
  instructorName: string | null
  partnerName: string | null
}

type Heat = {
  id: number
  number: number
  dance: string
  eventName: string | null
  entries: HeatEntry[]
  assignments: { studentId: number; floorId: number }[]
}

const STUDIO_COLORS = [
  '#dbeafe', '#dcfce7', '#fef9c3', '#fce7f3', '#ede9fe', '#ffedd5', '#e0f2fe', '#f0fdf4',
]

export default function FloorsManager({
  floors: initialFloors,
  heats,
  studentIndex,
}: {
  floors: Floor[]
  heats: Heat[]
  studentIndex: Record<number, { name: string; leaderNumber: number | null }>
}) {
  const [floors, setFloors] = useState(initialFloors)
  const [assignments, setAssignments] = useState<Record<string, number>>(() => {
    const map: Record<string, number> = {}
    for (const h of heats) {
      for (const a of h.assignments) map[`${h.id}-${a.studentId}`] = a.floorId
    }
    return map
  })
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  // Auto-assign controls
  const [fromHeat, setFromHeat] = useState(heats[0]?.number ?? 1)
  const [toHeat, setToHeat] = useState(heats[heats.length - 1]?.number ?? 1)
  const [activeFloorIds, setActiveFloorIds] = useState<Set<number>>(new Set(floors.map(f => f.id)))
  const [switchCounts, setSwitchCounts] = useState<Record<number, number>>({})

  // Per-heat filter
  const [heatFilter, setHeatFilter] = useState('')

  // Studio colors
  const studioNames = useMemo(() => [...new Set(heats.flatMap(h => h.entries.map(e => e.studioName)))].sort(), [heats])
  const studioColor = useMemo(() => {
    const map: Record<string, string> = {}
    studioNames.forEach((s, i) => { map[s] = STUDIO_COLORS[i % STUDIO_COLORS.length] })
    return map
  }, [studioNames])

  function handleAddFloor(fd: FormData) {
    startTransition(async () => {
      const r = await addFloor(fd)
      if (r?.error) setError(r.error)
      else setFloors(prev => [...prev, { id: Date.now(), label: (fd.get('label') as string).toUpperCase(), order: prev.length }])
    })
  }

  function handleDeleteFloor(floorId: number, label: string) {
    if (!confirm(`Remove Floor ${label}? All assignments to this floor will be cleared.`)) return
    startTransition(async () => {
      await deleteFloor(floorId)
      setFloors(prev => prev.filter(f => f.id !== floorId))
      setAssignments(prev => {
        const next = { ...prev }
        for (const k of Object.keys(next)) { if (next[k] === floorId) delete next[k] }
        return next
      })
    })
  }

  function handleAutoAssign() {
    const activeIds = [...activeFloorIds]
    if (activeIds.length === 0) { setError('Select at least one active floor'); return }
    startTransition(async () => {
      const { switches } = await autoAssignFloors(fromHeat, toHeat, activeIds)
      setSwitchCounts(switches)
      // Refresh assignments from server by re-fetching?
      // Since we can't refetch here, force a page reload after auto-assign
      window.location.reload()
    })
  }

  function handleReassign(heatId: number, studentId: number, floorId: number) {
    const key = `${heatId}-${studentId}`
    setAssignments(prev => ({ ...prev, [key]: floorId }))
    startTransition(() => setHeatFloorAssignment(heatId, studentId, floorId))
  }

  // Students with 3+ floor switches across ALL heats
  const problemStudents = useMemo(() => {
    return Object.entries(switchCounts)
      .filter(([, count]) => count >= 3)
      .map(([sid, count]) => ({ studentId: parseInt(sid), count, ...studentIndex[parseInt(sid)] }))
      .sort((a, b) => b.count - a.count)
  }, [switchCounts, studentIndex])

  const filteredHeats = useMemo(() => {
    if (!heatFilter) return heats
    const q = heatFilter.toLowerCase()
    return heats.filter(h =>
      h.number.toString().includes(q) ||
      h.dance.toLowerCase().includes(q) ||
      (h.eventName?.toLowerCase().includes(q))
    )
  }, [heats, heatFilter])

  const assignedHeats = filteredHeats.filter(h => h.entries.length > 0)

  return (
    <div className="max-w-6xl space-y-6">
      <h1 className="text-xl font-bold text-center">Floor Assignments</h1>

      {error && (
        <div className="text-sm px-3 py-2 flex justify-between" style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: 4, color: '#dc2626' }}>
          {error}<button onClick={() => setError(null)} className="font-bold">×</button>
        </div>
      )}

      {/* Floor definitions */}
      <div className="card p-4 space-y-3">
        <div className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>Floors</div>
        <div className="flex flex-wrap gap-2 items-center">
          {floors.map(f => (
            <div key={f.id} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-sm" style={{ backgroundColor: 'var(--header)', color: 'white' }}>
              Floor {f.label}
              <button onClick={() => handleDeleteFloor(f.id, f.label)} disabled={pending} style={{ color: '#aaa', fontWeight: 700, marginLeft: 4 }}>×</button>
            </div>
          ))}
          <form action={handleAddFloor} className="flex gap-2">
            <input name="label" placeholder="A" maxLength={2} required className="field" style={{ width: 60, textAlign: 'center', fontWeight: 700 }} />
            <button type="submit" disabled={pending} className="text-sm px-3 py-1.5 text-white font-medium" style={{ backgroundColor: '#333', borderRadius: 6 }}>Add Floor</button>
          </form>
        </div>
      </div>

      {/* Auto-assign panel */}
      <div className="card p-4 space-y-3">
        <div className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>Auto-Assign</div>
        <p className="text-xs" style={{ color: 'var(--muted)' }}>
          Replaces all assignments in the selected heat range. Keeps students on their most recent floor when possible. Multi-dance event couples stay on one floor for all their heats.
        </p>
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--muted)' }}>From heat #</label>
            <input type="number" value={fromHeat} onChange={e => setFromHeat(parseInt(e.target.value))}
              className="field" style={{ width: 80 }} />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--muted)' }}>To heat #</label>
            <input type="number" value={toHeat} onChange={e => setToHeat(parseInt(e.target.value))}
              className="field" style={{ width: 80 }} />
          </div>
          <div>
            <div className="text-xs font-medium mb-1" style={{ color: 'var(--muted)' }}>Active floors</div>
            <div className="flex gap-2">
              {floors.map(f => {
                const on = activeFloorIds.has(f.id)
                return (
                  <button
                    key={f.id}
                    onClick={() => setActiveFloorIds(prev => {
                      const next = new Set(prev)
                      on ? next.delete(f.id) : next.add(f.id)
                      return next
                    })}
                    className="px-3 py-1.5 text-sm font-bold"
                    style={{ borderRadius: 6, border: '2px solid', borderColor: on ? '#1d4ed8' : 'var(--border)', backgroundColor: on ? '#eff6ff' : 'transparent', color: on ? '#1d4ed8' : 'var(--muted)' }}
                  >
                    {f.label}
                  </button>
                )
              })}
            </div>
          </div>
          <button
            onClick={handleAutoAssign}
            disabled={pending || floors.length === 0}
            className="px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
            style={{ backgroundColor: '#1d4ed8', borderRadius: 6 }}
          >
            {pending ? 'Assigning…' : 'Run Auto-Assign'}
          </button>
        </div>
      </div>

      {/* Problem students */}
      {problemStudents.length > 0 && (
        <div className="card p-4" style={{ borderColor: '#fb923c', border: '1px solid #fb923c' }}>
          <div className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: '#c2410c' }}>
            ⚠ Students with 3+ floor switches
          </div>
          <div className="flex flex-wrap gap-2">
            {problemStudents.map(s => (
              <span key={s.studentId} className="text-xs px-2 py-1 rounded" style={{ backgroundColor: '#ffedd5', border: '1px solid #fb923c', color: '#7c2d12' }}>
                {s.leaderNumber ? `${s.leaderNumber} · ` : ''}{s.name} — {s.count} switches
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Studio legend */}
      {studioNames.length > 1 && (
        <div className="flex flex-wrap gap-2 items-center text-xs">
          <span style={{ color: 'var(--muted)' }}>Studios:</span>
          {studioNames.map(s => (
            <span key={s} className="px-2 py-0.5 rounded" style={{ backgroundColor: studioColor[s], border: '1px solid rgba(0,0,0,0.08)' }}>{s}</span>
          ))}
        </div>
      )}

      {/* Per-heat filter */}
      <div className="flex gap-3 items-center">
        <input value={heatFilter} onChange={e => setHeatFilter(e.target.value)}
          placeholder="Filter heats by # or dance…"
          className="field" style={{ width: 260 }} />
        {heatFilter && <button onClick={() => setHeatFilter('')} className="text-xs" style={{ color: 'var(--muted)' }}>Clear</button>}
        <span className="text-xs" style={{ color: 'var(--muted)' }}>
          {assignedHeats.filter(h => h.assignments.length > 0).length} of {assignedHeats.length} heats assigned
        </span>
      </div>

      {/* Per-heat grids */}
      <div className="space-y-3">
        {assignedHeats.map(heat => {
          const byFloor: Record<number, HeatEntry[]> = {}
          const unassigned: HeatEntry[] = []
          for (const entry of heat.entries) {
            const fid = assignments[`${heat.id}-${entry.studentId}`]
            if (fid) {
              if (!byFloor[fid]) byFloor[fid] = []
              byFloor[fid].push(entry)
            } else {
              unassigned.push(entry)
            }
          }

          const hasAssignments = heat.entries.some(e => assignments[`${heat.id}-${e.studentId}`])

          return (
            <div key={heat.id} className="card overflow-hidden">
              {/* Heat header */}
              <div className="px-4 py-2 flex items-center gap-2" style={{ backgroundColor: heat.eventName ? '#7ecfa0' : 'var(--card)', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#555' }}>#{heat.number}</span>
                <span className="font-semibold text-sm">{heat.dance}</span>
                {heat.eventName && <span className="text-xs" style={{ color: '#166534' }}>◆ {heat.eventName}</span>}
                <span className="ml-auto text-xs" style={{ color: 'var(--muted)' }}>{heat.entries.length} entries</span>
              </div>

              {/* Floor columns */}
              <div className="grid" style={{ gridTemplateColumns: `repeat(${Math.max(floors.length, 1)}, 1fr)${unassigned.length > 0 ? ' 1fr' : ''}` }}>
                {floors.map((floor, fi) => (
                  <div key={floor.id} style={{ borderRight: fi < floors.length - 1 ? '1px solid var(--border)' : undefined }}>
                    <div className="px-3 py-1.5 text-xs font-bold uppercase tracking-wide" style={{ backgroundColor: '#f5f5f5', borderBottom: '1px solid var(--border)', color: '#555' }}>
                      Floor {floor.label}
                    </div>
                    <div className="p-2 space-y-1 min-h-[48px]">
                      {(byFloor[floor.id] ?? []).map(entry => (
                        <EntryChip
                          key={entry.studentId}
                          entry={entry}
                          floors={floors}
                          currentFloorId={floor.id}
                          color={studioColor[entry.studioName]}
                          onMove={(fid) => handleReassign(heat.id, entry.studentId, fid)}
                          pending={pending}
                        />
                      ))}
                    </div>
                  </div>
                ))}
                {unassigned.length > 0 && (
                  <div style={{ borderLeft: floors.length > 0 ? '1px solid var(--border)' : undefined }}>
                    <div className="px-3 py-1.5 text-xs font-bold uppercase tracking-wide" style={{ backgroundColor: '#fff7ed', borderBottom: '1px solid #fed7aa', color: '#9a3412' }}>
                      Unassigned
                    </div>
                    <div className="p-2 space-y-1">
                      {unassigned.map(entry => (
                        <EntryChip
                          key={entry.studentId}
                          entry={entry}
                          floors={floors}
                          currentFloorId={null}
                          color={studioColor[entry.studioName]}
                          onMove={(fid) => handleReassign(heat.id, entry.studentId, fid)}
                          pending={pending}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )
        })}

        {assignedHeats.length === 0 && (
          <p className="text-sm italic text-center py-8" style={{ color: 'var(--muted)' }}>
            No heats with entries yet.
          </p>
        )}
      </div>
    </div>
  )
}

function EntryChip({
  entry,
  floors,
  currentFloorId,
  color,
  onMove,
  pending,
}: {
  entry: HeatEntry
  floors: Floor[]
  currentFloorId: number | null
  color: string
  onMove: (floorId: number) => void
  pending: boolean
}) {
  const [open, setOpen] = useState(false)
  const display = entry.leaderNumber
    ? `${entry.leaderNumber} · ${entry.name}`
    : entry.name
  const partner = entry.instructorName ?? entry.partnerName

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        disabled={pending}
        className="w-full text-left px-2 py-1 rounded text-xs"
        style={{ backgroundColor: color, border: '1px solid rgba(0,0,0,0.1)' }}
      >
        <div className="font-semibold truncate">{display}</div>
        {partner && <div className="truncate" style={{ color: '#555', fontSize: '0.68rem' }}>{partner}</div>}
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-0.5 z-20 rounded shadow-lg overflow-hidden" style={{ border: '1px solid var(--border)', backgroundColor: 'var(--card)', minWidth: 120 }}>
          {floors.map(f => (
            <button
              key={f.id}
              onClick={() => { onMove(f.id); setOpen(false) }}
              disabled={f.id === currentFloorId}
              className="w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 disabled:font-bold"
              style={{ color: f.id === currentFloorId ? '#1d4ed8' : 'var(--text)', borderBottom: '1px solid var(--border)' }}
            >
              {f.id === currentFloorId ? `✓ Floor ${f.label}` : `→ Floor ${f.label}`}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
