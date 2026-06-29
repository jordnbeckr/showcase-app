'use client'

import { setLeaderNumber, setInstructorLeaderNumber, setInstructorRole, autoAssignLeaderNumbers } from '@/app/actions/admin'
import { useState, useTransition } from 'react'

type Instructor = {
  id: number
  name: string
  studioName: string
  role: string
  leaderNumber: number | null
}

type StudentLeader = {
  id: number
  name: string
  studioName: string
  leaderNumber: number | null
}

function NumberCell({
  entityId,
  leaderNumber,
  onSave,
}: {
  entityId: number
  leaderNumber: number | null
  onSave: (id: number, num: number | null) => void
}) {
  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState('')

  function startEdit() {
    setVal(leaderNumber?.toString() ?? '')
    setEditing(true)
  }

  function save() {
    const num = val.trim() === '' ? null : parseInt(val)
    if (val.trim() !== '' && isNaN(num!)) return
    onSave(entityId, num)
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="flex gap-1 items-center">
        <input
          type="number"
          value={val}
          onChange={e => setVal(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setEditing(false) }}
          autoFocus
          className="field"
          style={{ width: 60, textAlign: 'center', padding: '2px 4px' }}
        />
        <button onClick={save} className="text-xs px-2 py-0.5 text-white" style={{ backgroundColor: '#333', borderRadius: 3 }}>✓</button>
        <button onClick={() => setEditing(false)} className="text-xs" style={{ color: 'var(--muted)' }}>✕</button>
      </div>
    )
  }

  return (
    <div className="flex gap-2 items-center">
      <span style={{ fontWeight: leaderNumber != null ? 700 : 400, color: leaderNumber != null ? 'var(--text)' : 'var(--border)' }}>
        {leaderNumber ?? '—'}
      </span>
      <button onClick={startEdit} className="text-xs" style={{ color: 'var(--muted)' }}>
        {leaderNumber != null ? 'Edit' : 'Assign'}
      </button>
    </div>
  )
}

export default function LeadersManager({
  instructors,
  studentLeaders,
}: {
  instructors: Instructor[]
  studentLeaders: StudentLeader[]
}) {
  const [pending, startTransition] = useTransition()
  const [autoMsg, setAutoMsg] = useState<string | null>(null)

  function saveInstructorNumber(id: number, num: number | null) {
    startTransition(async () => { await setInstructorLeaderNumber(id, num) })
  }

  function saveStudentNumber(id: number, num: number | null) {
    startTransition(async () => { await setLeaderNumber(id, num) })
  }

  function toggleRole(inst: Instructor) {
    const next = inst.role === 'Leader' ? 'Neither' : 'Leader'
    startTransition(async () => { await setInstructorRole(inst.id, next) })
  }

  function handleAutoAssign() {
    const instructorLeaders = instructors.filter(i => i.role === 'Leader')
    if (!confirm(`Auto-assign numbers?\n\nInstructor leaders (${instructorLeaders.length}): 100, 101, … sorted A–Z by last name across all studios\nStudent leaders (${studentLeaders.length}): 200, 201, … sorted A–Z by last name across all studios\n\nThis will overwrite existing numbers.`)) return
    startTransition(async () => {
      await autoAssignLeaderNumbers()
      setAutoMsg('Numbers assigned!')
      setTimeout(() => setAutoMsg(null), 3000)
    })
  }

  const instructorLeaders = [...instructors].sort((a, b) => {
    const aLast = a.name.trim().split(' ').pop() ?? a.name
    const bLast = b.name.trim().split(' ').pop() ?? b.name
    return aLast.localeCompare(bLast)
  })

  const sortedStudents = [...studentLeaders].sort((a, b) => {
    if (a.leaderNumber != null && b.leaderNumber != null) return a.leaderNumber - b.leaderNumber
    if (a.leaderNumber != null) return -1
    if (b.leaderNumber != null) return 1
    return a.name.localeCompare(b.name)
  })

  return (
    <div className="space-y-6">
      {/* Auto-assign */}
      <div className="card px-4 py-3 flex items-center gap-4">
        <div className="flex-1 text-sm" style={{ color: 'var(--muted)' }}>
          Mark instructors as <strong>Leader</strong> below, then auto-assign all numbers alphabetically by last name.
        </div>
        {autoMsg && <span className="text-sm font-medium" style={{ color: '#16a34a' }}>{autoMsg}</span>}
        <button
          onClick={handleAutoAssign}
          disabled={pending}
          className="text-sm px-4 py-1.5 font-medium text-white"
          style={{ backgroundColor: '#2c2c2c', borderRadius: 4 }}
        >
          Auto-Assign All Numbers
        </button>
      </div>

      {/* Instructors table */}
      <div className="card overflow-hidden">
        <div className="px-4 py-2 text-xs font-semibold uppercase tracking-wide" style={{ backgroundColor: '#ebebeb', borderBottom: '1px solid var(--border)', color: '#444' }}>
          Instructors — {instructors.filter(i => i.role === 'Leader').length} marked as Leader
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: 90, textAlign: 'center' }}>Role</th>
              <th>Instructor</th>
              <th>Studio</th>
              <th style={{ width: 130 }}>Leader #</th>
            </tr>
          </thead>
          <tbody>
            {instructorLeaders.map(inst => (
              <tr key={inst.id} style={{ backgroundColor: inst.role === 'Leader' ? '#f6fff6' : undefined }}>
                <td style={{ textAlign: 'center' }}>
                  <button
                    onClick={() => toggleRole(inst)}
                    disabled={pending}
                    className="text-xs px-2 py-0.5 font-medium"
                    style={{
                      backgroundColor: inst.role === 'Leader' ? '#2c2c2c' : 'transparent',
                      color: inst.role === 'Leader' ? 'white' : 'var(--muted)',
                      border: '1px solid',
                      borderColor: inst.role === 'Leader' ? '#2c2c2c' : 'var(--border)',
                      borderRadius: 3,
                    }}
                  >
                    {inst.role === 'Leader' ? 'Leader ✓' : 'Neither'}
                  </button>
                </td>
                <td className="font-medium">{inst.name}</td>
                <td style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>{inst.studioName}</td>
                <td>
                  {inst.role === 'Leader' ? (
                    <NumberCell entityId={inst.id} leaderNumber={inst.leaderNumber} onSave={saveInstructorNumber} />
                  ) : (
                    <span style={{ color: 'var(--border)', fontSize: '0.8rem' }}>—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Student leaders table */}
      <div className="card overflow-hidden">
        <div className="px-4 py-2 text-xs font-semibold uppercase tracking-wide" style={{ backgroundColor: '#ebebeb', borderBottom: '1px solid var(--border)', color: '#444' }}>
          Student Leaders ({studentLeaders.length})
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: 90, textAlign: 'center' }}>#</th>
              <th>Student</th>
              <th>Studio</th>
            </tr>
          </thead>
          <tbody>
            {studentLeaders.length === 0 && (
              <tr><td colSpan={3} style={{ color: 'var(--muted)', fontStyle: 'italic', textAlign: 'center' }}>No students marked as Leader in any studio</td></tr>
            )}
            {sortedStudents.map(s => (
              <tr key={s.id}>
                <td style={{ textAlign: 'center' }}>
                  <NumberCell entityId={s.id} leaderNumber={s.leaderNumber} onSave={saveStudentNumber} />
                </td>
                <td className="font-medium">{s.name}</td>
                <td style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>{s.studioName}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
