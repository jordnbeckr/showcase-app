import { db } from '@/lib/db'
import { getSession } from '@/lib/session'
import ViewTabs from './ViewTabs'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function PublicView() {
  const session = await getSession()
  const [heats, studios, events, studentEvents] = await Promise.all([
    db.heat.findMany({
      include: {
        danceType: true,
        entries: {
          include: {
            student: { include: { studio: true } },
            instructor: { include: { studio: true } },
          },
        },
      },
      orderBy: { number: 'asc' },
    }),
    db.studio.findMany({
      include: { instructors: { orderBy: { name: 'asc' } } },
      orderBy: { name: 'asc' },
    }),
    db.event.findMany({
      include: { heats: { orderBy: { heat: { number: 'asc' } } } },
      orderBy: { order: 'asc' },
    }),
    db.studentEvent.findMany({
      include: { event: true },
    }),
  ])

  const totalEntries = heats.reduce((s, h) => s + h.entries.length, 0)

  // Studio totals (entry count per studio)
  const studioTotals: Record<number, number> = {}
  for (const studio of studios) studioTotals[studio.id] = 0
  for (const heat of heats) {
    for (const entry of heat.entries) {
      if (!entry.instructor) continue
      const sid = entry.instructor.studio.id
      studioTotals[sid] = (studioTotals[sid] ?? 0) + 1
    }
  }

  // Build heatId → eventName(s) map
  const heatEventNames = new Map<number, string[]>()
  for (const evt of events) {
    for (const eh of evt.heats) {
      if (!heatEventNames.has(eh.heatId)) heatEventNames.set(eh.heatId, [])
      heatEventNames.get(eh.heatId)!.push(evt.name)
    }
  }

  // By-studio heat grid data
  const heatsData = heats.map(h => ({
    id: h.id,
    number: h.number,
    dance: h.danceType.name,
    maxCapacity: h.maxCapacity,
    totalEntries: h.entries.length,
    eventNames: heatEventNames.get(h.id) ?? [],
    studioCounts: studios.map(s => ({
      studioId: s.id,
      count: h.entries.filter(e => e.instructor?.studio.id === s.id).length,
    })),
  }))

  // StudentEvent map: studentId → eventName[]
  const studentEventNameMap = new Map<number, string[]>()
  for (const se of studentEvents) {
    if (!studentEventNameMap.has(se.studentId)) studentEventNameMap.set(se.studentId, [])
    studentEventNameMap.get(se.studentId)!.push(se.event.name)
  }

  // By-teacher data: instructor → students → dance breakdown
  const instructorMap = new Map<number, {
    id: number
    name: string
    studioName: string
    students: Map<number, { name: string; byDance: Map<string, number> }>
  }>()

  for (const studio of studios) {
    for (const inst of studio.instructors) {
      instructorMap.set(inst.id, {
        id: inst.id,
        name: inst.name,
        studioName: studio.name,
        students: new Map(),
      })
    }
  }

  for (const heat of heats) {
    for (const entry of heat.entries) {
      const instData = instructorMap.get(entry.instructorId)
      if (!instData) continue
      const sid = entry.studentId
      if (!instData.students.has(sid)) {
        instData.students.set(sid, {
          name: `${entry.student.firstName} ${entry.student.lastName}`,
          byDance: new Map(),
        })
      }
      const sd = instData.students.get(sid)!
      const dance = heat.danceType.name
      sd.byDance.set(dance, (sd.byDance.get(dance) ?? 0) + 1)
    }
  }

  const teacherData = [...instructorMap.values()]
    .filter(i => i.students.size > 0)
    .sort((a, b) => {
      const studioCmp = a.studioName.localeCompare(b.studioName)
      if (studioCmp !== 0) return studioCmp
      const aLast = a.name.split(' ').pop() ?? a.name
      const bLast = b.name.split(' ').pop() ?? b.name
      return aLast.localeCompare(bLast)
    })
    .map(i => ({
      id: i.id,
      name: i.name,
      studioName: i.studioName,
      totalEntries: [...i.students.values()].reduce((s, st) => {
        return s + [...st.byDance.values()].reduce((a, b) => a + b, 0)
      }, 0),
      students: [...i.students.entries()]
        .map(([sid, st]) => ({
          studentId: sid,
          studentName: st.name,
          totalEntries: [...st.byDance.values()].reduce((a, b) => a + b, 0),
          byDance: Object.fromEntries(st.byDance.entries()),
          eventNames: studentEventNameMap.get(sid) ?? [],
        }))
        .sort((a, b) => a.studentName.localeCompare(b.studentName)),
    }))

  return (
    <div className="min-h-screen flex flex-col">
      <header
        className="sticky top-0 z-50 flex items-center gap-4 px-6 shadow-md"
        style={{ backgroundColor: 'var(--header)', minHeight: 64 }}
      >
        <h1 className="font-bold text-sm text-white tracking-wide">Team Spirit Showcase — Heat Sheet</h1>
        <span className="text-xs text-white/40 uppercase tracking-wide">Read-only</span>
        <div className="ml-auto flex items-center gap-3">
          <span className="text-xs text-white/50">
            {heats.length} heats · {totalEntries} entries
          </span>
          {session?.role === 'admin' && (
            <Link href="/admin" className="text-xs text-white/70 hover:text-white transition-colors px-3 py-1.5 rounded" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
              ← Admin
            </Link>
          )}
          {session?.role === 'studio' && (
            <Link href={`/studio/${session.studioSlug}`} className="text-xs text-white/70 hover:text-white transition-colors px-3 py-1.5 rounded" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
              ← {session.studioName}
            </Link>
          )}
          {session?.role === 'judge' && (
            <Link href="/judge" className="text-xs text-white/70 hover:text-white transition-colors px-3 py-1.5 rounded" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
              ← Scoring
            </Link>
          )}
          <Link href="/" className="text-xs text-white/50 hover:text-white/80 transition-colors">
            Home
          </Link>
        </div>
      </header>
      <main className="flex-1 p-6">
        <ViewTabs
          heats={heatsData}
          studios={studios.map(s => ({ id: s.id, name: s.name, total: studioTotals[s.id] ?? 0 }))}
          teacherData={teacherData}
          events={events.map(e => ({ id: e.id, name: e.name, heatIds: e.heats.map(eh => eh.heatId) }))}
        />
      </main>
    </div>
  )
}
