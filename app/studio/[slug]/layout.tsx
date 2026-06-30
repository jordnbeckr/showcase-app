import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'
import { logout } from '@/app/actions/auth'
import Link from 'next/link'

export default async function StudioLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const session = await getSession()
  if (session?.role !== 'studio' || session.studioSlug !== slug) {
    redirect('/login/studio')
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header
        className="sticky top-0 z-50 flex items-center gap-0 shadow-md"
        style={{ backgroundColor: '#2c2c2c', minHeight: 52 }}
      >
        {/* Studio name */}
        <div className="px-5 py-3 flex items-center gap-2 border-r border-white/10">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect x="1" y="7" width="14" height="8" rx="1" stroke="white" strokeWidth="1.5"/>
            <path d="M4 7V5.5a4 4 0 018 0V7" stroke="white" strokeWidth="1.5"/>
          </svg>
          <span className="font-bold text-white text-sm tracking-wide">{session.studioName}</span>
        </div>
        {/* Nav */}
        <nav className="flex items-stretch h-full">
          {[
            { href: `/studio/${slug}`, label: 'Home' },
            { href: `/studio/${slug}/roster`, label: 'Roster' },
            { href: `/studio/${slug}/heats`, label: 'Heat Sign-Up' },
            { href: `/studio/${slug}/shows`, label: 'Shows' },
            { href: `/studio/${slug}/breakdown`, label: 'Breakdown' },
            { href: `/studio/${slug}/heatsheet`, label: 'Heat Sheet' },
            { href: `/studio/${slug}/feedback`, label: 'Feedback' },
          ].map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="px-4 py-3 text-sm text-white/75 hover:text-white hover:bg-white/10 transition-all flex items-center"
            >
              {label}
            </Link>
          ))}
        </nav>
        {/* Right side */}
        <div className="ml-auto flex items-center gap-3 px-5">
          <Link href="/view" className="text-xs text-white/50 hover:text-white/80 transition-colors">
            View sheet
          </Link>
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
      <main className="flex-1 p-6">{children}</main>
    </div>
  )
}
