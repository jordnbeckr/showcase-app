'use server'

import { db } from '@/lib/db'
import { getSession } from '@/lib/session'

async function requireJudge() {
  const session = await getSession()
  if (session?.role !== 'judge') throw new Error('Unauthorized')
  return session.judgeId
}

export async function setClosedScore(heatId: number, studentId: number, placement: string | null) {
  const judgeId = await requireJudge()
  if (placement === null) {
    await db.closedScore.deleteMany({ where: { judgeId, heatId, studentId } })
  } else {
    await db.closedScore.upsert({
      where: { judgeId_heatId_studentId: { judgeId, heatId, studentId } },
      create: { judgeId, heatId, studentId, placement },
      update: { placement },
    })
  }
}

export async function setOpenThumb(heatId: number, studentId: number, categoryId: number, sentiment: string | null) {
  const judgeId = await requireJudge()
  if (sentiment === null) {
    await db.openThumb.deleteMany({ where: { judgeId, heatId, studentId, categoryId } })
  } else {
    await db.openThumb.upsert({
      where: { judgeId_heatId_studentId_categoryId: { judgeId, heatId, studentId, categoryId } },
      create: { judgeId, heatId, studentId, categoryId, sentiment },
      update: { sentiment },
    })
  }
}

export async function setOpenNote(heatId: number, studentId: number, note: string) {
  const judgeId = await requireJudge()
  if (!note.trim()) {
    await db.openNote.deleteMany({ where: { judgeId, heatId, studentId } })
  } else {
    await db.openNote.upsert({
      where: { judgeId_heatId_studentId: { judgeId, heatId, studentId } },
      create: { judgeId, heatId, studentId, note: note.trim() },
      update: { note: note.trim() },
    })
  }
}

export async function setCompScore(eventId: number, studentId: number, place: number | null, heatId = 0) {
  const judgeId = await requireJudge()
  if (place === null) {
    await db.compScore.deleteMany({ where: { judgeId, eventId, heatId, studentId } })
  } else {
    // Enforce only one couple per place per judge per event per dance
    await db.compScore.deleteMany({ where: { judgeId, eventId, heatId, place } })
    await db.compScore.upsert({
      where: { judgeId_eventId_heatId_studentId: { judgeId, eventId, heatId, studentId } },
      create: { judgeId, eventId, heatId, studentId, place },
      update: { place },
    })
  }
}

export async function setSemiMark(eventId: number, heatId: number, studentId: number, called: boolean) {
  const judgeId = await requireJudge()
  await db.semiMark.upsert({
    where: { judgeId_eventId_heatId_studentId: { judgeId, eventId, heatId, studentId } },
    create: { judgeId, eventId, heatId, studentId, called },
    update: { called },
  })
}

export async function setHeatNote(heatId: number, note: string) {
  const judgeId = await requireJudge()
  if (!note.trim()) {
    await db.heatNote.deleteMany({ where: { judgeId, heatId } })
  } else {
    await db.heatNote.upsert({
      where: { judgeId_heatId: { judgeId, heatId } },
      create: { judgeId, heatId, note: note.trim() },
      update: { note: note.trim() },
    })
  }
}
