import { db } from '@/lib/db'
import DancesConfig from './DancesConfig'
import StudiosConfig from './StudiosConfig'
import EventsConfig from './EventsConfig'
import HeatOrderConfig from './HeatOrderConfig'
import CollapsibleSection from './CollapsibleSection'

export default async function ConfigPage() {
  const [danceTypes, studios, events, allHeats] = await Promise.all([
    db.danceType.findMany({
      include: { heats: { include: { entries: true } } },
      orderBy: { order: 'asc' },
    }),
    db.studio.findMany({
      include: { instructors: true },
      orderBy: { order: 'asc' },
    }),
    db.event.findMany({
      include: { heats: { include: { heat: true }, orderBy: { heat: { number: 'asc' } } } },
      orderBy: { order: 'asc' },
    }),
    db.heat.findMany({
      include: { danceType: true, entries: true, events: true },
      orderBy: { number: 'asc' },
    }),
  ])

  return (
    <div className="max-w-5xl space-y-3">
      <h1 className="text-xl font-bold mb-4">Configuration</h1>

      <CollapsibleSection title="Multi-Dance Events">
        <EventsConfig
          events={events.map(e => ({
            id: e.id,
            name: e.name,
            heats: e.heats.map(eh => ({ id: eh.heat.id, number: eh.heat.number })),
          }))}
          allHeats={allHeats.map(h => ({
            id: h.id,
            number: h.number,
            dance: h.danceType.name,
            eventIds: h.events.map(eh => eh.eventId),
          }))}
        />
      </CollapsibleSection>

      <CollapsibleSection title="Dance Types & Heats">
        <DancesConfig danceTypes={danceTypes.map(d => ({
          id: d.id,
          name: d.name,
          heatCount: d.heats.length,
          heats: d.heats.map(h => ({ id: h.id, number: h.number, entryCount: h.entries.length })),
        }))} />
      </CollapsibleSection>

      <CollapsibleSection title="Heat Order">
        <HeatOrderConfig
          heats={allHeats.map(h => ({
            id: h.id,
            number: h.number,
            dance: h.danceType.name,
            eventNames: h.events.map(eh => events.find(e => e.id === eh.eventId)?.name ?? '').filter(Boolean),
            entryCount: h.entries.length,
          }))}
        />
      </CollapsibleSection>

      <CollapsibleSection title="Studios & Instructors">
        <StudiosConfig
          studios={studios.map(s => ({
            id: s.id,
            name: s.name,
            slug: s.slug,
            instructors: s.instructors.map(i => ({ id: i.id, name: i.name })),
          }))}
        />
      </CollapsibleSection>
    </div>
  )
}
