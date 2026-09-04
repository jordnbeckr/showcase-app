import { db } from '@/lib/db'
import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'
import PlanGrid from './PlanGrid'
import AttendancePanel from './AttendancePanel'

export const dynamic = 'force-dynamic'

export default async function PlanPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const session = await getSession()
  if (session?.role !== 'studio' || session.studioSlug !== slug) redirect('/login/studio')

  const studio = await db.studio.findUnique({
    where: { slug },
    include: {
      instructors: true,
      students: { orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }] },
    },
  })
  if (!studio) redirect('/login/studio')

  const [danceTypes, events, heatCounts, planEntries, planEventEntries, attendanceNotes] = await Promise.all([
    db.danceType.findMany({ orderBy: { order: 'asc' } }),
    db.event.findMany({
      where: { isCompetitive: true },
      orderBy: [{ isAmateur: 'asc' }, { order: 'asc' }],
      include: { heats: { include: { heat: true } } },
    }),
    db.heat.findMany({
      where: { category: { in: ['closed', 'open'] } },
      select: { danceTypeId: true, category: true },
    }),
    db.planEntry.findMany({
      where: { studioId: studio.id },
      orderBy: { createdAt: 'asc' },
    }),
    db.planEventEntry.findMany({
      where: { studioId: studio.id },
      orderBy: { createdAt: 'asc' },
    }),
    db.attendanceNote.findMany({
      where: { studioId: studio.id },
      orderBy: { createdAt: 'asc' },
    }),
  ])

  const heatCountMap: Record<string, number> = {}
  for (const h of heatCounts) {
    const key = `${h.danceTypeId}:${h.category}`
    heatCountMap[key] = (heatCountMap[key] ?? 0) + 1
  }
  const heatCountsForGrid = Object.entries(heatCountMap).map(([key, count]) => {
    const [danceTypeId, category] = key.split(':')
    return { danceTypeId: parseInt(danceTypeId), category: category as 'closed' | 'open', count }
  })

  return (
    <>
    <PlanGrid
      slug={slug}
      instructors={[...studio.instructors]
        .sort((a, b) => {
          const lastName = (n: string) => n.trim().split(' ').slice(-1)[0].toLowerCase()
          return lastName(a.name).localeCompare(lastName(b.name))
        })
        .map(i => ({ id: i.id, name: i.name }))}
      students={studio.students.map(s => ({ id: s.id, firstName: s.firstName, lastName: s.lastName }))}
      danceTypes={danceTypes.map(d => ({ id: d.id, name: d.name }))}
      events={events.map(e => ({ id: e.id, name: e.name, heatCount: e.heats.length, isAmateur: e.isAmateur }))}
      heatCounts={heatCountsForGrid}
      planEntries={planEntries.map(e => ({
        id: e.id,
        instructorId: e.instructorId,
        studentId: e.studentId,
        danceTypeId: e.danceTypeId,
        category: e.category as 'closed' | 'open',
        slotIndex: e.slotIndex,
        isPublished: e.isPublished,
      }))}
      planEventEntries={planEventEntries.map(e => ({
        id: e.id,
        instructorId: e.instructorId,
        studentId: e.studentId,
        eventId: e.eventId,
        isPublished: e.isPublished,
      }))}
    />
    <AttendancePanel
      slug={slug}
      initial={attendanceNotes.map(n => ({ id: n.id, name: n.name, status: n.status, note: n.note }))}
    />
    </>
  )
}
