import { db } from '@/lib/db'
import { getSession } from '@/lib/session'
import PrintStudentButton from './PrintStudentButton'
import { Fragment } from 'react'

export default async function HeatSheetPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const session = await getSession()
  if (session?.role !== 'studio') return null

  const studio = await db.studio.findUnique({
    where: { slug },
    include: {
      students: { orderBy: [{ role: 'asc' }, { lastName: 'asc' }] },
      instructors: { orderBy: { name: 'asc' } },
    },
  })
  if (!studio) return <p>Studio not found</p>

  const studentIds = studio.students.map(s => s.id)
  const instructorIds = studio.instructors.map(i => i.id)

  const [studentEntries, instructorEntries, studentEvents, allEvents] = await Promise.all([
    db.heatEntry.findMany({
      where: { student: { studioId: studio.id } },
      include: {
        heat: { include: { danceType: true } },
        instructor: true,
        student: true,
      },
      orderBy: { heat: { number: 'asc' } },
    }),
    db.heatEntry.findMany({
      where: { instructorId: { in: instructorIds } },
      include: {
        heat: { include: { danceType: true } },
        student: true,
        instructor: true,
      },
      orderBy: { heat: { number: 'asc' } },
    }),
    db.studentEvent.findMany({
      where: { studentId: { in: studentIds } },
      include: { event: true },
    }),
    db.event.findMany({
      include: { heats: true },
      orderBy: { order: 'asc' },
    }),
  ])

  // studentId → Map<heatId, eventName>
  const studentHeatEventName = new Map<number, Map<number, string>>()
  for (const se of studentEvents) {
    if (!studentHeatEventName.has(se.studentId)) {
      studentHeatEventName.set(se.studentId, new Map())
    }
    const evt = allEvents.find(e => e.id === se.eventId)
    if (!evt) continue
    for (const eh of evt.heats) {
      studentHeatEventName.get(se.studentId)!.set(eh.heatId, se.event.name)
    }
  }

  // Group student entries by student
  const studentMap = new Map<number, {
    student: typeof studio.students[number]
    entries: typeof studentEntries
  }>()
  for (const s of studio.students) studentMap.set(s.id, { student: s, entries: [] })
  for (const e of studentEntries) studentMap.get(e.studentId)?.entries.push(e)
  const studentSheets = [...studentMap.values()].filter(s => s.entries.length > 0)

  // Group instructor entries by instructor
  const instructorMap = new Map<number, {
    instructor: typeof studio.instructors[number]
    entries: typeof instructorEntries
  }>()
  for (const i of studio.instructors) instructorMap.set(i.id, { instructor: i, entries: [] })
  for (const e of instructorEntries) instructorMap.get(e.instructorId)?.entries.push(e)
  const instructorSheets = [...instructorMap.values()].filter(i => i.entries.length > 0)

  type AnyEntry = typeof studentEntries[number] | typeof instructorEntries[number]
  type Seg =
    | { type: 'event'; eventName: string; entries: AnyEntry[] }
    | { type: 'solo'; entry: AnyEntry }

  function buildSegments(entries: AnyEntry[], heatEventMap: Map<number, string>): Seg[] {
    const eventGroups = new Map<string, AnyEntry[]>()
    for (const entry of entries) {
      const evtName = heatEventMap.get(entry.heatId)
      if (evtName) {
        if (!eventGroups.has(evtName)) eventGroups.set(evtName, [])
        eventGroups.get(evtName)!.push(entry)
      }
    }
    const segments: Seg[] = []
    const emitted = new Set<string>()
    for (const entry of entries) {
      const evtName = heatEventMap.get(entry.heatId)
      if (evtName) {
        if (!emitted.has(evtName)) {
          emitted.add(evtName)
          segments.push({ type: 'event', eventName: evtName, entries: eventGroups.get(evtName)! })
        }
      } else {
        segments.push({ type: 'solo', entry })
      }
    }
    return segments
  }

  function renderSheetTable(segments: Seg[], showStudent: boolean) {
    const colSpan = showStudent ? 3 : 3
    return (
      <table className="data-table">
        <thead>
          <tr>
            <th style={{ width: 52, textAlign: 'center' }}>#</th>
            <th style={{ width: 180 }}>Dance</th>
            <th>{showStudent ? 'Student' : 'Instructor'}</th>
          </tr>
        </thead>
        <tbody>
          {segments.map((seg, i) => {
            if (seg.type === 'solo') {
              const e = seg.entry
              return (
                <tr key={e.id}>
                  <td style={{ fontFamily: 'monospace', textAlign: 'center', fontSize: '0.85rem' }}>{e.heat.number}</td>
                  <td>{e.heat.danceType.name}</td>
                  <td style={{ fontSize: '0.9rem' }}>
                    {showStudent
                      ? `${(e as typeof studentEntries[number]).instructor.name}`
                      : `${(e as typeof instructorEntries[number]).student.firstName} ${(e as typeof instructorEntries[number]).student.lastName}`}
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
                {seg.entries.map(e => (
                  <tr key={e.id} style={{ backgroundColor: '#7ecfa0' }}>
                    <td style={{ fontFamily: 'monospace', textAlign: 'center', fontSize: '0.85rem', borderLeft: '3px solid #555' }}>{e.heat.number}</td>
                    <td style={{ fontSize: '0.8125rem' }}>{e.heat.danceType.name}</td>
                    <td style={{ fontSize: '0.8125rem' }}>
                      {showStudent
                        ? `${(e as typeof studentEntries[number]).instructor.name}`
                        : `${(e as typeof instructorEntries[number]).student.firstName} ${(e as typeof instructorEntries[number]).student.lastName}`}
                    </td>
                  </tr>
                ))}
              </Fragment>
            )
          })}
        </tbody>
      </table>
    )
  }

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          header { display: none !important; }
          nav { display: none !important; }
        }
        @media print {
          .sheet-section { display: none !important; }
          .sheet-section.printing-target { display: block !important; }
        }
        @media print {
          body:not(:has(.printing-target)) .sheet-section { display: block !important; }
        }
        .sheet-section + .sheet-section { page-break-before: always; }
      `}</style>

      <div className="no-print mb-6">
        <h1 className="text-xl font-bold mb-1">Heat Sheets — {studio.name}</h1>
        <p className="text-sm" style={{ color: 'var(--muted)' }}>Click "Print" next to any name to print their sheet.</p>
      </div>

      {/* ── Student Sheets ── */}
      {studentSheets.length > 0 && (
        <div className="no-print mb-2">
          <h2 className="text-base font-semibold" style={{ color: 'var(--muted)', letterSpacing: '0.05em', textTransform: 'uppercase', fontSize: '0.75rem' }}>Students</h2>
        </div>
      )}

      <div className="space-y-8">
        {studentSheets.map(({ student, entries }) => {
          const heatEventMap = studentHeatEventName.get(student.id) ?? new Map<number, string>()
          const segments = buildSegments(entries, heatEventMap)
          const sheetId = `sheet-student-${student.id}`
          return (
            <div key={student.id} id={sheetId} className="sheet-section">
              <div className="px-5 py-3 mb-3" style={{ backgroundColor: '#1a1a1a', color: 'white', borderRadius: 4 }}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-lg font-bold">{student.firstName} {student.lastName}</div>
                    <div className="text-sm opacity-70">{student.role} · {studio.name}</div>
                  </div>
                  <div className="flex items-center gap-4">
                    {student.leaderNumber && (
                      <div className="text-right">
                        <div className="text-3xl font-bold">{student.leaderNumber}</div>
                        <div className="text-xs opacity-60">Leader #</div>
                      </div>
                    )}
                    <PrintStudentButton sheetId={sheetId} />
                  </div>
                </div>
              </div>
              {renderSheetTable(segments, true)}
              <div className="mt-2 text-xs no-print" style={{ color: 'var(--muted)' }}>
                {entries.length} heat{entries.length !== 1 ? 's' : ''} total
              </div>
            </div>
          )
        })}

        {/* ── Instructor Sheets ── */}
        {instructorSheets.length > 0 && (
          <div className="no-print pt-4 pb-2" style={{ borderTop: '2px solid var(--border)' }}>
            <h2 className="text-base font-semibold" style={{ color: 'var(--muted)', letterSpacing: '0.05em', textTransform: 'uppercase', fontSize: '0.75rem' }}>Instructors</h2>
          </div>
        )}

        {instructorSheets.map(({ instructor, entries }) => {
          // For instructor sheets, build a per-student heatEventMap union
          // (instructor teaches multiple students who may each have different event enrollments)
          const instrHeatEventMap = new Map<number, string>()
          for (const e of entries) {
            const evtName = studentHeatEventName.get(e.studentId)?.get(e.heatId)
            if (evtName) instrHeatEventMap.set(e.heatId, evtName)
          }
          const segments = buildSegments(entries, instrHeatEventMap)
          const sheetId = `sheet-instructor-${instructor.id}`
          return (
            <div key={instructor.id} id={sheetId} className="sheet-section">
              <div className="px-5 py-3 mb-3" style={{ backgroundColor: '#2c4a2c', color: 'white', borderRadius: 4 }}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-lg font-bold">{instructor.name}</div>
                    <div className="text-sm opacity-70">Instructor · {studio.name}</div>
                  </div>
                  <div className="flex items-center gap-4">
                    {instructor.leaderNumber && (
                      <div className="text-right">
                        <div className="text-3xl font-bold">{instructor.leaderNumber}</div>
                        <div className="text-xs opacity-60">Leader #</div>
                      </div>
                    )}
                    <PrintStudentButton sheetId={sheetId} />
                  </div>
                </div>
              </div>
              {renderSheetTable(segments, false)}
              <div className="mt-2 text-xs no-print" style={{ color: 'var(--muted)' }}>
                {entries.length} heat{entries.length !== 1 ? 's' : ''} total
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}
