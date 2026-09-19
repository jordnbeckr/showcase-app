import { db } from '@/lib/db'
import { getSession } from '@/lib/session'
import HeatSheetAccordion, { PrintAllButton } from './HeatSheetAccordion'

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

  // Students from other studios shared into this studio (need unified heat sheets)
  const sharedAccess = await db.studentStudioAccess.findMany({ where: { studioId: studio.id }, select: { studentId: true } })
  const sharedStudentIds = sharedAccess.map(a => a.studentId)

  // Students home to this studio who are shared OUT to other studios (also need unified sheets)
  const sharedOutAccess = await db.studentStudioAccess.findMany({
    where: { studentId: { in: studentIds } },
    select: { studentId: true },
  })
  const sharedOutStudentIds = sharedOutAccess.map(a => a.studentId)

  // All student IDs that need unified (all-studio) entries
  const unifiedStudentIds = new Set([...sharedStudentIds, ...sharedOutStudentIds])

  const [studentEntries, instructorEntries, studentEvents, allEvents, floorAssignments, floors] = await Promise.all([
    db.heatEntry.findMany({
      // Home students + shared-in students (by studentId), filtered to exclude cross-studio entries for non-unified students
      where: {
        OR: [
          { student: { studioId: studio.id } },
          { studentId: { in: sharedStudentIds } },
        ],
      },
      include: { heat: { include: { danceType: true } }, instructor: true, student: true, partnerStudent: true },
      orderBy: { heat: { number: 'asc' } },
    }),
    db.heatEntry.findMany({
      where: { instructorId: { in: instructorIds } },
      include: { heat: { include: { danceType: true } }, student: true, instructor: true },
      orderBy: { heat: { number: 'asc' } },
    }),
    db.studentEvent.findMany({
      where: { studentId: { in: [...studentIds, ...sharedStudentIds] } },
      include: { event: true, instructor: true },
    }),
    db.event.findMany({
      include: {
        heats: { include: { heat: { include: { danceType: true } } } },
        compRound: true,
      },
      orderBy: { order: 'asc' },
    }),
    db.heatFloorAssignment.findMany({ where: { studentId: { in: studentIds } }, include: { floor: true } }),
    db.floor.findMany({ orderBy: { order: 'asc' } }),
  ])

  // floor lookup: studentId × heatId → floorLabel
  const floorLabel = new Map<string, string>()
  for (const a of floorAssignments) {
    floorLabel.set(`${a.studentId}-${a.heatId}`, a.floor.label)
  }

  // For semifinal competitive events, label the first half of heats "Semi" and second half "Final"
  const heatRoundLabel = new Map<number, string>()
  for (const evt of allEvents) {
    if (!evt.isCompetitive || evt.compRound?.round !== 'semifinal') continue
    const sortedHeats = [...evt.heats].sort((a, b) => a.heat.number - b.heat.number)
    const half = Math.ceil(sortedHeats.length / 2)
    sortedHeats.forEach((eh, i) => {
      heatRoundLabel.set(eh.heatId, i < half ? 'Semi' : 'Final')
    })
  }

  const studentHeatEventName = new Map<number, Map<number, string>>()
  for (const se of studentEvents) {
    if (!studentHeatEventName.has(se.studentId)) studentHeatEventName.set(se.studentId, new Map())
    const evt = allEvents.find(e => e.id === se.eventId)
    if (!evt) continue
    for (const eh of evt.heats) studentHeatEventName.get(se.studentId)!.set(eh.heatId, se.event.name)
  }

  type SimpleEntry = { id: number; heatNumber: number; dance: string; category: string; partnerName: string; floorLabel: string | null; roundLabel: string | null }
  type SimpleSeg = { type: 'event'; eventName: string; entries: SimpleEntry[] } | { type: 'solo'; entry: SimpleEntry }

  function buildSegments(entries: typeof studentEntries, heatEventMap: Map<number, string>, partnerIsInstructor: boolean, ownStudentId?: number): SimpleSeg[] {
    // Group key = eventName + round phase so semi and final emit as separate blocks
    const eventGroups = new Map<string, SimpleEntry[]>()
    function toSimple(e: typeof studentEntries[number]): SimpleEntry {
      const sid = ownStudentId ?? e.studentId
      return {
        id: e.id,
        heatNumber: e.heat.number,
        dance: e.heat.danceType.name,
        category: e.heat.category,
        partnerName: partnerIsInstructor
          ? e.instructor?.name ?? (e.partnerStudent ? `${e.partnerStudent.firstName} ${e.partnerStudent.lastName}` : '—')
          : `${(e as typeof instructorEntries[number]).student.firstName} ${(e as typeof instructorEntries[number]).student.lastName}`,
        floorLabel: floorLabel.get(`${sid}-${e.heatId}`) ?? null,
        roundLabel: heatRoundLabel.get(e.heatId) ?? null,
      }
    }
    function groupKey(evtName: string, roundLabel: string | null) {
      return roundLabel ? `${evtName}||${roundLabel}` : evtName
    }
    function displayName(evtName: string, roundLabel: string | null) {
      return roundLabel ? `${evtName} — ${roundLabel}` : evtName
    }
    for (const e of entries) {
      const evtName = heatEventMap.get(e.heatId)
      if (evtName) {
        const key = groupKey(evtName, heatRoundLabel.get(e.heatId) ?? null)
        if (!eventGroups.has(key)) eventGroups.set(key, [])
        eventGroups.get(key)!.push(toSimple(e))
      }
    }
    const segs: SimpleSeg[] = []
    const emitted = new Set<string>()
    for (const e of entries) {
      const evtName = heatEventMap.get(e.heatId)
      if (evtName) {
        const roundLabel = heatRoundLabel.get(e.heatId) ?? null
        const key = groupKey(evtName, roundLabel)
        if (!emitted.has(key)) {
          emitted.add(key)
          segs.push({ type: 'event', eventName: displayName(evtName, roundLabel), entries: eventGroups.get(key)! })
        }
      } else {
        segs.push({ type: 'solo', entry: toSimple(e) })
      }
    }
    return segs
  }

  const studentMap = new Map<number, { student: { id: number; firstName: string; lastName: string; role: string; leaderNumber: number | null }; entries: typeof studentEntries }>()
  for (const s of studio.students) studentMap.set(s.id, { student: s, entries: [] })
  // Also add shared-in students (from other studios) to the map
  for (const e of studentEntries) {
    if (!studentMap.has(e.studentId) && sharedStudentIds.includes(e.studentId)) {
      studentMap.set(e.studentId, { student: e.student, entries: [] })
    }
  }
  for (const e of studentEntries) studentMap.get(e.studentId)?.entries.push(e)

  // For competitive events, synthesize entries for any heats not yet in the student's HeatEntry records.
  // This covers cases where semifinal heats were linked to the event after enrollment was published.
  for (const se of studentEvents) {
    const evt = allEvents.find(e => e.id === se.eventId)
    if (!evt?.isCompetitive) continue
    const data = studentMap.get(se.studentId)
    if (!data) continue
    for (const eh of evt.heats) {
      if (data.entries.some(e => e.heatId === eh.heatId)) continue
      // Synthesize a minimal entry so it appears on the heat sheet
      data.entries.push({
        id: -(se.studentId * 100000 + eh.heatId),
        heatId: eh.heatId,
        studentId: se.studentId,
        instructorId: se.instructorId,
        partnerStudentId: null,
        heat: { number: eh.heat.number, category: eh.heat.category, danceType: { name: eh.heat.danceType.name } },
        student: data.student as typeof studentEntries[number]['student'],
        instructor: se.instructor ? { name: se.instructor.name } as typeof studentEntries[number]['instructor'] : null,
        partnerStudent: null,
      } as typeof studentEntries[number])
    }
    // Keep entries sorted by heat number
    data.entries.sort((a, b) => a.heat.number - b.heat.number)
  }

  const instructorMap = new Map<number, { instructor: typeof studio.instructors[number]; entries: typeof instructorEntries }>()
  for (const i of studio.instructors) instructorMap.set(i.id, { instructor: i, entries: [] })
  for (const e of instructorEntries) if (e.instructorId !== null) instructorMap.get(e.instructorId)?.entries.push(e)

  const studentSheets = [...studentMap.values()]
    .filter(s => s.entries.length > 0)
    .map(({ student, entries }) => ({
      sheetId: `sheet-student-${student.id}`,
      name: `${student.firstName} ${student.lastName}`,
      subtitle: sharedStudentIds.includes(student.id)
        ? `${student.role} · Shared (${studio.name})`
        : `${student.role} · ${studio.name}`,
      leaderNumber: student.leaderNumber,
      entryCount: entries.length,
      headerColor: '#1a2744',
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
        headerColor: '#608040',
        segments: buildSegments(entries as typeof studentEntries, instrHeatEventMap, false),
      }
    })

  return (
    <>
      <div className="mb-4">
        <h1 className="text-xl font-bold text-center mb-1">Heat Sheets — {studio.name}</h1>
        <p className="text-sm text-center" style={{ color: 'var(--muted)' }}>Click a name to expand. Click PDF to open a print-ready sheet.</p>
      </div>

      {studentSheets.length > 0 && (
        <div className="mb-2 flex items-center justify-between">
          <p style={{ color: 'var(--muted)', letterSpacing: '0.05em', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 600 }}>Students</p>
          <PrintAllButton sheets={studentSheets} label="Students" />
        </div>
      )}
      <HeatSheetAccordion sheets={studentSheets} />

      {instructorSheets.length > 0 && (
        <div className="mt-6 mb-2 flex items-center justify-between" style={{ borderTop: '2px solid var(--border)', paddingTop: 16 }}>
          <p style={{ color: 'var(--muted)', letterSpacing: '0.05em', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 600 }}>Instructors</p>
          <PrintAllButton sheets={instructorSheets} label="Instructors" />
        </div>
      )}
      <HeatSheetAccordion sheets={instructorSheets} />
    </>
  )
}
