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

function buildTableRows(segments: Seg[]): string {
  return segments.map((seg, i) => {
    if (seg.type === 'solo') {
      const e = seg.entry
      return `<tr>
        <td>${e.heatNumber}</td>
        <td>${e.dance}</td>
        <td>${e.partnerName}</td>
        <td>${e.floorLabel ?? '—'}</td>
      </tr>`
    }
    const eventRow = `<tr class="event-row">
      <td colspan="4">◆ ${seg.eventName}</td>
    </tr>`
    const entryRows = seg.entries.map(e => `<tr class="event-entry">
      <td>${e.heatNumber}</td>
      <td>${e.dance}</td>
      <td>${e.partnerName}</td>
      <td>${e.floorLabel ?? '—'}</td>
    </tr>`).join('')
    return eventRow + entryRows
  }).join('')
}

function openPdfWindow(sheet: Sheet) {
  const rows = buildTableRows(sheet.segments)
  const leaderBadge = sheet.leaderNumber
    ? `<span class="leader-num">${sheet.leaderNumber}</span>`
    : ''
  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>${sheet.name} — Heat Sheet</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  @page { size: letter; margin: 12mm 14mm; }
  body { font-family: Arial, sans-serif; font-size: 11px; color: #111; }
  .header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 10px; padding-bottom: 6px; border-bottom: 2px solid #1a2744; }
  .header-left h1 { font-size: 16px; font-weight: 700; color: #1a2744; }
  .header-left p { font-size: 11px; color: #555; margin-top: 2px; }
  .leader-num { font-size: 28px; font-weight: 900; color: #1a2744; line-height: 1; }
  table { width: 100%; border-collapse: collapse; margin-top: 2px; }
  th { background: #e8ecf0; border: 1px solid #c0c8d0; padding: 4px 6px; text-align: left; font-size: 10px; font-weight: 700; color: #2a3545; white-space: nowrap; }
  td { border: 1px solid #d0d8e0; padding: 3px 6px; vertical-align: top; }
  tr:nth-child(even) td { background: #f8f9fa; }
  .event-row td { background: #1a2744 !important; color: white; font-weight: 700; font-size: 10px; letter-spacing: 0.04em; padding: 3px 6px; }
  .event-entry td { background: #c8d9a8 !important; }
  col.num { width: 36px; }
  col.dance { width: 140px; }
  col.floor { width: 44px; text-align: center; }
</style>
</head>
<body>
<div class="header">
  <div class="header-left">
    <h1>${sheet.name}</h1>
    <p>${sheet.subtitle} &nbsp;·&nbsp; ${sheet.entryCount} heat${sheet.entryCount !== 1 ? 's' : ''}</p>
  </div>
  ${leaderBadge}
</div>
<table>
  <colgroup>
    <col class="num"><col class="dance"><col><col class="floor">
  </colgroup>
  <thead>
    <tr><th>#</th><th>Dance</th><th>Partner</th><th>Floor</th></tr>
  </thead>
  <tbody>${rows}</tbody>
</table>
<script>window.onload = () => { window.print(); }</script>
</body>
</html>`
  const win = window.open('', '_blank')
  if (!win) return
  win.document.write(html)
  win.document.close()
}

function SheetTable({ segments }: { segments: Seg[] }) {
  return (
    <table className="data-table" style={{ fontSize: '0.8rem' }}>
      <colgroup>
        <col style={{ width: 36 }} />
        <col style={{ width: 150 }} />
        <col />
        <col style={{ width: 52 }} />
      </colgroup>
      <thead>
        <tr>
          <th style={{ textAlign: 'center' }}>#</th>
          <th>Dance</th>
          <th>Partner</th>
          <th style={{ textAlign: 'center' }}>Floor</th>
        </tr>
      </thead>
      <tbody>
        {segments.map((seg, i) => {
          if (seg.type === 'solo') {
            const e = seg.entry
            return (
              <tr key={e.id}>
                <td style={{ fontFamily: 'monospace', textAlign: 'center' }}>{e.heatNumber}</td>
                <td>{e.dance}</td>
                <td style={{ fontSize: '0.85rem' }}>{e.partnerName}</td>
                <td style={{ textAlign: 'center' }}>
                  {e.floorLabel
                    ? <span style={{ fontWeight: 800, color: '#1e1e1e' }}>{e.floorLabel}</span>
                    : <span style={{ color: 'var(--muted)' }}>—</span>}
                </td>
              </tr>
            )
          }
          return [
            <tr key={`evt-${seg.eventName}-${i}`}>
              <td colSpan={4} style={{ backgroundColor: 'var(--header)', color: 'white', fontWeight: 700, fontSize: '0.7rem', letterSpacing: '0.06em', padding: '4px 8px', borderTop: '2px solid #1a1a1a', textTransform: 'uppercase' }}>
                ◆ {seg.eventName}
              </td>
            </tr>,
            ...seg.entries.map(e => (
              <tr key={e.id} style={{ backgroundColor: '#c8d9a8' }}>
                <td style={{ fontFamily: 'monospace', textAlign: 'center', borderLeft: '3px solid #555' }}>{e.heatNumber}</td>
                <td style={{ fontSize: '0.8rem' }}>{e.dance}</td>
                <td style={{ fontSize: '0.8rem' }}>{e.partnerName}</td>
                <td style={{ textAlign: 'center' }}>
                  {e.floorLabel
                    ? <span style={{ fontWeight: 800, color: '#1e1e1e' }}>{e.floorLabel}</span>
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

function AccordionSection({ sheet }: { sheet: Sheet }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="sheet-section">
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
              onClick={() => openPdfWindow(sheet)}
              className="text-xs px-3 py-1 font-medium text-white"
              style={{ backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 4, border: '1px solid rgba(255,255,255,0.3)' }}
            >
              PDF
            </button>
          </div>
        </div>
      </div>

      <div style={{ display: expanded ? 'block' : 'none' }}>
        <SheetTable segments={sheet.segments} />
        <div className="mt-2 text-xs" style={{ color: 'var(--muted)' }}>
          {sheet.entryCount} heat{sheet.entryCount !== 1 ? 's' : ''} total
        </div>
      </div>
    </div>
  )
}

function printAll(sheets: Sheet[]) {
  const pages = sheets.map(sheet => {
    const rows = buildTableRows(sheet.segments)
    const leaderBadge = sheet.leaderNumber
      ? `<span class="leader-num">${sheet.leaderNumber}</span>`
      : ''
    return `<div class="page">
<div class="header">
  <div class="header-left">
    <h1>${sheet.name}</h1>
    <p>${sheet.subtitle} &nbsp;·&nbsp; ${sheet.entryCount} heat${sheet.entryCount !== 1 ? 's' : ''}</p>
  </div>
  ${leaderBadge}
</div>
<table>
  <colgroup>
    <col class="num"><col class="dance"><col><col class="floor">
  </colgroup>
  <thead>
    <tr><th>#</th><th>Dance</th><th>Partner</th><th>Floor</th></tr>
  </thead>
  <tbody>${rows}</tbody>
</table>
</div>`
  }).join('')

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Heat Sheets — All</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  @page { size: letter; margin: 12mm 14mm; }
  body { font-family: Arial, sans-serif; font-size: 11px; color: #111; }
  .page { page-break-after: always; }
  .page:last-child { page-break-after: avoid; }
  .header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 10px; padding-bottom: 6px; border-bottom: 2px solid #1a2744; }
  .header-left h1 { font-size: 16px; font-weight: 700; color: #1a2744; }
  .header-left p { font-size: 11px; color: #555; margin-top: 2px; }
  .leader-num { font-size: 28px; font-weight: 900; color: #1a2744; line-height: 1; }
  table { width: 100%; border-collapse: collapse; margin-top: 2px; }
  th { background: #e8ecf0; border: 1px solid #c0c8d0; padding: 4px 6px; text-align: left; font-size: 10px; font-weight: 700; color: #2a3545; white-space: nowrap; }
  td { border: 1px solid #d0d8e0; padding: 3px 6px; vertical-align: top; }
  tr:nth-child(even) td { background: #f8f9fa; }
  .event-row td { background: #1a2744 !important; color: white; font-weight: 700; font-size: 10px; letter-spacing: 0.04em; padding: 3px 6px; }
  .event-entry td { background: #c8d9a8 !important; }
  col.num { width: 36px; }
  col.dance { width: 140px; }
  col.floor { width: 44px; text-align: center; }
</style>
</head>
<body>${pages}
<script>window.onload = () => { window.print(); }</script>
</body>
</html>`
  const win = window.open('', '_blank')
  if (!win) return
  win.document.write(html)
  win.document.close()
}

export function PrintAllButton({ sheets, label }: { sheets: Sheet[]; label: string }) {
  if (sheets.length === 0) return null
  return (
    <button
      onClick={() => printAll(sheets)}
      className="text-xs px-3 py-1.5 font-medium"
      style={{ backgroundColor: 'var(--accent)', color: 'white', borderRadius: 4 }}
    >
      Print All {label}
    </button>
  )
}

export default function HeatSheetAccordion({ sheets }: { sheets: Sheet[] }) {
  return (
    <div className="space-y-2">
      {sheets.map(sheet => (
        <AccordionSection key={sheet.sheetId} sheet={sheet} />
      ))}
    </div>
  )
}
