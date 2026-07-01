'use client'

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

function StudentSheet({ student }: { student: StudentFeedback }) {
  return (
    <div className="feedback-student" style={{ maxWidth: 680 }}>
      {/* Student header */}
      <div className="flex items-baseline justify-between mb-4 pb-2" style={{ borderBottom: '2px solid #1e1e1e' }}>
        <div>
          <div className="text-xl font-bold">{student.name}</div>
          <div className="text-sm" style={{ color: '#555' }}>{student.studioName}</div>
        </div>
        <div className="text-sm font-semibold no-print" style={{ color: '#555' }}>Judge Feedback</div>
      </div>

      {/* Heats — one row per heat: number · dance · all feedback inline */}
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
        <tbody>
          {student.heats.map(heat => {
            const judgeLines: { name: string; text: string }[] = []
            for (const judge of heat.judges) {
              const ups = judge.thumbs.filter(t => t.sentiment === 'up').map(t => getComment(t.categoryName, t.sentiment, student.studentId, heat.heatId, t.categoryId))
              const downs = judge.thumbs.filter(t => t.sentiment === 'down').map(t => getComment(t.categoryName, t.sentiment, student.studentId, heat.heatId, t.categoryId))
              const parts = [...ups, ...downs]
              if (judge.note) parts.push(judge.note)
              if (parts.length > 0) judgeLines.push({ name: judge.judgeName, text: parts.join(' · ') })
            }
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

  function printOne(studentId: number) {
    const el = document.getElementById(`feedback-student-${studentId}`)
    if (!el) return
    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(`<html><head><title>Feedback</title><style>
      body { font-family: sans-serif; padding: 24px; }
      ul { margin: 0; padding: 0; list-style: none; }
      li { margin: 2px 0; font-size: 14px; }
      .italic { font-style: italic; color: #444; }
    </style></head><body>${el.innerHTML}</body></html>`)
    win.document.close()
    win.print()
  }

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; -webkit-print-color-adjust: exact; }
          header { display: none !important; }
          nav { display: none !important; }
          .feedback-student { page-break-after: always; }
          .feedback-student:last-child { page-break-after: avoid; }
        }
      `}</style>

      <div className="no-print flex items-center gap-3 mb-6">
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

      <div className="space-y-12">
        {withFeedback.map(student => (
          <div key={student.studentId}>
            <div className="no-print flex justify-end mb-1">
              <button
                onClick={() => printOne(student.studentId)}
                className="text-xs px-3 py-1 font-medium"
                style={{ backgroundColor: '#f0f0f0', borderRadius: 4, border: '1px solid #ddd' }}
              >
                Print {student.name.split(' ')[0]}
              </button>
            </div>
            <div id={`feedback-student-${student.studentId}`}>
              <StudentSheet student={student} />
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
