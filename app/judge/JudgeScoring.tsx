'use client'

import { useState, useTransition, useCallback } from 'react'
import { setClosedScore, setOpenThumb, setOpenNote, setCompScore, setSemiMark } from '@/app/actions/judge'

type HeatEntry = {
  studentId: number
  studentFirstName: string
  studentLastName: string
  studentRole: string
  studentLeaderNumber: number | null
  instructorId: number | null
  instructorName: string | null
  instructorRole: string | null
  instructorLeaderNumber: number | null
  partnerStudentId: number | null
  partnerFirstName: string | null
  partnerLastName: string | null
}

type Heat = {
  id: number
  number: number
  dance: string
  category: 'none' | 'closed' | 'open'
  eventIds: number[]
  entries: HeatEntry[]
}

type Couple = {
  studentId: number
  leaderNumber: number | null
  personA: string
  personB: string
  personBStudentId: number | null
}

type CompetitiveEvent = {
  id: number
  name: string
  round: string
  finalSize: number
  semiSize: number
  firstHeatNumber: number
  couples: Couple[]
}

type Category = { id: number; name: string }


type Props = {
  judgeId: number
  heats: Heat[]
  competitiveEvents: CompetitiveEvent[]
  categories: Category[]
  initialClosedScores: { heatId: number; studentId: number; placement: string }[]
  initialOpenThumbs: { heatId: number; studentId: number; categoryId: number; sentiment: string }[]
  initialOpenNotes: { heatId: number; studentId: number; note: string }[]
  initialCompScores: { eventId: number; studentId: number; place: number }[]
  initialSemiMarks: { eventId: number; studentId: number; called: boolean }[]
}

function CoupleDisplay({ couple }: { couple: Couple }) {
  return (
    <div className="flex items-baseline gap-3">
      <span style={{ fontSize: '1.5rem', fontWeight: 900, fontFamily: 'monospace', color: '#1e1e1e', minWidth: 48 }}>
        {couple.leaderNumber ?? '—'}
      </span>
      <span style={{ fontSize: '0.9rem', color: '#333' }}>
        {couple.personA}{couple.personB ? ` & ${couple.personB}` : ''}
      </span>
    </div>
  )
}

export default function JudgeScoring({
  heats,
  competitiveEvents,
  categories,
  initialClosedScores,
  initialOpenThumbs,
  initialOpenNotes,
  initialCompScores,
  initialSemiMarks,
}: Props) {
  const [, startTransition] = useTransition()

  // Closed scores: key = `${heatId}-${studentId}` → placement
  const [closedScores, setClosedScoresState] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {}
    for (const s of initialClosedScores) map[`${s.heatId}-${s.studentId}`] = s.placement
    return map
  })

  // Open thumbs: key = `${heatId}-${studentId}-${categoryId}` → sentiment
  const [openThumbs, setOpenThumbsState] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {}
    for (const t of initialOpenThumbs) map[`${t.heatId}-${t.studentId}-${t.categoryId}`] = t.sentiment
    return map
  })

  // Open notes: key = `${heatId}-${studentId}` → note
  const [openNotes, setOpenNotesState] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {}
    for (const n of initialOpenNotes) map[`${n.heatId}-${n.studentId}`] = n.note
    return map
  })

  // Comp scores: key = `${eventId}-${studentId}` → place
  const [compScores, setCompScoresState] = useState<Record<string, number>>(() => {
    const map: Record<string, number> = {}
    for (const s of initialCompScores) map[`${s.eventId}-${s.studentId}`] = s.place
    return map
  })

  // Semi marks: key = `${eventId}-${studentId}` → called
  const [semiMarks, setSemiMarksState] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {}
    for (const m of initialSemiMarks) map[`${m.eventId}-${m.studentId}`] = m.called
    return map
  })

  function handleClosedScore(heatId: number, studentId: number, placement: string) {
    const key = `${heatId}-${studentId}`
    const current = closedScores[key]
    const next = current === placement ? null : placement
    setClosedScoresState(prev => {
      const updated = { ...prev }
      if (next) updated[key] = next
      else delete updated[key]
      return updated
    })
    startTransition(() => setClosedScore(heatId, studentId, next))
  }

  function handleThumb(heatId: number, studentId: number, categoryId: number, sentiment: 'up' | 'down') {
    const key = `${heatId}-${studentId}-${categoryId}`
    const current = openThumbs[key]
    const next = current === sentiment ? null : (sentiment as string)
    setOpenThumbsState(prev => {
      const updated = { ...prev }
      if (next) updated[key] = next
      else delete updated[key]
      return updated
    })
    startTransition(() => setOpenThumb(heatId, studentId, categoryId, next))
  }

  const handleNote = useCallback((heatId: number, studentId: number, note: string) => {
    setOpenNotesState(prev => ({ ...prev, [`${heatId}-${studentId}`]: note }))
  }, [])

  const saveNote = useCallback((heatId: number, studentId: number, note: string) => {
    startTransition(() => setOpenNote(heatId, studentId, note))
  }, [])

  function handleCompScore(eventId: number, studentId: number, place: number) {
    const key = `${eventId}-${studentId}`
    const current = compScores[key]
    const next = current === place ? null : place
    setCompScoresState(prev => {
      const updated = { ...prev }
      // Remove this place from any other couple in this event
      for (const k of Object.keys(updated)) {
        if (k.startsWith(`${eventId}-`) && updated[k] === place) delete updated[k]
      }
      if (next !== null) updated[key] = next
      else delete updated[key]
      return updated
    })
    startTransition(() => setCompScore(eventId, studentId, next))
  }

  function handleSemiMark(eventId: number, studentId: number) {
    const key = `${eventId}-${studentId}`
    const current = semiMarks[key] ?? false
    const next = !current
    setSemiMarksState(prev => ({ ...prev, [key]: next }))
    startTransition(() => setSemiMark(eventId, studentId, next))
  }

  // Build a set of heatNumbers that belong to competitive events (to suppress individual heat scoring for them)
  const compEventHeatNumbers = new Set<number>()
  for (const evt of competitiveEvents) {
    for (const h of heats) {
      if (h.eventIds.includes(evt.id)) compEventHeatNumbers.add(h.number)
    }
  }

  // Inject competitive event blocks at their first heat position
  type Item = { type: 'heat'; heat: Heat } | { type: 'comp'; event: CompetitiveEvent }
  const items: Item[] = []
  const insertedEventIds = new Set<number>()

  for (const heat of heats) {
    // Insert competitive event block before the first heat of that event
    for (const evt of competitiveEvents) {
      if (!insertedEventIds.has(evt.id) && heat.number === evt.firstHeatNumber) {
        items.push({ type: 'comp', event: evt })
        insertedEventIds.add(evt.id)
      }
    }
    // Skip individual heat rows for heats belonging to a competitive event
    if (!compEventHeatNumbers.has(heat.number)) {
      items.push({ type: 'heat', heat })
    }
  }
  // Append any competitive events with no heats yet
  for (const evt of competitiveEvents) {
    if (!insertedEventIds.has(evt.id)) {
      items.push({ type: 'comp', event: evt })
    }
  }

  return (
    <div className="space-y-3 pb-20">
      <div className="flex items-center gap-3 mb-4">
        <h1 className="text-lg font-bold">Score Sheet</h1>
        <div className="flex gap-2 text-xs">
          <span className="px-2 py-0.5" style={{ backgroundColor: '#fef9c3', border: '1px solid #fde68a', borderRadius: 3, color: '#92400e' }}>Closed</span>
          <span className="px-2 py-0.5" style={{ backgroundColor: '#eff6ff', border: '1px solid #93c5fd', borderRadius: 3, color: '#1d4ed8' }}>Open</span>
          <span className="px-2 py-0.5" style={{ backgroundColor: '#f3e8ff', border: '1px solid #d8b4fe', borderRadius: 3, color: '#6b21a8' }}>Competitive</span>
        </div>
      </div>

      {items.map(item => {
        if (item.type === 'heat') {
          const heat = item.heat
          return (
            <HeatBlock
              key={`heat-${heat.id}`}
              heat={heat}
              categories={categories}
              closedScores={closedScores}
              openThumbs={openThumbs}
              openNotes={openNotes}
              onClosedScore={handleClosedScore}
              onThumb={handleThumb}
              onNoteChange={handleNote}
              onNoteSave={saveNote}
            />
          )
        } else {
          const evt = item.event
          return (
            <CompBlock
              key={`comp-${evt.id}`}
              event={evt}
              compScores={compScores}
              semiMarks={semiMarks}
              onCompScore={handleCompScore}
              onSemiMark={handleSemiMark}
            />
          )
        }
      })}

      {items.length === 0 && (
        <p className="text-sm italic text-center py-12" style={{ color: 'var(--muted)' }}>No heats configured yet.</p>
      )}
    </div>
  )
}

function HeatBlock({
  heat,
  categories,
  closedScores,
  openThumbs,
  openNotes,
  onClosedScore,
  onThumb,
  onNoteChange,
  onNoteSave,
}: {
  heat: Heat
  categories: Category[]
  closedScores: Record<string, string>
  openThumbs: Record<string, string>
  openNotes: Record<string, string>
  onClosedScore: (heatId: number, studentId: number, placement: string) => void
  onThumb: (heatId: number, studentId: number, categoryId: number, sentiment: 'up' | 'down') => void
  onNoteChange: (heatId: number, studentId: number, note: string) => void
  onNoteSave: (heatId: number, studentId: number, note: string) => void
}) {
  const isClosed = heat.category === 'closed'
  const isOpen = heat.category === 'open'
  const isNone = heat.category === 'none'

  const borderColor = isClosed ? '#fde68a' : isOpen ? '#93c5fd' : 'var(--border)'
  const headerBg = isClosed ? '#fef9c3' : isOpen ? '#eff6ff' : 'var(--card)'

  return (
    <div className="rounded-lg overflow-hidden" style={{ border: `1px solid ${borderColor}` }}>
      {/* Header */}
      <div className="px-3 py-1.5 flex items-center gap-2" style={{ backgroundColor: headerBg }}>
        <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.8rem', color: '#555', minWidth: 28 }}>#{heat.number}</span>
        <span className="font-semibold text-sm">{heat.dance}</span>
        {isClosed && <span className="text-xs px-1.5 py-0.5 ml-auto" style={{ backgroundColor: '#fde68a', borderRadius: 3, color: '#92400e', fontWeight: 600 }}>Closed — G/S/B</span>}
        {isOpen && <span className="text-xs px-1.5 py-0.5 ml-auto" style={{ backgroundColor: '#93c5fd', borderRadius: 3, color: '#1d4ed8', fontWeight: 600 }}>Open — Feedback</span>}
        {isNone && <span className="text-xs ml-auto" style={{ color: 'var(--muted)' }}>{heat.entries.length} entr{heat.entries.length === 1 ? 'y' : 'ies'}</span>}
      </div>

      {/* Entries */}
      {!isNone && heat.entries.length > 0 && (
        <div className="divide-y divide-gray-100" style={{ borderTop: `1px solid ${borderColor}` }}>
          {heat.entries.map(entry => (
            <EntryRow
              key={entry.studentId}
              heat={heat}
              entry={entry}
              isClosed={isClosed}
              isOpen={isOpen}
              categories={categories}
              closedScores={closedScores}
              openThumbs={openThumbs}
              openNotes={openNotes}
              onClosedScore={onClosedScore}
              onThumb={onThumb}
              onNoteChange={onNoteChange}
              onNoteSave={onNoteSave}
            />
          ))}
        </div>
      )}

      {isNone && (
        <div className="px-4 py-2" style={{ backgroundColor: 'var(--surface)' }}>
          <span className="text-xs italic" style={{ color: 'var(--muted)' }}>No scoring for this heat</span>
        </div>
      )}
    </div>
  )
}

function getEntryDisplay(entry: HeatEntry): { leaderNumber: number | null; personA: string; personB: string } {
  if (entry.instructorId !== null && entry.instructorName) {
    const instRole = entry.instructorRole ?? 'Neither'
    const stuRole = entry.studentRole
    if (instRole === 'Leader' && stuRole !== 'Leader') {
      return {
        leaderNumber: entry.instructorLeaderNumber,
        personA: entry.instructorName,
        personB: `${entry.studentFirstName} ${entry.studentLastName}`,
      }
    } else {
      return {
        leaderNumber: entry.studentLeaderNumber,
        personA: `${entry.studentFirstName} ${entry.studentLastName}`,
        personB: entry.instructorName,
      }
    }
  } else if (entry.partnerStudentId !== null) {
    return {
      leaderNumber: entry.studentLeaderNumber,
      personA: `${entry.studentFirstName} ${entry.studentLastName}`,
      personB: entry.partnerFirstName ? `${entry.partnerFirstName} ${entry.partnerLastName}` : '?',
    }
  } else {
    return {
      leaderNumber: entry.studentLeaderNumber ?? entry.instructorLeaderNumber,
      personA: `${entry.studentFirstName} ${entry.studentLastName}`,
      personB: '',
    }
  }
}

function EntryRow({
  heat,
  entry,
  isClosed,
  isOpen,
  categories,
  closedScores,
  openThumbs,
  openNotes,
  onClosedScore,
  onThumb,
  onNoteChange,
  onNoteSave,
}: {
  heat: Heat
  entry: HeatEntry
  isClosed: boolean
  isOpen: boolean
  categories: Category[]
  closedScores: Record<string, string>
  openThumbs: Record<string, string>
  openNotes: Record<string, string>
  onClosedScore: (heatId: number, studentId: number, placement: string) => void
  onThumb: (heatId: number, studentId: number, categoryId: number, sentiment: 'up' | 'down') => void
  onNoteChange: (heatId: number, studentId: number, note: string) => void
  onNoteSave: (heatId: number, studentId: number, note: string) => void
}) {
  const display = getEntryDisplay(entry)
  const placement = closedScores[`${heat.id}-${entry.studentId}`]
  const note = openNotes[`${heat.id}-${entry.studentId}`] ?? ''

  const closedColors: Record<string, { bg: string; border: string; text: string; activeBg: string }> = {
    Gold:   { bg: '#fefce8', border: '#fde047', text: '#713f12', activeBg: '#fde047' },
    Silver: { bg: '#f8fafc', border: '#94a3b8', text: '#1e293b', activeBg: '#cbd5e1' },
    Bronze: { bg: '#fff7ed', border: '#fb923c', text: '#7c2d12', activeBg: '#fdba74' },
  }

  if (isClosed) {
    return (
      <div className="px-3 py-2 flex items-center gap-2" style={{ backgroundColor: 'var(--card)' }}>
        <span style={{ fontSize: '0.9rem', fontWeight: 900, fontFamily: 'monospace', color: '#1e1e1e', minWidth: 28, flexShrink: 0 }}>
          {display.leaderNumber ?? '—'}
        </span>
        <span className="text-sm font-medium flex-1" style={{ minWidth: 0 }}>
          {display.personA}{display.personB ? ` & ${display.personB}` : ''}
        </span>
        <div className="flex gap-1 flex-shrink-0">
          {(['Gold', 'Silver', 'Bronze'] as const).map(p => {
            const active = placement === p
            const c = closedColors[p]
            return (
              <button
                key={p}
                onClick={() => onClosedScore(heat.id, entry.studentId, p)}
                className="font-bold"
                style={{
                  width: 28, height: 28,
                  borderRadius: 5,
                  border: `2px solid ${c.border}`,
                  backgroundColor: active ? c.activeBg : c.bg,
                  color: c.text,
                  fontSize: '0.75rem',
                  boxShadow: active ? `0 0 0 2px ${c.border}` : undefined,
                  opacity: active ? 1 : 0.6,
                }}
              >
                {p[0]}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="px-3 py-1.5 flex items-center gap-0" style={{ backgroundColor: 'var(--card)' }}>
      {/* Identity: number + name, fixed width */}
      <div className="flex items-center gap-2 flex-shrink-0" style={{ minWidth: 160, width: 160 }}>
        <span style={{ fontSize: '0.9rem', fontWeight: 900, fontFamily: 'monospace', color: '#1e1e1e', minWidth: 28, flexShrink: 0 }}>
          {display.leaderNumber ?? '—'}
        </span>
        <span className="text-sm font-medium" style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {display.personA}{display.personB ? ` & ${display.personB}` : ''}
        </span>
      </div>

      {/* Categories + note, flush left of identity column */}
      {isOpen && (
        <div className="flex items-center gap-2 flex-1 flex-wrap" style={{ borderLeft: '1px solid var(--border)', paddingLeft: 10 }}>
          {categories.map(cat => {
            const thumbKey = `${heat.id}-${entry.studentId}-${cat.id}`
            const sentiment = openThumbs[thumbKey]
            return (
              <div key={cat.id} className="flex flex-col items-center gap-0.5">
                <span style={{ fontSize: '0.6rem', fontWeight: 600, color: '#555', textTransform: 'uppercase', letterSpacing: '0.02em', lineHeight: 1 }}>{cat.name}</span>
                <div className="flex">
                  <button
                    onClick={() => onThumb(heat.id, entry.studentId, cat.id, 'up')}
                    className="flex items-center justify-center font-bold"
                    style={{
                      width: 22, height: 22,
                      borderRadius: '4px 0 0 4px',
                      border: '1.5px solid',
                      borderColor: sentiment === 'up' ? '#15803d' : '#d1d5db',
                      backgroundColor: sentiment === 'up' ? '#16a34a' : '#f0fdf4',
                      color: sentiment === 'up' ? 'white' : '#15803d',
                      fontSize: '0.65rem',
                    }}
                  >▲</button>
                  <button
                    onClick={() => onThumb(heat.id, entry.studentId, cat.id, 'down')}
                    className="flex items-center justify-center font-bold"
                    style={{
                      width: 22, height: 22,
                      borderRadius: '0 4px 4px 0',
                      border: '1.5px solid',
                      borderLeft: 'none',
                      borderColor: sentiment === 'down' ? '#dc2626' : '#d1d5db',
                      backgroundColor: sentiment === 'down' ? '#dc2626' : '#fff1f2',
                      color: sentiment === 'down' ? 'white' : '#dc2626',
                      fontSize: '0.65rem',
                    }}
                  >▼</button>
                </div>
              </div>
            )
          })}
          <textarea
            value={note}
            onChange={e => onNoteChange(heat.id, entry.studentId, e.target.value)}
            onBlur={e => onNoteSave(heat.id, entry.studentId, e.target.value)}
            placeholder="Notes…"
            rows={1}
            className="text-xs rounded px-2 py-0.5"
            style={{ border: '1px solid var(--border)', resize: 'none', backgroundColor: 'var(--surface)', flex: '1 1 80px', minWidth: 60 }}
          />
        </div>
      )}
    </div>
  )
}

function CompBlock({
  event,
  compScores,
  semiMarks,
  onCompScore,
  onSemiMark,
}: {
  event: CompetitiveEvent
  compScores: Record<string, number>
  semiMarks: Record<string, boolean>
  onCompScore: (eventId: number, studentId: number, place: number) => void
  onSemiMark: (eventId: number, studentId: number) => void
}) {
  const isSemi = event.round === 'semifinal'
  const maxPlace = isSemi ? event.semiSize : event.finalSize

  return (
    <div className="rounded-lg overflow-hidden" style={{ border: '2px solid #d8b4fe' }}>
      {/* Header */}
      <div className="px-4 py-2.5 flex items-center gap-3" style={{ backgroundColor: '#f3e8ff' }}>
        <span className="font-bold text-sm" style={{ color: '#6b21a8' }}>◆ {event.name}</span>
        <span className="text-xs px-2 py-0.5 ml-auto font-semibold" style={{ backgroundColor: isSemi ? '#fde68a' : '#d8b4fe', borderRadius: 3, color: isSemi ? '#92400e' : '#6b21a8' }}>
          {isSemi ? `Semifinal — mark ${event.semiSize} callbacks` : `Final — place 1–${event.finalSize}`}
        </span>
      </div>

      {/* Couples */}
      <div className="divide-y" style={{ borderTop: '1px solid #e9d5ff' }}>
        {event.couples.map(couple => {
          const scoreKey = `${event.id}-${couple.studentId}`
          const myPlace = compScores[scoreKey]
          const myMark = semiMarks[scoreKey] ?? false

          return (
            <div key={couple.studentId} className="px-3 py-1.5 flex items-center gap-2" style={{ backgroundColor: 'var(--card)', minHeight: 40 }}>
              <span style={{ fontSize: '1rem', fontWeight: 900, fontFamily: 'monospace', color: '#1e1e1e', minWidth: 36, flexShrink: 0 }}>
                {couple.leaderNumber ?? '—'}
              </span>
              <span className="text-sm font-medium truncate" style={{ minWidth: 0, flex: '1 1 120px' }}>
                {couple.personA}{couple.personB ? ` & ${couple.personB}` : ''}
              </span>
              <div className="flex gap-1.5 flex-wrap flex-shrink-0 justify-start">
                  {isSemi ? (
                    <button
                      onClick={() => onSemiMark(event.id, couple.studentId)}
                      className="px-4 py-1.5 text-sm font-semibold"
                      style={{
                        borderRadius: 6,
                        border: '2px solid',
                        borderColor: myMark ? '#16a34a' : 'var(--border)',
                        backgroundColor: myMark ? '#dcfce7' : 'transparent',
                        color: myMark ? '#14532d' : 'var(--muted)',
                        minWidth: 80,
                      }}
                    >
                      {myMark ? '✓ Called' : 'Call back'}
                    </button>
                  ) : (
                    Array.from({ length: event.finalSize }, (_, i) => i + 1).map(place => {
                      const active = myPlace === place
                      return (
                        <button
                          key={place}
                          onClick={() => onCompScore(event.id, couple.studentId, place)}
                          className="w-9 h-9 text-sm font-bold"
                          style={{
                            borderRadius: 6,
                            border: '2px solid',
                            borderColor: active ? '#7c3aed' : 'var(--border)',
                            backgroundColor: active ? '#7c3aed' : 'transparent',
                            color: active ? 'white' : 'var(--muted)',
                          }}
                        >
                          {place}
                        </button>
                      )
                    })
                  )}
                </div>
            </div>
          )
        })}
        {event.couples.length === 0 && (
          <div className="px-4 py-3 text-sm italic" style={{ color: 'var(--muted)' }}>No couples enrolled yet</div>
        )}
      </div>
    </div>
  )
}
