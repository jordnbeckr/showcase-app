'use client'

import { useTransition, useState } from 'react'
import { addLunchGuest, updateLunchGuest, removeLunchGuest } from '@/app/actions/billing'

type LunchGuest = { id: number; name: string; guestOf: string | null; guestOfStudentId: number | null; lunchTickets: number; paid: boolean; paidDate: string | null; paidInitials: string | null }
type StudentOption = { id: number; firstName: string; lastName: string }

export default function HeadCountView({
  slug,
  studentCount,
  instructorCount,
  heatEntryCount,
  lunchGuests: initialLunchGuests,
  studentsWithHeats,
}: {
  slug: string
  studentCount: number
  instructorCount: number
  heatEntryCount: number
  lunchGuests: LunchGuest[]
  studentsWithHeats: StudentOption[]
}) {
  const [pending, startTransition] = useTransition()
  const [lunchGuests, setLunchGuests] = useState<LunchGuest[]>(initialLunchGuests)
  const [newGuest, setNewGuest] = useState({ name: '', guestOfStudentId: '' as string, lunchTickets: 1 })

  const totalParticipants = studentCount + instructorCount
  const totalGuests = lunchGuests.length

  return (
    <div className="max-w-2xl mx-auto space-y-4">

      {/* Stat tiles */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Students', value: studentCount },
          { label: 'Instructors', value: instructorCount },
          { label: 'Heat Entries', value: heatEntryCount },
          { label: 'Spectators', value: totalGuests, accent: true },
        ].map(stat => (
          <div key={stat.label} className="card p-4 text-center">
            <div className="text-3xl font-bold" style={{ color: stat.accent ? 'var(--accent)' : 'var(--text)' }}>
              {stat.value}
            </div>
            <div className="text-xs mt-1" style={{ color: 'var(--muted)' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Total bar */}
      <div className="card px-5 py-3 flex items-center justify-between" style={{ borderLeft: '4px solid var(--accent)' }}>
        <span className="text-sm font-semibold" style={{ color: 'var(--muted)' }}>Total Head Count</span>
        <span className="text-2xl font-bold" style={{ color: 'var(--text)' }}>
          {totalParticipants + totalGuests}
          <span className="text-xs font-normal ml-2" style={{ color: 'var(--muted)' }}>
            {totalParticipants} participants + {totalGuests} spectators
          </span>
        </span>
      </div>

      {/* Lunch Guests card */}
      <div className="card overflow-hidden">
        <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'var(--surface)' }}>
          <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
            Spectators {lunchGuests.length > 0 && `(${lunchGuests.length})`}
          </span>
        </div>

        {lunchGuests.length === 0 && (
          <p className="text-sm px-4 py-3" style={{ color: 'var(--muted)' }}>No spectators yet.</p>
        )}

        {lunchGuests.map((g, i) => (
          <div key={g.id} className="px-4 py-2.5 flex items-center gap-3"
            style={{ borderTop: i > 0 ? '1px solid var(--border)' : undefined }}>
            <div className="flex-1 min-w-0">
              <span className="text-sm font-medium">{g.name}</span>
              <span className="text-xs ml-2 px-1.5 py-0.5 rounded" style={{ background: '#f0f9ff', color: '#0369a1' }}>
                🥗 {g.lunchTickets}×
              </span>
              {g.guestOf && (
                <span className="text-xs ml-1.5 px-1.5 py-0.5 rounded" style={{ background: 'var(--surface2)', color: 'var(--muted)' }}>
                  guest of {g.guestOf}
                </span>
              )}
            </div>
            <input type="number" min={1} value={g.lunchTickets}
              onChange={e => setLunchGuests(prev => prev.map(x => x.id === g.id ? { ...x, lunchTickets: parseInt(e.target.value) || 1 } : x))}
              onBlur={e => { const v = parseInt(e.target.value) || 1; startTransition(async () => { await updateLunchGuest(slug, g.id, { lunchTickets: v }) }) }}
              className="input" style={{ width: 52, textAlign: 'center', fontSize: '0.82rem', border: '1px solid #94a3b8', borderRadius: 4 }} />
            <button onClick={() => {
              setLunchGuests(prev => prev.filter(x => x.id !== g.id))
              startTransition(async () => { await removeLunchGuest(slug, g.id) })
            }} disabled={pending} className="text-xs px-2 py-1" style={{ color: '#dc2626', opacity: pending ? 0.4 : 1 }}>
              Remove
            </button>
          </div>
        ))}

        {/* Inline add row */}
        <div className="px-4 py-3 flex gap-2 items-end flex-wrap"
          style={{ borderTop: '1px solid var(--border)', backgroundColor: 'var(--surface)' }}>
          <div>
            <label className="block text-xs mb-1" style={{ color: 'var(--muted)' }}>Name</label>
            <input type="text" placeholder="Anna R." value={newGuest.name}
              onChange={e => setNewGuest(g => ({ ...g, name: e.target.value }))}
              className="input" style={{ width: 130, border: '1px solid #94a3b8', borderRadius: 4, padding: '4px 8px', fontSize: '0.875rem' }} />
          </div>
          <div>
            <label className="block text-xs mb-1" style={{ color: 'var(--muted)' }}>Guest of</label>
            <select value={newGuest.guestOfStudentId}
              onChange={e => setNewGuest(g => ({ ...g, guestOfStudentId: e.target.value }))}
              className="input" style={{ width: 170, border: '1px solid #94a3b8', borderRadius: 4, padding: '4px 8px', fontSize: '0.875rem' }}>
              <option value="">N/A</option>
              {studentsWithHeats.map(s => (
                <option key={s.id} value={String(s.id)}>{s.firstName} {s.lastName}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs mb-1" style={{ color: 'var(--muted)' }}>Tickets</label>
            <input type="number" min={1} value={newGuest.lunchTickets}
              onChange={e => setNewGuest(g => ({ ...g, lunchTickets: parseInt(e.target.value) || 1 }))}
              className="input" style={{ width: 56, border: '1px solid #94a3b8', borderRadius: 4 }} />
          </div>
          <button disabled={!newGuest.name.trim() || pending} onClick={() => {
            const g = { ...newGuest }
            const studentId = g.guestOfStudentId ? parseInt(g.guestOfStudentId) : null
            const student = studentId ? studentsWithHeats.find(s => s.id === studentId) : null
            const guestOfName = student ? `${student.firstName} ${student.lastName}` : null
            setNewGuest({ name: '', guestOfStudentId: '', lunchTickets: 1 })
            startTransition(async () => {
              const created = await addLunchGuest(slug, { name: g.name, guestOf: guestOfName, guestOfStudentId: studentId, lunchTickets: g.lunchTickets })
              if (created) setLunchGuests(prev => [...prev, { ...created, paidDate: created.paidDate ?? null, paidInitials: created.paidInitials ?? null, guestOf: created.guestOf ?? null, guestOfStudentId: created.guestOfStudentId ?? null }])
            })
          }}
            className="text-sm font-medium px-4 py-2"
            style={{ backgroundColor: 'var(--accent)', color: 'white', borderRadius: 4, opacity: !newGuest.name.trim() || pending ? 0.5 : 1 }}>
            Add Spectator
          </button>
        </div>
      </div>

    </div>
  )
}
