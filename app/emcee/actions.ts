'use server'

import { db } from '@/lib/db'
import { getSession } from '@/lib/session'
import { revalidatePath } from 'next/cache'

async function requireEmcee() {
  const session = await getSession()
  if (session?.role !== 'emcee') throw new Error('Unauthorized')
  return session
}

export async function advanceHeat(heatNumber: number) {
  await requireEmcee()
  await db.showState.updateMany({ data: { currentHeatNumber: heatNumber } })
  revalidatePath('/emcee')
}

export async function moveEventToFinals(eventId: number) {
  await requireEmcee()
  await db.compRound.update({
    where: { eventId },
    data: { phase: 'final' },
  })
  revalidatePath('/emcee')
  revalidatePath('/judge')
}
