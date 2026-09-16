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

function heatStatus(count: number, max: number): { label: string; color: string; bg: string } {
  if (count >= max)                       return { label: 'Full',       color: '#dc2626', bg: '#fef2f2' }
  if (count >= Math.floor(max * 0.75))    return { label: 'Filling Up', color: '#ea580c', bg: '#fff7ed' }
  if (count >= Math.floor(max / 2))       return { label: 'Half Full',  color: '#d97706', bg: '#fffbeb' }
  return                                         { label: 'Open',       color: '#16a34a', bg: '#f0fdf4' }
}

export default function HeatRebalancer({ heats: initialHeats, studios }: Props) {
  const [heats, setHeats] = useState(initialHeats)
  const [pending, startTransition] = useTransition()
  const dragRef = useRef<{ entryId: number; fromHeatId: number } | null>(null)
  const [dragOver, setDragOver] = useState<{ heatId: number; instrId: number | null } | null>(null)
  const [danceFilter, setDanceFilter] = useState<string>('All')

  const instructors = getAllInstructors(studios)
  const dances = ['All', ...Array.from(new Set(initialHeats.map(h => h.dance))).sort()]
  const visibleHeats = danceFilter === 'All' ? heats : heats.filter(h => h.dance === danceFilter)

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

  return (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
        {dances.map(d => (
          <button
            key={d}
            onClick={() => setDanceFilter(d)}
            style={{
              fontSize: '0.78rem', fontWeight: 500, padding: '3px 10px', borderRadius: 6,
              border: '1px solid var(--border)', cursor: 'pointer',
              background: danceFilter === d ? 'var(--ink)' : 'var(--card)',
              color: danceFilter === d ? 'var(--page)' : 'var(--muted)',
            }}
          >{d}</button>
        ))}
      </div>
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
            <th style={TH_INSTR}>—</th>
          </tr>
        </thead>
        <tbody>
          {visibleHeats.map(heat => {
            const count = heat.entries.length
            const status = heatStatus(count, heat.max)
            return (
              <tr key={heat.id}>
                <td style={TD_HEAT_LABEL}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.82rem' }}>H{heat.number}</span>
                    <span style={{ color: 'var(--muted)', fontSize: '0.72rem' }}>{heat.dance}</span>
                    <span style={{
                      fontSize: '0.68rem', fontWeight: 600, padding: '1px 5px', borderRadius: 9,
                      background: status.bg, color: status.color,
                    }}>{count}</span>
                  </div>
                </td>

                {instructors.map(i => i.id).map(instrId => {
                  const cellEntries = heat.entries.filter(e => e.instructorId === instrId)
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
                      onDrop={() => handleDrop(heat.id, instrId)}
                    >
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
                    </td>
                  )
                })}
                {/* Unassigned column */}
                {(() => {
                  const cellEntries = heat.entries.filter(e => e.instructorId == null)
                  const isOver = dragOver?.heatId === heat.id && dragOver?.instrId === null
                  return (
                    <td
                      key="unassigned"
                      style={{
                        ...TD_CELL,
                        background: isOver ? 'var(--drag-bg)' : undefined,
                        outline: isOver ? '2px solid var(--accent)' : undefined,
                        outlineOffset: -2,
                      }}
                      onDragOver={e => { e.preventDefault(); setDragOver({ heatId: heat.id, instrId: null }) }}
                      onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOver(null) }}
                      onDrop={() => handleDrop(heat.id, null)}
                    >
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
                              ...(btb ? { borderLeft: `3px solid ${BTB_COLOR}`, background: BTB_COLOR + '18', paddingLeft: 5 } : {}),
                            }}
                            title={btbDir ? `Back-to-back: also in H${btbDir === 'prev' ? heat.number - 1 : btbDir === 'next' ? heat.number + 1 : `${heat.number - 1} + ${heat.number + 1}`}` : undefined}
                          >
                            {entry.studentName}
                            {btbDir && <span style={{ marginLeft: 3, fontWeight: 700, color: BTB_COLOR, fontSize: '0.65rem' }}>{btbDir === 'both' ? '↕' : btbDir === 'next' ? '↓' : '↑'}</span>}
                          </span>
                        )
                      })}
                    </td>
                  )
                })()}
              </tr>
            )
          })}
        </tbody>
      </table>
      </div>
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
  transition: 'background .1s',
  lineHeight: 1.8,
}

const CHIP: React.CSSProperties = {
  display: 'inline-block',
  verticalAlign: 'middle',
  padding: '1px 7px',
  margin: '1px 2px 1px 0',
  borderRadius: 10,
  background: 'var(--card-alt, #f5f3ef)',
  border: '1px solid var(--border)',
  fontSize: '0.7rem',
  fontWeight: 500,
  cursor: 'grab',
  userSelect: 'none',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  transition: 'opacity .1s',
  lineHeight: 1.6,
}
