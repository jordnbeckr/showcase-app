'use server'

import { db } from '@/lib/db'
import { getSession } from '@/lib/session'
import { revalidatePath } from 'next/cache'

async function requireStudio(slug: string) {
  const session = await getSession()
  if (session?.role !== 'studio' || session.studioSlug !== slug) throw new Error('Unauthorized')
  const studio = await db.studio.findUnique({ where: { slug } })
  if (!studio) throw new Error('Studio not found')
  return studio
}

export async function setPlanEntry(
  slug: string,
  instructorId: number,
  studentId: number,
  danceTypeId: number,
  category: 'closed' | 'open',
  slotIndex: number
) {
  const studio = await requireStudio(slug)
  await db.planEntry.upsert({
    where: { instructorId_danceTypeId_category_slotIndex: { instructorId, danceTypeId, category, slotIndex } },
    create: { studioId: studio.id, instructorId, studentId, danceTypeId, category, slotIndex },
    update: { studentId, isPublished: false },
  })
  revalidatePath(`/studio/${slug}/plan`)
}

export async function clearPlanEntry(slug: string, id: number) {
  await requireStudio(slug)
  await db.planEntry.delete({ where: { id } })
  revalidatePath(`/studio/${slug}/plan`)
}

export async function unpublishPlanEntry(slug: string, id: number) {
  await requireStudio(slug)
  const entry = await db.planEntry.findUnique({ where: { id } })
  if (!entry) return
  // Find the Nth heat (1-indexed slotIndex) for this dance+category
  const heats = await db.heat.findMany({
    where: { danceTypeId: entry.danceTypeId, category: entry.category },
    orderBy: { number: 'asc' },
  })
  const heat = heats[entry.slotIndex - 1]
  if (heat) {
    await db.heatEntry.deleteMany({ where: { heatId: heat.id, studentId: entry.studentId } })
  }
  await db.planEntry.delete({ where: { id } })
  revalidatePath(`/studio/${slug}/plan`)
  revalidatePath(`/studio/${slug}/heats`)
}

export async function unpublishPlanEventEntry(slug: string, id: number) {
  await requireStudio(slug)
  const entry = await db.planEventEntry.findUnique({ where: { id } })
  if (!entry) return
  const eventHeats = await db.eventHeat.findMany({ where: { eventId: entry.eventId } })
  for (const eh of eventHeats) {
    await db.heatEntry.deleteMany({ where: { heatId: eh.heatId, studentId: entry.studentId } })
  }
  await db.studentEvent.deleteMany({ where: { studentId: entry.studentId, eventId: entry.eventId } })
  await db.planEventEntry.delete({ where: { id } })
  revalidatePath(`/studio/${slug}/plan`)
  revalidatePath(`/studio/${slug}/heats`)
}

export async function addPlanEventEntry(
  slug: string,
  instructorId: number,
  studentId: number,
  eventId: number
) {
  const studio = await requireStudio(slug)
  await db.planEventEntry.upsert({
    where: { instructorId_studentId_eventId: { instructorId, studentId, eventId } },
    create: { studioId: studio.id, instructorId, studentId, eventId },
    update: {},
  })
  revalidatePath(`/studio/${slug}/plan`)
}

export async function removePlanEventEntry(slug: string, id: number) {
  await requireStudio(slug)
  await db.planEventEntry.delete({ where: { id } })
  revalidatePath(`/studio/${slug}/plan`)
}

export async function publishPlanEventEntries(slug: string) {
  const studio = await requireStudio(slug)

  const unpublished = await db.planEventEntry.findMany({
    where: { studioId: studio.id, isPublished: false },
  })

  let published = 0
  const skipReasons: string[] = []

  for (const entry of unpublished) {
    // Create StudentEvent if it doesn't exist
    const existingSE = await db.studentEvent.findUnique({
      where: { studentId_eventId: { studentId: entry.studentId, eventId: entry.eventId } },
    })
    if (existingSE) { skipReasons.push(`event already exists: studentId=${entry.studentId} eventId=${entry.eventId}`); continue }

    await db.studentEvent.create({
      data: { studentId: entry.studentId, eventId: entry.eventId, instructorId: entry.instructorId },
    })

    // Create HeatEntry for every heat linked to this event
    const eventHeats = await db.eventHeat.findMany({
      where: { eventId: entry.eventId },
      include: { heat: true },
    })
    for (const eh of eventHeats) {
      const existingHE = await db.heatEntry.findUnique({
        where: { heatId_studentId: { heatId: eh.heatId, studentId: entry.studentId } },
      })
      if (!existingHE) {
        await db.heatEntry.create({
          data: { heatId: eh.heatId, studentId: entry.studentId, instructorId: entry.instructorId },
        })
      }
    }

    await db.planEventEntry.update({ where: { id: entry.id }, data: { isPublished: true } })
    published++
  }

  revalidatePath(`/studio/${slug}/plan`)
  revalidatePath(`/studio/${slug}/heats`)
  revalidatePath(`/studio/${slug}/heatsheet`)

  return { published, skipped: skipReasons.length, skipReasons }
}

export async function publishPlanEntries(slug: string) {
  const studio = await requireStudio(slug)

  const unpublished = await db.planEntry.findMany({
    where: { studioId: studio.id, isPublished: false },
    orderBy: { slotIndex: 'asc' },
  })

  let published = 0
  const skipReasons: string[] = []

  for (const entry of unpublished) {
    const heats = await db.heat.findMany({
      where: { danceTypeId: entry.danceTypeId, category: entry.category },
      orderBy: { number: 'asc' },
    })
    const heat = heats[entry.slotIndex - 1]
    if (!heat) {
      skipReasons.push(`no heat: danceTypeId=${entry.danceTypeId} category=${entry.category} slot=${entry.slotIndex} (found ${heats.length} heats)`)
      continue
    }

    const exists = await db.heatEntry.findUnique({
      where: { heatId_studentId: { heatId: heat.id, studentId: entry.studentId } },
    })
    if (exists) {
      skipReasons.push(`already exists: heatId=${heat.id} studentId=${entry.studentId}`)
      continue
    }

    await db.heatEntry.create({
      data: { heatId: heat.id, studentId: entry.studentId, instructorId: entry.instructorId },
    })
    await db.planEntry.update({ where: { id: entry.id }, data: { isPublished: true } })
    published++
  }

  // Also publish event entries
  const eventResult = await publishPlanEventEntries(slug)
  published += eventResult.published
  skipReasons.push(...eventResult.skipReasons)

  revalidatePath(`/studio/${slug}/plan`)
  revalidatePath(`/studio/${slug}/heats`)
  revalidatePath(`/studio/${slug}/heatsheet`)

  return { published, skipped: skipReasons.length, skipReasons }
}
