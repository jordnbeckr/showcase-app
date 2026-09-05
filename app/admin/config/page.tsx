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
  const [danceTypes, studios, events, allHeats, judges, feedbackCategories, allStudents, semiMarksAll] = await Promise.all([
    db.danceType.findMany({
      include: { heats: { include: { entries: true } } },
      orderBy: { order: 'asc' },
    }),
    db.studio.findMany({
      include: {
        instructors: true,
        guestStudents: { include: { student: { include: { studio: true } } } },
      },
      orderBy: { order: 'asc' },
    }),
    db.event.findMany({
      include: {
        heats: { include: { heat: true }, orderBy: { heat: { number: 'asc' } } },
        compRound: true,
        studentEvents: {
          include: {
            student: true,
            instructor: true,
          },
        },
      },
      orderBy: { order: 'asc' },
    }),
    db.heat.findMany({
      include: { danceType: true, entries: true, events: true },
      orderBy: { number: 'asc' },
    }),
    db.judge.findMany({ orderBy: { name: 'asc' }, include: { floorRanges: { include: { floor: true }, orderBy: { heatFrom: 'asc' } } } }),
    db.feedbackCategory.findMany({ orderBy: { order: 'asc' } }),
    db.student.findMany({ include: { studio: true }, orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }] }),
    db.semiMark.findMany({ select: { eventId: true, studentId: true, judgeId: true, called: true } }),
  ])

  return (
    <div className="max-w-5xl mx-auto space-y-3">
      <h1 className="text-xl font-bold mb-4 text-center">Configuration</h1>

      <CollapsibleSection title="Multi-Dance Events">
        <EventsConfig
          events={events.map(e => {
            // Build couples list for semifinal tabulation
            const couples = e.studentEvents
              .filter(se => se.partnerStudentId !== null ? se.student.role === 'Leader' : true)
              .map(se => {
                const student = se.student
                const instructor = se.instructor
                let leaderNumber: number | null = null
                let personA = ''
                let personB = ''
                if (instructor) {
                  if (instructor.role === 'Leader' && student.role !== 'Leader') {
                    leaderNumber = instructor.leaderNumber; personA = instructor.name; personB = `${student.firstName} ${student.lastName}`
                  } else {
                    leaderNumber = student.leaderNumber; personA = `${student.firstName} ${student.lastName}`; personB = instructor.name
                  }
                } else {
                  leaderNumber = student.leaderNumber; personA = `${student.firstName} ${student.lastName}`
                  const partner = e.studentEvents.find(x => x.studentId === se.partnerStudentId)
                  if (partner) personB = `${partner.student.firstName} ${partner.student.lastName}`
                }
                return { studentId: student.id, leaderNumber, personA, personB }
              })
            const eventSemiMarks = semiMarksAll.filter(m => m.eventId === e.id)
            return {
              id: e.id,
              name: e.name,
              isAmateur: e.isAmateur,
              isCompetitive: e.isCompetitive,
              compRound: e.compRound
                ? { round: e.compRound.round, phase: e.compRound.phase, finalSize: e.compRound.finalSize, semiSize: e.compRound.semiSize }
                : null,
              heats: e.heats.filter(eh => eh.heat != null).map(eh => ({ id: eh.heat.id, number: eh.heat.number })),
              couples,
              semiMarks: eventSemiMarks,
              judgeCount: judges.length,
            }
          })}
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
            guestStudents: s.guestStudents.map(g => ({
              studentId: g.studentId,
              name: `${g.student.firstName} ${g.student.lastName}`,
              homeStudio: g.student.studio.name,
            })),
          }))}
          allStudents={allStudents.map(s => ({
            id: s.id,
            name: `${s.firstName} ${s.lastName}`,
            studioId: s.studioId,
            studioName: s.studio.name,
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
