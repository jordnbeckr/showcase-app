'use server'

import { db } from '@/lib/db'
import { getSession } from '@/lib/session'
import { revalidatePath } from 'next/cache'

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
  await db.spectator.create({ data: { studioId: studio.id, name, guestOf } })
  revalidatePath(`/studio/${slug}/headcount`)
  revalidatePath('/admin/headcount')
  revalidatePath('/admin/budget')
}

export async function removeSpectator(slug: string, spectatorId: number) {
  const studio = await getStudio(slug)
  await db.spectator.deleteMany({ where: { id: spectatorId, studioId: studio.id } })
  revalidatePath(`/studio/${slug}/headcount`)
  revalidatePath('/admin/headcount')
  revalidatePath('/admin/budget')
}
