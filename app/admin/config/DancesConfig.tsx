'use client'

import { addDanceType, addHeat, removeLastHeat, deleteDanceType, reorderDanceTypes } from '@/app/actions/admin'
import { useTransition, useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'

type DanceType = {
  id: number
  name: string
  heatCount: number
  heats: { id: number; number: number; entryCount: number }[]
}

export default function DancesConfig({ danceTypes: initialDanceTypes }: { danceTypes: DanceType[] }) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [danceTypes, setDanceTypes] = useState(initialDanceTypes)
  const [saved, setSaved] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const lastClickedIdx = useRef<number | null>(null)
  const dragId = useRef<number | null>(null)
  const router = useRouter()

  useEffect(() => { setDanceTypes(initialDanceTypes) }, [initialDanceTypes])

  function toggleSelect(id: number, idx: number, e: React.MouseEvent) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (e.shiftKey && lastClickedIdx.current !== null) {
        const lo = Math.min(lastClickedIdx.current, idx)
        const hi = Math.max(lastClickedIdx.current, idx)
        danceTypes.slice(lo, hi + 1).forEach(d => next.add(d.id))
      } else {
        next.has(id) ? next.delete(id) : next.add(id)
      }
      return next
    })
    lastClickedIdx.current = idx
  }

  function toggleAll() {
    setSelectedIds(prev =>
      prev.size === danceTypes.length ? new Set() : new Set(danceTypes.map(d => d.id))
    )
  }

  function handleDragStart(id: number) {
    dragId.current = id
    if (!selectedIds.has(id)) setSelectedIds(new Set([id]))
  }

  function handleDragOver(e: React.DragEvent, targetId: number) {
    e.preventDefault()
    if (dragId.current === null || selectedIds.has(targetId)) return
    const moving = danceTypes.filter(d => selectedIds.has(d.id))
    const rest = danceTypes.filter(d => !selectedIds.has(d.id))
    const insertAt = rest.findIndex(d => d.id === targetId)
    if (insertAt === -1) return
    const next = [...rest]
    next.splice(insertAt, 0, ...moving)
    setDanceTypes(next)
    setSaved(false)
  }

  function handleDrop() {
    dragId.current = null
  }

  function handleSave() {
    startTransition(async () => {
      await reorderDanceTypes(danceTypes.map(d => d.id))
      setSaved(true)
    })
  }

  function handleAddDance(formData: FormData) {
    startTransition(async () => {
      const result = await addDanceType(formData)
      if (result?.error) setError(result.error)
      else setSaved(false)
    })
  }

  function handleAddHeat(danceTypeId: number) {
    startTransition(async () => {
      await addHeat(danceTypeId)
      router.refresh()
    })
  }

  function handleRemoveHeat(danceTypeId: number) {
    startTransition(async () => {
      const result = await removeLastHeat(danceTypeId)
      if (result?.error) setError(result.error)
      else router.refresh()
    })
  }

  function handleDelete(danceTypeId: number, name: string) {
    if (!confirm(`Delete dance type "${name}"? This cannot be undone.`)) return
    startTransition(async () => {
      const result = await deleteDanceType(danceTypeId)
      if (result?.error) setError(result.error)
      else router.refresh()
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {selectedIds.size > 0 && (
            <>
              <span className="text-xs font-medium px-2 py-0.5" style={{ backgroundColor: '#e0f0ff', borderRadius: 3, color: '#1d6fa4' }}>
                {selectedIds.size} selected
              </span>
              <button onClick={() => setSelectedIds(new Set())} className="text-xs px-2 py-1" style={{ color: 'var(--muted)', border: '1px solid var(--border)', borderRadius: 3 }}>
                Clear
              </button>
            </>
          )}
          <span className="text-sm" style={{ color: 'var(--muted)' }}>{danceTypes.reduce((s, d) => s + d.heatCount, 0)} total heats</span>
          <button
            onClick={handleSave}
            disabled={pending || saved}
            className="text-sm px-3 py-1 font-medium text-white disabled:opacity-40"
            style={{ backgroundColor: saved ? '#16a34a' : '#333', borderRadius: 4 }}
          >
            {saved ? 'Saved' : 'Save Order'}
          </button>
        </div>
      </div>

      {error && (
        <div
          className="text-sm px-3 py-2 flex justify-between"
          style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: 4, color: '#dc2626' }}
        >
          {error}
          <button onClick={() => setError(null)} className="ml-2 font-bold">×</button>
        </div>
      )}

      <div className="card overflow-hidden">
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: 30, textAlign: 'center' }}>
                <input type="checkbox" checked={danceTypes.length > 0 && danceTypes.every(d => selectedIds.has(d.id))} onChange={toggleAll} style={{ cursor: 'pointer' }} />
              </th>
              <th style={{ width: 22 }}></th>
              <th style={{ width: 160 }}>Dance Type</th>
              <th style={{ width: 52, textAlign: 'center' }}>Heats</th>
              <th style={{ width: 96, textAlign: 'center' }}>Adjust</th>
              <th style={{ width: 60 }}></th>
            </tr>
          </thead>
          <tbody>
            {danceTypes.map((dance, idx) => {
              const isSelected = selectedIds.has(dance.id)
              return (
              <tr
                key={dance.id}
                draggable
                onDragStart={() => handleDragStart(dance.id)}
                onDragOver={e => handleDragOver(e, dance.id)}
                onDrop={handleDrop}
                style={{ cursor: 'grab', backgroundColor: isSelected ? '#eef6ff' : undefined, outline: isSelected ? '1px solid #93c5fd' : undefined }}
              >
                <td style={{ textAlign: 'center' }}>
                  <input type="checkbox" checked={isSelected} onChange={() => {}} onClick={e => toggleSelect(dance.id, idx, e)} style={{ cursor: 'pointer' }} />
                </td>
                <td style={{ color: 'var(--border)', textAlign: 'center', userSelect: 'none', fontSize: '0.85rem' }}>⠿</td>
                <td className="font-medium">{dance.name}</td>
                <td style={{ textAlign: 'center' }}>{dance.heatCount}</td>
                <td style={{ textAlign: 'center' }}>
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => handleRemoveHeat(dance.id)}
                      disabled={pending || dance.heatCount === 0}
                      className="w-7 h-7 flex items-center justify-center font-bold disabled:opacity-30 text-sm"
                      style={{ border: '1px solid var(--border-dark)', borderRadius: 3 }}
                    >
                      −
                    </button>
                    <button
                      onClick={() => handleAddHeat(dance.id)}
                      disabled={pending}
                      className="w-7 h-7 flex items-center justify-center font-bold disabled:opacity-30 text-sm text-white"
                      style={{ backgroundColor: '#333', borderRadius: 3 }}
                    >
                      +
                    </button>
                  </div>
                </td>
                <td>
                  <button
                    onClick={() => handleDelete(dance.id, dance.name)}
                    disabled={pending}
                    className="text-xs disabled:opacity-30"
                    style={{ color: '#dc2626' }}
                  >
                    Remove
                  </button>
                </td>
              </tr>
            )})}

          </tbody>
        </table>

        <div className="px-4 py-3" style={{ borderTop: '1px solid var(--border)', backgroundColor: '#fafafa' }}>
          <form action={handleAddDance} className="flex gap-2">
            <input name="name" placeholder="New dance type…" required className="field flex-1" />
            <button
              type="submit"
              className="text-sm px-4 py-1.5 font-medium text-white"
              style={{ backgroundColor: '#333', borderRadius: 4 }}
            >
              Add Dance
            </button>
          </form>
        </div>
      </div>

      <p className="text-xs" style={{ color: 'var(--muted)' }}>
        Drag rows to reorder, then click Save Order. + adds a heat to the end; − removes the last heat (only if empty).
      </p>
    </div>
  )
}
