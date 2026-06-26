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

  const [heats, events, studentEvents] = await Promise.all([
    db.heat.findMany({
      include: {
        danceType: true,
        events: { include: { event: true } },
        entries: {
          include: { student: true, instructor: true },
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
    }),
  ])

  const totalEntries = heats.reduce(
    (s, h) => s + h.entries.filter(e => e.instructor.studioId === studio.id).length,
    0
  )

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Heat Sign-Up — {studio.name}</h1>
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
            .filter(e => e.instructor.studioId === studio.id)
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
        }))}
        enrolledEvents={studentEvents.map(se => ({ studentId: se.studentId, eventId: se.eventId }))}
      />
    </div>
  )
}
