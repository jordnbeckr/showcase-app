'use client'

import { addJudge, resetJudgePin, deleteJudge } from '@/app/actions/admin'
import { setJudgeFloors } from '@/app/actions/floors'
import { useState, useTransition } from 'react'

type Floor = { id: number; label: string }
type JudgeRow = { id: number; name: string; floorIds: number[] }

export default function JudgesConfig({ judges, floors }: { judges: JudgeRow[]; floors: Floor[] }) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [resettingPin, setResettingPin] = useState<number | null>(null)

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

  function handleFloorToggle(judgeId: number, floorId: number, currentFloorIds: number[]) {
    const next = currentFloorIds.includes(floorId)
      ? currentFloorIds.filter(id => id !== floorId)
      : [...currentFloorIds, floorId]
    startTransition(async () => { await setJudgeFloors(judgeId, next) })
  }

  return (
    <div className="space-y-4">
      <p className="text-xs" style={{ color: 'var(--muted)' }}>
        Judges log in at <code>/login/judge</code> with their name and PIN. PIN must be 4–8 digits.
      </p>

      {error && (
        <div className="text-sm px-3 py-2 flex justify-between" style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: 4, color: '#dc2626' }}>
          {error}
          <button onClick={() => setError(null)} className="font-bold">×</button>
        </div>
      )}

      <div className="card overflow-hidden">
        {judges.length === 0 && (
          <p className="px-4 py-3 text-sm italic" style={{ color: 'var(--muted)' }}>No judges yet</p>
        )}
        {judges.map((judge, i) => (
          <div key={judge.id} className="flex items-center gap-3 px-4 py-2.5" style={{ borderTop: i > 0 ? '1px solid var(--border)' : undefined }}>
            {resettingPin === judge.id ? (
              <form action={fd => handleResetPin(judge.id, fd)} className="flex gap-2 flex-1">
                <input name="pin" type="text" inputMode="numeric" placeholder="New PIN (4–8 digits)" required autoFocus
                  className="field flex-1" style={{ padding: '3px 8px', fontSize: '0.875rem' }} />
                <button type="submit" className="text-xs px-2 py-1 text-white" style={{ backgroundColor: '#333', borderRadius: 3 }}>Save</button>
                <button type="button" onClick={() => setResettingPin(null)} className="text-xs px-2 py-1" style={{ color: 'var(--muted)' }}>Cancel</button>
              </form>
            ) : (
              <>
                <span className="font-medium text-sm" style={{ minWidth: 120 }}>{judge.name}</span>
                {floors.length > 0 && (
                  <div className="flex gap-1.5 items-center">
                    <span className="text-xs" style={{ color: 'var(--muted)' }}>Floors:</span>
                    {floors.map(f => {
                      const active = judge.floorIds.includes(f.id)
                      return (
                        <button
                          key={f.id}
                          onClick={() => handleFloorToggle(judge.id, f.id, judge.floorIds)}
                          disabled={pending}
                          className="text-xs px-2 py-0.5 font-bold"
                          style={{ borderRadius: 4, border: '1px solid', borderColor: active ? '#1d4ed8' : 'var(--border)', backgroundColor: active ? '#eff6ff' : 'transparent', color: active ? '#1d4ed8' : 'var(--muted)' }}
                        >
                          {f.label}
                        </button>
                      )
                    })}
                  </div>
                )}
                <div className="ml-auto flex gap-2">
                  <button onClick={() => setResettingPin(judge.id)} className="text-xs" style={{ color: 'var(--muted)' }}>Reset PIN</button>
                  <button onClick={() => handleDelete(judge.id, judge.name)} disabled={pending} className="text-xs" style={{ color: '#dc2626' }}>Remove</button>
                </div>
              </>
            )}
          </div>
        ))}

        <div className="px-5 py-4" style={{ borderTop: judges.length > 0 ? '1px solid var(--border)' : undefined, backgroundColor: '#fafafa' }}>
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
    </div>
  )
}
