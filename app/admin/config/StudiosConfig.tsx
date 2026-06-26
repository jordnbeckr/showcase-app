'use client'

import { addStudio, addInstructor, removeInstructor, updateStudioPassword, deleteStudio } from '@/app/actions/admin'
import { useTransition, useState } from 'react'

type Studio = {
  id: number
  name: string
  slug: string
  instructors: { id: number; name: string }[]
}

export default function StudiosConfig({ studios }: { studios: Studio[] }) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<number | null>(null)

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
                    <div key={inst.id} className="flex items-center justify-between py-1.5">
                      <span className="text-sm">{inst.name}</span>
                      <button
                        onClick={() => handleRemoveInstructor(inst.id, inst.name)}
                        disabled={pending}
                        className="text-xs disabled:opacity-40"
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
