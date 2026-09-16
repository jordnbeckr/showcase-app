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

type Props = {
  heats: Heat[]
  studios: Studio[]
}

// Flat list of every instructor across all studios
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

function isBTBEntry(entry: Entry, heat: Heat, heats: Heat[]): boolean {
  if (entry.instructorId == null) return false
  const heatByNum = new Map(heats.map(h => [h.number, h]))
  return !!(
    heatByNum.get(heat.number - 1)?.entries.some(e => e.studentId === entry.studentId && e.instructorId === entry.instructorId) ||
    heatByNum.get(heat.number + 1)?.entries.some(e => e.studentId === entry.studentId && e.instructorId === entry.instructorId)
  )
}

function getBTBDir(
  entry: Entry,
  heat: Heat,
  heats: Heat[],
): 'prev' | 'next' | 'both' | null {
  if (entry.instructorId == null) return null
  const heatByNum = new Map(heats.map(h => [h.number, h]))
  const hasPrev = heatByNum.get(heat.number - 1)?.entries
    .some(e => e.studentId === entry.studentId && e.instructorId === entry.instructorId)
  const hasNext = heatByNum.get(heat.number + 1)?.entries
    .some(e => e.studentId === entry.studentId && e.instructorId === entry.instructorId)
  if (hasPrev && hasNext) return 'both'
  if (hasPrev) return 'prev'
  if (hasNext) return 'next'
  return null
}

function countLabel(n: number, max: number) {
  if (n >= max * 0.85) return 'over'
  if (n >= max * 0.60) return 'warn'
  if (n <= max * 0.38) return 'good'
  return 'ok'
}

export default function HeatRebalancer({ heats: initialHeats, studios }: Props) {
  const [heats, setHeats] = useState(initialHeats)
  const [pending, startTransition] = useTransition()
  const dragRef = useRef<{ entryId: number; fromHeatId: number } | null>(null)
  const [dragOver, setDragOver] = useState<{ heatId: number; instrId: number | null } | null>(null)

  const instructors = getAllInstructors(studios)

  // Move entry optimistically then persist
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

    startTransition(async () => {
      await moveHeatEntry(drag.entryId, toHeatId)
    })
  }

  const UNCATEGORIZED_ID = -1 // sentinel for "no instructor" column

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{
        borderCollapse: 'collapse',
        minWidth: `${120 + instructors.length * 130}px`,
        fontSize: '0.78rem',
        opacity: pending ? 0.75 : 1,
        transition: 'opacity .15s',
      }}>
        <thead>
          <tr>
            <th style={TH_HEAT}>Heat</th>
            {instructors.map(i => (
              <th key={i.id} style={TH_INSTR}>{i.name}</th>
            ))}
            <th style={TH_INSTR} title="Students with no instructor assigned">—</th>
          </tr>
        </thead>
        <tbody>
          {heats.map(heat => {
            const count = heat.entries.length
            const cc = countLabel(count, heat.max)
            return (
              <tr key={heat.id}>
                <td style={TD_HEAT_LABEL}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.82rem' }}>H{heat.number}</span>
                    <span style={{ color: 'var(--muted)', fontSize: '0.72rem' }}>{heat.dance}</span>
                    <span className={`badge badge-${cc}`}>{count}</span>
                  </div>
                </td>

                {[...instructors.map(i => i.id), UNCATEGORIZED_ID].map(instrId => {
                  const cellEntries = heat.entries.filter(e =>
                    instrId === UNCATEGORIZED_ID ? e.instructorId == null : e.instructorId === instrId
                  )
                  const isOver = dragOver?.heatId === heat.id && dragOver?.instrId === instrId
                  return (
                    <td
                      key={instrId}
                      style={{
                        ...TD_CELL,
                        background: isOver ? 'var(--drag-bg)' : undefined,
                        outline: isOver ? '2px solid var(--accent)' : undefined,
                        outlineOffset: -2,
                      }}
                      onDragOver={e => { e.preventDefault(); setDragOver({ heatId: heat.id, instrId }) }}
                      onDragLeave={e => {
                        if (!e.currentTarget.contains(e.relatedTarget as Node))
                          setDragOver(null)
                      }}
                      onDrop={() => handleDrop(heat.id, instrId === UNCATEGORIZED_ID ? null : instrId)}
                    >
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, alignItems: 'flex-start' }}>
                        {cellEntries.map(entry => {
                          const btb = isBTBEntry(entry, heat, heats)
                          const btbDir = btb ? getBTBDir(entry, heat, heats) : null
                          return (
                            <span
                              key={entry.id}
                              draggable
                              onDragStart={() => { dragRef.current = { entryId: entry.id, fromHeatId: heat.id } }}
                              onDragEnd={() => { dragRef.current = null; setDragOver(null) }}
                              style={{
                                ...CHIP,
                                ...(btb ? {
                                  borderLeft: `3px solid ${BTB_COLOR}`,
                                  background: BTB_COLOR + '18',
                                  paddingLeft: 5,
                                } : {}),
                              }}
                              title={btbDir ? `Back-to-back: also in H${
                                btbDir === 'prev' ? heat.number - 1 :
                                btbDir === 'next' ? heat.number + 1 :
                                `${heat.number - 1} + ${heat.number + 1}`
                              }` : undefined}
                            >
                              {entry.studentName}
                              {btbDir && (
                                <span style={{ marginLeft: 3, fontWeight: 700, color: BTB_COLOR, fontSize: '0.65rem' }}>
                                  {btbDir === 'both' ? '↕' : btbDir === 'next' ? '↓' : '↑'}
                                </span>
                              )}
                            </span>
                          )
                        })}
                      </div>
                    </td>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// Styles

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
  whiteSpace: 'nowrap',
  verticalAlign: 'top',
  position: 'sticky',
  left: 0,
  zIndex: 1,
}

const TD_CELL: React.CSSProperties = {
  padding: '4px',
  border: '1px solid var(--border)',
  verticalAlign: 'top',
  minWidth: 110,
  minHeight: 40,
  transition: 'background .1s',
}

const CHIP: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '2px 7px',
  borderRadius: 10,
  background: 'var(--card-alt, #f5f3ef)',
  border: '1px solid var(--border)',
  fontSize: '0.7rem',
  fontWeight: 500,
  cursor: 'grab',
  userSelect: 'none',
  whiteSpace: 'nowrap',
  maxWidth: '100%',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  transition: 'opacity .1s',
}
