'use client'

import { Fragment, useState } from 'react'

type DanceRow =
  | { kind: 'solo'; dance: string; count: number }
  | { kind: 'event'; eventId: number; eventName: string; count: number; dances: { dance: string; count: number }[] }

type StudentBreakdown = {
  id: number
  name: string
  lastName: string
  role: string
  total: number
  heatTotal: number
  showCount: number
  byInstructor: {
    instructor: string
    total: number
    danceRows: DanceRow[]
  }[]
}

type InstructorBreakdown = {
  id: number
  name: string
  lastName: string
  total: number
  heatTotal: number
  showCount: number
  byStudent: {
    studentId: number
    name: string
    lastName: string
    total: number
    danceRows: DanceRow[]
  }[]
}

// Dance list with events visually juxtaposed against solo dances
function DanceTable({ rows }: { rows: DanceRow[] }) {
  if (rows.length === 0) return <span style={{ color: 'var(--muted)', fontSize: '0.75rem', fontStyle: 'italic' }}>none</span>

  const solos = rows.filter(r => r.kind === 'solo') as Extract<DanceRow, { kind: 'solo' }>[]
  const events = rows.filter(r => r.kind === 'event') as Extract<DanceRow, { kind: 'event' }>[]

  return (
    <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
      {/* Solo dances */}
      {solos.length > 0 && (
        <table style={{ fontSize: '0.72rem', borderCollapse: 'collapse', width: 'auto' }}>
          <tbody>
            {solos.map((row, i) => (
              <tr key={`solo-${row.dance}-${i}`}>
                <td style={{ padding: '0 6px 0 0', color: 'var(--text)', whiteSpace: 'nowrap' }}>{row.dance}</td>
                <td style={{ padding: '0', fontWeight: 600, color: 'var(--muted)', textAlign: 'right', whiteSpace: 'nowrap' }}>{row.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Event blocks — each event side by side */}
      {events.map(row => (
        <div key={`event-${row.eventId}`} style={{ border: '1px solid #ccc', borderRadius: 3, overflow: 'hidden', fontSize: '0.72rem' }}>
          <div style={{ padding: '2px 6px', backgroundColor: '#2c2c2c', color: 'white', fontWeight: 700, fontSize: '0.65rem', letterSpacing: '0.04em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
            ◆ {row.eventName}
            <span style={{ fontWeight: 400, opacity: 0.55, marginLeft: 6 }}>×{row.count}</span>
          </div>
          <table style={{ borderCollapse: 'collapse', width: '100%' }}>
            <tbody>
              {row.dances.map(d => (
                <tr key={d.dance} style={{ backgroundColor: '#f0fdf4' }}>
                  <td style={{ padding: '1px 8px 1px 6px', color: 'var(--muted)', whiteSpace: 'nowrap' }}>{d.dance}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  )
}

function sortByTotal<T extends { total: number; lastName: string }>(arr: T[]): T[] {
  return [...arr].sort((a, b) =>
    b.total !== a.total ? b.total - a.total : a.lastName.localeCompare(b.lastName)
  )
}

export default function BreakdownView({
  byStudent,
  byInstructor,
  totalEntries,
}: {
  byStudent: StudentBreakdown[]
  byInstructor: InstructorBreakdown[]
  totalEntries: number
}) {
  const [tab, setTab] = useState<'student' | 'instructor'>('student')
  const [expandedStudents, setExpandedStudents] = useState<Set<number>>(new Set())
  const [expandedInstructors, setExpandedInstructors] = useState<Set<number>>(new Set())

  function toggleStudent(id: number) {
    setExpandedStudents(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next })
  }
  function toggleInstructor(id: number) {
    setExpandedInstructors(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next })
  }

  return (
    <div className="space-y-4">
      <div className="card px-5 py-4 flex items-center gap-4">
        <div className="text-4xl font-bold">{totalEntries}</div>
        <div className="text-sm" style={{ color: 'var(--muted)' }}>Total heat entries from your studio</div>
      </div>

      <div className="flex gap-1 p-1 w-fit" style={{ backgroundColor: 'var(--border)', borderRadius: 4 }}>
        {([{ key: 'student', label: 'By Student' }, { key: 'instructor', label: 'By Teacher' }] as const).map(({ key, label }) => (
          <button key={key} onClick={() => setTab(key)} className="px-4 py-1.5 text-sm font-medium"
            style={{ backgroundColor: tab === key ? '#333' : 'transparent', color: tab === key ? 'white' : 'var(--muted)', borderRadius: 3 }}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'student' && (
        <div className="space-y-4">
          {(['Leader', 'Follower'] as const).map(role => {
            const group = sortByTotal(byStudent.filter(s => s.role === role))
            if (group.length === 0) return null
            return (
              <div key={role}>
                <div className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--muted)' }}>{role}s</div>
                <div className="card overflow-hidden">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Student</th>
                        <th style={{ width: 60, textAlign: 'center' }}>Entries</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.map(student => (
                        <Fragment key={student.id}>
                          <tr onClick={() => toggleStudent(student.id)} style={{ cursor: 'pointer' }} className="hover:bg-gray-50">
                            <td className="font-medium">
                              <span className="mr-2 text-xs" style={{ color: 'var(--muted)' }}>{expandedStudents.has(student.id) ? '▾' : '›'}</span>
                              {student.name}
                            </td>
                            <td style={{ textAlign: 'center', fontWeight: 700 }}>
                              {student.total || '—'}
                              {student.showCount > 0 && (
                                <span style={{ display: 'block', fontSize: '0.65rem', fontWeight: 500, color: '#7c3aed' }}>
                                  {student.heatTotal}h + {student.showCount}s
                                </span>
                              )}
                            </td>
                          </tr>
                          {expandedStudents.has(student.id) && student.byInstructor.map(row => (
                            <tr key={row.instructor} style={{ backgroundColor: '#f9f9f9' }}>
                              <td style={{ paddingLeft: 24, verticalAlign: 'top' }}>
                                <div style={{ fontWeight: 600, fontSize: '0.8rem', marginBottom: 2 }}>{row.instructor}</div>
                                <DanceTable rows={row.danceRows} />
                              </td>
                              <td style={{ textAlign: 'center', fontWeight: 600, fontSize: '0.8rem', verticalAlign: 'top', paddingTop: 2 }}>{row.total}</td>
                            </tr>
                          ))}
                        </Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {tab === 'instructor' && (
        <div className="card overflow-hidden">
          <table className="data-table">
            <thead>
              <tr>
                <th>Teacher</th>
                <th style={{ width: 60, textAlign: 'center' }}>Entries</th>
              </tr>
            </thead>
            <tbody>
              {sortByTotal(byInstructor).map(inst => (
                <Fragment key={inst.id}>
                  <tr onClick={() => toggleInstructor(inst.id)} style={{ cursor: 'pointer' }} className="hover:bg-gray-50">
                    <td className="font-medium">
                      <span className="mr-2 text-xs" style={{ color: 'var(--muted)' }}>{expandedInstructors.has(inst.id) ? '▾' : '›'}</span>
                      {inst.name}
                    </td>
                    <td style={{ textAlign: 'center', fontWeight: 700 }}>
                      {inst.total || '—'}
                      {inst.showCount > 0 && (
                        <span style={{ display: 'block', fontSize: '0.65rem', fontWeight: 500, color: '#7c3aed' }}>
                          {inst.heatTotal}h + {inst.showCount}s
                        </span>
                      )}
                    </td>
                  </tr>
                  {expandedInstructors.has(inst.id) && sortByTotal(inst.byStudent).map(row => (
                    <tr key={row.studentId} style={{ backgroundColor: '#f9f9f9' }}>
                      <td style={{ paddingLeft: 24, verticalAlign: 'top' }}>
                        <div style={{ fontWeight: 600, fontSize: '0.8rem', marginBottom: 2 }}>{row.name}</div>
                        <DanceTable rows={row.danceRows} />
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: 600, fontSize: '0.8rem', verticalAlign: 'top', paddingTop: 2 }}>{row.total}</td>
                    </tr>
                  ))}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
