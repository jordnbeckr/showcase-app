'use client'

import { useTransition, useState, useRef } from 'react'
import { moveHeatEntry } from '@/app/actions/admin'

type Instructor = { id: number; name: string }
type Studio = { id: number; name: string; instructors: Instructor[] }
type Entry = {
  id: number
  studentId: number
  studentName: string
  instructorId: number | null
  instructorName: string | null
}
type Heat = {
  id: number
  number: number
  dance: string
  max: number
  entries: Entry[]
}
type EventInfo = {
  id: number
  name: string
  heatIds: number[]
  studentIds: number[]
}

type Props = {
  heats: Heat[]
  studios: Studio[]
  events?: EventInfo[]
}

function getAllInstructors(studios: Studio[]): Instructor[] {
  const seen = new Set<number>()
  const list: Instructor[] = []
  for (const s of studios) {
    for (const i of s.instructors) {
      if (!seen.has(i.id)) { seen.add(i.id); list.push(i) }
    }
  }
  return list
}

const BTB_COLOR = '#c47a20'

// Stable palette for event labels
const EVENT_COLORS = [
  { bg: '#eff6ff', border: '#3b82f6', text: '#1d4ed8' },
  { bg: '#f0fdf4', border: '#22c55e', text: '#15803d' },
  { bg: '#fdf4ff', border: '#a855f7', text: '#7e22ce' },
  { bg: '#fff7ed', border: '#f97316', text: '#c2410c' },
  { bg: '#fef2f2', border: '#ef4444', text: '#b91c1c' },
  { bg: '#f0fdfa', border: '#14b8a6', text: '#0f766e' },
]

function isBTBEntry(entry: Entry, heat: Heat, heats: Heat[]): boolean {
  if (entry.instructorId == null) return false
  const byNum = new Map(heats.map(h => [h.number, h]))
  return !!(
    byNum.get(heat.number - 1)?.entries.some(e => e.studentId === entry.studentId && e.instructorId === entry.instructorId) ||
    byNum.get(heat.number + 1)?.entries.some(e => e.studentId === entry.studentId && e.instructorId === entry.instructorId)
  )
}

function getBTBDir(entry: Entry, heat: Heat, heats: Heat[]): 'prev' | 'next' | 'both' | null {
  if (entry.instructorId == null) return null
  const byNum = new Map(heats.map(h => [h.number, h]))
  const hasPrev = byNum.get(heat.number - 1)?.entries.some(e => e.studentId === entry.studentId && e.instructorId === entry.instructorId)
  const hasNext = byNum.get(heat.number + 1)?.entries.some(e => e.studentId === entry.studentId && e.instructorId === entry.instructorId)
  if (hasPrev && hasNext) return 'both'
  if (hasPrev) return 'prev'
  if (hasNext) return 'next'
  return null
}

function heatStatus(count: number, max: number) {
  if (count >= max)                    return { color: '#dc2626', bg: '#fef2f2' }
  if (count >= Math.floor(max * 0.75)) return { color: '#ea580c', bg: '#fff7ed' }
  if (count >= Math.floor(max / 2))    return { color: '#d97706', bg: '#fffbeb' }
  return                                      { color: '#16a34a', bg: '#f0fdf4' }
}

function renderChips(
  entries: Entry[],
  heat: Heat,
  heats: Heat[],
  dragRef: React.MutableRefObject<{ entryId: number; fromHeatId: number } | null>,
  setDragOver: (v: { heatId: number; instrId: number | null } | null) => void,
) {
  return entries.map(entry => {
    const btb = isBTBEntry(entry, heat, heats)
    const btbDir = btb ? getBTBDir(entry, heat, heats) : null
    return (
      <span
        key={entry.id}
        draggable
        onDragStart={() => { dragRef.current = { entryId: entry.id, fromHeatId: heat.id } }}
        onDragEnd={() => { dragRef.current = null; setDragOver(null) }}
        style={{
          display: 'inline-block',
          verticalAlign: 'middle',
          padding: '1px 7px',
          margin: '1px 2px 1px 0',
          borderRadius: 10,
          background: btb ? BTB_COLOR + '18' : 'var(--card, #fff)',
          border: `1px solid ${btb ? BTB_COLOR : 'var(--border, #d4d9e0)'}`,
          borderLeft: btb ? `3px solid ${BTB_COLOR}` : undefined,
          paddingLeft: btb ? 5 : undefined,
          fontSize: '0.7rem',
          fontWeight: 500,
          cursor: 'grab',
          userSelect: 'none' as const,
          whiteSpace: 'nowrap' as const,
          lineHeight: 1.6,
        }}
        title={btbDir ? `Back-to-back: also in H${btbDir === 'prev' ? heat.number - 1 : btbDir === 'next' ? heat.number + 1 : `${heat.number - 1} + ${heat.number + 1}`}` : undefined}
      >
        {entry.studentName}
        {btbDir && (
          <span style={{ marginLeft: 3, fontWeight: 700, color: BTB_COLOR, fontSize: '0.65rem' }}>
            {btbDir === 'both' ? '↕' : btbDir === 'next' ? '↓' : '↑'}
          </span>
        )}
      </span>
    )
  })
}

export default function HeatRebalancer({ heats: initialHeats, studios, events = [] }: Props) {
  const [heats, setHeats] = useState(initialHeats)
  const [pending, startTransition] = useTransition()
  const dragRef = useRef<{ entryId: number; fromHeatId: number } | null>(null)
  const [dragOver, setDragOver] = useState<{ heatId: number; instrId: number | null } | null>(null)
  const [danceFilter, setDanceFilter] = useState<string>('All')

  const instructors = getAllInstructors(studios)
  // Unified column list: instructor IDs + null sentinel for unassigned
  const columns: (number | null)[] = [...instructors.map(i => i.id), null]
  const dances = ['All', ...Array.from(new Set(initialHeats.map(h => h.dance))).sort()]
  const visibleHeats = danceFilter === 'All' ? heats : heats.filter(h => h.dance === danceFilter)

  // Build a map: heatId → event (only multi-heat events)
  const multiHeatEvents = events.filter(e => e.heatIds.length > 1)
  const heatEventMap = new Map<number, { event: EventInfo; colorIdx: number }>()
  multiHeatEvents.forEach((ev, idx) => {
    ev.heatIds.forEach(hid => heatEventMap.set(hid, { event: ev, colorIdx: idx % EVENT_COLORS.length }))
  })

  const handleDrop = (toHeatId: number, toInstrId: number | null) => {
    const drag = dragRef.current
    if (!drag || drag.fromHeatId === toHeatId) return
    dragRef.current = null
    setDragOver(null)
    setHeats(prev => prev.map(h => ({
      ...h,
      entries: h.entries
        .filter(e => !(e.id === drag.entryId && h.id === drag.fromHeatId))
        .concat(
          h.id === toHeatId
            ? prev.find(x => x.id === drag.fromHeatId)!.entries
                .filter(e => e.id === drag.entryId)
                .map(e => ({ ...e, ...(toInstrId !== null ? { instructorId: toInstrId } : {}) }))
            : []
        ),
    })))
    startTransition(async () => { await moveHeatEntry(drag.entryId, toHeatId) })
  }

  return (
    <div>
      {/* Dance filter */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
        {dances.map(d => (
          <button key={d} onClick={() => setDanceFilter(d)} style={{
            fontSize: '0.78rem', fontWeight: 500, padding: '3px 10px', borderRadius: 6,
            border: '1px solid var(--border)', cursor: 'pointer',
            background: danceFilter === d ? 'var(--ink, #1a2438)' : 'var(--card, #fff)',
            color: danceFilter === d ? 'var(--page, #fff)' : 'var(--muted, #5a6470)',
          }}>{d}</button>
        ))}
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{
          borderCollapse: 'collapse',
          minWidth: `${120 + columns.length * 130}px`,
          fontSize: '0.78rem',
          opacity: pending ? 0.75 : 1,
          transition: 'opacity .15s',
        }}>
          <thead>
            <tr>
              <th style={TH_HEAT}>Heat</th>
              {instructors.map(i => <th key={i.id} style={TH_INSTR}>{i.name}</th>)}
              <th style={TH_INSTR}>—</th>
            </tr>
          </thead>
          <tbody>
            {visibleHeats.map(heat => {
              const count = heat.entries.length
              const status = heatStatus(count, heat.max)
              const ev = heatEventMap.get(heat.id)
              const evColor = ev ? EVENT_COLORS[ev.colorIdx] : null

              return (
                <tr key={heat.id} style={evColor ? { borderLeft: `4px solid ${evColor.border}` } : undefined}>
                  <td style={{ ...TD_HEAT_LABEL, borderLeft: evColor ? `4px solid ${evColor.border}` : undefined }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.82rem' }}>H{heat.number}</span>
                      <span style={{ color: 'var(--muted)', fontSize: '0.72rem' }}>{heat.dance}</span>
                      <span style={{
                        fontSize: '0.68rem', fontWeight: 600, padding: '1px 5px', borderRadius: 9,
                        background: status.bg, color: status.color,
                      }}>{count}</span>
                    </div>
                    {evColor && (
                      <div style={{
                        fontSize: '0.65rem', fontWeight: 600, marginTop: 2,
                        color: evColor.text, whiteSpace: 'nowrap',
                      }}>{ev!.event.name}</div>
                    )}
                  </td>

                  {columns.map(instrId => {
                    const cellEntries = heat.entries.filter(e =>
                      instrId === null ? e.instructorId == null : e.instructorId === instrId
                    )
                    const isOver = dragOver?.heatId === heat.id && dragOver?.instrId === instrId
                    return (
                      <td
                        key={instrId ?? 'unassigned'}
                        style={{
                          ...TD_CELL,
                          background: isOver ? 'var(--drag-bg, #e8f0fe)' : undefined,
                          outline: isOver ? '2px solid var(--accent)' : undefined,
                          outlineOffset: -2,
                        }}
                        onDragOver={e => { e.preventDefault(); setDragOver({ heatId: heat.id, instrId }) }}
                        onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOver(null) }}
                        onDrop={() => handleDrop(heat.id, instrId)}
                      >
                        {renderChips(cellEntries, heat, heats, dragRef, setDragOver)}
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

const TH_HEAT: React.CSSProperties = {
  padding: '6px 10px',
  textAlign: 'left',
  fontWeight: 600,
  fontSize: '0.72rem',
  textTransform: 'uppercase',
  letterSpacing: '.04em',
  color: 'var(--muted)',
  background: 'var(--card)',
  border: '1px solid var(--border)',
  whiteSpace: 'nowrap',
  position: 'sticky',
  left: 0,
  zIndex: 1,
}

const TH_INSTR: React.CSSProperties = {
  padding: '6px 10px',
  textAlign: 'left',
  fontWeight: 600,
  fontSize: '0.78rem',
  background: 'var(--card)',
  border: '1px solid var(--border)',
  whiteSpace: 'nowrap',
}

const TD_HEAT_LABEL: React.CSSProperties = {
  padding: '4px 8px',
  border: '1px solid var(--border)',
  background: 'var(--card)',
  verticalAlign: 'top',
  position: 'sticky',
  left: 0,
  zIndex: 1,
}

const TD_CELL: React.CSSProperties = {
  padding: '4px 5px',
  border: '1px solid var(--border)',
  verticalAlign: 'top',
  minWidth: 110,
  transition: 'background .1s',
  lineHeight: 1.8,
}
