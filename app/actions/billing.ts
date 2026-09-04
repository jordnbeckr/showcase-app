'use server'

import { db } from '@/lib/db'
import { getSession } from '@/lib/session'
import { revalidatePath } from 'next/cache'
import { logActivity } from './activity'

async function requireStudio(slug: string) {
  const session = await getSession()
  if (session?.role !== 'studio' || session.studioSlug !== slug) throw new Error('Unauthorized')
  const studio = await db.studio.findUnique({ where: { slug } })
  if (!studio) throw new Error('Studio not found')
  return studio
}

export async function updateStudioBillingConfig(
  slug: string,
  config: {
    depositAmount: number
    requiresDeposit: boolean
    heatPrice: number
    lunchTicketPrice: number
    maxFreeHeats: number
  }
) {
  const studio = await requireStudio(slug)
  await db.studio.update({ where: { id: studio.id }, data: config })
  revalidatePath(`/studio/${slug}/students`)
}

export async function addLunchGuest(
  slug: string,
  data: { name: string; guestOf?: string | null; lunchTickets?: number }
) {
  const studio = await requireStudio(slug)
  const guest = await db.lunchGuest.create({
    data: { studioId: studio.id, name: data.name.trim(), guestOf: data.guestOf?.trim() || null, lunchTickets: data.lunchTickets ?? 1 },
  })
  await logActivity({ studioSlug: slug, action: 'add_lunch_guest', subject: data.name.trim() + (data.guestOf ? ` (guest of ${data.guestOf})` : '') + ` — ${data.lunchTickets ?? 1} lunch ticket(s)` })
  revalidatePath(`/studio/${slug}/students`)
  return guest
}

export async function updateLunchGuest(
  slug: string,
  id: number,
  data: Partial<{ name: string; guestOf: string | null; lunchTickets: number; paid: boolean; paidDate: string | null; paidInitials: string | null }>
) {
  const studio = await requireStudio(slug)
  await db.lunchGuest.updateMany({ where: { id, studioId: studio.id }, data })
  revalidatePath(`/studio/${slug}/students`)
}

export async function removeLunchGuest(slug: string, id: number) {
  const studio = await requireStudio(slug)
  await db.lunchGuest.deleteMany({ where: { id, studioId: studio.id } })
  revalidatePath(`/studio/${slug}/students`)
}

async function upsertBilling(studioId: number, studentId: number) {
  return db.studentBilling.upsert({
    where: { studioId_studentId: { studioId, studentId } },
    create: { studioId, studentId },
    update: {},
  })
}

export async function updateStudentBilling(
  slug: string,
  studentId: number,
  data: Partial<{
    freeHeats: number
    lunchTickets: number
    isKeyClub: boolean
    depositPaid: boolean
    depositDate: string | null
    depositInitials: string | null
    pifPaid: boolean
    pifDate: string | null
    pifInitials: string | null
    notes: string | null
  }>
) {
  const studio = await requireStudio(slug)
  await db.studentBilling.upsert({
    where: { studioId_studentId: { studioId: studio.id, studentId } },
    create: { studioId: studio.id, studentId, ...data },
    update: data,
  })
  revalidatePath(`/studio/${slug}/students`)
}
