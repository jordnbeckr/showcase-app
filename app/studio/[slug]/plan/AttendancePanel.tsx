'use client'

import { useState, useTransition } from 'react'
import { addAttendanceNote, removeAttendanceNote } from '@/app/actions/attendance'

type Note = { id: number; name: string; status: string; note: string | null }

export default function AttendancePanel({ slug, initial }: { slug: string; initial: Note[] }) {
  const [notes, setNotes] = useState<Note[]>(initial)
  const [name, setName] = useState('')
  const [noteText, setNoteText] = useState('')
  const [pending, startTransition] = useTransition()

  const out = notes.filter(n => n.status === 'out')
  const maybe = notes.filter(n => n.status === 'maybe')

  function add(status: 'out' | 'maybe') {
    if (!name.trim()) return
    const payload = { name: name.trim(), status, note: noteText.trim() || null }
    setName('')
    setNoteText('')
    startTransition(async () => {
      const created = await addAttendanceNote(slug, payload)
      setNotes(prev => [...prev, created])
    })
  }

  function remove(id: number) {
    setNotes(prev => prev.filter(n => n.id !== id))
    startTransition(async () => { await removeAttendanceNote(slug, id) })
  }

  const col: React.CSSProperties = { flex: 1, border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden', minWidth: 0 }
  const head: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', fontSize: '0.78rem', fontWeight: 600 }
  const rowS: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', borderTop: '1px solid var(--border)', fontSize: '0.82rem' }

  return (
    <div style={{ marginTop: 32, borderTop: '1px solid var(--border)', paddingTop: 20 }}>
      <div style={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 12 }}>
        Attendance notes
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        {/* Not going */}
        <div style={col}>
          <div style={{ ...head, background: '#fef2f2', borderBottom: '1px solid #fecaca', color: '#991b1b' }}>
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M3 3l8 8M11 3L3 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            Not going
            {out.length > 0 && <span style={{ marginLeft: 'auto', background: '#fee2e2', color: '#991b1b', fontSize: '0.7rem', padding: '1px 6px', borderRadius: 10, fontWeight: 600 }}>{out.length}</span>}
          </div>
          {out.map(n => (
            <div key={n.id} style={rowS}>
              <span style={{ flex: 1, fontWeight: 500, color: 'var(--text)' }}>{n.name}</span>
              {n.note && <span style={{ fontSize: '0.75rem', color: 'var(--muted)', flex: 2 }}>{n.note}</span>}
              <button onClick={() => remove(n.id)} disabled={pending} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', fontSize: '0.72rem', padding: '2px 4px', opacity: pending ? 0.4 : 1 }}>✕</button>
            </div>
          ))}
          {out.length === 0 && (
            <div style={{ padding: '8px 12px', fontSize: '0.78rem', color: 'var(--muted)' }}>None yet</div>
          )}
        </div>

        {/* Maybe */}
        <div style={col}>
          <div style={{ ...head, background: '#fffbeb', borderBottom: '1px solid #fde68a', color: '#92400e' }}>
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M7 4.5c-.8 0-1.5.6-1.5 1.4 0 .3.1.6.3.8L7 8v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <circle cx="7" cy="10" r=".6" fill="currentColor"/>
            </svg>
            Maybe
            {maybe.length > 0 && <span style={{ marginLeft: 'auto', background: '#fef3c7', color: '#92400e', fontSize: '0.7rem', padding: '1px 6px', borderRadius: 10, fontWeight: 600 }}>{maybe.length}</span>}
          </div>
          {maybe.map(n => (
            <div key={n.id} style={rowS}>
              <span style={{ flex: 1, fontWeight: 500, color: 'var(--text)' }}>{n.name}</span>
              {n.note && <span style={{ fontSize: '0.75rem', color: 'var(--muted)', flex: 2 }}>{n.note}</span>}
              <button onClick={() => remove(n.id)} disabled={pending} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', fontSize: '0.72rem', padding: '2px 4px', opacity: pending ? 0.4 : 1 }}>✕</button>
            </div>
          ))}
          {maybe.length === 0 && (
            <div style={{ padding: '8px 12px', fontSize: '0.78rem', color: 'var(--muted)' }}>None yet</div>
          )}
        </div>
      </div>

      {/* Add row */}
      <div style={{ display: 'flex', gap: 8, marginTop: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Student name…"
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && name.trim()) add('out') }}
          className="input"
          style={{ width: 160 }}
          disabled={pending}
        />
        <input
          type="text"
          placeholder="Note (optional)…"
          value={noteText}
          onChange={e => setNoteText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && name.trim()) add('out') }}
          className="input"
          style={{ flex: 1, minWidth: 140 }}
          disabled={pending}
        />
        <button
          onClick={() => add('out')}
          disabled={!name.trim() || pending}
          style={{ padding: '5px 12px', background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca', borderRadius: 6, fontSize: '0.8rem', fontWeight: 600, cursor: !name.trim() || pending ? 'not-allowed' : 'pointer', opacity: !name.trim() || pending ? 0.5 : 1, whiteSpace: 'nowrap' }}
        >
          + Not going
        </button>
        <button
          onClick={() => add('maybe')}
          disabled={!name.trim() || pending}
          style={{ padding: '5px 12px', background: '#fffbeb', color: '#92400e', border: '1px solid #fde68a', borderRadius: 6, fontSize: '0.8rem', fontWeight: 600, cursor: !name.trim() || pending ? 'not-allowed' : 'pointer', opacity: !name.trim() || pending ? 0.5 : 1, whiteSpace: 'nowrap' }}
        >
          + Maybe
        </button>
      </div>
    </div>
  )
}
