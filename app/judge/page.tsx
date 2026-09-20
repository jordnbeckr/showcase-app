import { db } from '@/lib/db'
import { getSession } from '@/lib/session'
import JudgeScoring from './JudgeScoring'

export const dynamic = 'force-dynamic'

export default async function JudgePage() {
  const session = await getSession()
  if (session?.role !== 'judge') return null
  const judgeId = session.judgeId
  const isGuest = session.judgeName === 'Guest'

  // Load judge's heat-range floor assignments
  const judgeFloorRanges = await db.judgeFloorRange.findMany({
    where: { judgeId },
    orderBy: { heatFrom: 'asc' },
  })
  const hasFloorFilter = judgeFloorRanges.length > 0

  // Load all floor assignments for heat entries
  const allFloorAssignments = await db.heatFloorAssignment.findMany({})
  // studentId × heatId → floorId
  const entryFloorId = new Map<string, number>()
  for (const a of allFloorAssignments) entryFloorId.set(`${a.studentId}-${a.heatId}`, a.floorId)

  // Returns the set of floorIds this judge covers for a given heat number
  function judgeFloorIdsForHeat(heatNumber: number): Set<number> {
    const ids = new Set<number>()
    for (const r of judgeFloorRanges) {
      if (heatNumber >= r.heatFrom && heatNumber <= r.heatTo) ids.add(r.floorId)
    }
    return ids
  }

  const floors = await db.floor.findMany({ orderBy: { order: 'asc' } })
  const floorById = new Map(floors.map(f => ({ id: f.id, label: f.label })).map(f => [f.id, f.label]))

  const [heats, events, categories, existingClosedScores, existingOpenThumbs, existingOpenNotes, existingCompScores, existingSemanMarks, allSemiMarks] = await Promise.all([
    db.heat.findMany({
      orderBy: { number: 'asc' },
      include: {
        danceType: true,
        events: { include: { event: true } },
        entries: {
          include: {
            student: { include: { studio: true } },
            instructor: { include: { studio: true } },
            partnerStudent: true,
          },
        },
      },
    }),
    db.event.findMany({
      where: { isCompetitive: true },
      include: {
        compRound: true,
        studentEvents: {
          include: {
            student: { include: { studio: true } },
            instructor: { include: { studio: true } },
          },
        },
      },
      orderBy: { order: 'asc' },
    }),
    db.feedbackCategory.findMany({ orderBy: { order: 'asc' } }),
    db.closedScore.findMany({ where: { judgeId } }),
    db.openThumb.findMany({ where: { judgeId } }),
    db.openNote.findMany({ where: { judgeId } }),
    db.compScore.findMany({ where: { judgeId } }),
    db.semiMark.findMany({ where: { judgeId } }),
    db.semiMark.findMany({ select: { eventId: true, heatId: true, studentId: true, judgeId: true, called: true } }),
  ])

  // Map events by first heat number so they appear at the right position in the scroll
  const eventByFirstHeat = new Map<number, typeof events[number]>()
  for (const evt of events) {
    if (!evt.isCompetitive) continue
    // Find which heats belong to this event
    const eventHeatNumbers = heats
      .filter(h => h.events.some(eh => eh.eventId === evt.id))
      .map(h => h.number)
    if (eventHeatNumbers.length === 0) continue
    const firstHeatNum = Math.min(...eventHeatNumbers)
    eventByFirstHeat.set(firstHeatNum, evt)
  }

  const competitiveEventsForJudge = isGuest ? [] : events

  return (
    <JudgeScoring
      judgeId={judgeId}
      heats={heats.filter(h => {
        if (!hasFloorFilter) return true
        return judgeFloorIdsForHeat(h.number).size > 0
      }).map(h => ({
        id: h.id,
        number: h.number,
        dance: h.danceType.name,
        category: h.category as 'none' | 'closed' | 'open',
        eventIds: h.events.map(e => e.eventId),
        floorLabel: (() => {
          if (!hasFloorFilter) return null
          const coveringFloorIds = judgeFloorIdsForHeat(h.number)
          if (coveringFloorIds.size === 0) return null
          return [...coveringFloorIds].map(id => floorById.get(id)).filter(Boolean).join(', ')
        })(),
        entries: h.entries.filter(e => {
          // For amateur couples (no instructor, has partnerStudentId), only keep the Leader entry
          if (e.instructorId === null && e.partnerStudentId !== null && e.student.role !== 'Leader') return false
          if (!hasFloorFilter) return true
          const floorIdsForThisHeat = judgeFloorIdsForHeat(h.number)
          const fid = entryFloorId.get(`${e.studentId}-${h.id}`)
          return fid !== undefined && floorIdsForThisHeat.has(fid)
        }).sort((a, b) => {
          // Use student.role to determine who leads — more reliable than instructor.role (defaults to 'Neither')
          const numFor = (e: typeof h.entries[number]) =>
            (e.student.role === 'Leader' ? e.student.leaderNumber : (e.instructor?.leaderNumber ?? e.student.leaderNumber)) ?? 9999
          return numFor(a) - numFor(b)
        }).map(e => ({
          studentId: e.studentId,
          studentFirstName: e.student.firstName,
          studentLastName: e.student.lastName,
          studentRole: e.student.role,
          studentLeaderNumber: e.student.leaderNumber,
          instructorId: e.instructorId,
          instructorName: e.instructor?.name ?? null,
          instructorRole: e.instructor?.role ?? null,
          instructorLeaderNumber: e.instructor?.leaderNumber ?? null,
          partnerStudentId: e.partnerStudentId,
          partnerFirstName: e.partnerStudent?.firstName ?? null,
          partnerLastName: e.partnerStudent?.lastName ?? null,
        })),
      }))}
      competitiveEvents={competitiveEventsForJudge.flatMap(evt => {
        // Identify couples: for instructor-led, one StudentEvent per student; for amateur, only Leader students
        const couples = evt.studentEvents
          .filter(se => {
            if (se.partnerStudentId !== null) {
              return se.student.role === 'Leader'
            }
            return true
          })
          .map(se => {
            const student = se.student
            const instructor = se.instructor

            let leaderNumber: number | null = null
            let personA: string = ''
            let personB: string = ''

            if (instructor) {
              const instIsLeader = instructor.role === 'Leader'
              const stuIsLeader = student.role === 'Leader'
              if (instIsLeader && !stuIsLeader) {
                leaderNumber = instructor.leaderNumber
                personA = instructor.name
                personB = `${student.firstName} ${student.lastName}`
              } else {
                leaderNumber = student.leaderNumber
                personA = `${student.firstName} ${student.lastName}`
                personB = instructor.name
              }
            } else if (se.partnerStudentId !== null) {
              leaderNumber = student.leaderNumber
              personA = `${student.firstName} ${student.lastName}`
              personB = ''
            }

            return {
              studentId: student.id,
              leaderNumber,
              personA,
              personBStudentId: se.partnerStudentId,
              personB,
            }
          })

        // Fill in partner names for amateur couples
        const allStudents = evt.studentEvents.map(se => se.student)
        const allCouples = couples.map(c => {
          if (c.personBStudentId !== null && c.personB === '') {
            const partner = allStudents.find(s => s.id === c.personBStudentId)
            return { ...c, personB: partner ? `${partner.firstName} ${partner.lastName}` : '?' }
          }
          return c
        }).sort((a, b) => (a.leaderNumber ?? 9999) - (b.leaderNumber ?? 9999))

        const round = evt.compRound?.round ?? 'final'
        const finalSize = evt.compRound?.finalSize ?? 6
        const semiSize = evt.compRound?.semiSize ?? 7

        const allEventHeats = heats
          .filter(h => h.events.some(eh => eh.eventId === evt.id))
          .sort((a, b) => a.number - b.number)

        function makeDances(eventHeats: typeof allEventHeats, forCouples: typeof allCouples) {
          return eventHeats.map(h => ({
            heatId: h.id,
            heatNumber: h.number,
            dance: h.danceType.name,
            coupleFloors: Object.fromEntries(
              forCouples.map(c => {
                const fid = entryFloorId.get(`${c.studentId}-${h.id}`)
                const label = fid !== undefined ? (floorById.get(fid) ?? null) : null
                return [c.studentId, label]
              })
            ),
          }))
        }

        if (round !== 'semifinal') {
          // Non-semi: single block
          return [{
            id: evt.id,
            name: evt.name,
            round,
            phase: 'final',
            finalSize,
            semiSize,
            blockKey: `${evt.id}`,
            firstHeatNumber: allEventHeats.length > 0 ? allEventHeats[0].number : 99999,
            dances: makeDances(allEventHeats, allCouples),
            couples: allCouples,
          }]
        }

        // Semi event: emit two separate blocks
        const half = Math.ceil(allEventHeats.length / 2)
        const semiHeats = allEventHeats.slice(0, half)
        const finalHeats = allEventHeats.slice(half)

        // Advancing couples: total marks from semi heats only (not final heats)
        const semiHeatIds = new Set(semiHeats.map(h => h.id))
        const eventAllSemiMarks = allSemiMarks.filter(m => m.eventId === evt.id && semiHeatIds.has(m.heatId))
        const withCounts = allCouples.map(c => ({
          ...c,
          callbacks: eventAllSemiMarks.filter(m => m.studentId === c.studentId && m.called).length,
        }))
        withCounts.sort((a, b) => b.callbacks - a.callbacks || (a.leaderNumber ?? 9999) - (b.leaderNumber ?? 9999))
        const advancingCouples = withCounts.slice(0, finalSize)
          .sort((a, b) => (a.leaderNumber ?? 9999) - (b.leaderNumber ?? 9999))

        const semiBlock = {
          id: evt.id,
          name: evt.name,
          round: 'semifinal',
          phase: 'semi',
          finalSize,
          semiSize,
          blockKey: `${evt.id}-semi`,
          firstHeatNumber: semiHeats.length > 0 ? semiHeats[0].number : 99999,
          dances: makeDances(semiHeats, allCouples),
          couples: allCouples,
        }

        const finalBlock = {
          id: evt.id,
          name: evt.name,
          round: 'semifinal',
          phase: 'final',
          finalSize,
          semiSize,
          blockKey: `${evt.id}-final`,
          firstHeatNumber: finalHeats.length > 0 ? finalHeats[0].number : 99999,
          dances: makeDances(finalHeats, advancingCouples),
          couples: advancingCouples,
        }

        return [semiBlock, finalBlock]
      }).sort((a, b) => a.firstHeatNumber - b.firstHeatNumber)}
      categories={categories.map(c => ({ id: c.id, name: c.name }))}
      initialClosedScores={existingClosedScores.map(s => ({ heatId: s.heatId, studentId: s.studentId, placement: s.placement }))}
      initialOpenThumbs={existingOpenThumbs.map(t => ({ heatId: t.heatId, studentId: t.studentId, categoryId: t.categoryId, sentiment: t.sentiment }))}
      initialOpenNotes={existingOpenNotes.map(n => ({ heatId: n.heatId, studentId: n.studentId, note: n.note }))}
      initialCompScores={existingCompScores.map(s => ({ eventId: s.eventId, heatId: s.heatId, studentId: s.studentId, place: s.place }))}
      initialSemiMarks={existingSemanMarks.map(m => ({ eventId: m.eventId, heatId: m.heatId, studentId: m.studentId, called: m.called }))}
    />
  )
}
