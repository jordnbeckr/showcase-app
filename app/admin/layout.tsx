import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { logout } from '@/app/actions/auth'
import NavShell, { type NavGroup } from '@/components/NavShell'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (session?.role !== 'admin') redirect('/login/admin')

  const jar = await cookies()
  const railCollapsed = jar.get('nav_rail')?.value === '1'

  const groups: NavGroup[] = [
    { items: [{ href: '/admin', label: 'Dashboard', icon: 'dashboard' }] },
    { heading: 'SHOW DAY', items: [
      { href: '/admin/master', label: 'Master View', icon: 'master' },
      { href: '/admin/headcount', label: 'Head Count', icon: 'headcount' },
      { href: '/admin/attendance', label: 'Attendance', icon: 'attendance' },
    ] },
    { heading: 'SCORING', items: [
      { href: '/admin/results', label: 'Results', icon: 'results' },
      { href: '/admin/feedback', label: 'Feedback', icon: 'feedback' },
    ] },
    { heading: 'MONEY & SETUP', items: [
      { href: '/admin/budget', label: 'Budget', icon: 'budget' },
      { href: '/admin/config', label: 'Config', icon: 'config' },
      { href: '/admin/floors', label: 'Floors', icon: 'floors' },
      { href: '/admin/leaders', label: 'Leader #s', icon: 'leaders' },
      { href: '/admin/activity', label: 'Activity', icon: 'activity' },
    ] },
  ]

  return (
    <NavShell
      toolkit
      groups={groups}
      role="Admin"
      showcaseName="Team Spirit Showcase"
      initialCollapsed={railCollapsed}
      logoutAction={logout}
      topExtra={<Link href="/login/judge" className="text-xs px-2 py-1.5 rounded" style={{ color: 'var(--muted)' }}>Judge login</Link>}
    >
      <main className="flex-1 p-6 pb-16">
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>{children}</div>
      </main>
    </NavShell>
  )
}
