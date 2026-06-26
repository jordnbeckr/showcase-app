import { Fragment } from 'react'

type Entry = {
  student: { firstName: string; lastName: string; studio: { name: string } }
  instructor: { name: string; studio: { name: string } }
}

type Heat = {
  id: number
  number: number
  maxCapacity: number
  danceType: { name: string }
  entries: Entry[]
}

type Studio = {
  id: number
  name: string
  instructors: { id: number; name: string }[]
}

type EventInfo = { id: number; name: string; heatIds: number[] }

function statusInfo(count: number, max: number) {
  if (count >= max) return { label: 'FULL', color: '#dc2626' }
  if (count >= Math.floor(max * 0.75)) return { label: 'Filling Up', color: '#ea580c' }
  if (count >= Math.floor(max / 2)) return { label: 'Half Full', color: '#d97706' }
  return { label: 'Open', color: '#16a34a' }
}

export default function HeatSheet({
  heats,
  studios,
  events = [],
  adminView = false,
}: {
  heats: Heat[]
  studios: Studio[]
  events?: EventInfo[]
  adminView?: boolean
}) {
  const colCount = adminView ? 4 : 3 + studios.length

  // Build segments in heat-number order (same logic as sign-up and view pages)
  type Seg =
    | { type: 'event'; event: EventInfo; heats: Heat[] }
    | { type: 'heat'; heat: Heat }

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

  function renderHeatRow(heat: Heat, inEvent = false) {
    const { label, color } = statusInfo(heat.entries.length, heat.maxCapacity)
    return (
      <tr key={heat.id} style={{ backgroundColor: inEvent ? '#7ecfa0' : undefined }}>
        <td style={{
          color: inEvent ? '#aaa' : 'var(--muted)',
          fontFamily: 'monospace',
          textAlign: 'center',
          fontSize: '0.75rem',
          borderLeft: inEvent ? '3px solid #555' : undefined,
        }}>
          {heat.number}
        </td>
        <td style={{ fontSize: '0.8125rem' }}>{heat.danceType.name}</td>
        <td>
          <span style={{ color, fontWeight: 600, fontSize: '0.75rem' }}>{label}</span>
          <span className="ml-1 text-xs" style={{ color: 'var(--muted)' }}>({heat.entries.length}/{heat.maxCapacity})</span>
        </td>
        {adminView ? (
          <td>
            <div className="flex flex-wrap gap-1">
              {heat.entries.map((e, i) => (
                <span
                  key={i}
                  className="text-xs px-1.5 py-0.5"
                  style={{ backgroundColor: '#ebebeb', borderRadius: 3, border: '1px solid var(--border)' }}
                >
                  {e.student.firstName} {e.student.lastName}
                  <span className="ml-1" style={{ color: 'var(--muted)' }}>({e.student.studio.name})</span>
                </span>
              ))}
            </div>
          </td>
        ) : (
          studios.map(studio => {
            const studioEntries = heat.entries.filter(e => e.instructor.studio.name === studio.name)
            return (
              <td key={studio.id} style={{ textAlign: 'center' }}>
                {studioEntries.length > 0 ? (
                  <div className="flex flex-wrap gap-1 justify-center">
                    {studioEntries.map((e, i) => (
                      <span key={i} className="text-xs px-1.5 py-0.5" style={{ backgroundColor: '#e8e8e8', borderRadius: 3 }}>
                        {e.student.firstName} {e.student.lastName}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span style={{ color: 'var(--border)' }}>—</span>
                )}
              </td>
            )
          })
        )}
      </tr>
    )
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="data-table" style={{ minWidth: adminView ? 600 : 400 + studios.length * 120 }}>
        <thead>
          <tr>
            <th style={{ width: 56 }}>#</th>
            <th style={{ width: 180 }}>Dance</th>
            <th style={{ width: 120 }}>Status</th>
            {adminView
              ? <th>Entries</th>
              : studios.map(s => (
                  <th key={s.id} style={{ textAlign: 'center', minWidth: 110 }}>{s.name}</th>
                ))
            }
          </tr>
        </thead>
        <tbody>
          {segments.map(seg => {
            if (seg.type === 'heat') return renderHeatRow(seg.heat)
            const { event, heats: evtHeats } = seg
            return (
              <Fragment key={`evtseg-${event.id}`}>
                <tr>
                  <td
                    colSpan={colCount}
                    style={{
                      backgroundColor: '#2c2c2c',
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
                {evtHeats.map(h => renderHeatRow(h, true))}
              </Fragment>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
