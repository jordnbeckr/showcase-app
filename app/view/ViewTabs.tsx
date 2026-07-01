'use client'

import { Fragment, useState } from 'react'

type HeatData = {
  id: number
  number: number
  dance: string
  maxCapacity: number
  totalEntries: number
  eventNames: string[]
  studioCounts: { studioId: number; count: number }[]
}

type Studio = { id: number; name: string; total: number }

type EventInfo = { id: number; name: string; heatIds: number[] }

type TeacherData = {
  id: number
  name: string
  studioName: string
  totalEntries: number
  students: {
    studentId: number
    studentName: string
    totalEntries: number
    byDance: Record<string, number>
    eventNames: string[]
  }[]
}

function capacityColor(count: number, max: number) {
  if (count >= max) return '#dc2626'
  if (count >= Math.floor(max * 0.75)) return '#ea580c'
  if (count >= Math.floor(max / 2)) return '#d97706'
  return '#16a34a'
}

// ---- By Studio Tab ----
function ByStudioView({ heats, studios, events }: { heats: HeatData[]; studios: Studio[]; events: EventInfo[] }) {
  const colSpan = 3 + studios.length

  // Build segments in heat-number order (same logic as sign-up grid)
  type Seg =
    | { type: 'event'; event: EventInfo; heats: HeatData[] }
    | { type: 'heat'; heat: HeatData }

  const segments: Seg[] = []
  const processedEventIds = new Set<number>()
  const claimedHeatIds = new Set<number>()
  const heatInAnyEvent = new Set(events.flatMap(e => e.heatIds))

  for (const heat of heats) {
    if (claimedHeatIds.has(heat.id)) continue

    const eventsStartingHere = events.filter(evt => {
      if (processedEventIds.has(evt.id)) return false
      const nums = evt.heatIds.map(id => heats.find(h => h.id === id)?.number ?? 9999).sort((a, b) => a - b)
      return nums[0] === heat.number
    })

    if (eventsStartingHere.length > 0) {
      for (const evt of eventsStartingHere) {
        processedEventIds.add(evt.id)
        const evtHeats = heats.filter(h => evt.heatIds.includes(h.id)).sort((a, b) => a.number - b.number)
        evt.heatIds.forEach(id => claimedHeatIds.add(id))
        segments.push({ type: 'event', event: evt, heats: evtHeats })
      }
    } else if (!heatInAnyEvent.has(heat.id)) {
      segments.push({ type: 'heat', heat })
    }
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="data-table" style={{ minWidth: 400 + studios.length * 100 }}>
        <thead>
          <tr>
            <th style={{ width: 52 }}>#</th>
            <th style={{ width: 170 }}>Dance</th>
            <th style={{ width: 100, textAlign: 'center' }}>Total</th>
            {studios.map(s => (
              <th key={s.id} style={{ textAlign: 'center', minWidth: 90 }}>
                <div>{s.name}</div>
                <div style={{ fontWeight: 400, color: 'var(--muted)', fontSize: '0.7rem' }}>
                  {s.total} entries
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {segments.map(seg => {
            if (seg.type === 'heat') {
              const heat = seg.heat
              return (
                <tr key={heat.id}>
                  <td style={{ color: 'var(--muted)', fontFamily: 'monospace', textAlign: 'center', fontSize: '0.75rem' }}>{heat.number}</td>
                  <td>{heat.dance}</td>
                  <td style={{ textAlign: 'center' }}>
                    <span style={{ fontWeight: 600, color: capacityColor(heat.totalEntries, heat.maxCapacity) }}>
                      {heat.totalEntries}
                    </span>
                    <span className="text-xs" style={{ color: 'var(--muted)' }}>/{heat.maxCapacity}</span>
                  </td>
                  {heat.studioCounts.map(sc => (
                    <td key={sc.studioId} style={{ textAlign: 'center' }}>
                      {sc.count > 0 ? <span className="font-semibold text-sm">{sc.count}</span> : <span style={{ color: 'var(--border)' }}>—</span>}
                    </td>
                  ))}
                </tr>
              )
            }

            const { event, heats: evtHeats } = seg
            return (
              <Fragment key={`evtseg-${event.id}`}>
                <tr>
                  <td
                    colSpan={colSpan}
                    style={{
                      backgroundColor: 'var(--header)',
                      color: 'white',
                      fontWeight: 700,
                      fontSize: '0.72rem',
                      letterSpacing: '0.06em',
                      padding: '5px 10px',
                      borderTop: '2px solid #1a1a1a',
                      textTransform: 'uppercase',
                    }}
                  >
                    ◆ {event.name}
                    <span style={{ fontWeight: 400, opacity: 0.55, marginLeft: 10, fontSize: '0.68rem', textTransform: 'none' }}>
                      {event.heatIds.length} dances
                    </span>
                  </td>
                </tr>
                {evtHeats.map(heat => (
                  <tr key={heat.id} style={{ backgroundColor: '#7ecfa0' }}>
                    <td style={{ color: '#aaa', fontFamily: 'monospace', textAlign: 'center', fontSize: '0.72rem', borderLeft: '3px solid #555' }}>{heat.number}</td>
                    <td style={{ fontSize: '0.8125rem' }}>{heat.dance}</td>
                    <td style={{ textAlign: 'center' }}>
                      <span style={{ fontWeight: 600, color: capacityColor(heat.totalEntries, heat.maxCapacity) }}>
                        {heat.totalEntries}
                      </span>
                      <span className="text-xs" style={{ color: 'var(--muted)' }}>/{heat.maxCapacity}</span>
                    </td>
                    {heat.studioCounts.map(sc => (
                      <td key={sc.studioId} style={{ textAlign: 'center' }}>
                        {sc.count > 0 ? <span className="font-semibold text-sm">{sc.count}</span> : <span style={{ color: 'var(--border)' }}>—</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </Fragment>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ---- By Teacher Tab ----
function ByTeacherView({ teacherData }: { teacherData: TeacherData[] }) {
  const [expanded, setExpanded] = useState<Set<number>>(new Set())

  function toggle(id: number) {
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleAll() {
    if (expanded.size === teacherData.length) setExpanded(new Set())
    else setExpanded(new Set(teacherData.map(t => t.id)))
  }

  if (teacherData.length === 0) {
    return <p className="text-sm py-4" style={{ color: 'var(--muted)' }}>No entries yet.</p>
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs" style={{ color: 'var(--muted)' }}>
          Sorted alphabetically. Expand to see per-student breakdowns.
        </p>
        <button
          onClick={toggleAll}
          className="text-xs px-3 py-1.5 font-medium text-white"
          style={{ backgroundColor: '#444', borderRadius: 4 }}
        >
          {expanded.size === teacherData.length ? 'Collapse All' : 'Expand All'}
        </button>
      </div>

      <div className="card overflow-hidden">
        {teacherData.map((teacher, i) => {
          const isOpen = expanded.has(teacher.id)
          return (
            <div key={teacher.id} style={{ borderTop: i > 0 ? '1px solid var(--border)' : undefined }}>
              <button
                onClick={() => toggle(teacher.id)}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-gray-50 transition-colors"
              >
                <span className="w-4 text-xs" style={{ color: 'var(--muted)' }}>{isOpen ? '▾' : '›'}</span>
                <span className="font-semibold text-sm flex-1">{teacher.name}</span>
                <span className="text-xs" style={{ color: 'var(--muted)' }}>{teacher.studioName}</span>
                <span
                  className="text-xs font-bold px-2 py-0.5 ml-2"
                  style={{ backgroundColor: '#333', color: 'white', borderRadius: 3 }}
                >
                  {teacher.totalEntries}
                </span>
              </button>

              {isOpen && (
                <div style={{ backgroundColor: '#f9f9f9', borderTop: '1px solid var(--border)' }}>
                  <table className="data-table" style={{ fontSize: '0.8rem' }}>
                    <thead>
                      <tr>
                        <th style={{ width: 200 }}>Student</th>
                        <th style={{ width: 60, textAlign: 'center' }}>Total</th>
                        <th>Dances</th>
                      </tr>
                    </thead>
                    <tbody>
                      {teacher.students.map(student => (
                        <tr key={student.studentId}>
                          <td style={{ fontWeight: 500 }}>{student.studentName}</td>
                          <td style={{ textAlign: 'center', fontWeight: 700 }}>{student.totalEntries}</td>
                          <td>
                            <div className="flex flex-wrap gap-1">
                              {/* Event enrollments shown as dark pill groups */}
                              {student.eventNames.map(evtName => (
                                <span
                                  key={evtName}
                                  className="text-xs px-1.5 py-0.5"
                                  style={{ backgroundColor: 'var(--header)', color: 'white', borderRadius: 3 }}
                                >
                                  ◆ {evtName}
                                </span>
                              ))}
                              {/* Solo dances (not in events) */}
                              {Object.entries(student.byDance)
                                .sort(([a], [b]) => a.localeCompare(b))
                                .map(([dance, count]) => (
                                  <span
                                    key={dance}
                                    className="text-xs px-1.5 py-0.5"
                                    style={{ backgroundColor: '#e8e8e8', borderRadius: 3, border: '1px solid var(--border)' }}
                                  >
                                    {dance} ×{count}
                                  </span>
                                ))}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ---- Main Tabs ----
export default function ViewTabs({
  heats,
  studios,
  teacherData,
  events,
}: {
  heats: HeatData[]
  studios: Studio[]
  teacherData: TeacherData[]
  events: EventInfo[]
}) {
  const [tab, setTab] = useState<'studio' | 'teacher'>('studio')

  return (
    <div className="space-y-4">
      <div
        className="flex gap-1 p-1 w-fit"
        style={{ backgroundColor: 'var(--border)', borderRadius: 4 }}
      >
        {([
          { key: 'studio', label: 'By Studio (counts)' },
          { key: 'teacher', label: 'By Teacher (names)' },
        ] as const).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className="px-4 py-1.5 text-sm font-medium transition-all"
            style={{
              backgroundColor: tab === key ? '#333' : 'transparent',
              color: tab === key ? 'white' : 'var(--muted)',
              borderRadius: 3,
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'studio'
        ? <ByStudioView heats={heats} studios={studios} events={events} />
        : <ByTeacherView teacherData={teacherData} />
      }
    </div>
  )
}
