'use client'

import { studioLogin } from '@/app/actions/auth'
import { useActionState } from 'react'

export default function StudioLoginForm({ studios }: { studios: { slug: string; name: string }[] }) {
  const [state, action, pending] = useActionState(studioLogin, undefined)

  return (
    <form action={action} className="card p-6 space-y-4">
      {state?.error && (
        <div className="text-sm px-3 py-2 rounded text-white" style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626' }}>
          {state.error}
        </div>
      )}
      <div>
        <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text)' }}>Studio</label>
        <select name="studio" required className="field">
          <option value="">Select your studio…</option>
          {studios.map(s => (
            <option key={s.slug} value={s.slug}>{s.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text)' }}>Password</label>
        <input type="password" name="password" required className="field" />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="w-full py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-50 transition-opacity"
        style={{ backgroundColor: '#333' }}
      >
        {pending ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  )
}
