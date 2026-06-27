import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'
import { logout } from '@/app/actions/auth'

export default async function JudgeLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (session?.role !== 'judge') redirect('/login/judge')

  return (
    <div className="min-h-screen flex flex-col">
      <header
        className="sticky top-0 z-50 flex items-center gap-0 shadow-md"
        style={{ backgroundColor: '#1e3a5f', minHeight: 52 }}
      >
        <div className="px-5 py-3 flex items-center gap-2 border-r border-white/10">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 1.5L9.5 5.5H14L10.5 8.5L11.5 12.5L8 10L4.5 12.5L5.5 8.5L2 5.5H6.5L8 1.5Z" stroke="white" strokeWidth="1.4" strokeLinejoin="round"/>
          </svg>
          <span className="font-bold text-white text-sm tracking-wide">Judge Panel</span>
        </div>
        <div className="px-5 py-3 text-sm text-white/70">
          {session.judgeName}
        </div>
        <div className="ml-auto flex items-center gap-3 px-5">
          <form action={logout}>
            <button
              className="text-xs font-medium px-3 py-1.5 rounded text-white/90 hover:text-white transition-colors"
              style={{ backgroundColor: 'rgba(255,255,255,0.12)' }}
            >
              Sign out
            </button>
          </form>
        </div>
      </header>
      <main className="flex-1 p-4 max-w-2xl mx-auto w-full">{children}</main>
    </div>
  )
}
