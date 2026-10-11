import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { logout } from '@/app/actions/auth'
import NavShell, { type NavGroup } from '@/components/NavShell'

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

  const jar = await cookies()
  const railCollapsed = jar.get('nav_rail')?.value === '1'
  const base = `/studio/${slug}`
  const groups: NavGroup[] = [
    { items: [{ href: base, label: 'Home', icon: 'home' }] },
    { heading: 'SIGN UP', items: [
      { href: `${base}/roster`, label: 'Roster', icon: 'roster' },
      { href: `${base}/heats`, label: 'Heat Sign-Up', icon: 'heats' },
      { href: `${base}/shows`, label: 'Solos', icon: 'solos' },
      ...(slug === 'sherman-oaks' ? [{ href: `${base}/plan`, label: 'Plan', icon: 'plan' }, { href: `${base}/students`, label: 'Payments', icon: 'payments' }] : []),
    ] },
    { heading: 'SHEETS', items: [
      { href: `${base}/breakdown`, label: 'Breakdown', icon: 'breakdown' },
      { href: `${base}/heatsheet`, label: 'Heat Sheet', icon: 'sheet' },
      { href: `${base}/headcount`, label: 'Head Count', icon: 'headcount' },
    ] },
    { heading: 'RESULTS', items: [
      { href: `${base}/results`, label: 'Results', icon: 'results' },
      { href: `${base}/feedback`, label: 'Feedback', icon: 'feedback' },
    ] },
  ]

  return (
    <NavShell
      toolkit={slug === 'sherman-oaks'}
      groups={groups}
      role={session.studioName}
      showcaseName="Team Spirit Showcase"
      initialCollapsed={railCollapsed}
      logoutAction={logout}
      showHomeLink={false}
      topExtra={<Link href="/view" className="text-xs px-2 py-1.5 rounded" style={{ color: 'var(--muted)' }}>View sheet</Link>}
    >
      <main className="flex-1 p-6 pb-16">
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>{children}</div>
      </main>
    </NavShell>
  )
}
