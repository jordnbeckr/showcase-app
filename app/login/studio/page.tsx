import { db } from '@/lib/db'
import StudioLoginForm from './StudioLoginForm'
import Link from 'next/link'
import { headers } from 'next/headers'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function StudioLogin() {
  await headers() // dynamic function — prevents any static/edge caching
  const studios = await db.studio.findMany({ orderBy: { name: 'asc' } })

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6" style={{ backgroundColor: 'var(--surface)' }}>
      <div className="w-full max-w-xs space-y-6">
        <div className="text-center space-y-1">
          <div className="w-12 h-12 rounded-xl mx-auto flex items-center justify-center mb-3" style={{ backgroundColor: '#333' }}>
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <rect x="2" y="10" width="18" height="10" rx="1.5" stroke="white" strokeWidth="1.6"/>
              <path d="M6 10V8a5 5 0 0110 0v2" stroke="white" strokeWidth="1.6" strokeLinecap="round"/>
              <circle cx="11" cy="15" r="2" fill="white"/>
            </svg>
          </div>
          <h1 className="text-xl font-bold text-center" style={{ color: 'var(--text)' }}>Studio Login</h1>
        </div>
        <StudioLoginForm studios={studios.map(s => ({ slug: s.slug, name: s.name }))} />
        <div className="text-center">
          <Link href="/" className="text-sm" style={{ color: 'var(--muted)' }}>← Back to home</Link>
        </div>
      </div>
    </main>
  )
}
