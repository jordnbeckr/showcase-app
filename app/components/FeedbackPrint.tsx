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
          header { display: none !important; }
          .feedback-student { page-break-after: always; }
          .feedback-student:last-child { page-break-after: avoid; }
        }
      `}</style>

      <div className="no-print flex items-center gap-3 mb-6">
        <h1 className="text-xl font-bold">Judge Feedback Sheets</h1>
        <button
          onClick={() => window.print()}
          className="text-sm px-4 py-1.5 font-medium text-white"
          style={{ backgroundColor: '#2c2c2c', borderRadius: 6 }}
        >
          Print all
        </button>
        <span className="text-xs" style={{ color: 'var(--muted)' }}>{withFeedback.length} student{withFeedback.length !== 1 ? 's' : ''} with feedback</span>
      </div>

      <div className="space-y-12">
        {withFeedback.map(student => (
          <div key={student.studentId} className="feedback-student" style={{ maxWidth: 680 }}>
            {/* Student header */}
            <div className="flex items-baseline justify-between mb-4 pb-2" style={{ borderBottom: '2px solid #1e1e1e' }}>
              <div>
                <div className="text-xl font-bold">{student.name}</div>
                <div className="text-sm" style={{ color: '#555' }}>{student.studioName}</div>
              </div>
              <div className="text-sm font-semibold" style={{ color: '#555' }}>Judge Feedback</div>
            </div>

            {/* Heats */}
            <div className="space-y-5">
              {student.heats.map(heat => (
                <div key={heat.heatId}>
                  <div className="text-sm font-bold mb-2" style={{ color: '#333', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Heat {heat.heatNumber} — {heat.dance}
                  </div>
                  <div className="space-y-3 pl-3" style={{ borderLeft: '3px solid #e5e7eb' }}>
                    {heat.judges.map(judge => {
                      const hasContent = judge.thumbs.length > 0 || judge.note
                      if (!hasContent) return null
                      return (
                        <div key={judge.judgeId}>
                          <div className="text-xs font-semibold mb-1" style={{ color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            {judge.judgeName}
                          </div>
                          <ul className="space-y-0.5">
                            {judge.thumbs.map(t => {
                              const comment = getComment(t.categoryName, t.sentiment, student.studentId, heat.heatId, t.categoryId)
                              return (
                                <li key={`${t.categoryId}-${t.sentiment}`} className="text-sm flex items-start gap-2">
                                  <span style={{ color: t.sentiment === 'up' ? '#16a34a' : '#dc2626', flexShrink: 0, marginTop: 1 }}>
                                    {t.sentiment === 'up' ? '▲' : '▼'}
                                  </span>
                                  <span>{comment}</span>
                                </li>
                              )
                            })}
                            {judge.note && (
                              <li className="text-sm italic" style={{ color: '#444', paddingLeft: 20 }}>
                                "{judge.note}"
                              </li>
                            )}
                          </ul>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
