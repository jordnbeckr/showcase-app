'use server'

import { db } from '@/lib/db'
import { getSession } from '@/lib/session'
import { revalidatePath } from 'next/cache'
import { logActivity } from './activity'

async function getStudio(slug: string) {
  const session = await getSession()
  if (session?.role !== 'studio' || session.studioSlug !== slug) throw new Error('Unauthorized')
  return db.studio.findUniqueOrThrow({ where: { slug } })
}

export async function addSpectator(slug: string, formData: FormData) {
  const studio = await getStudio(slug)
  const name = (formData.get('name') as string)?.trim()
  const guestOf = (formData.get('guestOf') as string)?.trim() || null
  if (!name) return { error: 'Name is required' }
  const spectator = await db.spectator.create({ data: { studioId: studio.id, name, guestOf } })
  await logActivity({ studioSlug: slug, action: 'add_spectator', subject: name + (guestOf ? ` (guest of ${guestOf})` : '') })
  revalidatePath(`/studio/${slug}/headcount`)
  revalidatePath('/admin/headcount')
  revalidatePath('/admin/budget')
  return { id: spectator.id }
}

export async function removeSpectator(slug: string, spectatorId: number) {
  const studio = await getStudio(slug)
  await db.spectator.deleteMany({ where: { id: spectatorId, studioId: studio.id } })
  revalidatePath(`/studio/${slug}/headcount`)
  revalidatePath('/admin/headcount')
  revalidatePath('/admin/budget')
}

export async function updateSpectator(slug: string, spectatorId: number, name: string, guestOf: string | null) {
  const studio = await getStudio(slug)
  if (!name.trim()) return
  await db.spectator.updateMany({
    where: { id: spectatorId, studioId: studio.id },
    data: { name: name.trim(), guestOf: guestOf?.trim() || null },
  })
  revalidatePath(`/studio/${slug}/headcount`)
  revalidatePath('/admin/headcount')
}
