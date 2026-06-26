'use client'

import { toggleCheckedIn } from '@/app/actions/admin'
import { useState, useTransition } from 'react'

type Student = {
  id: number
  name: string
  role: string
  studioName: string
  checkedIn: boolean
  leaderNumber: number | null
}

export default function AttendanceManager({ students }: { students: Student[] }) {
  const [pending, startTransition] = useTransition()
  const [filter, setFilter] = useState('')
  const [studioFilter, setStudioFilter] = useState('')

  const studios = [...new Set(students.map(s => s.studioName))].sort()

  const displayed = students.filter(s => {
    if (studioFilter && s.studioName !== studioFilter) return false
    if (filter && !s.name.toLowerCase().includes(filter.toLowerCase())) return false
    return true
  })

  const checkedInCount = displayed.filter(s => s.checkedIn).length

  function handleToggle(id: number) {
    startTransition(() => toggleCheckedIn(id))
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-3 items-end">
        <div>
          <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--muted)' }}>STUDIO</label>
          <select value={studioFilter} onChange={e => setStudioFilter(e.target.value)} className="field" style={{ width: 200 }}>
            <option value="">All Studios</option>
            {studios.map(s => <option key={s} value={s}>{s}</option>)}
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
            {displayed.map(student => (
              <tr
                key={student.id}
                onClick={() => handleToggle(student.id)}
                style={{
                  cursor: 'pointer',
                  backgroundColor: student.checkedIn ? '#f0fff4' : undefined,
                  opacity: pending ? 0.7 : 1,
                }}
                className="hover:bg-gray-50"
              >
                <td style={{ textAlign: 'center', fontSize: '1.1rem' }}>
                  {student.checkedIn ? '✓' : <span style={{ color: 'var(--border)' }}>○</span>}
                </td>
                <td style={{ textAlign: 'center', color: 'var(--muted)', fontWeight: student.leaderNumber ? 700 : 400 }}>
                  {student.leaderNumber ?? '—'}
                </td>
                <td className="font-medium" style={{ textDecoration: student.checkedIn ? 'none' : undefined }}>
                  {student.name}
                </td>
                <td style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>{student.role}</td>
                <td style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>{student.studioName}</td>
              </tr>
            ))}
            {displayed.length === 0 && (
              <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--muted)', fontStyle: 'italic' }}>No students match</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
