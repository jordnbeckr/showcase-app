import { db } from '@/lib/db'
import JudgeLoginForm from './JudgeLoginForm'

export const dynamic = 'force-dynamic'

export default async function JudgeLoginPage() {
  const judges = await db.judge.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true } })

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6" style={{ backgroundColor: 'var(--surface)' }}>
      <div className="w-full max-w-xs space-y-6">
        <div className="text-center space-y-1">
          <div className="w-12 h-12 rounded-xl mx-auto flex items-center justify-center mb-3" style={{ backgroundColor: '#1e3a5f' }}>
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <path d="M11 2L13.5 8H20L14.5 12L16.5 18L11 14L5.5 18L7.5 12L2 8H8.5L11 2Z" stroke="white" strokeWidth="1.6" strokeLinejoin="round"/>
            </svg>
          </div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text)' }}>Judge Login</h1>
          {judges.length === 0 && (
            <p className="text-sm" style={{ color: 'var(--muted)' }}>No judges configured yet. Ask the admin.</p>
          )}
        </div>

        {judges.length > 0 && <JudgeLoginForm judges={judges} />}

        <div className="text-center">
          <a href="/" className="text-sm" style={{ color: 'var(--muted)' }}>← Back to home</a>
        </div>
      </div>
    </main>
  )
}
