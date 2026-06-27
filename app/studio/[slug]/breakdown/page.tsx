import { db } from '@/lib/db'
import { getSession } from '@/lib/session'
import BreakdownView from './BreakdownView'

export default async function BreakdownPage({ params }: { params: Promise<{ slug: string }> }) {
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

  const [entries, allEvents, studentEvents, studentShows] = await Promise.all([
    db.heatEntry.findMany({
      where: { instructor: { studioId: studio.id } },
      include: {
        heat: { include: { danceType: true } },
        student: true,
        instructor: true,
      },
      orderBy: { heat: { number: 'asc' } },
    }),
    db.event.findMany({
      include: { heats: true },
      orderBy: { order: 'asc' },
    }),
    db.studentEvent.findMany({
      where: { student: { studioId: studio.id } },
    }),
    db.studentShow.findMany({
      where: { students: { some: { studioId: studio.id } } },
      include: { students: { where: { studioId: studio.id }, select: { id: true } } },
    }),
  ])

  // show count per student
  const showCountByStudent = new Map<number, number>()
  for (const show of studentShows) {
    for (const s of show.students) {
      showCountByStudent.set(s.id, (showCountByStudent.get(s.id) ?? 0) + 1)
    }
  }
  const totalShowEntries = [...showCountByStudent.values()].reduce((a, b) => a + b, 0)

  type DanceRow =
    | { kind: 'solo'; dance: string; count: number }
    | { kind: 'event'; eventId: number; eventName: string; count: number; dances: { dance: string; count: number }[] }

  function buildDanceRows(filteredEntries: typeof entries, forStudentId: number): DanceRow[] {
    const rows: DanceRow[] = []
    const attributedHeatIds = new Set<number>()

    // Use explicit StudentEvent enrollments — no ambiguity
    const enrollments = studentEvents.filter(se => se.studentId === forStudentId)

    for (const enrollment of enrollments) {
      const evt = allEvents.find(e => e.id === enrollment.eventId)
      if (!evt) continue
      const evtHeatIds = evt.heats.map(eh => eh.heatId)
      const evtEntries = filteredEntries.filter(e => evtHeatIds.includes(e.heatId))
      if (evtEntries.length === 0) continue
      evtHeatIds.forEach(id => attributedHeatIds.add(id))

      const danceMap = new Map<string, number>()
      for (const e of evtEntries) {
        const dance = e.heat.danceType.name
        danceMap.set(dance, (danceMap.get(dance) ?? 0) + 1)
      }
      rows.push({
        kind: 'event',
        eventId: evt.id,
        eventName: evt.name,
        count: evtEntries.length,
        dances: [...danceMap.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([dance, count]) => ({ dance, count })),
      })
    }

    // Remaining entries not from any event → solo
    const soloMap = new Map<string, number>()
    for (const e of filteredEntries) {
      if (!attributedHeatIds.has(e.heatId)) {
        const dance = e.heat.danceType.name
        soloMap.set(dance, (soloMap.get(dance) ?? 0) + 1)
      }
    }
    for (const [dance, count] of [...soloMap.entries()].sort(([a], [b]) => a.localeCompare(b))) {
      rows.push({ kind: 'solo', dance, count })
    }

    return rows
  }

  const byStudent = studio.students.map(student => {
    const studentEntries = entries.filter(e => e.studentId === student.id)
    const byInstructor = studio.instructors
      .map(inst => {
        const instEntries = studentEntries.filter(e => e.instructorId === inst.id)
        return { instructor: inst.name, total: instEntries.length, danceRows: buildDanceRows(instEntries, student.id) }
      })
      .filter(r => r.total > 0)
    const showCount = showCountByStudent.get(student.id) ?? 0
    return {
      id: student.id,
      name: `${student.firstName} ${student.lastName}`,
      lastName: student.lastName,
      role: student.role,
      total: studentEntries.length + showCount,
      heatTotal: studentEntries.length,
      showCount,
      byInstructor,
    }
  })

  const byInstructor = studio.instructors.map(inst => {
    const instEntries = entries.filter(e => e.instructorId === inst.id)
    const instLastName = inst.name.trim().split(' ').pop() ?? inst.name
    const byStudentRows = studio.students
      .map(student => {
        const se = instEntries.filter(e => e.studentId === student.id)
        return {
          studentId: student.id,
          name: `${student.firstName} ${student.lastName}`,
          lastName: student.lastName,
          total: se.length,
          danceRows: buildDanceRows(se, student.id),
        }
      })
      .filter(r => r.total > 0)
    return {
      id: inst.id,
      name: inst.name,
      lastName: instLastName,
      total: instEntries.length,
      byStudent: byStudentRows,
    }
  })

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-end gap-4">
        <h1 className="text-xl font-bold">Entry Breakdown — {studio.name}</h1>
        <span className="text-sm pb-0.5" style={{ color: 'var(--muted)' }}>
          {entries.length} heat + {totalShowEntries} show entries
        </span>
      </div>
      <BreakdownView byStudent={byStudent} byInstructor={byInstructor} totalEntries={entries.length + totalShowEntries} />
    </div>
  )
}
