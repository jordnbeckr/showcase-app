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
    depositDate: string
    depositInitials: string
    pifPaid: boolean
    pifDate: string
    pifInitials: string
    notes: string
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
