import { db } from '@/lib/db'
import ResultsView from './ResultsView'
import type { ClosedHeatData, OpenHeatData, CompEventData } from './ResultsView'

export const dynamic = 'force-dynamic'

function getEntryDisplay(entry: {
  student: { firstName: string; lastName: string; role: string; leaderNumber: number | null }
  instructor: { name: string; role: string; leaderNumber: number | null } | null
  partnerStudent: { firstName: string; lastName: string } | null
}) {
  const { student, instructor, partnerStudent } = entry
  if (instructor) {
    if (instructor.role === 'Leader' && student.role !== 'Leader') {
      return { num: instructor.leaderNumber, personA: instructor.name, personB: `${student.firstName} ${student.lastName}` }
    }
    return { num: student.leaderNumber, personA: `${student.firstName} ${student.lastName}`, personB: instructor.name }
  }
  if (partnerStudent) {
    return { num: student.leaderNumber, personA: `${student.firstName} ${student.lastName}`, personB: `${partnerStudent.firstName} ${partnerStudent.lastName}` }
  }
  return { num: student.leaderNumber, personA: `${student.firstName} ${student.lastName}`, personB: '' }
}

function lastNameSort(name: string) {
  const parts = name.trim().split(/\s+/)
  return parts.length > 1 ? parts[parts.length - 1] : name
}

export default async function AdminResultsPage() {
  const [judgesRaw, heats, allEntries, closedScoresAll, studios, events] = await Promise.all([
    db.judge.findMany({ orderBy: { name: 'asc' } }),
    db.heat.findMany({
      where: { category: { not: 'none' } },
      orderBy: { number: 'asc' },
      include: {
        danceType: true,
        closedScores: { include: { judge: true, student: { include: { studio: true } } } },
        openThumbs: { include: { judge: true, student: { include: { studio: true } }, category: true } },
        openNotes: { include: { judge: true, student: { include: { studio: true } } } },
        entries: { include: { student: { include: { studio: true } }, instructor: true, partnerStudent: true } },
      },
    }),
    db.heatEntry.findMany({
      include: { heat: true, student: { include: { studio: true } }, instructor: { include: { studio: true } } },
    }),
    db.closedScore.findMany({
      include: { student: { include: { studio: true } }, heat: true },
    }),
    db.studio.findMany({ orderBy: { order: 'asc' } }),
    db.event.findMany({
      where: { isCompetitive: true },
      orderBy: { order: 'asc' },
      include: {
        compRound: true,
        compScores: { include: { judge: true, student: { include: { studio: true } } } },
        semiMarks: { include: { judge: true, student: { include: { studio: true } } } },
        studentEvents: { include: { student: { include: { studio: true } }, instructor: true } },
      },
    }),
  ])

  // Sort judges by last name
  const judges = [...judgesRaw].sort((a, b) => lastNameSort(a.name).localeCompare(lastNameSort(b.name)))

  if (judges.length === 0) {
    return (
      <div className="max-w-4xl mx-auto">
        <h1 className="text-xl font-bold text-center mb-4">Judge Results</h1>
        <p className="text-sm italic" style={{ color: 'var(--muted)' }}>No judges configured yet.</p>
      </div>
    )
  }

  // ── Awards computation ──────────────────────────────────────────────────────

  const heatCategory = new Map<number, string>()
  for (const h of heats) heatCategory.set(h.id, h.category)

  type InstructorAwardData = { id: number; name: string; studioName: string; totalEntries: number; closedEntries: number; totalPlacements: number; goldCount: number; silverCount: number; bronzeCount: number }
  const instructorMap = new Map<number, InstructorAwardData>()
  for (const entry of allEntries) {
    if (!entry.instructorId || !entry.instructor) continue
    const iid = entry.instructorId
    if (!instructorMap.has(iid)) instructorMap.set(iid, { id: iid, name: entry.instructor.name, studioName: entry.instructor.studio.name, totalEntries: 0, closedEntries: 0, totalPlacements: 0, goldCount: 0, silverCount: 0, bronzeCount: 0 })
    const rec = instructorMap.get(iid)!
    rec.totalEntries++
    if ((heatCategory.get(entry.heatId) ?? 'none') === 'closed') rec.closedEntries++
  }
  for (const score of closedScoresAll) {
    if ((heatCategory.get(score.heatId) ?? 'none') !== 'closed') continue
    const entry = allEntries.find(e => e.studentId === score.studentId && e.heatId === score.heatId)
    if (!entry?.instructorId) continue
    const rec = instructorMap.get(entry.instructorId)
    if (!rec) continue
    rec.totalPlacements++
    if (score.placement === 'Gold') rec.goldCount++
    else if (score.placement === 'Silver') rec.silverCount++
    else if (score.placement === 'Bronze') rec.bronzeCount++
  }
  const eligibleTeachers = [...instructorMap.values()]
    .filter(t => t.totalEntries >= 30 && t.closedEntries / t.totalEntries >= 0.4)
    .sort((a, b) => {
      const gA = a.closedEntries > 0 ? a.goldCount / a.closedEntries : 0
      const gB = b.closedEntries > 0 ? b.goldCount / b.closedEntries : 0
      if (gB !== gA) return gB - gA
      const sA = a.closedEntries > 0 ? a.silverCount / a.closedEntries : 0
      const sB = b.closedEntries > 0 ? b.silverCount / b.closedEntries : 0
      if (sB !== sA) return sB - sA
      const bA = a.closedEntries > 0 ? a.bronzeCount / a.closedEntries : 0
      const bB = b.closedEntries > 0 ? b.bronzeCount / b.closedEntries : 0
      return bB - bA
    })

  type StudioAwardData = { id: number; name: string; totalEntries: number; studentsInClosed: number; goldStudents: number; goldPct: number }
  const studioAwardMap = new Map<number, StudioAwardData>()
  for (const s of studios) studioAwardMap.set(s.id, { id: s.id, name: s.name, totalEntries: 0, studentsInClosed: 0, goldStudents: 0, goldPct: 0 })
  for (const entry of allEntries) {
    const rec = studioAwardMap.get(entry.student.studio.id)
    if (rec) rec.totalEntries++
  }
  // Count closed entries and gold entries per studio (entries, not unique students)
  for (const entry of allEntries) {
    if ((heatCategory.get(entry.heatId) ?? 'none') !== 'closed') continue
    const rec = studioAwardMap.get(entry.student.studio.id)
    if (rec) rec.studentsInClosed++
  }
  for (const score of closedScoresAll) {
    if (score.placement !== 'Gold') continue
    if ((heatCategory.get(score.heatId) ?? 'none') !== 'closed') continue
    const rec = studioAwardMap.get(score.student.studio.id)
    if (rec) rec.goldStudents++
  }
  for (const rec of studioAwardMap.values()) {
    rec.goldPct = rec.studentsInClosed > 0 ? rec.goldStudents / rec.studentsInClosed : 0
  }
  const eligibleStudios = [...studioAwardMap.values()]
    .filter(s => s.totalEntries >= 200)
    .sort((a, b) => b.goldPct !== a.goldPct ? b.goldPct - a.goldPct : b.goldStudents - a.goldStudents)

  type BoBStudent = { studentId: number; name: string; studioName: string }
  const bobByDance = new Map<string, { dance: string; students: Map<number, BoBStudent> }>()
  for (const score of closedScoresAll) {
    if (score.placement !== 'Gold') continue
    if ((heatCategory.get(score.heatId) ?? 'none') !== 'closed') continue
    const heat = heats.find(h => h.id === score.heatId)
    if (!heat) continue
    const dance = heat.danceType.name
    if (!bobByDance.has(dance)) bobByDance.set(dance, { dance, students: new Map() })
    const group = bobByDance.get(dance)!
    if (!group.students.has(score.studentId)) {
      group.students.set(score.studentId, { studentId: score.studentId, name: `${score.student.firstName} ${score.student.lastName}`, studioName: score.student.studio.name })
    }
  }
  const bobDances = [...bobByDance.values()]
    .map(g => ({ dance: g.dance, students: [...g.students.values()].sort((a, b) => a.name.localeCompare(b.name)) }))
    .sort((a, b) => a.dance.localeCompare(b.dance))

  // ── Transform heats into serializable data for ResultsView ──────────────────

  const closedHeatData: ClosedHeatData[] = heats
    .filter(h => h.category === 'closed')
    .map(heat => ({
      id: heat.id,
      number: heat.number,
      dance: heat.danceType.name,
      entries: heat.entries.map(entry => {
        const display = getEntryDisplay(entry)
        const byJudge = judges.map(j => ({
          judgeId: j.id,
          placement: heat.closedScores.find(s => s.studentId === entry.studentId && s.judgeId === j.id)?.placement ?? null,
        }))
        return { studentId: entry.studentId, num: display.num, personA: display.personA, personB: display.personB, byJudge }
      }),
    }))

  const openHeatData: OpenHeatData[] = heats
    .filter(h => h.category === 'open')
    .map(heat => ({
      id: heat.id,
      number: heat.number,
      dance: heat.danceType.name,
      entries: heat.entries.map(entry => {
        const display = getEntryDisplay(entry)
        const thumbs = heat.openThumbs.filter(t => t.studentId === entry.studentId)
        const notes = heat.openNotes.filter(n => n.studentId === entry.studentId)
        const feedbackLines: { judgeId: number; judgeName: string; text: string }[] = []
        for (const j of judges) {
          const jThumbs = thumbs.filter(t => t.judgeId === j.id)
          const jNote = notes.find(n => n.judgeId === j.id)
          const parts = [
            ...jThumbs.filter(t => t.sentiment === 'up').map(t => t.category.name),
            ...jThumbs.filter(t => t.sentiment === 'down').map(t => `↓${t.category.name}`),
          ]
          if (jNote) parts.push(jNote.note)
          if (parts.length > 0) feedbackLines.push({ judgeId: j.id, judgeName: j.name, text: parts.join(' · ') })
        }
        return { studentId: entry.studentId, num: display.num, personA: display.personA, personB: display.personB, feedbackLines }
      }),
    }))

  // Fetch all semiMarks for results (need all judges' marks)
  const allSemiMarks = await db.semiMark.findMany({ select: { eventId: true, studentId: true, judgeId: true, called: true } })

  const eventData: CompEventData[] = events.map(evt => {
    const isSemi = evt.compRound?.round === 'semifinal'
    const phase = evt.compRound?.phase ?? 'semi'
    const finalSize = evt.compRound?.finalSize ?? 6
    const eventSemiMarks = allSemiMarks.filter(m => m.eventId === evt.id)
    const couples = evt.studentEvents
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
          const partner = evt.studentEvents.find(x => x.studentId === se.partnerStudentId)
          if (partner) personB = `${partner.student.firstName} ${partner.student.lastName}`
        }
        const scores = judges.map(j => {
          const s = evt.compScores.find(cs => cs.judgeId === j.id && cs.studentId === student.id)
          return s ? { judgeId: j.id, place: s.place } : null
        }).filter(Boolean) as { judgeId: number; place: number }[]
        const semiCalled = judges.map(j => {
          const m = eventSemiMarks.find(sm => sm.judgeId === j.id && sm.studentId === student.id)
          return { judgeId: j.id, called: m?.called ?? false }
        })
        const callbackCount = eventSemiMarks.filter(m => m.studentId === student.id && m.called).length
        return { studentId: student.id, leaderNumber, personA, personB, scores, semiCalled, callbackCount }
      })
    return { id: evt.id, name: evt.name, isSemi, phase, finalSize, judgeCount: judges.length, couples }
  })

  return (
    <ResultsView
      judges={judges.map(j => ({ id: j.id, name: j.name }))}
      closedHeats={closedHeatData}
      openHeats={openHeatData}
      events={eventData}
      bobDances={bobDances}
      eligibleTeachers={eligibleTeachers}
      eligibleStudios={eligibleStudios}
    />
  )
}
