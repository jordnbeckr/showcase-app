import { db } from '@/lib/db'
import { getSession } from '@/lib/session'
import JudgeScoring from './JudgeScoring'

export const dynamic = 'force-dynamic'

export default async function JudgePage() {
  const session = await getSession()
  if (session?.role !== 'judge') return null
  const judgeId = session.judgeId

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

  const [heats, events, categories, existingClosedScores, existingOpenThumbs, existingOpenNotes, existingCompScores, existingSemanMarks] = await Promise.all([
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

  return (
    <JudgeScoring
      judgeId={judgeId}
      heats={heats.map(h => ({
        id: h.id,
        number: h.number,
        dance: h.danceType.name,
        category: h.category as 'none' | 'closed' | 'open',
        eventIds: h.events.map(e => e.eventId),
        entries: h.entries.filter(e => {
          if (!hasFloorFilter) return true
          const floorIdsForThisHeat = judgeFloorIdsForHeat(h.number)
          if (floorIdsForThisHeat.size === 0) return true // no range covers this heat — show all
          const fid = entryFloorId.get(`${e.studentId}-${h.id}`)
          return fid !== undefined && floorIdsForThisHeat.has(fid)
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
      competitiveEvents={events.map(evt => {
        // Identify couples: for instructor-led, one StudentEvent per student; for amateur, only Leader students
        const couples = evt.studentEvents
          .filter(se => {
            if (se.partnerStudentId !== null) {
              // amateur: only include the Leader
              return se.student.role === 'Leader'
            }
            return true // instructor-led: include all
          })
          .map(se => {
            const student = se.student
            const instructor = se.instructor

            // Determine display order and number
            let leaderNumber: number | null = null
            let personA: string = ''
            let personB: string = ''

            if (instructor) {
              const instIsLeader = instructor.role === 'Leader'
              const stuIsLeader = student.role === 'Leader'
              if (instIsLeader && !stuIsLeader) {
                // Instructor leads
                leaderNumber = instructor.leaderNumber
                personA = instructor.name
                personB = `${student.firstName} ${student.lastName}`
              } else {
                // Student leads (or both leaders → student goes first)
                leaderNumber = student.leaderNumber
                personA = `${student.firstName} ${student.lastName}`
                personB = instructor.name
              }
            } else if (se.partnerStudentId !== null) {
              // Amateur: this is the Leader student
              leaderNumber = student.leaderNumber
              personA = `${student.firstName} ${student.lastName}`
              personB = '' // filled in below from studentEvents lookup
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
        const couplesWithPartners = couples.map(c => {
          if (c.personBStudentId !== null && c.personB === '') {
            const partner = allStudents.find(s => s.id === c.personBStudentId)
            return { ...c, personB: partner ? `${partner.firstName} ${partner.lastName}` : '?' }
          }
          return c
        })

        return {
          id: evt.id,
          name: evt.name,
          round: evt.compRound?.round ?? 'final',
          finalSize: evt.compRound?.finalSize ?? 6,
          semiSize: evt.compRound?.semiSize ?? 7,
          firstHeatNumber: (() => {
            const nums = heats.filter(h => h.events.some(eh => eh.eventId === evt.id)).map(h => h.number)
            return nums.length > 0 ? Math.min(...nums) : 99999
          })(),
          couples: couplesWithPartners.sort((a, b) => (a.leaderNumber ?? 9999) - (b.leaderNumber ?? 9999)),
        }
      }).sort((a, b) => a.firstHeatNumber - b.firstHeatNumber)}
      categories={categories.map(c => ({ id: c.id, name: c.name }))}
      initialClosedScores={existingClosedScores.map(s => ({ heatId: s.heatId, studentId: s.studentId, placement: s.placement }))}
      initialOpenThumbs={existingOpenThumbs.map(t => ({ heatId: t.heatId, studentId: t.studentId, categoryId: t.categoryId, sentiment: t.sentiment }))}
      initialOpenNotes={existingOpenNotes.map(n => ({ heatId: n.heatId, studentId: n.studentId, note: n.note }))}
      initialCompScores={existingCompScores.map(s => ({ eventId: s.eventId, studentId: s.studentId, place: s.place }))}
      initialSemiMarks={existingSemanMarks.map(m => ({ eventId: m.eventId, studentId: m.studentId, called: m.called }))}
    />
  )
}
