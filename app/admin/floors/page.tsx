import { db } from '@/lib/db'
import FloorsManager from './FloorsManager'

export const dynamic = 'force-dynamic'

export default async function AdminFloorsPage() {
  const [floors, heats, students] = await Promise.all([
    db.floor.findMany({ orderBy: { order: 'asc' } }),
    db.heat.findMany({
      orderBy: { number: 'asc' },
      include: {
        danceType: true,
        events: { include: { event: true } },
        entries: {
          include: {
            student: { include: { studio: true } },
            instructor: true,
            partnerStudent: true,
          },
        },
        floorAssignments: true,
      },
    }),
    db.student.findMany({
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
      select: { id: true, firstName: true, lastName: true, leaderNumber: true, studio: { select: { name: true } } },
    }),
  ])

  return (
    <FloorsManager
      floors={floors.map(f => ({ id: f.id, label: f.label, order: f.order }))}
      heats={heats.map(h => ({
        id: h.id,
        number: h.number,
        dance: h.danceType.name,
        eventName: h.events[0]?.event.name ?? null,
        entries: h.entries.map(e => ({
          studentId: e.studentId,
          name: `${e.student.firstName} ${e.student.lastName}`,
          leaderNumber: e.student.leaderNumber,
          studioName: e.student.studio.name,
          instructorName: e.instructor?.name ?? null,
          partnerName: e.partnerStudent ? `${e.partnerStudent.firstName} ${e.partnerStudent.lastName}` : null,
        })),
        assignments: h.floorAssignments.map(a => ({ studentId: a.studentId, floorId: a.floorId })),
      }))}
      studentIndex={(() => {
        const idx: Record<number, { name: string; leaderNumber: number | null }> = {}
        for (const s of students) idx[s.id] = { name: `${s.firstName} ${s.lastName}`, leaderNumber: s.leaderNumber }
        return idx
      })()}
    />
  )
}
