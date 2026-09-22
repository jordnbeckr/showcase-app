import { db } from '@/lib/db'
import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'
import EmceeClient from './EmceeClient'

export const dynamic = 'force-dynamic'

export default async function EmceePage() {
  const session = await getSession()
  if (session?.role !== 'emcee') redirect('/login/emcee')

  const [heats, showState, events] = await Promise.all([
    db.heat.findMany({
      orderBy: { number: 'asc' },
      include: {
        danceType: true,
        entries: {
          include: {
            student: true,
            partnerStudent: true,
            instructor: true,
          },
        },
        floorAssignments: { include: { floor: true } },
        events: {
          include: {
            event: {
              include: {
                compRound: true,
                semiMarks: { include: { student: true } },
              },
            },
          },
        },
      },
    }),
    db.showState.findFirst(),
    db.event.findMany({
      where: { isCompetitive: true },
      include: {
        compRound: true,
        heats: { include: { heat: true } },
        semiMarks: { include: { student: true } },
        compScores: { include: { student: true } },
        studentEvents: {
          include: {
            student: true,
            instructor: true,
            partnerStudent: true,
          },
        },
      },
      orderBy: { order: 'asc' },
    }),
  ])

  const currentHeatNumber = showState?.currentHeatNumber ?? 0

  const heatRows = heats.map(h => {
    const eventLink = h.events[0]?.event ?? null
    const floorByStudent = new Map(h.floorAssignments.map(fa => [fa.studentId, fa.floor.label]))
    return {
      number: h.number,
      dance: h.danceType.name,
      category: h.category,
      entries: h.entries.map(e => ({
        studentName: `${e.student.firstName} ${e.student.lastName}`,
        partnerName: e.partnerStudent ? `${e.partnerStudent.firstName} ${e.partnerStudent.lastName}` : null,
        instructor: e.instructor?.name ?? null,
        floor: floorByStudent.get(e.studentId) ?? null,
        level: e.student.level,
      })),
      event: eventLink ? {
        id: eventLink.id,
        name: eventLink.name,
        phase: eventLink.compRound?.phase ?? 'semi',
        callbacks: eventLink.semiMarks
          .filter(m => m.called)
          .map(m => `${m.student.firstName} ${m.student.lastName}`),
      } : null,
    }
  })

  const compEvents = events.map(ev => {
    const heatNumber = ev.heats[0]?.heat?.number ?? 0

    // Build couple label map: studentId → "Leader & Follower"
    const coupleLabel = new Map<number, string>()
    for (const se of ev.studentEvents) {
      const studentFull = `${se.student.firstName} ${se.student.lastName}`
      let label: string
      if (se.instructor) {
        // Pro-am: figure out who leads
        if (se.instructor.role === 'Leader') {
          label = `${se.instructor.name} & ${studentFull}`
        } else {
          label = `${studentFull} & ${se.instructor.name}`
        }
      } else if (se.partnerStudent) {
        // Amateur couple: student is leader (only leaders have SemiMarks)
        const partnerFull = `${se.partnerStudent.firstName} ${se.partnerStudent.lastName}`
        label = se.student.role === 'Leader'
          ? `${studentFull} & ${partnerFull}`
          : `${partnerFull} & ${studentFull}`
      } else {
        label = studentFull
      }
      coupleLabel.set(se.studentId, label)
    }

    const callMap = new Map<number, { label: string; count: number }>()
    for (const m of ev.semiMarks) {
      if (m.called) {
        const existing = callMap.get(m.studentId)
        if (existing) existing.count++
        else callMap.set(m.studentId, {
          label: coupleLabel.get(m.studentId) ?? `${m.student.firstName} ${m.student.lastName}`,
          count: 1,
        })
      }
    }
    const callbacks = [...callMap.values()].sort((a, b) => b.count - a.count).map(v => v.label)

    const placeMap = new Map<number, { label: string; total: number }>()
    for (const s of ev.compScores) {
      const existing = placeMap.get(s.studentId)
      if (existing) existing.total += s.place
      else placeMap.set(s.studentId, {
        label: coupleLabel.get(s.studentId) ?? `${s.student.firstName} ${s.student.lastName}`,
        total: s.place,
      })
    }
    const finalPlacements = [...placeMap.values()]
      .sort((a, b) => a.total - b.total)
      .map((v, i) => ({ place: i + 1, name: v.label }))

    return {
      id: ev.id,
      name: ev.name,
      phase: ev.compRound?.phase ?? 'semi',
      heatNumber,
      callbacks,
      finalPlacements,
    }
  })

  return (
    <main className="min-h-screen p-4 pb-10" style={{ backgroundColor: 'var(--surface)' }}>
      <div className="max-w-2xl mx-auto mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold" style={{ color: 'var(--text)' }}>Emcee</h1>
        <form action={'/api/logout'}>
          <button type="submit" className="text-sm" style={{ color: 'var(--muted)' }}>Sign out</button>
        </form>
      </div>
      <EmceeClient
        currentHeatNumber={currentHeatNumber}
        heats={heatRows}
        compEvents={compEvents}
      />
    </main>
  )
}
