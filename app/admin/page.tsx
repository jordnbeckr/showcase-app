import { db } from '@/lib/db'
import Link from 'next/link'

export default async function AdminDashboard() {
  const [heatCount, studioCount, studentCount, entryCount] = await Promise.all([
    db.heat.count(),
    db.studio.count(),
    db.student.count(),
    db.heatEntry.count(),
  ])

  const heats = await db.heat.findMany({ include: { entries: true }, orderBy: { number: 'asc' } })
  const fullHeats = heats.filter(h => h.entries.length >= h.maxCapacity).length
  const halfHeats = heats.filter(h => h.entries.length >= Math.floor(h.maxCapacity / 2)).length

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-xl font-bold text-center">Admin Dashboard — Showcase 2026</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Heats', value: heatCount },
          { label: 'Studios', value: studioCount },
          { label: 'Students', value: studentCount },
          { label: 'Heat Entries', value: entryCount },
        ].map(stat => (
          <div key={stat.label} className="card p-4 text-center">
            <div className="text-3xl font-bold">{stat.value}</div>
            <div className="text-xs mt-1" style={{ color: 'var(--muted)' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="card p-5">
          <h2 className="font-semibold text-sm mb-3">Heat Capacity</h2>
          <div className="space-y-2 text-sm">
            {[
              { label: 'Open', count: heats.length - halfHeats, color: '#16a34a' },
              { label: 'Half Full or more', count: halfHeats - fullHeats, color: '#d97706' },
              { label: 'Full (24/24)', count: fullHeats, color: '#dc2626' },
            ].map(({ label, count, color }) => (
              <div key={label} className="flex items-center justify-between">
                <span>{label}</span>
                <span className="font-bold text-sm" style={{ color }}>{count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card overflow-hidden">
          <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--border)', backgroundColor: '#f5f5f5' }}>
            <h2 className="font-semibold text-sm">Quick Links</h2>
          </div>
          <div>
            {[
              { href: '/admin/config', label: 'Configure Heats, Dances & Studios' },
              { href: '/admin/master', label: 'Master Heat Sheet' },
              { href: '/view', label: 'Public Read-Only View' },
            ].map(({ href, label }, i) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-sm"
                style={{ borderTop: i > 0 ? '1px solid var(--border)' : undefined }}
              >
                <span className="flex-1">{label}</span>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ color: 'var(--muted)' }}>
                  <path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
