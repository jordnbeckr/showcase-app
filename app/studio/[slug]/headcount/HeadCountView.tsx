'use client'

import { useTransition, useRef } from 'react'
import { addSpectator, removeSpectator } from '@/app/actions/headcount'

type Spectator = { id: number; name: string; guestOf: string | null }

export default function HeadCountView({
  slug,
  studentCount,
  instructorCount,
  heatEntryCount,
  spectators,
}: {
  slug: string
  studentCount: number
  instructorCount: number
  heatEntryCount: number
  spectators: Spectator[]
}) {
  const [pending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)

  function handleAdd(formData: FormData) {
    startTransition(async () => {
      const result = await addSpectator(slug, formData)
      if (!result?.error) formRef.current?.reset()
    })
  }

  function handleRemove(id: number) {
    startTransition(async () => { await removeSpectator(slug, id) })
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
          { label: 'Spectators', value: spectators.length, accent: true },
        ].map(stat => (
          <div key={stat.label} className="card p-4 text-center">
            <div
              className="text-3xl font-bold"
              style={{ color: stat.accent ? 'var(--accent)' : 'var(--text)' }}
            >
              {stat.value}
            </div>
            <div className="text-xs mt-1" style={{ color: 'var(--muted)' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Total head count summary */}
      <div
        className="card p-4 flex items-center justify-between"
        style={{ borderLeft: '4px solid var(--accent)' }}
      >
        <span className="text-sm font-medium" style={{ color: 'var(--muted)' }}>Total Head Count</span>
        <span className="text-2xl font-bold" style={{ color: 'var(--text)' }}>
          {totalParticipants + spectators.length}
          <span className="text-xs font-normal ml-2" style={{ color: 'var(--muted)' }}>
            {totalParticipants} participants + {spectators.length} spectators
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
              <input
                name="name"
                required
                className="input w-full"
                placeholder="Full name"
                disabled={pending}
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs mb-1" style={{ color: 'var(--muted)' }}>Guest Of <span style={{ color: 'var(--muted)' }}>(optional)</span></label>
              <input
                name="guestOf"
                className="input w-full"
                placeholder="Student or instructor name"
                disabled={pending}
              />
            </div>
          </div>
          <div>
            <button
              type="submit"
              disabled={pending}
              className="text-sm font-medium px-4 py-2"
              style={{ backgroundColor: 'var(--accent)', color: 'white', borderRadius: 4, opacity: pending ? 0.6 : 1 }}
            >
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
            <div
              key={s.id}
              className="flex items-center gap-3 px-4 py-2.5"
              style={{ borderTop: i > 0 ? '1px solid var(--border)' : undefined }}
            >
              <div className="flex-1">
                <div className="text-sm font-medium">{s.name}</div>
                {s.guestOf && (
                  <div className="text-xs" style={{ color: 'var(--muted)' }}>Guest of {s.guestOf}</div>
                )}
              </div>
              <button
                onClick={() => handleRemove(s.id)}
                disabled={pending}
                className="text-xs px-2 py-1"
                style={{ color: '#dc2626', opacity: pending ? 0.4 : 1 }}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}

      {spectators.length === 0 && (
        <p className="text-sm text-center py-4" style={{ color: 'var(--muted)' }}>No spectators added yet.</p>
      )}
    </div>
  )
}
