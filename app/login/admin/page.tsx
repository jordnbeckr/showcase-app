'use client'

import { adminLogin } from '@/app/actions/auth'
import { useActionState } from 'react'
import Link from 'next/link'

export default function AdminLogin() {
  const [state, action, pending] = useActionState(adminLogin, undefined)

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6" style={{ backgroundColor: 'var(--surface)' }}>
      <div className="w-full max-w-xs space-y-6">
        <div className="text-center space-y-1">
          <div className="w-12 h-12 rounded-xl mx-auto flex items-center justify-center mb-3" style={{ backgroundColor: '#333' }}>
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <circle cx="11" cy="11" r="3.5" stroke="white" strokeWidth="1.6"/>
              <path d="M11 2v2M11 18v2M2 11h2M18 11h2" stroke="white" strokeWidth="1.6" strokeLinecap="round"/>
            </svg>
          </div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text)' }}>Admin Login</h1>
        </div>

        <form action={action} className="card p-6 space-y-4">
          {state?.error && (
            <div className="text-sm px-3 py-2 rounded text-white" style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626' }}>
              {state.error}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text)' }}>Password</label>
            <input type="password" name="password" autoFocus required className="field" />
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

        <div className="text-center">
          <Link href="/" className="text-sm" style={{ color: 'var(--muted)' }}>← Back to home</Link>
        </div>
      </div>
    </main>
  )
}
