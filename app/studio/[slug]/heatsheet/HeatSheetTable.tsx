'use client'

import { useState, useTransition, Fragment } from 'react'
import { reassignHeatEntry } from '@/app/actions/studio'

type Entry = {
  id: number
  heatNumber: number
  dance: string
  partnerId: number
  partnerName: string
  heatId: number
}

type Seg =
  | { type: 'event'; eventName: string; entries: Entry[] }
  | { type: 'solo'; entry: Entry }

type Partner = { id: number; name: string }

export default function HeatSheetTable({
  slug,
  segments,
  partners,
  showStudent,
}: {
  slug: string
  segments: Seg[]
  partners: Partner[]
  showStudent: boolean
}) {
  const [, startTransition] = useTransition()
  const [localEntries, setLocalEntries] = useState<Record<number, number>>({})

  function getPartnerId(entry: Entry) {
    return localEntries[entry.id] ?? entry.partnerId
  }

  function getPartnerName(entry: Entry) {
    const id = getPartnerId(entry)
    return partners.find(p => p.id === id)?.name ?? entry.partnerName
  }

  function handleChange(entry: Entry, newPartnerId: number) {
    setLocalEntries(prev => ({ ...prev, [entry.id]: newPartnerId }))
    startTransition(async () => {
      const changes = showStudent
        ? { instructorId: newPartnerId }
        : { studentId: newPartnerId }
      await reassignHeatEntry(slug, entry.id, changes)
    })
  }

  const colSpan = 3

  return (
    <table className="data-table">
      <thead>
        <tr>
          <th style={{ width: 52, textAlign: 'center' }}>#</th>
          <th style={{ width: 180 }}>Dance</th>
          <th>{showStudent ? 'Instructor' : 'Student'}</th>
        </tr>
      </thead>
      <tbody>
        {segments.map((seg, i) => {
          if (seg.type === 'solo') {
            const e = seg.entry
            const currentId = getPartnerId(e)
            return (
              <tr key={e.id}>
                <td style={{ fontFamily: 'monospace', textAlign: 'center', fontSize: '0.85rem' }}>{e.heatNumber}</td>
                <td>{e.dance}</td>
                <td>
                  <select
                    className="no-print field"
                    style={{ fontSize: '0.85rem', padding: '2px 6px' }}
                    value={currentId}
                    onChange={ev => handleChange(e, parseInt(ev.target.value))}
                  >
                    {partners.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                  <span className="print-only">{getPartnerName(e)}</span>
                </td>
              </tr>
            )
          }

          return (
            <Fragment key={`evtseg-${seg.eventName}-${i}`}>
              <tr>
                <td
                  colSpan={colSpan}
                  style={{
                    backgroundColor: '#2c2c2c',
                    color: 'white',
                    fontWeight: 700,
                    fontSize: '0.7rem',
                    letterSpacing: '0.06em',
                    padding: '4px 10px',
                    borderTop: '2px solid #1a1a1a',
                    textTransform: 'uppercase',
                  }}
                >
                  ◆ {seg.eventName}
                  <span style={{ fontWeight: 400, opacity: 0.55, marginLeft: 8, fontSize: '0.65rem', textTransform: 'none' }}>
                    {seg.entries.length} dances
                  </span>
                </td>
              </tr>
              {seg.entries.map(e => {
                const currentId = getPartnerId(e)
                return (
                  <tr key={e.id} style={{ backgroundColor: '#7ecfa0' }}>
                    <td style={{ fontFamily: 'monospace', textAlign: 'center', fontSize: '0.85rem', borderLeft: '3px solid #555' }}>{e.heatNumber}</td>
                    <td style={{ fontSize: '0.8125rem' }}>{e.dance}</td>
                    <td style={{ fontSize: '0.8125rem' }}>
                      <select
                        className="no-print field"
                        style={{ fontSize: '0.8rem', padding: '2px 6px' }}
                        value={currentId}
                        onChange={ev => handleChange(e, parseInt(ev.target.value))}
                      >
                        {partners.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                      <span className="print-only">{getPartnerName(e)}</span>
                    </td>
                  </tr>
                )
              })}
            </Fragment>
          )
        })}
      </tbody>
    </table>
  )
}
