import { db } from '@/lib/db'
import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'
import PlanGrid from './PlanGrid'

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

  const [danceTypes, events, heatCounts, planEntries, planEventEntries] = await Promise.all([
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
  ])

  return (
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
      heatCounts={
        Object.entries(
          heatCounts.reduce((acc, h) => {
            const key = `${h.danceTypeId}:${h.category}`
            acc[key] = (acc[key] ?? 0) + 1
            return acc
          }, {} as Record<string, number>)
        ).map(([key, count]) => {
          const [danceTypeId, category] = key.split(':')
          return { danceTypeId: parseInt(danceTypeId), category: category as 'closed' | 'open', count }
        })
      }
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
  )
}
