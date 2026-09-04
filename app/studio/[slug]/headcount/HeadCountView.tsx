'use client'

import { useTransition, useRef, useState } from 'react'
import { addSpectator, removeSpectator, updateSpectator } from '@/app/actions/headcount'
import { addLunchGuest, updateLunchGuest, removeLunchGuest } from '@/app/actions/billing'

type Spectator = { id: number; name: string; guestOf: string | null }
type LunchGuest = { id: number; name: string; guestOf: string | null; guestOfStudentId: number | null; lunchTickets: number; paid: boolean; paidDate: string | null; paidInitials: string | null }
type StudentOption = { id: number; firstName: string; lastName: string }

export default function HeadCountView({
  slug,
  studentCount,
  instructorCount,
  heatEntryCount,
  spectators,
  lunchGuests: initialLunchGuests,
  studentsWithHeats,
}: {
  slug: string
  studentCount: number
  instructorCount: number
  heatEntryCount: number
  spectators: Spectator[]
  lunchGuests: LunchGuest[]
  studentsWithHeats: StudentOption[]
}) {
  const [pending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editName, setEditName] = useState('')
  const [editGuestOf, setEditGuestOf] = useState('')

  const [lunchGuests, setLunchGuests] = useState<LunchGuest[]>(initialLunchGuests)
  const [newGuest, setNewGuest] = useState({ name: '', guestOfStudentId: '' as string, lunchTickets: 1 })

  function handleAdd(formData: FormData) {
    startTransition(async () => {
      const result = await addSpectator(slug, formData)
      if (!result?.error) formRef.current?.reset()
    })
  }

  function handleRemove(id: number) {
    startTransition(async () => { await removeSpectator(slug, id) })
  }

  function startEdit(s: Spectator) {
    setEditingId(s.id)
    setEditName(s.name)
    setEditGuestOf(s.guestOf ?? '')
  }

  function handleSave(id: number) {
    if (!editName.trim()) return
    startTransition(async () => {
      await updateSpectator(slug, id, editName, editGuestOf || null)
      setEditingId(null)
    })
  }

  const totalParticipants = studentCount + instructorCount

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Stat blocks */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Students', value: studentCount },
          { label: 'Instructors', value: instructorCount },
          { label: 'Heat Entries', value: heatEntryCount },
          { label: 'Spectators', value: spectators.length + lunchGuests.length, accent: true },
        ].map(stat => (
          <div key={stat.label} className="card p-4 text-center">
            <div className="text-3xl font-bold" style={{ color: stat.accent ? 'var(--accent)' : 'var(--text)' }}>
              {stat.value}
            </div>
            <div className="text-xs mt-1" style={{ color: 'var(--muted)' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Total head count summary */}
      <div className="card p-4 flex items-center justify-between" style={{ borderLeft: '4px solid var(--accent)' }}>
        <span className="text-sm font-medium" style={{ color: 'var(--muted)' }}>Total Head Count</span>
        <span className="text-2xl font-bold" style={{ color: 'var(--text)' }}>
          {totalParticipants + spectators.length + lunchGuests.length}
          <span className="text-xs font-normal ml-2" style={{ color: 'var(--muted)' }}>
            {totalParticipants} participants + {spectators.length + lunchGuests.length} guests
          </span>
        </span>
      </div>

      {/* Add spectator */}
      <div className="card p-5">
        <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--text)' }}>Add Spectator</h2>
        <form ref={formRef} action={handleAdd} className="flex flex-col gap-3">
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs mb-1" style={{ color: 'var(--muted)' }}>Name <span style={{ color: '#dc2626' }}>*</span></label>
              <input name="name" required className="input w-full" placeholder="Full name" disabled={pending} />
            </div>
            <div className="flex-1">
              <label className="block text-xs mb-1" style={{ color: 'var(--muted)' }}>Guest Of <span style={{ color: 'var(--muted)' }}>(optional)</span></label>
              <input name="guestOf" className="input w-full" placeholder="Student or instructor name" disabled={pending} />
            </div>
          </div>
          <div>
            <button type="submit" disabled={pending} className="text-sm font-medium px-4 py-2"
              style={{ backgroundColor: 'var(--accent)', color: 'white', borderRadius: 4, opacity: pending ? 0.6 : 1 }}>
              Add Spectator
            </button>
          </div>
        </form>
      </div>

      {/* Spectator list */}
      {spectators.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-4 py-2.5" style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'var(--surface)' }}>
            <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>
              Spectators ({spectators.length})
            </span>
          </div>
          {spectators.map((s, i) => (
            <div key={s.id} className="px-4 py-2.5" style={{ borderTop: i > 0 ? '1px solid var(--border)' : undefined }}>
              {editingId === s.id ? (
                <div className="flex gap-2 items-center flex-wrap">
                  <input autoFocus value={editName} onChange={e => setEditName(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleSave(s.id); if (e.key === 'Escape') setEditingId(null) }}
                    className="input" style={{ flex: '1 1 120px', minWidth: 100 }} placeholder="Name" />
                  <input value={editGuestOf} onChange={e => setEditGuestOf(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleSave(s.id); if (e.key === 'Escape') setEditingId(null) }}
                    className="input" style={{ flex: '1 1 140px', minWidth: 120 }} placeholder="Guest of (optional)" />
                  <button onClick={() => handleSave(s.id)} disabled={pending || !editName.trim()} className="text-xs px-3 py-1 font-medium"
                    style={{ backgroundColor: 'var(--accent)', color: 'white', borderRadius: 4, opacity: pending ? 0.5 : 1 }}>
                    Save
                  </button>
                  <button onClick={() => setEditingId(null)} className="text-xs px-2 py-1" style={{ color: 'var(--muted)' }}>Cancel</button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="text-sm font-medium">{s.name}</div>
                    {s.guestOf && <div className="text-xs" style={{ color: 'var(--muted)' }}>Guest of {s.guestOf}</div>}
                  </div>
                  <button onClick={() => startEdit(s)} disabled={pending} className="text-xs px-2 py-1" style={{ color: 'var(--muted)', opacity: pending ? 0.4 : 1 }}>Edit</button>
                  <button onClick={() => handleRemove(s.id)} disabled={pending} className="text-xs px-2 py-1" style={{ color: '#dc2626', opacity: pending ? 0.4 : 1 }}>Remove</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {spectators.length === 0 && (
        <p className="text-sm text-center py-4" style={{ color: 'var(--muted)' }}>No spectators added yet.</p>
      )}

      {/* Lunch guests */}
      <div className="card overflow-hidden">
        <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'var(--surface)' }}>
          <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>
            Lunch Guests {lunchGuests.length > 0 ? `(${lunchGuests.length})` : ''}
          </span>
        </div>

        {lunchGuests.map((g, i) => (
          <div key={g.id} className="px-4 py-2.5 flex items-center gap-3" style={{ borderTop: i > 0 ? '1px solid var(--border)' : undefined }}>
            <div className="flex-1">
              <div className="text-sm font-medium">{g.name}
                <span style={{ marginLeft: 6, fontSize: '0.7rem', background: '#f0f9ff', color: '#0369a1', borderRadius: 4, padding: '1px 5px', fontWeight: 600 }}>🥗 {g.lunchTickets}×</span>
              </div>
              {g.guestOf && <div className="text-xs" style={{ color: 'var(--muted)' }}>Guest of {g.guestOf}</div>}
            </div>
            <input type="number" min={1} value={g.lunchTickets}
              onChange={e => setLunchGuests(prev => prev.map(x => x.id === g.id ? { ...x, lunchTickets: parseInt(e.target.value) || 1 } : x))}
              onBlur={e => { const v = parseInt(e.target.value) || 1; startTransition(async () => { await updateLunchGuest(slug, g.id, { lunchTickets: v }) }) }}
              className="input" style={{ width: 52, textAlign: 'center', fontSize: '0.82rem' }} />
            <button onClick={() => {
              setLunchGuests(prev => prev.filter(x => x.id !== g.id))
              startTransition(async () => { await removeLunchGuest(slug, g.id) })
            }} disabled={pending} className="text-xs px-2 py-1" style={{ color: '#dc2626', opacity: pending ? 0.4 : 1 }}>
              Remove
            </button>
          </div>
        ))}

        {/* Add lunch guest form */}
        <div className="px-4 py-3" style={{ borderTop: lunchGuests.length > 0 ? '1px solid var(--border)' : undefined, display: 'flex', gap: 8, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div>
            <label className="block text-xs mb-1" style={{ color: 'var(--muted)' }}>Name</label>
            <input type="text" placeholder="Anna R." value={newGuest.name}
              onChange={e => setNewGuest(g => ({ ...g, name: e.target.value }))}
              className="input" style={{ width: 130 }} />
          </div>
          <div>
            <label className="block text-xs mb-1" style={{ color: 'var(--muted)' }}>Guest of</label>
            <select value={newGuest.guestOfStudentId}
              onChange={e => setNewGuest(g => ({ ...g, guestOfStudentId: e.target.value }))}
              className="input" style={{ width: 170 }}>
              <option value="">— standalone —</option>
              {studentsWithHeats.map(s => (
                <option key={s.id} value={String(s.id)}>{s.firstName} {s.lastName}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs mb-1" style={{ color: 'var(--muted)' }}>Tickets</label>
            <input type="number" min={1} value={newGuest.lunchTickets}
              onChange={e => setNewGuest(g => ({ ...g, lunchTickets: parseInt(e.target.value) || 1 }))}
              className="input" style={{ width: 56 }} />
          </div>
          <button
            disabled={!newGuest.name.trim() || pending}
            onClick={() => {
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
            style={{ backgroundColor: 'var(--accent)', color: 'white', borderRadius: 4, opacity: !newGuest.name.trim() || pending ? 0.5 : 1 }}
          >
            Add Lunch Guest
          </button>
        </div>
      </div>
    </div>
  )
}
