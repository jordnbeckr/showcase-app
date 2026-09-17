'use client'

import { toggleCheckedIn, toggleInstructorCheckedIn } from '@/app/actions/admin'
import { useState, useTransition } from 'react'

type Person = {
  id: number
  name: string
  role: string
  studioName: string
  checkedIn: boolean
  leaderNumber: number | null
}

type Props = {
  students: Person[]
  instructors: Person[]
}

function PersonList({
  people,
  onToggle,
  pending,
}: {
  people: Person[]
  onToggle: (id: number) => void
  pending: boolean
}) {
  const [filter, setFilter] = useState('')
  const [studioFilter, setStudioFilter] = useState('')
  const [roleFilter, setRoleFilter] = useState('')

  const studios = [...new Set(people.map(p => p.studioName))].sort()

  const displayed = people.filter(p => {
    if (studioFilter && p.studioName !== studioFilter) return false
    if (roleFilter && p.role !== roleFilter) return false
    if (filter && !p.name.toLowerCase().includes(filter.toLowerCase())) return false
    return true
  })

  const checkedInCount = displayed.filter(p => p.checkedIn).length

  return (
    <div className="space-y-3">
      <div className="flex gap-3 items-end flex-wrap">
        <div>
          <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--muted)' }}>STUDIO</label>
          <select value={studioFilter} onChange={e => setStudioFilter(e.target.value)} className="field" style={{ width: 200 }}>
            <option value="">All Studios</option>
            {studios.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--muted)' }}>ROLE</label>
          <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="field" style={{ width: 140 }}>
            <option value="">All Roles</option>
            <option value="Leader">Leader</option>
            <option value="Follower">Follower</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--muted)' }}>SEARCH</label>
          <input value={filter} onChange={e => setFilter(e.target.value)} placeholder="Name…" className="field" style={{ width: 180 }} />
        </div>
        <div className="ml-auto text-sm" style={{ color: 'var(--muted)', paddingBottom: 2 }}>
          {checkedInCount} / {displayed.length} checked in
        </div>
      </div>

      <div className="card overflow-hidden">
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: 52, textAlign: 'center' }}>✓</th>
              <th style={{ width: 52, textAlign: 'center' }}>#</th>
              <th>Name</th>
              <th style={{ width: 80 }}>Role</th>
              <th>Studio</th>
            </tr>
          </thead>
          <tbody>
            {displayed.map(person => (
              <tr
                key={person.id}
                onClick={() => onToggle(person.id)}
                style={{
                  cursor: 'pointer',
                  backgroundColor: person.checkedIn ? '#f0fff4' : undefined,
                  opacity: pending ? 0.7 : 1,
                }}
                className="hover:bg-gray-50"
              >
                <td style={{ textAlign: 'center', fontSize: '1.1rem' }}>
                  {person.checkedIn ? '✓' : <span style={{ color: 'var(--border)' }}>○</span>}
                </td>
                <td style={{ textAlign: 'center', color: 'var(--muted)', fontWeight: person.leaderNumber ? 700 : 400 }}>
                  {person.leaderNumber ?? '—'}
                </td>
                <td className="font-medium">{person.name}</td>
                <td style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>{person.role}</td>
                <td style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>{person.studioName}</td>
              </tr>
            ))}
            {displayed.length === 0 && (
              <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--muted)', fontStyle: 'italic' }}>No results match</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default function AttendanceManager({ students, instructors }: Props) {
  const [tab, setTab] = useState<'students' | 'instructors'>('students')
  const [pending, startTransition] = useTransition()

  function handleToggleStudent(id: number) {
    startTransition(() => toggleCheckedIn(id))
  }

  function handleToggleInstructor(id: number) {
    startTransition(() => toggleInstructorCheckedIn(id))
  }

  const tabStyle = (active: boolean) => ({
    fontSize: '0.85rem',
    fontWeight: 600,
    padding: '5px 16px',
    borderRadius: 6,
    border: '1px solid var(--border)',
    cursor: 'pointer',
    background: active ? 'var(--ink)' : 'var(--card)',
    color: active ? 'var(--page)' : 'var(--muted)',
  })

  return (
    <div className="space-y-3">
      <div style={{ display: 'flex', gap: 6 }}>
        <button style={tabStyle(tab === 'students')} onClick={() => setTab('students')}>
          Students ({students.filter(s => s.checkedIn).length}/{students.length})
        </button>
        <button style={tabStyle(tab === 'instructors')} onClick={() => setTab('instructors')}>
          Instructors ({instructors.filter(i => i.checkedIn).length}/{instructors.length})
        </button>
      </div>

      {tab === 'students' ? (
        <PersonList people={students} onToggle={handleToggleStudent} pending={pending} />
      ) : (
        <PersonList people={instructors} onToggle={handleToggleInstructor} pending={pending} />
      )}
    </div>
  )
}
