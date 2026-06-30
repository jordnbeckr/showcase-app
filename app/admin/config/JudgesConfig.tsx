'use client'

import { addJudge, resetJudgePin, deleteJudge } from '@/app/actions/admin'
import { addJudgeFloorRange, deleteJudgeFloorRange } from '@/app/actions/floors'
import { useState, useTransition } from 'react'

type Floor = { id: number; label: string }
type FloorRange = { id: number; floorId: number; floorLabel: string; heatFrom: number; heatTo: number }
type JudgeRow = { id: number; name: string; floorRanges: FloorRange[] }

export default function JudgesConfig({ judges, floors }: { judges: JudgeRow[]; floors: Floor[] }) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [resettingPin, setResettingPin] = useState<number | null>(null)
  // Per-judge add-range form state
  const [addingRange, setAddingRange] = useState<Record<number, { floorId: string; heatFrom: string; heatTo: string }>>({})

  function handleAdd(formData: FormData) {
    startTransition(async () => {
      const result = await addJudge(formData)
      if (result?.error) setError(result.error)
    })
  }

  function handleResetPin(judgeId: number, formData: FormData) {
    startTransition(async () => {
      const result = await resetJudgePin(judgeId, formData)
      if (result?.error) setError(result.error)
      else setResettingPin(null)
    })
  }

  function handleDelete(judgeId: number, name: string) {
    if (!confirm(`Remove judge "${name}"? Their scores will be deleted.`)) return
    startTransition(async () => { await deleteJudge(judgeId) })
  }

  function handleAddRange(judgeId: number) {
    const form = addingRange[judgeId]
    if (!form?.floorId || !form?.heatFrom) return
    const floorId = parseInt(form.floorId)
    const heatFrom = parseInt(form.heatFrom)
    const heatTo = form.heatTo ? parseInt(form.heatTo) : null
    if (isNaN(floorId) || isNaN(heatFrom)) return
    startTransition(async () => {
      await addJudgeFloorRange(judgeId, floorId, heatFrom, heatTo)
      setAddingRange(prev => ({ ...prev, [judgeId]: { floorId: '', heatFrom: '', heatTo: '' } }))
    })
  }

  function handleDeleteRange(rangeId: number) {
    startTransition(async () => { await deleteJudgeFloorRange(rangeId) })
  }

  return (
    <div className="space-y-4">
      <p className="text-xs" style={{ color: 'var(--muted)' }}>
        Judges log in at <code>/login/judge</code> with their name and PIN. PIN must be 4–8 digits.
        Floor ranges control which entries each judge sees on their scoring sheet for each heat.
        Leave "To" blank for open-ended (covers all heats from that number onward).
      </p>

      {error && (
        <div className="text-sm px-3 py-2 flex justify-between" style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: 4, color: '#dc2626' }}>
          {error}
          <button onClick={() => setError(null)} className="font-bold">×</button>
        </div>
      )}

      <div className="space-y-3">
        {judges.length === 0 && (
          <p className="text-sm italic" style={{ color: 'var(--muted)' }}>No judges yet</p>
        )}
        {judges.map(judge => {
          const form = addingRange[judge.id] ?? { floorId: '', heatFrom: '', heatTo: '' }
          return (
            <div key={judge.id} className="card overflow-hidden">
              {/* Judge header */}
              <div className="flex items-center gap-3 px-4 py-2.5" style={{ borderBottom: '1px solid var(--border)', backgroundColor: '#fafafa' }}>
                {resettingPin === judge.id ? (
                  <form action={fd => handleResetPin(judge.id, fd)} className="flex gap-2 flex-1">
                    <input name="pin" type="text" inputMode="numeric" placeholder="New PIN (4–8 digits)" required autoFocus
                      className="field flex-1" style={{ padding: '3px 8px', fontSize: '0.875rem' }} />
                    <button type="submit" className="text-xs px-2 py-1 text-white" style={{ backgroundColor: '#333', borderRadius: 3 }}>Save</button>
                    <button type="button" onClick={() => setResettingPin(null)} className="text-xs px-2 py-1" style={{ color: 'var(--muted)' }}>Cancel</button>
                  </form>
                ) : (
                  <>
                    <span className="font-semibold text-sm">{judge.name}</span>
                    <div className="ml-auto flex gap-2">
                      <button onClick={() => setResettingPin(judge.id)} className="text-xs" style={{ color: 'var(--muted)' }}>Reset PIN</button>
                      <button onClick={() => handleDelete(judge.id, judge.name)} disabled={pending} className="text-xs" style={{ color: '#dc2626' }}>Remove</button>
                    </div>
                  </>
                )}
              </div>

              {/* Existing floor ranges */}
              {judge.floorRanges.length === 0 ? (
                <p className="px-4 py-2 text-xs italic" style={{ color: 'var(--muted)' }}>No floor assignments — judge sees all entries</p>
              ) : (
                <div className="divide-y" style={{ borderBottom: '1px solid var(--border)' }}>
                  {judge.floorRanges.map(r => (
                    <div key={r.id} className="flex items-center gap-2 px-4 py-2">
                      <span className="text-xs font-bold px-2 py-0.5" style={{ backgroundColor: '#eff6ff', color: '#1d4ed8', borderRadius: 4, border: '1px solid #bfdbfe' }}>
                        Floor {r.floorLabel}
                      </span>
                      <span className="text-xs" style={{ color: 'var(--muted)' }}>
                        Heats {r.heatFrom}–{r.heatTo === 9999 ? '∞' : r.heatTo}
                      </span>
                      <button
                        onClick={() => handleDeleteRange(r.id)}
                        disabled={pending}
                        className="ml-auto text-xs"
                        style={{ color: '#dc2626' }}
                      >Remove</button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add range form */}
              {floors.length > 0 && (
                <div className="px-4 py-2.5 flex items-center gap-2 flex-wrap" style={{ backgroundColor: '#f8fafc' }}>
                  <span className="text-xs font-medium" style={{ color: 'var(--muted)' }}>Add range:</span>
                  <select
                    value={form.floorId}
                    onChange={e => setAddingRange(prev => ({ ...prev, [judge.id]: { ...form, floorId: e.target.value } }))}
                    className="field text-xs py-1"
                    style={{ width: 80 }}
                  >
                    <option value="">Floor</option>
                    {floors.map(f => <option key={f.id} value={f.id}>Floor {f.label}</option>)}
                  </select>
                  <span className="text-xs" style={{ color: 'var(--muted)' }}>Heats</span>
                  <input
                    type="number" min={1} placeholder="From"
                    value={form.heatFrom}
                    onChange={e => setAddingRange(prev => ({ ...prev, [judge.id]: { ...form, heatFrom: e.target.value } }))}
                    className="field text-xs py-1"
                    style={{ width: 64 }}
                  />
                  <span className="text-xs" style={{ color: 'var(--muted)' }}>–</span>
                  <input
                    type="number" min={1} placeholder="To (∞)"
                    value={form.heatTo}
                    onChange={e => setAddingRange(prev => ({ ...prev, [judge.id]: { ...form, heatTo: e.target.value } }))}
                    className="field text-xs py-1"
                    style={{ width: 64 }}
                  />
                  <button
                    onClick={() => handleAddRange(judge.id)}
                    disabled={pending || !form.floorId || !form.heatFrom}
                    className="text-xs px-3 py-1 font-medium text-white"
                    style={{ backgroundColor: '#1d4ed8', borderRadius: 4, opacity: (!form.floorId || !form.heatFrom) ? 0.4 : 1 }}
                  >Add</button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Add judge */}
      <div className="card px-5 py-4">
        <div className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--muted)' }}>Add Judge</div>
        <form action={handleAdd} className="flex gap-2">
          <input name="name" placeholder="Judge name" required className="field flex-1" />
          <input name="pin" type="text" inputMode="numeric" placeholder="PIN" required className="field" style={{ width: 100 }} />
          <button type="submit" disabled={pending} className="text-sm px-4 py-1.5 font-medium text-white" style={{ backgroundColor: '#333', borderRadius: 4 }}>
            Add
          </button>
        </form>
      </div>
    </div>
  )
}
