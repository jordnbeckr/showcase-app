'use client'

import { useState, useTransition, useEffect } from 'react'
import { advanceHeat, moveEventToFinals } from './actions'

type HeatRow = {
  number: number
  dance: string
  category: string
  entries: { studentName: string; partnerName: string | null; instructor: string | null; floor: string | null; level: string }[]
  event?: { id: number; name: string; phase: string; callbacks: string[] } | null
  script?: string | null
}

type CompEvent = {
  id: number
  name: string
  phase: string
  heatNumber: number
  callbacks: string[]
  finalPlacements: { place: number; name: string }[]
}

const STORAGE_KEY = 'emcee-done-heats'

function loadDone(): Set<number> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return new Set(JSON.parse(raw) as number[])
  } catch {}
  return new Set()
}

function saveDone(done: Set<number>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...done]))
  } catch {}
}

export default function EmceeClient({
  currentHeatNumber,
  heats,
  compEvents,
}: {
  currentHeatNumber: number
  heats: HeatRow[]
  compEvents: CompEvent[]
}) {
  const [, startTransition] = useTransition()
  const [tab, setTab] = useState<'heats' | 'comp'>('heats')
  const [doneHeats, setDoneHeats] = useState<Set<number>>(new Set())

  useEffect(() => {
    setDoneHeats(loadDone())
  }, [])

  const currentIdx = heats.findIndex(h => h.number === currentHeatNumber)
  const currentHeat = currentIdx >= 0 ? heats[currentIdx] : null
  const nextHeat = currentIdx >= 0 && currentIdx < heats.length - 1 ? heats[currentIdx + 1] : null

  function callHeat(num: number) {
    startTransition(() => { advanceHeat(num) })
  }

  function completeCurrent() {
    if (!currentHeat) return
    // Mark done then advance to next
    setDoneHeats(prev => {
      const next = new Set(prev)
      next.add(currentHeat.number)
      saveDone(next)
      return next
    })
    if (nextHeat) {
      startTransition(() => { advanceHeat(nextHeat.number) })
    }
  }

  function toggleDone(num: number) {
    setDoneHeats(prev => {
      const next = new Set(prev)
      if (next.has(num)) next.delete(num)
      else next.add(num)
      saveDone(next)
      return next
    })
  }

  function triggerFinals(eventId: number) {
    startTransition(() => { moveEventToFinals(eventId) })
  }

  const TAB = 'px-4 py-2 rounded-lg text-sm font-medium transition-colors'

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Tab bar */}
      <div className="flex gap-2 p-1 rounded-xl" style={{ backgroundColor: 'var(--card)' }}>
        <button className={`${TAB} flex-1 ${tab === 'heats' ? 'text-white' : 'text-[var(--muted)]'}`}
          style={tab === 'heats' ? { backgroundColor: '#1e3a5f' } : {}}
          onClick={() => setTab('heats')}>
          Heat Tracker
        </button>
        <button className={`${TAB} flex-1 ${tab === 'comp' ? 'text-white' : 'text-[var(--muted)]'}`}
          style={tab === 'comp' ? { backgroundColor: '#1e3a5f' } : {}}
          onClick={() => setTab('comp')}>
          Competitive Results
        </button>
      </div>

      {tab === 'heats' && (
        <div className="space-y-4">
          {/* Current heat */}
          <div className="card p-6" style={{ border: '2px solid #1e3a5f' }}>
            <div className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--muted)' }}>
              Now Announcing
            </div>
            {currentHeat ? (
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1 min-w-0">
                  <div className="text-4xl font-bold" style={{ color: 'var(--text)' }}>
                    Heat {currentHeat.number}
                  </div>
                  <div className="text-xl" style={{ color: 'var(--muted)' }}>{currentHeat.dance}</div>
                  {currentHeat.event && (
                    <div className="text-sm font-medium pt-1" style={{ color: '#1e3a5f' }}>
                      {currentHeat.event.name}
                      {currentHeat.event.phase === 'final' && (
                        <span className="ml-2 text-xs px-2 py-0.5 rounded-full font-semibold text-white" style={{ backgroundColor: '#16a34a' }}>Final</span>
                      )}
                    </div>
                  )}
                  {currentHeat.script && (
                    <div className="mt-3 p-3 rounded-lg text-sm leading-relaxed" style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a', color: '#78350f', whiteSpace: 'pre-wrap' }}>
                      {currentHeat.script}
                    </div>
                  )}
                </div>
                <button
                  onClick={completeCurrent}
                  title="Mark done and advance"
                  style={{
                    flexShrink: 0,
                    width: 44, height: 44,
                    borderRadius: '50%',
                    border: '2px solid #e2e8f0',
                    backgroundColor: 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'background 0.15s, border-color 0.15s',
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#dcfce7'
                    ;(e.currentTarget as HTMLButtonElement).style.borderColor = '#16a34a'
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'
                    ;(e.currentTarget as HTMLButtonElement).style.borderColor = '#e2e8f0'
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M4 10.5l4 4 8-8" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
            ) : (
              <div className="text-lg" style={{ color: 'var(--muted)' }}>No heat selected</div>
            )}
          </div>

          {/* Next up */}
          {nextHeat && (
            <button
              onClick={() => callHeat(nextHeat.number)}
              className="card p-4 w-full text-left hover:opacity-80 transition-opacity"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--muted)' }}>Next Up</div>
                  <div className="font-semibold" style={{ color: 'var(--text)' }}>
                    Heat {nextHeat.number} — {nextHeat.dance}
                  </div>
                  {nextHeat.event && (
                    <div className="text-sm" style={{ color: '#1e3a5f' }}>{nextHeat.event.name}</div>
                  )}
                </div>
                <span className="text-lg font-medium" style={{ color: '#1e3a5f' }}>→</span>
              </div>
            </button>
          )}

          {/* All heats */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--muted)' }}>All Heats</p>
            <div className="space-y-1">
              {heats.map(h => {
                const isCurrent = h.number === currentHeatNumber
                const isDone = doneHeats.has(h.number)

                if (isDone) {
                  // Collapsed done strip
                  return (
                    <div
                      key={h.number}
                      className="flex items-center justify-between rounded-md"
                      style={{
                        padding: '3px 8px',
                        backgroundColor: 'var(--surface)',
                        opacity: 0.6,
                      }}
                    >
                      <span
                        className="text-xs cursor-pointer flex-1"
                        style={{ color: 'var(--muted)', fontVariantNumeric: 'tabular-nums' }}
                        onClick={() => callHeat(h.number)}
                      >
                        {h.number} — {h.dance}
                        {h.event && <span className="ml-1" style={{ color: 'var(--muted)' }}>· {h.event.name}</span>}
                      </span>
                      <button
                        onClick={e => { e.stopPropagation(); toggleDone(h.number) }}
                        title="Mark undone"
                        style={{
                          width: 18, height: 18,
                          borderRadius: '50%',
                          backgroundColor: '#dcfce7',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0, border: 'none', cursor: 'pointer',
                        }}
                      >
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                          <path d="M2 5.5l2 2 4-4" stroke="#16a34a" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                    </div>
                  )
                }

                // Normal row
                return (
                  <div
                    key={h.number}
                    className="flex items-center gap-2 rounded-lg text-sm transition-colors"
                    style={{
                      backgroundColor: isCurrent ? '#1e3a5f' : 'var(--card)',
                      color: isCurrent ? 'white' : 'var(--text)',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    <button
                      onClick={() => callHeat(h.number)}
                      className="flex items-center gap-2 flex-1 text-left"
                      style={{ padding: '7px 8px', minWidth: 0 }}
                    >
                      <span className="font-semibold" style={{ minWidth: 24 }}>{h.number}</span>
                      <span style={{ color: isCurrent ? 'rgba(255,255,255,0.75)' : 'var(--muted)', fontSize: '0.8125rem', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {h.dance}
                        {h.event && (
                          <span style={{ color: isCurrent ? 'rgba(255,255,255,0.5)' : 'var(--muted)' }}>
                            {' '}· {h.event.name}{h.event.phase === 'final' ? ' (Final)' : ''}
                          </span>
                        )}
                      </span>
                      {h.script && (
                        <span title="Has script" style={{ fontSize: '0.65rem', flexShrink: 0, color: isCurrent ? 'rgba(255,255,255,0.6)' : '#d97706' }}>📝</span>
                      )}
                      <span style={{ color: isCurrent ? 'rgba(255,255,255,0.45)' : 'var(--muted)', fontSize: '0.75rem', flexShrink: 0 }}>
                        {h.entries.length}
                      </span>
                    </button>
                    {!isCurrent && (
                      <button
                        onClick={() => toggleDone(h.number)}
                        title="Mark done"
                        style={{
                          width: 18, height: 18, marginRight: 8,
                          borderRadius: '50%',
                          border: '1.5px solid var(--border)',
                          backgroundColor: 'transparent',
                          flexShrink: 0, cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                      />
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {tab === 'comp' && (
        <div className="space-y-4">
          {compEvents.length === 0 && (
            <div className="card p-5 text-center" style={{ color: 'var(--muted)' }}>No competitive events configured.</div>
          )}
          {compEvents.map(ev => (
            <div key={ev.id} className="card p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold" style={{ color: 'var(--text)' }}>{ev.name}</div>
                  <div className="text-xs" style={{ color: 'var(--muted)' }}>Heat {ev.heatNumber}</div>
                </div>
                <span className="text-xs px-2 py-1 rounded-full font-medium"
                  style={{ backgroundColor: ev.phase === 'final' ? '#dcfce7' : '#fef9c3', color: ev.phase === 'final' ? '#16a34a' : '#a16207' }}>
                  {ev.phase === 'semi' ? 'Semi' : 'Final'}
                </span>
              </div>

              {ev.phase === 'semi' && ev.callbacks.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>
                    Callbacks ({ev.callbacks.length})
                  </p>
                  <ul className="space-y-1">
                    {ev.callbacks.map((label, i) => (
                      <li key={i} className="text-sm py-1.5 px-3 rounded" style={{ backgroundColor: 'var(--surface)', color: 'var(--text)' }}>
                        {label}
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => triggerFinals(ev.id)}
                    className="w-full mt-2 py-2 rounded-lg text-sm font-semibold text-white"
                    style={{ backgroundColor: '#16a34a' }}
                  >
                    Announce Callbacks — Move to Finals
                  </button>
                </div>
              )}

              {ev.phase === 'semi' && ev.callbacks.length === 0 && (
                <p className="text-sm" style={{ color: 'var(--muted)' }}>Judges are still marking callbacks.</p>
              )}

              {ev.phase === 'final' && ev.finalPlacements.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>
                    Final Results
                  </p>
                  <ul className="space-y-1">
                    {ev.finalPlacements.map(p => (
                      <li key={p.place} className="flex items-center gap-3 text-sm py-1.5 px-3 rounded" style={{ backgroundColor: 'var(--surface)' }}>
                        <span className="font-bold w-5 text-center" style={{ color: p.place === 1 ? '#d97706' : 'var(--muted)' }}>{p.place}</span>
                        <span style={{ color: 'var(--text)' }}>{p.name}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {ev.phase === 'final' && ev.finalPlacements.length === 0 && (
                <p className="text-sm" style={{ color: 'var(--muted)' }}>Judges are finalizing placements.</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
