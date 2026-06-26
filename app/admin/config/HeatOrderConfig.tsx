'use client'

import { reorderHeats } from '@/app/actions/admin'
import { useState, useTransition, useRef, useEffect } from 'react'

type HeatItem = {
  id: number
  number: number
  dance: string
  eventNames: string[]
  entryCount: number
}

export default function HeatOrderConfig({ heats: initialHeats }: { heats: HeatItem[] }) {
  const [heats, setHeats] = useState(initialHeats)
  const [pending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)
  const [filter, setFilter] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const lastClickedIdx = useRef<number | null>(null)
  const dragId = useRef<number | null>(null)

  useEffect(() => { setHeats(initialHeats) }, [initialHeats])

  const filtered = filter
    ? heats.filter(h =>
        h.dance.toLowerCase().includes(filter.toLowerCase()) ||
        h.number.toString().includes(filter) ||
        h.eventNames.some(n => n.toLowerCase().includes(filter.toLowerCase()))
      )
    : heats

  function toggleSelect(id: number, idx: number, e: React.MouseEvent) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (e.shiftKey && lastClickedIdx.current !== null) {
        const lo = Math.min(lastClickedIdx.current, idx)
        const hi = Math.max(lastClickedIdx.current, idx)
        filtered.slice(lo, hi + 1).forEach(h => next.add(h.id))
      } else {
        next.has(id) ? next.delete(id) : next.add(id)
      }
      return next
    })
    lastClickedIdx.current = idx
  }

  function toggleAll() {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filtered.map(h => h.id)))
    }
  }

  function handleDragStart(id: number) {
    dragId.current = id
    // If dragging an unselected row, make it the sole selection
    if (!selectedIds.has(id)) {
      setSelectedIds(new Set([id]))
    }
  }

  function handleDragOver(e: React.DragEvent, targetId: number) {
    e.preventDefault()
    if (dragId.current === null || selectedIds.has(targetId)) return
    const toIdx = heats.findIndex(h => h.id === targetId)
    if (toIdx === -1) return
    const moving = heats.filter(h => selectedIds.has(h.id))
    const rest = heats.filter(h => !selectedIds.has(h.id))
    const insertAt = rest.findIndex(h => h.id === targetId)
    if (insertAt === -1) return
    const next = [...rest]
    next.splice(insertAt, 0, ...moving)
    setHeats(next)
    setSaved(false)
  }

  function handleDrop() {
    dragId.current = null
  }

  function moveUp(id: number) {
    const ids = selectedIds.has(id) ? [...selectedIds] : [id]
    // Find the topmost selected index
    const indices = ids.map(sid => heats.findIndex(h => h.id === sid)).sort((a, b) => a - b)
    if (indices[0] <= 0) return
    const next = [...heats]
    // Move block up by one
    for (const idx of indices) {
      ;[next[idx - 1], next[idx]] = [next[idx], next[idx - 1]]
    }
    setHeats(next)
    setSaved(false)
  }

  function moveDown(id: number) {
    const ids = selectedIds.has(id) ? [...selectedIds] : [id]
    const indices = ids.map(sid => heats.findIndex(h => h.id === sid)).sort((a, b) => b - a)
    if (indices[0] >= heats.length - 1) return
    const next = [...heats]
    for (const idx of indices) {
      ;[next[idx], next[idx + 1]] = [next[idx + 1], next[idx]]
    }
    setHeats(next)
    setSaved(false)
  }

  function save() {
    startTransition(async () => {
      await reorderHeats(heats.map(h => h.id))
      setSaved(true)
    })
  }

  const allFilteredSelected = filtered.length > 0 && filtered.every(h => selectedIds.has(h.id))
  const someSelected = selectedIds.size > 0

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs" style={{ color: 'var(--muted)' }}>
            Check rows to select, then drag or use ↑↓ to move. Shift-click to select a range.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {someSelected && (
            <span className="text-xs font-medium px-2 py-0.5" style={{ backgroundColor: '#e0f0ff', borderRadius: 3, color: '#1d6fa4' }}>
              {selectedIds.size} selected
            </span>
          )}
          {!saved && heats !== initialHeats && (
            <span className="text-xs" style={{ color: '#d97706' }}>Unsaved changes</span>
          )}
          {saved && <span className="text-xs" style={{ color: '#16a34a' }}>Saved</span>}
          <button
            onClick={save}
            disabled={pending}
            className="text-sm px-4 py-1.5 font-medium text-white disabled:opacity-50"
            style={{ backgroundColor: '#333', borderRadius: 4 }}
          >
            {pending ? 'Saving…' : 'Save Order'}
          </button>
        </div>
      </div>

      <div className="flex gap-2 items-center">
        <input
          value={filter}
          onChange={e => setFilter(e.target.value)}
          placeholder="Filter by dance, heat #, or event…"
          className="field"
          style={{ width: 280 }}
        />
        {filter && (
          <span className="text-xs" style={{ color: 'var(--muted)' }}>
            Showing {filtered.length} of {heats.length}
          </span>
        )}
        {someSelected && (
          <button
            onClick={() => setSelectedIds(new Set())}
            className="text-xs px-2 py-1"
            style={{ color: 'var(--muted)', border: '1px solid var(--border)', borderRadius: 3 }}
          >
            Clear selection
          </button>
        )}
      </div>

      <div className="card overflow-hidden">
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: 30, textAlign: 'center' }}>
                <input
                  type="checkbox"
                  checked={allFilteredSelected}
                  onChange={toggleAll}
                  style={{ cursor: 'pointer' }}
                />
              </th>
              <th style={{ width: 22 }}></th>
              <th style={{ width: 40, textAlign: 'center' }}>Pos.</th>
              <th style={{ width: 160 }}>Dance</th>
              <th style={{ width: 160 }}>Event</th>
              <th style={{ width: 52, textAlign: 'center' }}>Entries</th>
              <th style={{ width: 52, textAlign: 'center' }}>Move</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((heat, displayIdx) => {
              const realIdx = heats.findIndex(h => h.id === heat.id)
              const isSelected = selectedIds.has(heat.id)
              return (
                <tr
                  key={heat.id}
                  draggable={!filter}
                  onDragStart={() => handleDragStart(heat.id)}
                  onDragOver={e => handleDragOver(e, heat.id)}
                  onDrop={handleDrop}
                  style={{
                    cursor: filter ? 'default' : 'grab',
                    backgroundColor: isSelected ? '#eef6ff' : heat.eventNames.length > 0 ? '#7ecfa0' : undefined,
                    opacity: pending ? 0.6 : 1,
                    outline: isSelected ? '1px solid #93c5fd' : undefined,
                  }}
                >
                  <td style={{ textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}}
                      onClick={e => toggleSelect(heat.id, displayIdx, e)}
                      style={{ cursor: 'pointer' }}
                    />
                  </td>
                  <td style={{ textAlign: 'center', color: '#bbb', fontSize: '0.75rem', userSelect: 'none' }}>
                    {!filter && '⣿'}
                  </td>
                  <td style={{ textAlign: 'center', fontFamily: 'monospace', color: 'var(--muted)', fontWeight: 600 }}>
                    {realIdx + 1}
                  </td>
                  <td className="font-medium">{heat.dance}</td>
                  <td style={{ fontSize: '0.8rem' }}>
                    {heat.eventNames.length > 0
                      ? <div className="flex flex-col gap-0.5">
                          {heat.eventNames.map(n => (
                            <span key={n} style={{ color: '#555' }}>{n}</span>
                          ))}
                        </div>
                      : <span style={{ color: 'var(--border)', fontStyle: 'italic' }}>—</span>
                    }
                  </td>
                  <td style={{ textAlign: 'center', color: 'var(--muted)', fontSize: '0.8rem' }}>
                    {heat.entryCount > 0 ? heat.entryCount : '—'}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button onClick={() => moveUp(heat.id)} disabled={realIdx === 0 || pending} className="px-1 py-0.5 disabled:opacity-20 text-sm" title="Move up">↑</button>
                    <button onClick={() => moveDown(heat.id)} disabled={realIdx === heats.length - 1 || pending} className="px-1 py-0.5 disabled:opacity-20 text-sm" title="Move down">↓</button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
