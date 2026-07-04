import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'
import Link from 'next/link'

const entries = [
  {
    href: '/login/admin',
    label: 'Admin',
    color: '#1a2744',
    // ti-settings
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 0 0-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 0 0-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 0 0-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 0 0-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 0 0 1.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
        <circle cx="12" cy="12" r="3"/>
      </svg>
    ),
  },
  {
    href: '/login/studio',
    label: 'Studio Login',
    color: '#608040',
    // disco ball — sphere with grid, hanging cord, sparkle dots
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="14" r="6"/>
        <line x1="6" y1="14" x2="18" y2="14"/>
        <path d="M7 11q2.5 1.2 5 1.2t5-1.2"/>
        <path d="M7 17q2.5-1.2 5-1.2t5 1.2"/>
        <line x1="12" y1="8" x2="12" y2="5"/>
        <line x1="10" y1="5" x2="14" y2="5"/>
        <circle cx="4.5" cy="7" r="0.6" fill="currentColor" stroke="none"/>
        <circle cx="19.5" cy="9" r="0.6" fill="currentColor" stroke="none"/>
        <circle cx="3.5" cy="11" r="0.6" fill="currentColor" stroke="none"/>
      </svg>
    ),
  },
  {
    href: '/login/judge',
    label: 'Judge Login',
    color: '#2d5fa3',
    // ti-award
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="9" r="6"/>
        <path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/>
      </svg>
    ),
  },
  {
    href: '/view',
    label: 'Heat Sheet (Read Only)',
    color: '#5a5a5a',
    // ti-clipboard-list
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/>
        <rect x="9" y="3" width="6" height="4" rx="2"/>
        <line x1="9" y1="12" x2="15" y2="12"/>
        <line x1="9" y1="16" x2="12" y2="16"/>
        <circle cx="9" cy="12" r="0.5" fill="currentColor" stroke="none"/>
        <circle cx="9" cy="16" r="0.5" fill="currentColor" stroke="none"/>
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
