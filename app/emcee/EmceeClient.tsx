'use client'

import { useState, useTransition } from 'react'
import { advanceHeat, moveEventToFinals } from './actions'

type HeatRow = {
  number: number
  dance: string
  category: string
  entries: { studentName: string; partnerName: string | null; instructor: string | null; floor: string | null; level: string }[]
  event?: { id: number; name: string; phase: string; callbacks: string[] } | null
}

type CompEvent = {
  id: number
  name: string
  phase: string
  heatNumber: number
  callbacks: string[]
  finalPlacements: { place: number; name: string }[]
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

  const currentIdx = heats.findIndex(h => h.number === currentHeatNumber)
  const prevHeat = currentIdx > 0 ? heats[currentIdx - 1] : null
  const currentHeat = currentIdx >= 0 ? heats[currentIdx] : null
  const nextHeat = currentIdx >= 0 && currentIdx < heats.length - 1 ? heats[currentIdx + 1] : heats[0] ?? null

  function callHeat(num: number) {
    startTransition(() => { advanceHeat(num) })
  }

  function triggerFinals(eventId: number) {
    startTransition(() => { moveEventToFinals(eventId) })
  }

  const TAB = 'px-4 py-2 rounded-lg text-sm font-medium transition-colors'
  const ACTIVE = 'text-white'
  const INACTIVE = 'text-[var(--muted)]'

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Tab bar */}
      <div className="flex gap-2 p-1 rounded-xl" style={{ backgroundColor: 'var(--card)' }}>
        <button className={`${TAB} flex-1 ${tab === 'heats' ? ACTIVE : INACTIVE}`}
          style={tab === 'heats' ? { backgroundColor: '#1e3a5f' } : {}}
          onClick={() => setTab('heats')}>
          Heat Announcer
        </button>
        <button className={`${TAB} flex-1 ${tab === 'comp' ? ACTIVE : INACTIVE}`}
          style={tab === 'comp' ? { backgroundColor: '#1e3a5f' } : {}}
          onClick={() => setTab('comp')}>
          Competitive Results
        </button>
      </div>

      {tab === 'heats' && (
        <div className="space-y-3">
          {/* Current heat — big */}
          {currentHeat ? (
            <div className="card p-5 space-y-3" style={{ border: '2px solid #1e3a5f' }}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>Now Announcing</span>
                <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: '#1e3a5f22', color: '#1e3a5f' }}>
                  {currentHeat.category === 'closed' ? 'Closed' : currentHeat.category === 'open' ? 'Open' : 'Heat'}
                </span>
              </div>
              <div>
                <div className="text-3xl font-bold" style={{ color: 'var(--text)' }}>Heat {currentHeat.number}</div>
                <div className="text-lg font-medium" style={{ color: 'var(--muted)' }}>{currentHeat.dance}</div>
              </div>
              {currentHeat.event && (
                <div className="text-sm font-medium" style={{ color: '#1e3a5f' }}>Event: {currentHeat.event.name}</div>
              )}
              <div className="space-y-1.5 pt-1">
                {currentHeat.entries.map((e, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <div>
                      <span style={{ color: 'var(--text)' }}>{e.studentName}</span>
                      {e.partnerName && <span style={{ color: 'var(--muted)' }}> & {e.partnerName}</span>}
                      {e.instructor && <span style={{ color: 'var(--muted)' }}> / {e.instructor}</span>}
                      <span className="ml-1.5 text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: 'var(--surface)', color: 'var(--muted)' }}>{e.level}</span>
                    </div>
                    {e.floor && <span className="text-xs font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: 'var(--surface)', color: 'var(--muted)' }}>Floor {e.floor}</span>}
                  </div>
                ))}
                {currentHeat.entries.length === 0 && <p className="text-sm" style={{ color: 'var(--muted)' }}>No entries</p>}
              </div>
            </div>
          ) : (
            <div className="card p-5 text-center" style={{ color: 'var(--muted)' }}>
              No heat selected. Call the first heat below.
            </div>
          )}

          {/* Next up */}
          {nextHeat && nextHeat.number !== currentHeatNumber && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--muted)' }}>Next Up</p>
              <button
                onClick={() => callHeat(nextHeat.number)}
                className="card p-4 w-full text-left hover:opacity-80 transition-opacity"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold" style={{ color: 'var(--text)' }}>Heat {nextHeat.number} — {nextHeat.dance}</div>
                    <div className="text-sm" style={{ color: 'var(--muted)' }}>{nextHeat.entries.length} dancer{nextHeat.entries.length !== 1 ? 's' : ''}</div>
                  </div>
                  <span className="text-sm font-medium" style={{ color: '#1e3a5f' }}>Call →</span>
                </div>
              </button>
            </div>
          )}

          {/* Full heat list */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--muted)' }}>All Heats</p>
            <div className="space-y-1">
              {heats.map(h => (
                <button
                  key={h.number}
                  onClick={() => callHeat(h.number)}
                  className="w-full text-left px-3 py-2 rounded-lg text-sm flex items-center justify-between transition-colors"
                  style={{
                    backgroundColor: h.number === currentHeatNumber ? '#1e3a5f' : 'var(--card)',
                    color: h.number === currentHeatNumber ? 'white' : 'var(--text)',
                    opacity: prevHeat && h.number < currentHeatNumber ? 0.5 : 1,
                  }}
                >
                  <span>Heat {h.number} — {h.dance}</span>
                  <span style={{ color: h.number === currentHeatNumber ? 'rgba(255,255,255,0.7)' : 'var(--muted)', fontSize: '0.75rem' }}>
                    {h.entries.length} entries
                  </span>
                </button>
              ))}
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
                  {ev.phase === 'semi' ? 'Semi — awaiting callbacks' : 'Final'}
                </span>
              </div>

              {ev.phase === 'semi' && ev.callbacks.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>
                    Callbacks ({ev.callbacks.length})
                  </p>
                  <ul className="space-y-1">
                    {ev.callbacks.map((name, i) => (
                      <li key={i} className="text-sm py-1.5 px-3 rounded" style={{ backgroundColor: 'var(--surface)', color: 'var(--text)' }}>
                        {name}
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
