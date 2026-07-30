'use client'

import { addStudio, addInstructor, removeInstructor, renameInstructor, updateStudioPassword, deleteStudio, addStudentStudioAccess, removeStudentStudioAccess } from '@/app/actions/admin'
import { useTransition, useState, useRef } from 'react'

type Studio = {
  id: number
  name: string
  slug: string
  instructors: { id: number; name: string }[]
  guestStudents: { studentId: number; name: string; homeStudio: string }[]
}

type AllStudent = { id: number; name: string; studioId: number; studioName: string }

export default function StudiosConfig({ studios, allStudents }: { studios: Studio[]; allStudents: AllStudent[] }) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<number | null>(null)
  const [editingInstructorId, setEditingInstructorId] = useState<number | null>(null)
  const [editingName, setEditingName] = useState('')
  const editInputRef = useRef<HTMLInputElement>(null)

  function handleAddInstructor(studioId: number) {
    return (formData: FormData) => {
      startTransition(async () => {
        const result = await addInstructor(studioId, formData)
        if (result?.error) setError(result.error)
      })
    }
  }

  function handleUpdatePassword(studioId: number) {
    return (formData: FormData) => {
      startTransition(async () => {
        const result = await updateStudioPassword(studioId, formData)
        if (result?.error) setError(result.error)
      })
    }
  }

  function handleAddStudio(formData: FormData) {
    startTransition(async () => {
      const result = await addStudio(formData)
      if (result?.error) setError(result.error)
    })
  }

  function startEditing(inst: { id: number; name: string }) {
    setEditingInstructorId(inst.id)
    setEditingName(inst.name)
    setTimeout(() => editInputRef.current?.select(), 0)
  }

  function commitRename(instructorId: number) {
    const trimmed = editingName.trim()
    if (!trimmed) { setEditingInstructorId(null); return }
    startTransition(async () => {
      const result = await renameInstructor(instructorId, trimmed)
      if (result?.error) setError(result.error)
    })
    setEditingInstructorId(null)
  }

  function handleRemoveInstructor(instructorId: number, name: string) {
    if (!confirm(`Remove instructor "${name}"?`)) return
    startTransition(async () => {
      const result = await removeInstructor(instructorId)
      if (result?.error) setError(result.error)
    })
  }

  function handleDeleteStudio(studioId: number, name: string) {
    if (!confirm(`Delete studio "${name}"?\n\nThis will permanently delete the studio and ALL its students, instructors, and heat entries. This cannot be undone.`)) return
    startTransition(async () => { await deleteStudio(studioId) })
  }

  return (
    <div className="space-y-4">

      {error && (
        <div
          className="text-sm px-3 py-2 flex justify-between"
          style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: 4, color: '#dc2626' }}
        >
          {error}
          <button onClick={() => setError(null)} className="ml-2 font-bold">×</button>
        </div>
      )}

      <div className="card overflow-hidden">
        {studios.map((studio, i) => (
          <div key={studio.id} style={{ borderTop: i > 0 ? '1px solid var(--border)' : undefined }}>
            <div
              className="flex items-center"
              style={{ backgroundColor: expanded === studio.id ? '#f5f5f5' : 'var(--card)' }}
            >
              <button
                className="flex-1 flex items-center gap-3 px-4 py-2.5 text-left"
                onClick={() => setExpanded(expanded === studio.id ? null : studio.id)}
              >
                <span className="font-medium text-sm">{studio.name}</span>
                <span className="text-xs" style={{ color: 'var(--muted)' }}>
                  {studio.instructors.length} instructor{studio.instructors.length !== 1 ? 's' : ''}
                </span>
                <span className="ml-auto text-xs" style={{ color: 'var(--muted)' }}>
                  {expanded === studio.id ? '▾' : '›'}
                </span>
              </button>
              <button
                onClick={() => handleDeleteStudio(studio.id, studio.name)}
                disabled={pending}
                className="px-3 py-2.5 text-xs disabled:opacity-40"
                style={{ color: '#dc2626', borderLeft: '1px solid var(--border)' }}
              >
                Delete
              </button>
            </div>

            {expanded === studio.id && (
              <div className="px-5 pb-4 space-y-4" style={{ backgroundColor: '#f9f9f9', borderTop: '1px solid var(--border)' }}>
                <div className="pt-3">
                  <div className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--muted)' }}>Instructors</div>
                  {studio.instructors.length === 0 && (
                    <p className="text-sm italic" style={{ color: 'var(--muted)' }}>No instructors yet</p>
                  )}
                  {studio.instructors.map(inst => (
                    <div key={inst.id} className="flex items-center justify-between py-1.5 gap-2">
                      {editingInstructorId === inst.id ? (
                        <input
                          ref={editInputRef}
                          value={editingName}
                          onChange={e => setEditingName(e.target.value)}
                          onBlur={() => commitRename(inst.id)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') commitRename(inst.id)
                            if (e.key === 'Escape') setEditingInstructorId(null)
                          }}
                          className="field flex-1 text-sm"
                          style={{ padding: '2px 6px', height: 28 }}
                        />
                      ) : (
                        <button
                          className="text-sm text-left flex-1 hover:underline"
                          style={{ color: 'var(--text)', cursor: 'text' }}
                          onClick={() => startEditing(inst)}
                          title="Click to rename"
                        >
                          {inst.name}
                        </button>
                      )}
                      <button
                        onClick={() => handleRemoveInstructor(inst.id, inst.name)}
                        disabled={pending}
                        className="text-xs disabled:opacity-40 flex-shrink-0"
                        style={{ color: '#dc2626' }}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <form action={handleAddInstructor(studio.id)} className="flex gap-2 mt-2">
                    <input name="name" placeholder="Instructor name…" required className="field flex-1" />
                    <button type="submit" className="text-xs px-3 py-1 text-white" style={{ backgroundColor: '#333', borderRadius: 4 }}>
                      Add
                    </button>
                  </form>
                </div>

                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--muted)' }}>Cross-Studio Students</div>
                  <p className="text-xs mb-2" style={{ color: 'var(--muted)' }}>Students from other studios who can sign up in this studio's login.</p>
                  {studio.guestStudents.length === 0 && (
                    <p className="text-sm italic mb-2" style={{ color: 'var(--muted)' }}>None</p>
                  )}
                  {studio.guestStudents.map(g => (
                    <div key={g.studentId} className="flex items-center justify-between py-1 gap-2">
                      <span className="text-sm">{g.name} <span className="text-xs" style={{ color: 'var(--muted)' }}>({g.homeStudio})</span></span>
                      <button
                        onClick={() => startTransition(async () => { await removeStudentStudioAccess(g.studentId, studio.id) })}
                        disabled={pending}
                        className="text-xs disabled:opacity-40 flex-shrink-0"
                        style={{ color: '#dc2626' }}
                      >Remove</button>
                    </div>
                  ))}
                  <div className="flex gap-2 mt-2">
                    <select
                      className="field flex-1 text-sm"
                      defaultValue=""
                      onChange={e => {
                        const sid = parseInt(e.target.value)
                        if (!sid) return
                        e.target.value = ''
                        startTransition(async () => {
                          const result = await addStudentStudioAccess(sid, studio.id)
                          if (result?.error) setError(result.error)
                        })
                      }}
                    >
                      <option value="">Add student from another studio…</option>
                      {allStudents
                        .filter(s => s.studioId !== studio.id && !studio.guestStudents.some(g => g.studentId === s.id))
                        .map(s => (
                          <option key={s.id} value={s.id}>{s.name} ({s.studioName})</option>
                        ))}
                    </select>
                  </div>
                </div>

                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--muted)' }}>Change Password</div>
                  <form action={handleUpdatePassword(studio.id)} className="flex gap-2">
                    <input name="password" type="text" placeholder="New password…" required className="field flex-1" />
                    <button type="submit" className="text-xs px-3 py-1 text-white" style={{ backgroundColor: '#555', borderRadius: 4 }}>
                      Update
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        ))}

        <div className="px-5 py-4" style={{ borderTop: '1px solid var(--border)', backgroundColor: '#fafafa' }}>
          <div className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--muted)' }}>Add Studio</div>
          <form action={handleAddStudio} className="flex gap-2">
            <input name="name" placeholder="Studio name…" required className="field" style={{ flex: '2 1 0' }} />
            <input name="password" placeholder="Password…" required className="field" style={{ flex: '1 1 0' }} />
            <button type="submit" className="text-sm px-3 py-1.5 font-medium text-white" style={{ backgroundColor: '#333', borderRadius: 4 }}>
              Add
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
