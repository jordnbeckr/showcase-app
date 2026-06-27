'use client'

import { useState } from 'react'

type Entry = {
  id: number
  heatNumber: number
  dance: string
  partnerName: string
  floorLabel: string | null
}

type Seg =
  | { type: 'event'; eventName: string; entries: Entry[] }
  | { type: 'solo'; entry: Entry }

type Sheet = {
  sheetId: string
  name: string
  subtitle: string
  leaderNumber?: number | null
  entryCount: number
  segments: Seg[]
  headerColor: string
}

function SheetTable({ segments }: { segments: Seg[] }) {
  return (
    <table className="data-table">
      <thead>
        <tr>
          <th style={{ width: 52, textAlign: 'center' }}>#</th>
          <th style={{ width: 180 }}>Dance</th>
          <th>Partner</th>
          <th style={{ width: 64, textAlign: 'center' }}>Floor</th>
        </tr>
      </thead>
      <tbody>
        {segments.map((seg, i) => {
          if (seg.type === 'solo') {
            const e = seg.entry
            return (
              <tr key={e.id}>
                <td style={{ fontFamily: 'monospace', textAlign: 'center', fontSize: '0.85rem' }}>{e.heatNumber}</td>
                <td>{e.dance}</td>
                <td style={{ fontSize: '0.9rem' }}>{e.partnerName}</td>
                <td style={{ textAlign: 'center' }}>
                  {e.floorLabel
                    ? <span style={{ fontWeight: 800, fontSize: '1rem', color: '#1e1e1e' }}>{e.floorLabel}</span>
                    : <span style={{ color: 'var(--muted)' }}>—</span>}
                </td>
              </tr>
            )
          }
          return [
            <tr key={`evt-${seg.eventName}-${i}`}>
              <td colSpan={4} style={{ backgroundColor: '#2c2c2c', color: 'white', fontWeight: 700, fontSize: '0.7rem', letterSpacing: '0.06em', padding: '4px 10px', borderTop: '2px solid #1a1a1a', textTransform: 'uppercase' }}>
                ◆ {seg.eventName}
                <span style={{ fontWeight: 400, opacity: 0.55, marginLeft: 8, fontSize: '0.65rem', textTransform: 'none' }}>
                  {seg.entries.length} dances
                </span>
              </td>
            </tr>,
            ...seg.entries.map(e => (
              <tr key={e.id} style={{ backgroundColor: '#7ecfa0' }}>
                <td style={{ fontFamily: 'monospace', textAlign: 'center', fontSize: '0.85rem', borderLeft: '3px solid #555' }}>{e.heatNumber}</td>
                <td style={{ fontSize: '0.8125rem' }}>{e.dance}</td>
                <td style={{ fontSize: '0.8125rem' }}>{e.partnerName}</td>
                <td style={{ textAlign: 'center' }}>
                  {e.floorLabel
                    ? <span style={{ fontWeight: 800, fontSize: '1rem', color: '#1e1e1e' }}>{e.floorLabel}</span>
                    : <span style={{ color: 'var(--muted)' }}>—</span>}
                </td>
              </tr>
            )),
          ]
        })}
      </tbody>
    </table>
  )
}

function AccordionSection({ sheet, onPrint }: { sheet: Sheet; onPrint: (sheetId: string) => void }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div id={sheet.sheetId} className="sheet-section">
      <div
        className="px-5 py-3"
        style={{ backgroundColor: sheet.headerColor, color: 'white', borderRadius: expanded ? '4px 4px 0 0' : 4, cursor: 'pointer' }}
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span style={{ fontSize: '0.85rem', opacity: 0.6 }}>{expanded ? '▾' : '›'}</span>
            <div>
              <div className="text-lg font-bold">{sheet.name}</div>
              <div className="text-sm opacity-70">{sheet.subtitle}</div>
            </div>
          </div>
          <div className="flex items-center gap-4" onClick={e => e.stopPropagation()}>
            {sheet.leaderNumber && (
              <div className="text-right">
                <div className="text-3xl font-bold">{sheet.leaderNumber}</div>
                <div className="text-xs opacity-60">Leader #</div>
              </div>
            )}
            <button
              onClick={() => onPrint(sheet.sheetId)}
              className="no-print text-xs px-3 py-1 font-medium text-white"
              style={{ backgroundColor: '#555', borderRadius: 4 }}
            >
              Print
            </button>
          </div>
        </div>
      </div>

      {/* Always in DOM for print targeting; hidden via style when collapsed */}
      <div className="sheet-table-content" style={{ display: expanded ? 'block' : 'none' }}>
        <SheetTable segments={sheet.segments} />
        <div className="mt-2 text-xs no-print" style={{ color: 'var(--muted)' }}>
          {sheet.entryCount} heat{sheet.entryCount !== 1 ? 's' : ''} total
        </div>
      </div>
    </div>
  )
}

export default function HeatSheetAccordion({ sheets }: { sheets: Sheet[] }) {
  function handlePrint(sheetId: string) {
    const section = document.getElementById(sheetId)
    if (!section) return
    // Expand the content div for printing
    const contentDiv = section.querySelector('.sheet-table-content') as HTMLElement | null
    const wasHidden = contentDiv?.style.display === 'none'
    if (contentDiv && wasHidden) contentDiv.style.display = 'block'
    section.classList.add('printing-target')
    window.print()
    section.classList.remove('printing-target')
    if (contentDiv && wasHidden) contentDiv.style.display = 'none'
  }

  return (
    <div className="space-y-2">
      {sheets.map(sheet => (
        <AccordionSection key={sheet.sheetId} sheet={sheet} onPrint={handlePrint} />
      ))}
    </div>
  )
}
