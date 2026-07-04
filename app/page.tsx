import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'
import Link from 'next/link'

const entries = [
  {
    href: '/login/admin',
    label: 'Admin',
    color: '#1a2744',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a3 3 0 0 1 3 3v1h2a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h2V5a3 3 0 0 1 3-3z"/>
        <circle cx="12" cy="13" r="2"/>
        <path d="M12 15v2"/>
      </svg>
    ),
  },
  {
    href: '/login/studio',
    label: 'Studio Login',
    color: '#608040',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        {/* disco ball */}
        <circle cx="12" cy="14" r="7"/>
        <ellipse cx="12" cy="14" rx="3.5" ry="7"/>
        <line x1="5" y1="14" x2="19" y2="14"/>
        <path d="M6 11q3 1.5 6 1.5t6-1.5"/>
        <path d="M6 17q3-1.5 6-1.5t6 1.5"/>
        <line x1="12" y1="7" x2="12" y2="4"/>
        <line x1="10" y1="4" x2="14" y2="4"/>
        <circle cx="4" cy="6" r="0.7" fill="currentColor" stroke="none"/>
        <circle cx="20" cy="8" r="0.7" fill="currentColor" stroke="none"/>
        <circle cx="3" cy="10" r="0.7" fill="currentColor" stroke="none"/>
        <circle cx="20" cy="5" r="0.7" fill="currentColor" stroke="none"/>
      </svg>
    ),
  },
  {
    href: '/login/judge',
    label: 'Judge Login',
    color: '#2d5fa3',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
      </svg>
    ),
  },
  {
    href: '/view',
    label: 'Read-Only Heat Sheet',
    color: '#5a5a5a',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <rect x="5" y="3" width="14" height="18" rx="2"/>
        <line x1="9" y1="8" x2="15" y2="8"/>
        <line x1="9" y1="12" x2="15" y2="12"/>
        <line x1="9" y1="16" x2="12" y2="16"/>
        <line x1="5" y1="7" x2="3" y2="7"/>
        <line x1="5" y1="11" x2="3" y2="11"/>
        <line x1="5" y1="15" x2="3" y2="15"/>
      </svg>
    ),
  },
]

export default async function Home() {
  const session = await getSession()
  if (session?.role === 'admin') redirect('/admin')
  if (session?.role === 'studio') redirect(`/studio/${session.studioSlug}`)
  if (session?.role === 'judge') redirect('/judge')

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6" style={{ backgroundColor: 'var(--surface)' }}>
      <div className="w-full space-y-8" style={{ maxWidth: 680 }}>
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-center" style={{ color: 'var(--text)' }}>Team Spirit Showcase</h1>
          <div className="text-sm text-center space-y-0.5" style={{ color: 'var(--muted)' }}>
            <p><strong style={{ color: 'var(--text)' }}>Sunday, 9/20</strong></p>
            <p>Final deadline to add or change — Monday, 9/14</p>
            <p>Final deadline for head count — Tuesday, 9/15</p>
          </div>
        </div>
        <div className="flex gap-3">
          {entries.map(({ href, label, color, icon }) => (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center justify-center gap-3 rounded-lg py-6 px-3 text-center transition-opacity hover:opacity-90 active:opacity-75"
              style={{ backgroundColor: color, color: 'white', flex: 1, minHeight: 110 }}
            >
              {icon}
              <span className="text-xs font-semibold leading-tight" style={{ color: 'white' }}>{label}</span>
            </Link>
          ))}
        </div>
      </div>
    </main>
  )
}
