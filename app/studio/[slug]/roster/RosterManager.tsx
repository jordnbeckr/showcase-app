'use client'

import { addStudent, deleteStudent, updateStudent } from '@/app/actions/studio'
import { useTransition, useState } from 'react'

type Student = { id: number; firstName: string; lastName: string; role: string }

export default function RosterManager({ slug, students }: { slug: string; students: Student[] }) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleAddStudent(formData: FormData) {
    startTransition(async () => {
      const result = await addStudent(slug, formData)
      if (result?.error) setError(result.error)
    })
  }

  function handleToggleRole(student: Student) {
    const newRole = student.role === 'Leader' ? 'Follower' : 'Leader'
    const fd = new FormData()
    fd.set('firstName', student.firstName)
    fd.set('lastName', student.lastName)
    fd.set('role', newRole)
    startTransition(async () => {
      const result = await updateStudent(slug, student.id, fd)
      if (result?.error) setError(result.error)
    })
  }

  function handleDelete(studentId: number, name: string) {
    if (!confirm(`Remove ${name}? This will also remove all their heat entries.`)) return
    startTransition(async () => {
      const result = await deleteStudent(slug, studentId)
      if (result?.error) setError(result.error)
    })
  }

  const leaders = students.filter(s => s.role === 'Leader')
  const followers = students.filter(s => s.role === 'Follower')

  return (
    <div className="space-y-4">
      {error && (
        <div
          className="text-sm px-3 py-2 flex justify-between"
          style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: 4, color: '#dc2626' }}
        >
          {error}
          <button onClick={() => setError(null)} className="font-bold">×</button>
        </div>
      )}

      <div className="card p-4">
        <h3 className="font-semibold text-sm mb-3">Add Student</h3>
        <form action={handleAddStudent} className="space-y-3">
          <div className="flex gap-2">
            <input name="firstName" placeholder="First name" required className="field flex-1" />
            <input name="lastName" placeholder="Last name" required className="field flex-1" />
          </div>
          <div className="flex gap-2">
            <select name="role" required className="field flex-1">
              <option value="">Role…</option>
              <option value="Leader">Leader</option>
              <option value="Follower">Follower</option>
            </select>
            <button
              type="submit"
              disabled={pending}
              className="px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              style={{ backgroundColor: '#333', borderRadius: 4 }}
            >
              Add
            </button>
          </div>
        </form>
      </div>

      {(['Leader', 'Follower'] as const).map(role => {
        const group = role === 'Leader' ? leaders : followers
        return (
          <div key={role} className="card overflow-hidden">
            <div
              className="px-4 py-2 text-xs font-semibold uppercase tracking-wide"
              style={{ backgroundColor: '#ebebeb', borderBottom: '1px solid var(--border)', color: '#444' }}
            >
              {role}s ({group.length})
            </div>
            {group.length === 0 && (
              <p className="px-4 py-3 text-sm italic" style={{ color: 'var(--muted)' }}>No {role.toLowerCase()}s yet</p>
            )}
            {group.map((s, i) => (
              <div
                key={s.id}
                className="flex items-center px-4 py-2"
                style={{ borderTop: i > 0 ? '1px solid var(--border)' : undefined }}
              >
                <span className="flex-1 text-sm">{s.firstName} {s.lastName}</span>
                <button
                  onClick={() => handleToggleRole(s)}
                  disabled={pending}
                  className="text-xs px-2 py-0.5 mr-3 disabled:opacity-40"
                  style={{ border: '1px solid var(--border)', borderRadius: 3, color: 'var(--muted)' }}
                  title={`Switch to ${s.role === 'Leader' ? 'Follower' : 'Leader'}`}
                >
                  → {s.role === 'Leader' ? 'Follower' : 'Leader'}
                </button>
                <button
                  onClick={() => handleDelete(s.id, `${s.firstName} ${s.lastName}`)}
                  disabled={pending}
                  className="text-xs disabled:opacity-40"
                  style={{ color: '#dc2626' }}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )
      })}

    </div>
  )
}
