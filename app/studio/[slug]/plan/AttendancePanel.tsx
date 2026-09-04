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

  const rowS: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', borderTop: '1px solid var(--border)', fontSize: '0.82rem' }

  return (
    <div style={{ marginTop: 32 }}>
      {/* Card wrapper */}
      <div style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden', background: 'var(--surface)' }}>
        {/* Card header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--surface2, #f8fafc)', borderBottom: '1px solid var(--border)' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--muted)' }}>
            Attendance notes
          </span>
          <div style={{ display: 'flex', gap: 6 }}>
            {out.length > 0 && <span style={{ background: '#fee2e2', color: '#991b1b', fontSize: '0.72rem', padding: '2px 8px', borderRadius: 10, fontWeight: 600 }}>{out.length} not going</span>}
            {maybe.length > 0 && <span style={{ background: '#fef3c7', color: '#92400e', fontSize: '0.72rem', padding: '2px 8px', borderRadius: 10, fontWeight: 600 }}>{maybe.length} maybe</span>}
          </div>
        </div>

        {/* Two columns */}
        <div style={{ display: 'flex', gap: 0 }}>
          {/* Not going */}
          <div style={{ flex: 1, borderRight: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', background: '#fef2f2', borderBottom: '1px solid #fecaca', fontSize: '0.78rem', fontWeight: 600, color: '#991b1b' }}>
              <svg width="12" height="12" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path d="M3 3l8 8M11 3L3 11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
              Not going
            </div>
            {out.map(n => (
              <div key={n.id} style={rowS}>
                <span style={{ fontWeight: 500, color: 'var(--text)', minWidth: 0, flex: '0 0 auto', maxWidth: '40%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.name}</span>
                {n.note && <span style={{ fontSize: '0.75rem', color: 'var(--muted)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.note}</span>}
                <button onClick={() => remove(n.id)} disabled={pending} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', fontSize: '0.75rem', padding: '2px 4px', marginLeft: 'auto', flexShrink: 0, opacity: pending ? 0.4 : 1 }}>✕</button>
              </div>
            ))}
            {out.length === 0 && <div style={{ padding: '9px 12px', fontSize: '0.78rem', color: 'var(--muted)', fontStyle: 'italic' }}>None yet</div>}
          </div>

          {/* Maybe */}
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', background: '#fffbeb', borderBottom: '1px solid #fde68a', fontSize: '0.78rem', fontWeight: 600, color: '#92400e' }}>
              <svg width="12" height="12" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M5.5 5.5c0-.8.67-1.5 1.5-1.5s1.5.67 1.5 1.5c0 .7-.4 1.1-1 1.5L7 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <circle cx="7" cy="10" r=".6" fill="currentColor"/>
              </svg>
              Maybe
            </div>
            {maybe.map(n => (
              <div key={n.id} style={rowS}>
                <span style={{ fontWeight: 500, color: 'var(--text)', flex: '0 0 auto', maxWidth: '40%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.name}</span>
                {n.note && <span style={{ fontSize: '0.75rem', color: 'var(--muted)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.note}</span>}
                <button onClick={() => remove(n.id)} disabled={pending} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', fontSize: '0.75rem', padding: '2px 4px', marginLeft: 'auto', flexShrink: 0, opacity: pending ? 0.4 : 1 }}>✕</button>
              </div>
            ))}
            {maybe.length === 0 && <div style={{ padding: '9px 12px', fontSize: '0.78rem', color: 'var(--muted)', fontStyle: 'italic' }}>None yet</div>}
          </div>
        </div>

        {/* Add row — integrated inside the card */}
        <div style={{ display: 'flex', gap: 8, padding: '10px 12px', borderTop: '1px solid var(--border)', background: 'var(--surface2, #f8fafc)', alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Student name…"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && name.trim()) add('out') }}
            className="input"
            style={{ width: 155 }}
            disabled={pending}
          />
          <input
            type="text"
            placeholder="Note (optional)…"
            value={noteText}
            onChange={e => setNoteText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && name.trim()) add('out') }}
            className="input"
            style={{ flex: 1, minWidth: 130 }}
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
    </div>
  )
}
