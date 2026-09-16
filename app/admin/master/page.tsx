import { db } from '@/lib/db'
import HeatSheet from '@/components/HeatSheet'
import MasterViewClient from './MasterViewClient'

export const dynamic = 'force-dynamic'

export default async function MasterView() {
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
      include: { instructors: true },
      orderBy: { name: 'asc' },
    }),
    db.event.findMany({
      include: { heats: { orderBy: { heat: { number: 'asc' } } } },
      orderBy: { name: 'asc' },
    }),
    db.studentEvent.findMany({ select: { studentId: true, eventId: true } }),
  ])

  const eventStudentIds: Record<number, number[]> = {}
  for (const se of studentEvents) {
    if (!eventStudentIds[se.eventId]) eventStudentIds[se.eventId] = []
    eventStudentIds[se.eventId].push(se.studentId)
  }

  const rebalancerHeats = heats.map(h => ({
    id: h.id,
    number: h.number,
    dance: h.danceType.name,
    max: 24,
    entries: h.entries.map(e => ({
      id: e.id,
      studentId: e.student.id,
      studentName: `${e.student.firstName} ${e.student.lastName}`,
      instructorId: e.instructor?.id ?? null,
      instructorName: e.instructor?.name ?? null,
    })),
  }))

  const rebalancerStudios = studios.map(s => ({
    id: s.id,
    name: s.name,
    instructors: s.instructors.map(i => ({ id: i.id, name: i.name })),
  }))

  const rebalancerEvents = events.map(e => ({
    id: e.id,
    name: e.name,
    heatIds: e.heats.map(eh => eh.heatId),
    studentIds: eventStudentIds[e.id] ?? [],
  }))

  return (
    <MasterViewClient
      rebalancerHeats={rebalancerHeats}
      rebalancerStudios={rebalancerStudios}
      rebalancerEvents={rebalancerEvents}
      heatCount={heats.length}
      entryCount={heats.reduce((s, h) => s + h.entries.length, 0)}
    >
      <HeatSheet
        heats={heats}
        studios={studios}
        events={events.map(e => ({ id: e.id, name: e.name, heatIds: e.heats.map(eh => eh.heatId) }))}
        eventStudentIds={eventStudentIds}
        adminView
      />
    </MasterViewClient>
  )
}
