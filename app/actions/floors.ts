'use server'

import { db } from '@/lib/db'
import { getSession } from '@/lib/session'
import { revalidatePath } from 'next/cache'

async function requireAdmin() {
  const session = await getSession()
  if (session?.role !== 'admin') throw new Error('Unauthorized')
}

// --- Floor CRUD ---

export async function addFloor(formData: FormData) {
  await requireAdmin()
  const label = (formData.get('label') as string).trim().toUpperCase()
  if (!label) return { error: 'Label required' }
  const max = await db.floor.aggregate({ _max: { order: true } })
  try {
    await db.floor.create({ data: { label, order: (max._max.order ?? 0) + 1 } })
  } catch {
    return { error: `Floor "${label}" already exists` }
  }
  revalidatePath('/admin/floors')
  revalidatePath('/admin/config')
}

export async function deleteFloor(floorId: number) {
  await requireAdmin()
  await db.floor.delete({ where: { id: floorId } })
  revalidatePath('/admin/floors')
  revalidatePath('/admin/config')
}

// --- Manual reassignment ---

export async function setHeatFloorAssignment(heatId: number, studentId: number, floorId: number) {
  await requireAdmin()
  await db.heatFloorAssignment.upsert({
    where: { heatId_studentId: { heatId, studentId } },
    create: { heatId, studentId, floorId },
    update: { floorId },
  })
  revalidatePath('/admin/floors')
}

export async function removeHeatFloorAssignment(heatId: number, studentId: number) {
  await requireAdmin()
  await db.heatFloorAssignment.deleteMany({ where: { heatId, studentId } })
  revalidatePath('/admin/floors')
}

// --- Auto-assign ---

export async function autoAssignFloors(
  heatFrom: number,
  heatTo: number,
  activeFloorIds: number[]
): Promise<{ switches: Record<number, number> }> {
  await requireAdmin()
  if (activeFloorIds.length === 0) return { switches: {} }

  // Load everything we need
  const [heats, floors, events] = await Promise.all([
    db.heat.findMany({
      where: { number: { gte: heatFrom, lte: heatTo } },
      orderBy: { number: 'asc' },
      include: {
        entries: { include: { student: true } },
        events: true,
      },
    }),
    db.floor.findMany({
      where: { id: { in: activeFloorIds } },
      orderBy: { order: 'asc' },
    }),
    db.event.findMany({
      include: { heats: { include: { heat: true } }, studentEvents: true },
    }),
  ])

  // Build event→heats map for competitive multi-dance events
  // key: eventId, value: sorted heat numbers in that event
  const eventHeatNums = new Map<number, number[]>()
  for (const evt of events) {
    const nums = evt.heats.map(eh => eh.heat.number).sort((a, b) => a - b)
    eventHeatNums.set(evt.id, nums)
  }

  // For each student, find their multi-dance event enrollments (studentId → eventId[])
  const studentEvents = new Map<number, number[]>()
  for (const evt of events) {
    for (const se of evt.studentEvents) {
      if (!studentEvents.has(se.studentId)) studentEvents.set(se.studentId, [])
      studentEvents.get(se.studentId)!.push(evt.id)
    }
  }

  const numFloors = floors.length
  // Track current floor per student (index into floors array)
  const lastFloorIdx = new Map<number, number>()
  // Track event→floorIdx so all heats in an event use the same floor
  const eventFloorIdx = new Map<number, number>()
  // Count of entries per floor for current heat (reset each heat)
  // Assignments to write: { heatId, studentId, floorId }[]
  const assignments: { heatId: number; studentId: number; floorId: number }[] = []

  for (const heat of heats) {
    // Count per floor for this heat to balance load
    const floorCount = new Array(numFloors).fill(0)

    // Pre-count already-decided assignments for this heat (from event locks)
    const heatAssigned = new Map<number, number>() // studentId → floorIdx

    // First pass: lock students who are in an event that has already been assigned a floor
    for (const entry of heat.entries) {
      const sid = entry.studentId
      const evtIds = studentEvents.get(sid) ?? []
      for (const evtId of evtIds) {
        const evtHeatNums = eventHeatNums.get(evtId) ?? []
        // This heat belongs to this event
        if (evtHeatNums.includes(heat.number)) {
          if (eventFloorIdx.has(evtId)) {
            const fi = eventFloorIdx.get(evtId)!
            heatAssigned.set(sid, fi)
            floorCount[fi]++
          }
          break
        }
      }
    }

    // Second pass: assign remaining students
    for (const entry of heat.entries) {
      const sid = entry.studentId
      if (heatAssigned.has(sid)) continue

      // Find if this student is in an event that includes this heat but not yet assigned
      let evtIdForThis: number | null = null
      for (const evtId of (studentEvents.get(sid) ?? [])) {
        if ((eventHeatNums.get(evtId) ?? []).includes(heat.number)) {
          evtIdForThis = evtId
          break
        }
      }

      // Choose floor: prefer last floor, then least-loaded floor
      const preferred = lastFloorIdx.get(sid) ?? -1
      let chosen: number

      if (preferred >= 0 && floorCount[preferred] <= Math.ceil(heat.entries.length / numFloors)) {
        chosen = preferred
      } else {
        // Pick least-loaded floor
        chosen = floorCount.reduce((minI, count, i) => count < floorCount[minI] ? i : minI, 0)
      }

      heatAssigned.set(sid, chosen)
      floorCount[chosen]++
      if (evtIdForThis !== null && !eventFloorIdx.has(evtIdForThis)) {
        eventFloorIdx.set(evtIdForThis, chosen)
      }
    }

    // Commit assignments and update lastFloor
    for (const [sid, fi] of heatAssigned) {
      assignments.push({ heatId: heat.id, studentId: sid, floorId: floors[fi].id })
      lastFloorIdx.set(sid, fi)
    }
  }

  // Delete existing assignments in range and write new ones
  const heatIds = heats.map(h => h.id)
  await db.heatFloorAssignment.deleteMany({ where: { heatId: { in: heatIds } } })

  // Batch create
  await db.heatFloorAssignment.createMany({ data: assignments })

  // Calculate switch counts per student for the UI
  const switches: Record<number, number> = {}
  const studentLastFloor = new Map<number, number>()
  for (const heat of heats) {
    for (const a of assignments.filter(x => x.heatId === heat.id)) {
      const prev = studentLastFloor.get(a.studentId)
      if (prev !== undefined && prev !== a.floorId) {
        switches[a.studentId] = (switches[a.studentId] ?? 0) + 1
      }
      studentLastFloor.set(a.studentId, a.floorId)
    }
  }

  revalidatePath('/admin/floors')
  revalidatePath('/studio/[slug]/heatsheet')
  return { switches }
}

// --- Judge floor assignments (legacy global) ---

export async function setJudgeFloors(judgeId: number, floorIds: number[]) {
  await requireAdmin()
  await db.judgeFloor.deleteMany({ where: { judgeId } })
  if (floorIds.length > 0) {
    await db.judgeFloor.createMany({ data: floorIds.map(floorId => ({ judgeId, floorId })) })
  }
  revalidatePath('/admin/config')
  revalidatePath('/judge')
}

// --- Judge floor range assignments (heat-range-scoped) ---

export async function addJudgeFloorRange(judgeId: number, floorId: number, heatFrom: number, heatTo: number | null) {
  await requireAdmin()
  await db.judgeFloorRange.create({
    data: { judgeId, floorId, heatFrom, heatTo: heatTo ?? 9999 },
  })
  revalidatePath('/admin/config')
  revalidatePath('/judge')
}

export async function deleteJudgeFloorRange(rangeId: number) {
  await requireAdmin()
  await db.judgeFloorRange.delete({ where: { id: rangeId } })
  revalidatePath('/admin/config')
  revalidatePath('/judge')
}
