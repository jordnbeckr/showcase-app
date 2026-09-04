'use server'

import { db } from '@/lib/db'
import { getSession } from '@/lib/session'
import { revalidatePath } from 'next/cache'

async function requireStudio(slug: string) {
  const session = await getSession()
  if (session?.role !== 'studio' || session.studioSlug !== slug) throw new Error('Unauthorized')
  return db.studio.findUniqueOrThrow({ where: { slug } })
}

export async function addAttendanceNote(
  slug: string,
  data: { name: string; status: 'out' | 'maybe'; note?: string | null }
) {
  const studio = await requireStudio(slug)
  const entry = await db.attendanceNote.create({
    data: { studioId: studio.id, name: data.name.trim(), status: data.status, note: data.note?.trim() || null },
  })
  revalidatePath(`/studio/${slug}/plan`)
  return entry
}

export async function removeAttendanceNote(slug: string, id: number) {
  const studio = await requireStudio(slug)
  await db.attendanceNote.deleteMany({ where: { id, studioId: studio.id } })
  revalidatePath(`/studio/${slug}/plan`)
}
