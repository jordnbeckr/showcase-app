'use client'

import { useState } from 'react'
import { getComment } from '@/lib/feedbackComments'

export type FeedbackHeat = {
  heatId: number
  heatNumber: number
  dance: string
  judges: {
    judgeId: number
    judgeName: string
    thumbs: { categoryId: number; categoryName: string; sentiment: 'up' | 'down' }[]
    note: string | null
  }[]
}

export type StudentFeedback = {
  studentId: number
  name: string
  studioName: string
  heats: FeedbackHeat[]
  closedHeats: { heatNumber: number; dance: string; placement: string }[]
}

function buildJudgeLines(student: StudentFeedback, heat: FeedbackHeat) {
  const lines: { name: string; text: string }[] = []
  for (const judge of heat.judges) {
    const ups = judge.thumbs.filter(t => t.sentiment === 'up').map(t => getComment(t.categoryName, t.sentiment, student.studentId, heat.heatId, t.categoryId))
    const downs = judge.thumbs.filter(t => t.sentiment === 'down').map(t => getComment(t.categoryName, t.sentiment, student.studentId, heat.heatId, t.categoryId))
    const parts = [...ups, ...downs]
    if (judge.note) parts.push(judge.note)
    if (parts.length > 0) lines.push({ name: judge.judgeName, text: parts.join(' · ') })
  }
  return lines
}

const PLACEMENT_STYLES: Record<string, React.CSSProperties> = {
  Gold:   { background: '#fef9c3', border: '1.5px solid #fbbf24', color: '#713f12' },
  Silver: { background: '#f1f5f9', border: '1.5px solid #94a3b8', color: '#1e293b' },
  Bronze: { background: '#fff7ed', border: '1.5px solid #f97316', color: '#7c2d12' },
}
const PLACEMENT_DOT: Record<string, string> = { Gold: '#fbbf24', Silver: '#94a3b8', Bronze: '#f97316' }

function PlacementChip({ placement }: { placement: string }) {
  const s = PLACEMENT_STYLES[placement] ?? { background: '#f0f2f5', border: '1.5px solid #d4d9e0', color: '#5a6470' }
  const dot = PLACEMENT_DOT[placement] ?? '#a0aab4'
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 7px', borderRadius: 3, fontSize: 11, fontWeight: 700, ...s }}>
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: dot, flexShrink: 0, display: 'inline-block' }} />
      {placement}
    </span>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase',
      color: 'var(--muted)', padding: '6px 12px 4px', background: '#f5f7fa',
      borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 6,
    }}>
      {children}
    </div>
  )
}

function StudentCard({ student }: { student: StudentFeedback }) {
  const [open, setOpen] = useState(false)
  const hasAnything = student.closedHeats.length > 0 || student.heats.length > 0

  const goldCount   = student.closedHeats.filter(h => h.placement === 'Gold').length
  const silverCount = student.closedHeats.filter(h => h.placement === 'Silver').length
  const bronzeCount = student.closedHeats.filter(h => h.placement === 'Bronze').length

  function printOne() {
    const closedRows = student.closedHeats.map(h => {
      const s = PLACEMENT_STYLES[h.placement] ?? {}
      const dot = PLACEMENT_DOT[h.placement] ?? '#a0aab4'
      return `<tr>
        <td style="padding:5px 8px 5px 0;font-family:monospace;font-size:11px;color:#5a6470;width:32px">${h.heatNumber}</td>
        <td style="padding:5px 12px 5px 0;color:#333;width:140px;white-space:nowrap">${h.dance}</td>
        <td style="padding:5px 0"><span style="display:inline-flex;align-items:center;gap:4px;padding:2px 7px;border-radius:3px;font-size:11px;font-weight:700;background:${(s as Record<string,string>).background ?? ''};border:${(s as Record<string,string>).border ?? ''};color:${(s as Record<string,string>).color ?? ''}">
          <span style="width:7px;height:7px;border-radius:50%;background:${dot};display:inline-block"></span>${h.placement}
        </span></td>
      </tr>`
    }).join('')

    const openRows = student.heats.map(heat => {
      const judgeLines = buildJudgeLines(student, heat)
      if (judgeLines.length === 0) return ''
      return `<tr>
        <td style="padding:5px 8px 5px 0;font-weight:700;color:#1a2744;width:32px">${heat.heatNumber}</td>
        <td style="padding:5px 12px 5px 0;color:#555;width:140px;white-space:nowrap">${heat.dance}</td>
        <td style="padding:5px 0;color:#222;line-height:1.6">
          ${judgeLines.map(j => `<div><span style="font-weight:600;color:#1a2744;margin-right:6px">${j.name}:</span>${j.text}</div>`).join('')}
        </td>
      </tr>`
    }).join('')

    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(`<!DOCTYPE html><html><head><title>${student.name} – Feedback</title>
<style>
  body { font-family: Arial, Helvetica, sans-serif; padding: 24px; font-size: 13px; color: #0f1923; }
  h2 { font-size: 16px; font-weight: 700; margin: 0 0 2px; }
  .sub { font-size: 11px; color: #555; margin-bottom: 14px; }
  table { width: 100%; border-collapse: collapse; }
  tr { border-bottom: 1px solid #e5e7eb; vertical-align: top; }
  .page { page-break-after: always; padding-bottom: 24px; }
  .page:last-child { page-break-after: avoid; }
  @media print { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
</style></head><body>
${student.closedHeats.length > 0 ? `<div class="page">
<h2>${student.name}</h2>
<div class="sub">${student.studioName} · Closed Heats — G/S/B</div>
<table><tbody>${closedRows}</tbody></table>
</div>` : ''}
${openRows.trim() ? `<div class="page">
<h2>${student.name}</h2>
<div class="sub">${student.studioName} · Open Heats — Judge Feedback</div>
<table><tbody>${openRows}</tbody></table>
</div>` : ''}
</body></html>`)
    win.document.close()
    win.print()
  }

  return (
    <div
      id={`feedback-student-${student.studentId}`}
      style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 4, marginBottom: 8, overflow: 'hidden' }}
    >
      {/* Header */}
      <div
        style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
        onClick={() => setOpen(o => !o)}
      >
        <div style={{ flex: 1 }}>
          <span style={{ fontSize: 13, fontWeight: 700 }}>{student.name}</span>
        </div>
        {/* Fixed-width tally columns so they align down the page */}
        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
          {(['Gold', 'Silver', 'Bronze'] as const).map(p => {
            const count = p === 'Gold' ? goldCount : p === 'Silver' ? silverCount : bronzeCount
            const s = PLACEMENT_STYLES[p]
            const dot = PLACEMENT_DOT[p]
            return (
              <span key={p} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 3, width: 36, padding: '2px 0', borderRadius: 3, fontSize: 11, fontWeight: 700, opacity: count === 0 ? 0.3 : 1, ...s }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: dot, flexShrink: 0, display: 'inline-block' }} />
                {count}
              </span>
            )
          })}
          <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 46, padding: '2px 0', borderRadius: 3, fontSize: 11, fontWeight: 700, background: '#f0f2f5', color: student.heats.length === 0 ? 'var(--border-dark)' : 'var(--muted)', opacity: student.heats.length === 0 ? 0.6 : 1 }}>
            {student.heats.length} open
          </span>
        </div>
        <button
          className="no-print"
          onClick={e => { e.stopPropagation(); printOne() }}
          style={{ fontSize: 11, padding: '2px 8px', borderRadius: 3, border: '1px solid var(--border-dark)', background: 'var(--surface)', color: 'var(--muted)', cursor: 'pointer' }}
        >
          Print
        </button>
        <span style={{ color: 'var(--muted)', fontSize: 10, marginLeft: 2, display: 'inline-block', transition: 'transform .15s', transform: open ? 'rotate(90deg)' : 'none' }}>▶</span>
      </div>

      {/* Expanded: two stacked sections */}
      {open && hasAnything && (
        <div style={{ borderTop: '1px solid var(--border)' }}>

          {/* ── Closed G/S/B section ── */}
          <SectionLabel>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#fbbf24', display: 'inline-block' }} />
            Closed Heats — G/S/B
            {student.closedHeats.length > 0 && (
              <span style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
                {goldCount   > 0 && <span style={{ ...PLACEMENT_STYLES.Gold,   display: 'inline-block', padding: '1px 5px', borderRadius: 3, fontSize: 10, fontWeight: 700 }}>🥇 {goldCount}</span>}
                {silverCount > 0 && <span style={{ ...PLACEMENT_STYLES.Silver, display: 'inline-block', padding: '1px 5px', borderRadius: 3, fontSize: 10, fontWeight: 700 }}>🥈 {silverCount}</span>}
                {bronzeCount > 0 && <span style={{ ...PLACEMENT_STYLES.Bronze, display: 'inline-block', padding: '1px 5px', borderRadius: 3, fontSize: 10, fontWeight: 700 }}>🥉 {bronzeCount}</span>}
              </span>
            )}
          </SectionLabel>
          {student.closedHeats.length === 0 ? (
            <p style={{ padding: '6px 12px', fontSize: 11, color: 'var(--muted)', fontStyle: 'italic' }}>No closed heat placements recorded.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
              <tbody>
                {student.closedHeats.map((h, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f0f2f5' }}>
                    <td style={{ padding: '5px 12px', fontFamily: 'monospace', fontSize: 11, color: 'var(--muted)', width: 36 }}>#{h.heatNumber}</td>
                    <td style={{ padding: '5px 12px', flex: 1 }}>{h.dance}</td>
                    <td style={{ padding: '5px 12px', textAlign: 'right' }}><PlacementChip placement={h.placement} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* ── Open feedback section ── */}
          <SectionLabel>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#93c5fd', display: 'inline-block' }} />
            Open Heats — Judge Feedback
          </SectionLabel>
          {student.heats.length === 0 ? (
            <p style={{ padding: '6px 12px', fontSize: 11, color: 'var(--muted)', fontStyle: 'italic' }}>No open heat feedback recorded.</p>
          ) : (
            <div style={{ padding: '4px 12px 8px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                <tbody>
                  {student.heats.map(heat => {
                    const judgeLines = buildJudgeLines(student, heat)
                    if (judgeLines.length === 0) return null
                    return (
                      <tr key={heat.heatId} style={{ borderBottom: '1px solid #e5e7eb', verticalAlign: 'top' }}>
                        <td style={{ padding: '5px 8px 5px 0', fontWeight: 700, whiteSpace: 'nowrap', color: '#1a2744', width: 32 }}>{heat.heatNumber}</td>
                        <td style={{ padding: '5px 12px 5px 0', whiteSpace: 'nowrap', color: '#555', width: 140 }}>{heat.dance}</td>
                        <td style={{ padding: '5px 0', color: '#222', lineHeight: 1.6 }}>
                          {judgeLines.map((j, idx) => (
                            <div key={idx}><span style={{ fontWeight: 600, color: '#1a2744', marginRight: 6 }}>{j.name}:</span>{j.text}</div>
                          ))}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function FeedbackPrint({ students }: { students: StudentFeedback[] }) {
  const withFeedback = students.filter(s => s.heats.length > 0 || s.closedHeats.length > 0)

  if (withFeedback.length === 0) {
    return (
      <p className="text-sm italic" style={{ color: 'var(--muted)' }}>
        No feedback or placements recorded yet.
      </p>
    )
  }

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .screen-only { display: none !important; }
          .print-only { display: block !important; }
          body { background: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          header, nav { display: none !important; }
          .print-page { page-break-after: always; }
          .print-page:last-child { page-break-after: avoid; }
        }
        @media screen {
          .print-only { display: none !important; }
        }
      `}</style>

      {/* ── Screen: accordion cards ── */}
      <div className="screen-only">
        <div className="no-print flex items-center gap-3 mb-4">
          <h1 className="text-xl font-bold">Judge Feedback Sheets</h1>
          <button
            onClick={() => window.print()}
            className="text-sm px-4 py-1.5 font-medium text-white"
            style={{ backgroundColor: 'var(--accent)', borderRadius: 6 }}
          >
            Print all
          </button>
          <span className="text-xs" style={{ color: 'var(--muted)' }}>{withFeedback.length} student{withFeedback.length !== 1 ? 's' : ''} with feedback</span>
        </div>
        {withFeedback.map(student => (
          <StudentCard key={student.studentId} student={student} />
        ))}
      </div>

      {/* ── Print-only: always fully rendered, closed and open on separate pages ── */}
      <div className="print-only">
        {withFeedback.flatMap(student => {
          const pages: React.ReactNode[] = []

          if (student.closedHeats.length > 0) {
            pages.push(
              <div key={`${student.studentId}-closed`} className="print-page" style={{ fontFamily: 'Arial, Helvetica, sans-serif', fontSize: 13, color: '#0f1923', padding: '0 0 24px' }}>
                <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 2 }}>{student.name}</div>
                <div style={{ fontSize: 11, color: '#5a6470', marginBottom: 12 }}>{student.studioName} · Closed Heats — G/S/B</div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <tbody>
                    {student.closedHeats.map((h, i) => {
                      const s = PLACEMENT_STYLES[h.placement] ?? {}
                      const dot = PLACEMENT_DOT[h.placement] ?? '#a0aab4'
                      return (
                        <tr key={i} style={{ borderBottom: '1px solid #e5e7eb' }}>
                          <td style={{ padding: '5px 8px 5px 0', fontFamily: 'monospace', fontSize: 11, color: '#5a6470', width: 32 }}>#{h.heatNumber}</td>
                          <td style={{ padding: '5px 12px 5px 0', width: 160 }}>{h.dance}</td>
                          <td style={{ padding: '5px 0' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 7px', borderRadius: 3, fontSize: 11, fontWeight: 700, ...s }}>
                              <span style={{ width: 7, height: 7, borderRadius: '50%', background: dot, flexShrink: 0, display: 'inline-block' }} />
                              {h.placement}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )
          }

          if (student.heats.length > 0) {
            const openRows = student.heats.flatMap(heat => {
              const judgeLines = buildJudgeLines(student, heat)
              if (judgeLines.length === 0) return []
              return [(
                <tr key={heat.heatId} style={{ borderBottom: '1px solid #e5e7eb', verticalAlign: 'top' }}>
                  <td style={{ padding: '5px 8px 5px 0', fontWeight: 700, color: '#1a2744', width: 32, whiteSpace: 'nowrap' }}>{heat.heatNumber}</td>
                  <td style={{ padding: '5px 12px 5px 0', color: '#555', width: 160, whiteSpace: 'nowrap' }}>{heat.dance}</td>
                  <td style={{ padding: '5px 0', color: '#222', lineHeight: 1.6 }}>
                    {judgeLines.map((j, idx) => (
                      <div key={idx}><span style={{ fontWeight: 600, color: '#1a2744', marginRight: 6 }}>{j.name}:</span>{j.text}</div>
                    ))}
                  </td>
                </tr>
              )]
            })
            if (openRows.length > 0) {
              pages.push(
                <div key={`${student.studentId}-open`} className="print-page" style={{ fontFamily: 'Arial, Helvetica, sans-serif', fontSize: 13, color: '#0f1923', padding: '0 0 24px' }}>
                  <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 2 }}>{student.name}</div>
                  <div style={{ fontSize: 11, color: '#5a6470', marginBottom: 12 }}>{student.studioName} · Open Heats — Judge Feedback</div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                    <tbody>{openRows}</tbody>
                  </table>
                </div>
              )
            }
          }

          return pages
        })}
      </div>
    </>
  )
}
