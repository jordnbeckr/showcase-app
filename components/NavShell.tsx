'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import NavIcon from './NavIcons'
import { TOOLKIT_URL } from '@/lib/toolkit'

export type NavGroup = { heading?: string; items: { href: string; label: string; icon: string }[] }

const STATUS: Record<string, { label: string; bg: string; fg: string }> = {
  live: { label: 'LIVE', bg: '#dcfce7', fg: '#166534' },
  upcoming: { label: 'UPCOMING', bg: '#e0f2fe', fg: '#075985' },
  archived: { label: 'ARCHIVED', bg: '#fef3c7', fg: '#78350f' },
}

// Left navigation rail (admin and studio) that can shrink to icons only (remembered in a cookie so it doesn't flash
// on the next page) and becomes a slide-in drawer on phones. The top bar carries the showcase.
export default function NavShell({
  groups, role, showcaseName, status, initialCollapsed, logoutAction, topExtra, showHomeLink = true, toolkit = false, children,
}: {
  groups: NavGroup[]
  role: string
  showcaseName: string
  status?: string
  initialCollapsed: boolean
  logoutAction: () => void | Promise<void>
  /** Extra controls in the top bar, e.g. the studio's past-showcase picker. */
  topExtra?: React.ReactNode
  showHomeLink?: boolean
  /** Show the "back to the Toolkit" link (our own staff only). */
  toolkit?: boolean
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(initialCollapsed)
  // The phone drawer is "open for the page it was opened on", so moving to another page closes it
  // without an effect.
  const [drawerPath, setDrawerPath] = useState<string | null>(null)
  const drawer = drawerPath === pathname
  const setDrawer = (open: boolean) => setDrawerPath(open ? pathname : null)

  const toggle = () => {
    const next = !collapsed
    setCollapsed(next)
    document.cookie = `nav_rail=${next ? '1' : '0'}; path=/; max-age=31536000; samesite=lax`
  }
  const active = (href: string) => (href === '/admin' || /^\/studio\/[^/]+$/.test(href) ? pathname === href : pathname.startsWith(href))
  const chip = status ? (STATUS[status] ?? STATUS.live) : null
  // On phones the drawer is always full-width labels; the icon-only mode only applies on wide screens.
  const slim = collapsed

  return (
    <div className="min-h-screen flex">
      {drawer && <div className="fixed inset-0 z-40 bg-black/40 md:hidden no-print" onClick={() => setDrawer(false)} />}

      <aside
        aria-label="Navigation"
        className={`no-print fixed md:sticky top-0 z-50 h-screen flex flex-col shrink-0 overflow-y-auto transition-[transform,width] duration-150 ${drawer ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 ${slim ? 'w-[208px] md:w-[58px]' : 'w-[208px]'}`}
        style={{ backgroundColor: 'hsl(210 44% 18%)', color: '#fff' }}
      >
        <div className={`flex items-center gap-2.5 px-3.5 py-4 ${slim ? 'md:justify-center md:px-0' : ''}`} style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          {toolkit ? (
            <a href={TOOLKIT_URL} title="Back to the Toolkit" aria-label="Back to the Toolkit" className="inline-flex items-center justify-center shrink-0 rounded-[11px] transition-colors hover:bg-white/25"
              style={{ width: 40, height: 40, background: 'rgba(255,255,255,0.14)', border: '1px solid rgba(255,255,255,0.3)' }}>
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 11L11 4l8 7" /><rect x="4.5" y="11" width="13" height="8" rx="1.5" /><path d="M4.5 14.5h13M10 14.5v2h2v-2" /></svg>
            </a>
          ) : (
            <svg width="20" height="20" viewBox="0 0 16 16" fill="none" aria-hidden="true" style={{ flex: 'none' }}>
              <circle cx="8" cy="8" r="3" stroke="white" strokeWidth="1.5" />
              <path d="M8 1v1.5M8 13.5V15M1 8h1.5M13.5 8H15" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          )}
          <span className={`font-bold tracking-wide truncate ${slim ? 'md:hidden' : ''}`} style={{ fontSize: '0.9rem' }}>{role}</span>
          <button className="ml-auto md:hidden text-white/70" aria-label="Close menu" onClick={() => setDrawer(false)}><NavIcon name="close" /></button>
        </div>

        <nav className="flex-1 px-2 py-2" aria-label="Pages">
          {groups.map((g, gi) => (
            <div key={gi} className={gi > 0 ? 'mt-1' : ''}>
              {g.heading && (
                slim
                  ? <div className="hidden md:block mx-3 my-2" style={{ borderTop: '1px solid rgba(255,255,255,0.12)' }} />
                  : null
              )}
              {g.heading && <div className={`px-2.5 pt-3 pb-1 text-[10px] font-semibold tracking-[0.1em] text-white/45 ${slim ? 'md:hidden' : ''}`}>{g.heading}</div>}
              {g.items.map(({ href, label, icon }) => (
                <Link
                  key={href}
                  href={href}
                  title={slim ? label : undefined}
                  aria-current={active(href) ? 'page' : undefined}
                  className={`flex items-center gap-2.5 rounded-full px-3.5 py-2 transition-colors ${slim ? 'md:justify-center md:px-0' : ''} ${active(href) ? 'text-white' : 'text-white/75 hover:text-white hover:bg-white/10'}`}
                  style={{ fontSize: '0.875rem', fontWeight: 600, ...(active(href) ? { backgroundColor: 'hsl(215 70% 54%)' } : {}) }}
                >
                  <NavIcon name={icon} />
                  <span className={slim ? 'md:hidden' : ''}>{label}</span>
                </Link>
              ))}
            </div>
          ))}
        </nav>

        <div className="hidden md:block px-2 py-2" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <button
            onClick={toggle}
            aria-expanded={!collapsed}
            aria-label={collapsed ? 'Expand the menu' : 'Collapse the menu'}
            title={collapsed ? 'Expand the menu' : 'Collapse the menu'}
            className={`flex items-center gap-2.5 w-full rounded-md px-2.5 py-2 text-white/60 hover:text-white hover:bg-white/10 transition-colors ${slim ? 'justify-center px-0' : ''}`}
            style={{ fontSize: '0.8125rem' }}
          >
            <NavIcon name={collapsed ? 'expand' : 'collapse'} />
            {!slim && <span>Collapse</span>}
          </button>
        </div>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="no-print sticky top-0 z-30 flex items-center gap-3 px-4 shadow-sm" style={{ backgroundColor: 'var(--card)', borderBottom: '1px solid var(--border)', minHeight: 52 }}>
          <button className="md:hidden p-1.5 -ml-1.5" aria-label="Open menu" onClick={() => setDrawer(true)} style={{ color: 'var(--text)' }}><NavIcon name="menu" size={22} /></button>
          <span className="font-bold truncate" style={{ fontSize: '0.95rem', color: 'var(--text)' }}>{showcaseName}</span>
          {chip && <span className="text-[10px] font-bold tracking-wider px-2 py-0.5 rounded-full" style={{ background: chip.bg, color: chip.fg }}>{chip.label}</span>}
          <div className="ml-auto flex items-center gap-2">
            {topExtra}
            {showHomeLink && <Link href="/" className="flex items-center gap-1.5 text-xs px-2 py-1.5 rounded" style={{ color: 'var(--muted)' }}><NavIcon name="home" size={15} /><span className="hidden sm:inline">Home</span></Link>}
            <form action={logoutAction}>
              <button className="text-xs font-medium px-3 py-1.5 rounded text-white" style={{ backgroundColor: 'var(--header)' }}>Sign out</button>
            </form>
          </div>
        </header>
        {children}
      </div>
    </div>
  )
}
