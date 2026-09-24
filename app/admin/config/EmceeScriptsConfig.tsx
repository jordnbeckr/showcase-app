'use client'

import { setHeatScript } from '@/app/actions/admin'
import { useState, useTransition } from 'react'

type HeatItem = {
  number: number
  dance: string
  eventName: string | null
}

export default function EmceeScriptsConfig({
  heats,
  initialScripts,
}: {
  heats: HeatItem[]
  initialScripts: { heatNumber: number; script: string }[]
}) {
  const scriptMap = new Map(initialScripts.map(s => [s.heatNumber, s.script]))
  const [drafts, setDrafts] = useState<Record<number, string>>(() => {
    const m: Record<number, string> = {}
    for (const s of initialScripts) m[s.heatNumber] = s.script
    return m
  })
  const [saved, setSaved] = useState<Set<number>>(new Set())
  const [, startTransition] = useTransition()

  function handleSave(heatNumber: number) {
    const fd = new FormData()
    fd.set('heatNumber', String(heatNumber))
    fd.set('script', drafts[heatNumber] ?? '')
    startTransition(async () => {
      await setHeatScript(fd)
      setSaved(prev => new Set([...prev, heatNumber]))
      setTimeout(() => setSaved(prev => { const n = new Set(prev); n.delete(heatNumber); return n }), 1500)
    })
  }

  return (
    <div className="space-y-3">
      <p className="text-xs" style={{ color: 'var(--muted)' }}>
        Write a script for any heat. It will appear on the emcee screen when that heat is selected.
      </p>
      {heats.map(h => {
        const val = drafts[h.number] ?? ''
        const isSaved = saved.has(h.number)
        const hasScript = !!val.trim()
        return (
          <div key={h.number} className="rounded-lg p-3 space-y-2" style={{ border: '1px solid var(--border)', backgroundColor: hasScript ? '#fffbeb' : 'var(--card)' }}>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold" style={{ fontFamily: 'monospace', color: '#555', minWidth: 28 }}>#{h.number}</span>
              <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>{h.dance}</span>
              {h.eventName && <span className="text-xs" style={{ color: 'var(--muted)' }}>· {h.eventName}</span>}
            </div>
            <textarea
              value={val}
              onChange={e => setDrafts(prev => ({ ...prev, [h.number]: e.target.value }))}
              rows={3}
              placeholder="Script for emcee to read…"
              className="w-full text-sm rounded px-3 py-2"
              style={{ border: '1px solid var(--border)', resize: 'vertical', backgroundColor: 'var(--surface)', color: 'var(--text)' }}
            />
            <div className="flex items-center justify-end gap-2">
              {hasScript && (
                <button
                  onClick={() => { setDrafts(prev => ({ ...prev, [h.number]: '' })); setTimeout(() => handleSave(h.number), 0) }}
                  className="text-xs px-3 py-1 rounded"
                  style={{ border: '1px solid #fca5a5', backgroundColor: '#fef2f2', color: '#dc2626' }}
                >
                  Clear
                </button>
              )}
              <button
                onClick={() => handleSave(h.number)}
                className="text-xs px-3 py-1 rounded font-semibold"
                style={{ border: '1px solid #1e3a5f', backgroundColor: '#1e3a5f', color: 'white' }}
              >
                {isSaved ? '✓ Saved' : 'Save'}
              </button>
            </div>
          </div>
        )
      })}
      {heats.length === 0 && (
        <p className="text-sm italic" style={{ color: 'var(--muted)' }}>No heats yet.</p>
      )}
    </div>
  )
}
