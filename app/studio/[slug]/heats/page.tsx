import { db } from '@/lib/db'
import { getSession } from '@/lib/session'
import HeatSignUp from './HeatSignUp'

export default async function HeatsPage({ params }: { params: Promise<{ slug: string }> }) {
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

  const [heats, events, studentEvents, studentShows] = await Promise.all([
    db.heat.findMany({
      include: {
        danceType: true,
        events: { include: { event: true } },
        entries: {
          include: { student: true, instructor: true, partnerStudent: true },
        },
      },
      orderBy: { number: 'asc' },
    }),
    db.event.findMany({
      include: { heats: { orderBy: { heat: { number: 'asc' } } } },
      orderBy: { order: 'asc' },
    }),
    db.studentEvent.findMany({
      where: { studentId: { in: studentIds } },
      include: { student: true },
    }),
    db.studentShow.findMany({
      where: { students: { some: { id: { in: studentIds } } } },
      include: { students: { where: { id: { in: studentIds } }, select: { id: true } } },
    }),
  ])

  const showCountByStudent: Record<number, number> = {}
  for (const show of studentShows) {
    for (const s of show.students) {
      showCountByStudent[s.id] = (showCountByStudent[s.id] ?? 0) + 1
    }
  }

  // Build amateur pairs: studentEvents with no instructor, deduplicated by leaderId
  const amateurEvents = studentEvents.filter(se => se.instructorId === null && se.partnerStudentId !== null)
  const seenPairs = new Set<string>()
  const amateurPairs: { eventId: number; leaderId: number; leaderName: string; followerId: number; followerName: string }[] = []
  for (const se of amateurEvents) {
    const leader = studio.students.find(s => s.id === se.studentId && s.role === 'Leader')
    if (!leader) continue
    const pairKey = `${se.eventId}-${se.studentId}-${se.partnerStudentId}`
    if (seenPairs.has(pairKey)) continue
    seenPairs.add(pairKey)
    const follower = studio.students.find(s => s.id === se.partnerStudentId)
    if (!follower) continue
    amateurPairs.push({
      eventId: se.eventId,
      leaderId: leader.id,
      leaderName: `${leader.firstName} ${leader.lastName}`,
      followerId: follower.id,
      followerName: `${follower.firstName} ${follower.lastName}`,
    })
  }

  // Amateur heat pairs: entries with no instructor, partnerStudentId set, student belongs to this studio
  // Deduplicate by keeping only the leader's entry (role === 'Leader')
  const amateurHeatPairs: { heatId: number; leaderId: number; leaderName: string; followerId: number; followerName: string }[] = []
  const seenHeatPairs = new Set<string>()
  for (const heat of heats) {
    for (const entry of heat.entries) {
      if (entry.instructorId !== null || entry.partnerStudentId === null) continue
      if (!studentIds.includes(entry.studentId)) continue
      const leader = studio.students.find(s => s.id === entry.studentId && s.role === 'Leader')
      if (!leader) continue
      const pairKey = `${heat.id}-${entry.studentId}-${entry.partnerStudentId}`
      if (seenHeatPairs.has(pairKey)) continue
      seenHeatPairs.add(pairKey)
      const follower = studio.students.find(s => s.id === entry.partnerStudentId) ??
        (entry.partnerStudent ? { firstName: entry.partnerStudent.firstName, lastName: entry.partnerStudent.lastName } : null)
      if (!follower) continue
      amateurHeatPairs.push({
        heatId: heat.id,
        leaderId: leader.id,
        leaderName: `${leader.firstName} ${leader.lastName}`,
        followerId: entry.partnerStudentId,
        followerName: `${follower.firstName} ${follower.lastName}`,
      })
    }
  }

  const totalHeatEntries = heats.reduce(
    (s, h) => s + h.entries.filter(e => e.instructorId !== null && instructorIds.includes(e.instructorId)).length,
    0
  )
  const totalShowEntries = Object.values(showCountByStudent).reduce((a, b) => a + b, 0)
  const totalEntries = totalHeatEntries + totalShowEntries

  return (
    <div className="mx-auto space-y-3">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-center">Heat Sign-Up — {studio.name}</h1>
        <span className="text-sm" style={{ color: 'var(--muted)' }}>{totalEntries} entries from this studio</span>
      </div>
      <HeatSignUp
        slug={slug}
        studio={{ id: studio.id, name: studio.name }}
        students={studio.students}
        instructors={studio.instructors}
        heats={heats.map(h => ({
          id: h.id,
          number: h.number,
          dance: h.danceType.name,
          maxCapacity: h.maxCapacity,
          totalEntries: h.entries.length,
          eventIds: h.events.map(eh => eh.eventId),
          myEntries: h.entries
            .filter(e => e.instructorId !== null && instructorIds.includes(e.instructorId))
            .map(e => ({
              id: e.id,
              studentId: e.studentId,
              studentName: `${e.student.firstName} ${e.student.lastName}`,
              instructorId: e.instructorId,
            })),
        }))}
        events={events.map(e => ({
          id: e.id,
          name: e.name,
          heatIds: e.heats.map(eh => eh.heatId),
          isAmateur: e.isAmateur,
        }))}
        enrolledEvents={studentEvents.map(se => ({ studentId: se.studentId, eventId: se.eventId }))}
        amateurPairs={amateurPairs}
        amateurHeatPairs={amateurHeatPairs}
        showCountByStudent={showCountByStudent}
      />
    </div>
  )
}
