import { db } from '@/lib/db'
import { getSession } from '@/lib/session'
import HeatSheetAccordion from './HeatSheetAccordion'

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

  const [studentEntries, instructorEntries, studentEvents, allEvents, floorAssignments, floors] = await Promise.all([
    db.heatEntry.findMany({
      where: { student: { studioId: studio.id } },
      include: { heat: { include: { danceType: true } }, instructor: true, student: true, partnerStudent: true },
      orderBy: { heat: { number: 'asc' } },
    }),
    db.heatEntry.findMany({
      where: { instructorId: { in: instructorIds } },
      include: { heat: { include: { danceType: true } }, student: true, instructor: true },
      orderBy: { heat: { number: 'asc' } },
    }),
    db.studentEvent.findMany({ where: { studentId: { in: studentIds } }, include: { event: true } }),
    db.event.findMany({ include: { heats: true }, orderBy: { order: 'asc' } }),
    db.heatFloorAssignment.findMany({ where: { studentId: { in: studentIds } }, include: { floor: true } }),
    db.floor.findMany({ orderBy: { order: 'asc' } }),
  ])

  // floor lookup: studentId × heatId → floorLabel
  const floorLabel = new Map<string, string>()
  for (const a of floorAssignments) {
    floorLabel.set(`${a.studentId}-${a.heatId}`, a.floor.label)
  }

  const studentHeatEventName = new Map<number, Map<number, string>>()
  for (const se of studentEvents) {
    if (!studentHeatEventName.has(se.studentId)) studentHeatEventName.set(se.studentId, new Map())
    const evt = allEvents.find(e => e.id === se.eventId)
    if (!evt) continue
    for (const eh of evt.heats) studentHeatEventName.get(se.studentId)!.set(eh.heatId, se.event.name)
  }

  type SimpleEntry = { id: number; heatNumber: number; dance: string; partnerName: string; floorLabel: string | null }
  type SimpleSeg = { type: 'event'; eventName: string; entries: SimpleEntry[] } | { type: 'solo'; entry: SimpleEntry }

  function buildSegments(entries: typeof studentEntries, heatEventMap: Map<number, string>, partnerIsInstructor: boolean, ownStudentId?: number): SimpleSeg[] {
    const eventGroups = new Map<string, SimpleEntry[]>()
    function toSimple(e: typeof studentEntries[number]): SimpleEntry {
      const sid = ownStudentId ?? e.studentId
      return {
        id: e.id,
        heatNumber: e.heat.number,
        dance: e.heat.danceType.name,
        partnerName: partnerIsInstructor
          ? e.instructor?.name ?? (e.partnerStudent ? `${e.partnerStudent.firstName} ${e.partnerStudent.lastName}` : '—')
          : `${(e as typeof instructorEntries[number]).student.firstName} ${(e as typeof instructorEntries[number]).student.lastName}`,
        floorLabel: floorLabel.get(`${sid}-${e.heatId}`) ?? null,
      }
    }
    for (const e of entries) {
      const evtName = heatEventMap.get(e.heatId)
      if (evtName) {
        if (!eventGroups.has(evtName)) eventGroups.set(evtName, [])
        eventGroups.get(evtName)!.push(toSimple(e))
      }
    }
    const segs: SimpleSeg[] = []
    const emitted = new Set<string>()
    for (const e of entries) {
      const evtName = heatEventMap.get(e.heatId)
      if (evtName) {
        if (!emitted.has(evtName)) { emitted.add(evtName); segs.push({ type: 'event', eventName: evtName, entries: eventGroups.get(evtName)! }) }
      } else {
        segs.push({ type: 'solo', entry: toSimple(e) })
      }
    }
    return segs
  }

  const studentMap = new Map<number, { student: typeof studio.students[number]; entries: typeof studentEntries }>()
  for (const s of studio.students) studentMap.set(s.id, { student: s, entries: [] })
  for (const e of studentEntries) studentMap.get(e.studentId)?.entries.push(e)

  const instructorMap = new Map<number, { instructor: typeof studio.instructors[number]; entries: typeof instructorEntries }>()
  for (const i of studio.instructors) instructorMap.set(i.id, { instructor: i, entries: [] })
  for (const e of instructorEntries) if (e.instructorId !== null) instructorMap.get(e.instructorId)?.entries.push(e)

  const studentSheets = [...studentMap.values()]
    .filter(s => s.entries.length > 0)
    .map(({ student, entries }) => ({
      sheetId: `sheet-student-${student.id}`,
      name: `${student.firstName} ${student.lastName}`,
      subtitle: `${student.role} · ${studio.name}`,
      leaderNumber: student.leaderNumber,
      entryCount: entries.length,
      headerColor: '#1a1a1a',
      segments: buildSegments(entries, studentHeatEventName.get(student.id) ?? new Map(), true, student.id),
    }))

  const instructorSheets = [...instructorMap.values()]
    .filter(i => i.entries.length > 0)
    .sort((a, b) => b.entries.length !== a.entries.length
      ? b.entries.length - a.entries.length
      : (a.instructor.name.split(' ').pop() ?? '').localeCompare(b.instructor.name.split(' ').pop() ?? ''))
    .map(({ instructor, entries }) => {
      const instrHeatEventMap = new Map<number, string>()
      for (const e of entries) {
        const evtName = studentHeatEventName.get(e.studentId)?.get(e.heatId)
        if (evtName) instrHeatEventMap.set(e.heatId, evtName)
      }
      return {
        sheetId: `sheet-instructor-${instructor.id}`,
        name: instructor.name,
        subtitle: `Instructor · ${studio.name}`,
        leaderNumber: instructor.leaderNumber,
        entryCount: entries.length,
        headerColor: '#2c4a2c',
        segments: buildSegments(entries as typeof studentEntries, instrHeatEventMap, false),
      }
    })

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          header { display: none !important; }
          .sheet-section { display: none !important; }
          .sheet-section.printing-target { display: block !important; }
          .sheet-section.printing-target .sheet-table-content { display: block !important; }
        }
        .sheet-section + .sheet-section { page-break-before: always; }
      `}</style>

      <div className="mb-4">
        <h1 className="text-xl font-bold mb-1">Heat Sheets — {studio.name}</h1>
        <p className="text-sm no-print" style={{ color: 'var(--muted)' }}>Click a name to expand. Click "Print" to print their sheet.</p>
      </div>

      {studentSheets.length > 0 && (
        <div className="mb-2">
          <p style={{ color: 'var(--muted)', letterSpacing: '0.05em', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 600 }}>Students</p>
        </div>
      )}
      <HeatSheetAccordion sheets={studentSheets} />

      {instructorSheets.length > 0 && (
        <div className="mt-6 mb-2" style={{ borderTop: '2px solid var(--border)', paddingTop: 16 }}>
          <p style={{ color: 'var(--muted)', letterSpacing: '0.05em', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 600 }}>Instructors</p>
        </div>
      )}
      <HeatSheetAccordion sheets={instructorSheets} />
    </>
  )
}
