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

function StudentCard({ student }: { student: StudentFeedback }) {
  const [open, setOpen] = useState(false)

  function printOne() {
    const rows = student.heats.map(heat => {
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
</style></head><body>
<h2>${student.name}</h2>
<div class="sub">${student.studioName} · Judge Feedback</div>
<table><tbody>${rows}</tbody></table>
</body></html>`)
    win.document.close()
    win.print()
  }

  return (
    <div
      id={`feedback-student-${student.studentId}`}
      style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 4, marginBottom: 8, overflow: 'hidden' }}
    >
      {/* Card header row */}
      <div
        style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
        onClick={() => setOpen(o => !o)}
      >
        <div style={{ flex: 1 }}>
          <span style={{ fontSize: 13, fontWeight: 700 }}>{student.name}</span>
          {' '}
          <span style={{ fontSize: 11, color: 'var(--muted)' }}>{student.heats.length} heat{student.heats.length !== 1 ? 's' : ''}</span>
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

      {/* Expanded feedback */}
      {open && (
        <div style={{ borderTop: '1px solid var(--border)', padding: '8px 12px' }}>
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
                      {judgeLines.map((j, i) => (
                        <div key={i}><span style={{ fontWeight: 600, color: '#1a2744', marginRight: 6 }}>{j.name}:</span>{j.text}</div>
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
  )
}

export default function FeedbackPrint({ students }: { students: StudentFeedback[] }) {
  const withFeedback = students.filter(s => s.heats.length > 0)

  if (withFeedback.length === 0) {
    return (
      <p className="text-sm italic" style={{ color: 'var(--muted)' }}>
        No open heat feedback recorded yet.
      </p>
    )
  }

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; -webkit-print-color-adjust: exact; }
          header, nav { display: none !important; }
        }
      `}</style>

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
    </>
  )
}
