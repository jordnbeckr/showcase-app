import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'
import Link from 'next/link'

const entries = [
  {
    href: '/login/admin',
    label: 'Admin',
    sub: 'Manage heats, dances, and studios',
  },
  {
    href: '/login/studio',
    label: 'Studio Login',
    sub: 'Sign up students and submit shows',
  },
  {
    href: '/login/judge',
    label: 'Judge Login',
    sub: 'Score heats and competitive events',
  },
  {
    href: '/view',
    label: 'View Heat Sheet',
    sub: 'Read-only — all studios',
  },
]

export default async function Home() {
  const session = await getSession()
  if (session?.role === 'admin') redirect('/admin')
  if (session?.role === 'studio') redirect(`/studio/${session.studioSlug}`)
  if (session?.role === 'judge') redirect('/judge')

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6" style={{ backgroundColor: 'var(--surface)' }}>
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-center" style={{ color: 'var(--text)' }}>Team Spirit Showcase</h1>
          <div className="text-sm text-center space-y-0.5" style={{ color: 'var(--muted)' }}>
            <p><strong style={{ color: 'var(--text)' }}>Sunday, 9/20</strong></p>
            <p>Final deadline to add or change — Monday, 9/14</p>
            <p>Final deadline for head count — Tuesday, 9/15</p>
          </div>
        </div>
        <div className="card overflow-hidden">
          {entries.map(({ href, label, sub }, i) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors"
              style={{ borderTop: i > 0 ? '1px solid var(--border)' : undefined }}
            >
              <div className="flex-1">
                <div className="font-semibold text-sm" style={{ color: 'var(--text)' }}>{label}</div>
                <div className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{sub}</div>
              </div>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ color: 'var(--muted)' }}>
                <path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
          ))}
        </div>
      </div>
    </main>
  )
}
