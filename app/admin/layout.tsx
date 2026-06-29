import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'
import { logout } from '@/app/actions/auth'
import Link from 'next/link'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (session?.role !== 'admin') redirect('/login/admin')

  return (
    <div className="min-h-screen flex flex-col">
      <header
        className="sticky top-0 z-50 flex items-center gap-0 shadow-md"
        style={{ backgroundColor: '#2c2c2c', minHeight: 52 }}
      >
        {/* Brand */}
        <div className="px-5 py-3 flex items-center gap-2 border-r border-white/10">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="3" stroke="white" strokeWidth="1.5"/>
            <path d="M8 1v1.5M8 13.5V15M1 8h1.5M13.5 8H15" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <span className="font-bold text-white text-sm tracking-wide">Admin</span>
        </div>
        {/* Nav */}
        <nav className="flex items-stretch h-full">
          {[
            { href: '/admin', label: 'Dashboard' },
            { href: '/admin/config', label: 'Config' },
            { href: '/admin/master', label: 'Master View' },
            { href: '/admin/shows', label: 'Shows' },
            { href: '/admin/results', label: 'Results' },
            { href: '/admin/floors', label: 'Floors' },
            { href: '/admin/leaders', label: 'Leader #s' },
            { href: '/admin/budget', label: 'Budget' },
            { href: '/admin/attendance', label: 'Attendance' },
          ].map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="px-5 py-3 text-sm text-white/75 hover:text-white hover:bg-white/10 transition-all flex items-center"
            >
              {label}
            </Link>
          ))}
        </nav>
        {/* Right side */}
        <div className="ml-auto flex items-center gap-3 px-5">
          <Link href="/login/judge" className="text-xs text-white/50 hover:text-white/80 transition-colors">
            Judge login
          </Link>
          <Link href="/" className="text-xs text-white/50 hover:text-white/80 transition-colors">
            ← Home
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
