'use client'

import { emceeLogin } from '@/app/actions/auth'
import { useActionState } from 'react'

export default function EmceeLoginForm({ emcees }: { emcees: { id: number; name: string }[] }) {
  const [state, action, pending] = useActionState(emceeLogin, undefined)

  return (
    <form action={action} className="card p-6 space-y-4">
      {state?.error && (
        <div className="text-sm px-3 py-2 rounded" style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626' }}>
          {state.error}
        </div>
      )}
      <div>
        <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text)' }}>Emcee</label>
        <select name="emceeId" required className="field w-full">
          <option value="">Select your name…</option>
          {emcees.map(e => (
            <option key={e.id} value={e.id}>{e.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text)' }}>PIN</label>
        <input type="password" name="pin" inputMode="numeric" autoComplete="off" required className="field w-full" placeholder="••••" />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="w-full py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-50 transition-opacity"
        style={{ backgroundColor: '#1e3a5f' }}
      >
        {pending ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  )
}
