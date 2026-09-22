'use client'

import { addEmcee, resetEmceePin, deleteEmcee } from '@/app/actions/admin'
import { useState, useTransition } from 'react'

type EmceeRow = { id: number; name: string }

export default function EmceesConfig({ emcees }: { emcees: EmceeRow[] }) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [resettingPin, setResettingPin] = useState<number | null>(null)

  function handleAdd(formData: FormData) {
    startTransition(async () => {
      const result = await addEmcee(formData)
      if (result?.error) setError(result.error)
    })
  }

  function handleResetPin(emceeId: number, formData: FormData) {
    startTransition(async () => {
      const result = await resetEmceePin(emceeId, formData)
      if (result?.error) setError(result.error)
      else setResettingPin(null)
    })
  }

  function handleDelete(emceeId: number, name: string) {
    if (!confirm(`Remove emcee "${name}"?`)) return
    startTransition(async () => { await deleteEmcee(emceeId) })
  }

  return (
    <div className="space-y-4">
      <p className="text-xs" style={{ color: 'var(--muted)' }}>
        Emcees log in at <code>/login/emcee</code> with their name and PIN.
      </p>

      {error && (
        <div className="text-sm px-3 py-2 flex justify-between" style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: 4, color: '#dc2626' }}>
          {error}
          <button onClick={() => setError(null)} className="font-bold">×</button>
        </div>
      )}

      <div className="space-y-2">
        {emcees.length === 0 && <p className="text-sm italic" style={{ color: 'var(--muted)' }}>No emcees yet</p>}
        {emcees.map(emcee => (
          <div key={emcee.id} className="card px-4 py-2.5 flex items-center gap-3">
            {resettingPin === emcee.id ? (
              <form action={fd => handleResetPin(emcee.id, fd)} className="flex gap-2 flex-1">
                <input name="pin" type="text" inputMode="numeric" placeholder="New PIN (4–8 digits)" required autoFocus
                  className="field flex-1" style={{ padding: '3px 8px', fontSize: '0.875rem' }} />
                <button type="submit" className="text-xs px-2 py-1 text-white" style={{ backgroundColor: '#333', borderRadius: 3 }}>Save</button>
                <button type="button" onClick={() => setResettingPin(null)} className="text-xs px-2 py-1" style={{ color: 'var(--muted)' }}>Cancel</button>
              </form>
            ) : (
              <>
                <span className="font-semibold text-sm flex-1">{emcee.name}</span>
                <button onClick={() => setResettingPin(emcee.id)} className="text-xs" style={{ color: 'var(--muted)' }}>Reset PIN</button>
                <button onClick={() => handleDelete(emcee.id, emcee.name)} disabled={pending} className="text-xs" style={{ color: '#dc2626' }}>Remove</button>
              </>
            )}
          </div>
        ))}
      </div>

      <div className="card px-5 py-4">
        <div className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--muted)' }}>Add Emcee</div>
        <form action={handleAdd} className="flex gap-2">
          <input name="name" placeholder="Emcee name" required className="field flex-1" />
          <input name="pin" type="text" inputMode="numeric" placeholder="PIN" required className="field" style={{ width: 100 }} />
          <button type="submit" disabled={pending} className="text-sm px-4 py-1.5 font-medium text-white" style={{ backgroundColor: '#333', borderRadius: 4 }}>
            Add
          </button>
        </form>
      </div>
    </div>
  )
}
