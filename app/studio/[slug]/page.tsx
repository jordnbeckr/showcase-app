import { getSession } from '@/lib/session'
import { db } from '@/lib/db'
import Link from 'next/link'

export default async function StudioDashboard({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const session = await getSession()
  if (session?.role !== 'studio') return null

  const studio = await db.studio.findUnique({
    where: { slug },
    include: { students: true, instructors: true },
  })

  const entryCount = await db.heatEntry.count({
    where: { student: { studioId: studio?.id } },
  })

  const actions = [
    { label: 'Manage Roster', sub: 'Add & edit students', href: 'roster' },
    { label: 'Heat Sign-Up', sub: 'Assign students to heats', href: 'heats' },
    { label: 'Show Entries', sub: 'Pro & Student Show', href: 'shows' },
    { label: 'Entry Breakdown', sub: 'Counts by student & teacher', href: 'breakdown' },
    { label: 'View Full Sheet', sub: 'All studios — read only', href: '/view' },
  ]

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-center">{studio?.name}</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--muted)' }}>Dance Showcase 2026</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Students', value: studio?.students.length ?? 0 },
          { label: 'Instructors', value: studio?.instructors.length ?? 0 },
          { label: 'Heat Entries', value: entryCount },
        ].map(stat => (
          <div key={stat.label} className="card p-4 text-center">
            <div className="text-3xl font-bold text-center" style={{ color: 'var(--text)' }}>{stat.value}</div>
            <div className="text-xs mt-1" style={{ color: 'var(--muted)' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="card overflow-hidden">
        {actions.map(({ label, sub, href }, i) => {
          const fullHref = href.startsWith('/') ? href : `/studio/${slug}/${href}`
          return (
            <Link
              key={href}
              href={fullHref}
              className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
              style={{ borderTop: i > 0 ? '1px solid var(--border)' : undefined }}
            >
              <div className="flex-1">
                <div className="font-medium text-sm" style={{ color: 'var(--text)' }}>{label}</div>
                <div className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{sub}</div>
              </div>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ color: 'var(--muted)' }}>
                <path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
