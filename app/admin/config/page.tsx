import { db } from '@/lib/db'
import DancesConfig from './DancesConfig'
import StudiosConfig from './StudiosConfig'
import EventsConfig from './EventsConfig'
import HeatOrderConfig from './HeatOrderConfig'
import JudgesConfig from './JudgesConfig'
import FeedbackCategoriesConfig from './FeedbackCategoriesConfig'
import CollapsibleSection from './CollapsibleSection'

export const dynamic = 'force-dynamic'

export default async function ConfigPage() {
  const [danceTypes, studios, events, allHeats, judges, feedbackCategories] = await Promise.all([
    db.danceType.findMany({
      include: { heats: { include: { entries: true } } },
      orderBy: { order: 'asc' },
    }),
    db.studio.findMany({
      include: { instructors: true },
      orderBy: { order: 'asc' },
    }),
    db.event.findMany({
      include: {
        heats: { include: { heat: true }, orderBy: { heat: { number: 'asc' } } },
        compRound: true,
      },
      orderBy: { order: 'asc' },
    }),
    db.heat.findMany({
      include: { danceType: true, entries: true, events: true },
      orderBy: { number: 'asc' },
    }),
    db.judge.findMany({ orderBy: { name: 'asc' }, include: { floorRanges: { include: { floor: true }, orderBy: { heatFrom: 'asc' } } } }),
    db.feedbackCategory.findMany({ orderBy: { order: 'asc' } }),
  ])

  return (
    <div className="max-w-5xl mx-auto space-y-3">
      <h1 className="text-xl font-bold mb-4 text-center">Configuration</h1>

      <CollapsibleSection title="Multi-Dance Events">
        <EventsConfig
          events={events.map(e => ({
            id: e.id,
            name: e.name,
            isAmateur: e.isAmateur,
            isCompetitive: e.isCompetitive,
            compRound: e.compRound ? { round: e.compRound.round, finalSize: e.compRound.finalSize, semiSize: e.compRound.semiSize } : null,
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

      <CollapsibleSection title="Heat Order & Categories">
        <HeatOrderConfig
          heats={allHeats.map(h => ({
            id: h.id,
            number: h.number,
            dance: h.danceType.name,
            eventNames: h.events.map(eh => events.find(e => e.id === eh.eventId)?.name ?? '').filter(Boolean),
            entryCount: h.entries.length,
            category: h.category,
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

      <CollapsibleSection title="Judges">
        <JudgesConfig
          judges={judges.map(j => ({ id: j.id, name: j.name, floorRanges: j.floorRanges.map(r => ({ id: r.id, floorId: r.floorId, floorLabel: r.floor.label, heatFrom: r.heatFrom, heatTo: r.heatTo })) }))}
          floors={await db.floor.findMany({ orderBy: { order: 'asc' }, select: { id: true, label: true } })}
        />
      </CollapsibleSection>

      <CollapsibleSection title="Open Heat Feedback Categories">
        <FeedbackCategoriesConfig categories={feedbackCategories} />
      </CollapsibleSection>
    </div>
  )
}
