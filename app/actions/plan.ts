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

export async function publishPlanEntries(slug: string) {
  const studio = await requireStudio(slug)

  const unpublished = await db.planEntry.findMany({
    where: { studioId: studio.id, isPublished: false },
    orderBy: { slotIndex: 'asc' },
  })

  let published = 0
  let skipped = 0

  for (const entry of unpublished) {
    // Find the Nth heat for this dance+category (slotIndex 1 = first heat, 2 = second, etc.)
    const heats = await db.heat.findMany({
      where: { danceTypeId: entry.danceTypeId, category: entry.category },
      orderBy: { number: 'asc' },
    })
    const heat = heats[entry.slotIndex - 1]
    if (!heat) { skipped++; continue }

    const exists = await db.heatEntry.findUnique({
      where: { heatId_studentId: { heatId: heat.id, studentId: entry.studentId } },
    })
    if (exists) { skipped++; continue }

    await db.heatEntry.create({
      data: { heatId: heat.id, studentId: entry.studentId, instructorId: entry.instructorId },
    })
    await db.planEntry.update({ where: { id: entry.id }, data: { isPublished: true } })
    published++
  }

  revalidatePath(`/studio/${slug}/plan`)
  revalidatePath(`/studio/${slug}/heats`)
  revalidatePath(`/studio/${slug}/heatsheet`)

  return { published, skipped }
}
