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

export async function addPlanEntry(
  slug: string,
  instructorId: number,
  studentId: number,
  danceTypeId: number,
  category: 'closed' | 'open'
) {
  const studio = await requireStudio(slug)
  // Don't allow duplicates (same instructor+student+dance+category)
  const existing = await db.planEntry.findFirst({
    where: { studioId: studio.id, instructorId, studentId, danceTypeId, category },
  })
  if (existing) return
  await db.planEntry.create({
    data: { studioId: studio.id, instructorId, studentId, danceTypeId, category },
  })
  revalidatePath(`/studio/${slug}/plan`)
}

export async function removePlanEntry(slug: string, id: number) {
  await requireStudio(slug)
  await db.planEntry.delete({ where: { id } })
  revalidatePath(`/studio/${slug}/plan`)
}

export async function publishPlanEntries(slug: string) {
  const studio = await requireStudio(slug)

  const unpublished = await db.planEntry.findMany({
    where: { studioId: studio.id, isPublished: false },
    include: { danceType: true },
  })

  let published = 0
  let skipped = 0

  for (const entry of unpublished) {
    // Find matching heat by danceType + category
    const heat = await db.heat.findFirst({
      where: { danceTypeId: entry.danceTypeId, category: entry.category },
      orderBy: { number: 'asc' },
    })
    if (!heat) { skipped++; continue }

    // Skip if entry already exists
    const exists = await db.heatEntry.findUnique({
      where: { heatId_studentId: { heatId: heat.id, studentId: entry.studentId } },
    })
    if (exists) { skipped++; continue }

    await db.heatEntry.create({
      data: {
        heatId: heat.id,
        studentId: entry.studentId,
        instructorId: entry.instructorId,
      },
    })

    await db.planEntry.update({ where: { id: entry.id }, data: { isPublished: true } })
    published++
  }

  revalidatePath(`/studio/${slug}/plan`)
  revalidatePath(`/studio/${slug}/heats`)
  revalidatePath(`/studio/${slug}/heatsheet`)

  return { published, skipped }
}
