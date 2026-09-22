import { db } from '@/lib/db'
import EmceeLoginForm from './EmceeLoginForm'

export const dynamic = 'force-dynamic'

export default async function EmceeLoginPage() {
  const emcees = await db.emcee.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true } })

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6" style={{ backgroundColor: 'var(--surface)' }}>
      <div className="w-full max-w-xs space-y-6">
        <div className="text-center space-y-1">
          <div className="w-12 h-12 rounded-xl mx-auto flex items-center justify-center mb-3" style={{ backgroundColor: '#1e3a5f' }}>
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <circle cx="11" cy="7" r="4" stroke="white" strokeWidth="1.6"/>
              <path d="M8 13h6M9 17l1-4M13 17l-1-4" stroke="white" strokeWidth="1.6" strokeLinecap="round"/>
            </svg>
          </div>
          <h1 className="text-xl font-bold text-center" style={{ color: 'var(--text)' }}>Emcee Login</h1>
          {emcees.length === 0 && (
            <p className="text-sm" style={{ color: 'var(--muted)' }}>No emcees configured yet. Ask the admin.</p>
          )}
        </div>

        {emcees.length > 0 && <EmceeLoginForm emcees={emcees} />}

        <div className="text-center">
          <a href="/" className="text-sm" style={{ color: 'var(--muted)' }}>← Back to home</a>
        </div>
      </div>
    </main>
  )
}
