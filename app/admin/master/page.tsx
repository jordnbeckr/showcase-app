import { db } from '@/lib/db'
import HeatSheet from '@/components/HeatSheet'

export const dynamic = 'force-dynamic'

export default async function MasterView() {
  const [heats, studios, events] = await Promise.all([
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
  ])

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-center">Master Heat Sheet</h1>
      <p className="text-sm text-gray-500 text-center">All studios · {heats.length} heats · {heats.reduce((s, h) => s + h.entries.length, 0)} total entries</p>
      <HeatSheet
        heats={heats}
        studios={studios}
        events={events.map(e => ({ id: e.id, name: e.name, heatIds: e.heats.map(eh => eh.heatId) }))}
        adminView
      />
    </div>
  )
}
