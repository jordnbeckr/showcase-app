import { db } from '@/lib/db'
import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  add_heat_entry:    { label: 'Heat added',      color: '#2563eb' },
  remove_heat_entry: { label: 'Heat removed',    color: '#dc2626' },
  publish_plan:      { label: 'Plan published',  color: '#7c3aed' },
  add_spectator:     { label: 'Spectator added', color: '#0891b2' },
  add_lunch_guest:   { label: 'Lunch guest',     color: '#059669' },
}

function fmt(d: Date) {
  return d.toLocaleString('en-US', {
    month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true,
    timeZone: 'America/Los_Angeles',
  })
}

const PAGE_SIZE = 50

export default async function ActivityPage({ searchParams }: { searchParams: Promise<{ studio?: string; action?: string; page?: string }> }) {
  const session = await getSession()
  if (session?.role !== 'admin') redirect('/login/admin')

  const { studio, action, page: pageParam } = await searchParams
  const page = Math.max(1, parseInt(pageParam ?? '1') || 1)

  const where = {
    ...(studio ? { studioSlug: studio } : {}),
    ...(action ? { action } : {}),
  }

  const [logs, total] = await Promise.all([
    db.activityLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
    }),
    db.activityLog.count({ where }),
  ])

  const studios = await db.studio.findMany({ select: { slug: true, name: true }, orderBy: { order: 'asc' } })
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  function pageUrl(p: number) {
    const params = new URLSearchParams()
    if (studio) params.set('studio', studio)
    if (action) params.set('action', action)
    if (p > 1) params.set('page', String(p))
    return `/admin/activity${params.size ? '?' + params.toString() : ''}`
  }

  return (
    <div style={{ maxWidth: 820, margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ marginBottom: 20, display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text)' }}>Activity Log</h1>
          <p style={{ fontSize: '0.78rem', color: 'var(--muted)', marginTop: 2 }}>
            {total} event{total !== 1 ? 's' : ''} total · page {page} of {totalPages}
          </p>
        </div>
      </div>

      {/* Filters */}
      <form style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <select name="studio" defaultValue={studio ?? ''}
          style={{ padding: '5px 10px', border: '1px solid var(--border)', borderRadius: 6, fontSize: '0.82rem', background: 'var(--surface)', color: 'var(--text)' }}>
          <option value="">All studios</option>
          {studios.map(s => <option key={s.slug} value={s.slug}>{s.name}</option>)}
        </select>
        <select name="action" defaultValue={action ?? ''}
          style={{ padding: '5px 10px', border: '1px solid var(--border)', borderRadius: 6, fontSize: '0.82rem', background: 'var(--surface)', color: 'var(--text)' }}>
          <option value="">All actions</option>
          {Object.entries(ACTION_LABELS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <button type="submit"
          style={{ padding: '5px 14px', background: 'var(--accent)', color: 'white', border: 'none', borderRadius: 6, fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}>
          Filter
        </button>
        {(studio || action) && (
          <a href="/admin/activity"
            style={{ padding: '5px 10px', fontSize: '0.82rem', color: 'var(--muted)', display: 'flex', alignItems: 'center' }}>
            Clear
          </a>
        )}
      </form>

      {logs.length === 0 ? (
        <p style={{ color: 'var(--muted)', fontSize: '0.85rem', padding: '24px 0' }}>No activity recorded yet.</p>
      ) : (
        <div style={{ border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
            <thead>
              <tr style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, fontSize: '0.72rem', letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--muted)', whiteSpace: 'nowrap' }}>Time</th>
                <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, fontSize: '0.72rem', letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--muted)' }}>Studio</th>
                <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, fontSize: '0.72rem', letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--muted)' }}>Action</th>
                <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, fontSize: '0.72rem', letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--muted)' }}>Detail</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log, i) => {
                const meta = ACTION_LABELS[log.action] ?? { label: log.action, color: '#64748b' }
                return (
                  <tr key={log.id} style={{ borderTop: i > 0 ? '1px solid var(--border)' : undefined, background: i % 2 === 0 ? 'var(--surface)' : 'var(--surface2)' }}>
                    <td style={{ padding: '8px 12px', color: 'var(--muted)', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
                      {fmt(new Date(log.createdAt))}
                    </td>
                    <td style={{ padding: '8px 12px', color: 'var(--muted)' }}>
                      {log.studioSlug ?? '—'}
                    </td>
                    <td style={{ padding: '8px 12px', whiteSpace: 'nowrap' }}>
                      <span style={{ display: 'inline-block', background: meta.color + '18', color: meta.color, borderRadius: 4, padding: '2px 7px', fontWeight: 600, fontSize: '0.72rem' }}>
                        {meta.label}
                      </span>
                      {log.actor && (
                        <span style={{ marginLeft: 6, fontSize: '0.72rem', color: 'var(--muted)' }}>by {log.actor}</span>
                      )}
                    </td>
                    <td style={{ padding: '8px 12px', color: 'var(--text)' }}>
                      {log.subject}
                      {log.details && <span style={{ marginLeft: 6, color: 'var(--muted)', fontSize: '0.75rem' }}>{log.details}</span>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 16, justifyContent: 'center' }}>
          <a href={pageUrl(page - 1)}
            aria-disabled={page <= 1}
            style={{ padding: '5px 12px', border: '1px solid var(--border)', borderRadius: 6, fontSize: '0.82rem', color: page <= 1 ? 'var(--muted)' : 'var(--text)', pointerEvents: page <= 1 ? 'none' : 'auto', background: 'var(--surface)', textDecoration: 'none' }}>
            ← Prev
          </a>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <a key={p} href={pageUrl(p)}
              style={{ padding: '5px 10px', border: '1px solid var(--border)', borderRadius: 6, fontSize: '0.82rem', background: p === page ? 'var(--accent)' : 'var(--surface)', color: p === page ? 'white' : 'var(--text)', textDecoration: 'none', fontWeight: p === page ? 700 : 400 }}>
              {p}
            </a>
          ))}
          <a href={pageUrl(page + 1)}
            aria-disabled={page >= totalPages}
            style={{ padding: '5px 12px', border: '1px solid var(--border)', borderRadius: 6, fontSize: '0.82rem', color: page >= totalPages ? 'var(--muted)' : 'var(--text)', pointerEvents: page >= totalPages ? 'none' : 'auto', background: 'var(--surface)', textDecoration: 'none' }}>
            Next →
          </a>
        </div>
      )}
    </div>
  )
}
