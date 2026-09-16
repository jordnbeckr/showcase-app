'use client'

import { useTransition, useState, useEffect } from 'react'
import { setStudioEntriesUnlocked } from '@/app/actions/admin'
import { ENTRY_DEADLINE } from '@/lib/entryDeadline'

type StudioLock = { id: number; name: string; entriesUnlocked: boolean }

export default function EntryLockConfig({ studios }: { studios: StudioLock[] }) {
  const [pending, startTransition] = useTransition()
  const [isPastDeadline, setIsPastDeadline] = useState(false)
  useEffect(() => { setIsPastDeadline(new Date() > ENTRY_DEADLINE) }, [])

  const deadlineStr = ENTRY_DEADLINE.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  const lockedCount = studios.filter(s => !s.entriesUnlocked).length

  return (
    <div className="space-y-2">
      <p className="text-sm" style={{ color: 'var(--muted)' }}>
        Entry deadline: <strong>{deadlineStr}</strong>.{' '}
        {isPastDeadline
          ? `Deadline has passed — ${lockedCount} of ${studios.length} studios are locked.`
          : 'Deadline has not passed yet — all studios can still make entries.'}
      </p>

      {isPastDeadline && (
        <div className="card overflow-hidden">
          {studios.map((studio, i) => (
            <div
              key={studio.id}
              className="flex items-center justify-between px-4 py-2.5"
              style={{ borderTop: i > 0 ? '1px solid var(--border)' : undefined }}
            >
              <div className="flex items-center gap-2">
                <span style={{ fontSize: '0.95rem' }}>{studio.entriesUnlocked ? '🔓' : '🔒'}</span>
                <span className="text-sm font-medium">{studio.name}</span>
                <span className="text-xs" style={{ color: studio.entriesUnlocked ? '#16a34a' : '#dc2626' }}>
                  {studio.entriesUnlocked ? 'Unlocked' : 'Locked'}
                </span>
              </div>
              <button
                disabled={pending}
                onClick={() => startTransition(async () => {
                  await setStudioEntriesUnlocked(studio.id, !studio.entriesUnlocked)
                })}
                className="text-xs px-3 py-1.5 font-semibold disabled:opacity-40"
                style={{
                  borderRadius: 4,
                  backgroundColor: studio.entriesUnlocked ? '#fef2f2' : '#f0fdf4',
                  color: studio.entriesUnlocked ? '#dc2626' : '#16a34a',
                  border: `1px solid ${studio.entriesUnlocked ? '#fca5a5' : '#86efac'}`,
                }}
              >
                {studio.entriesUnlocked ? 'Lock' : 'Unlock'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
