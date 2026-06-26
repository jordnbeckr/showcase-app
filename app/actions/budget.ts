'use server'

import { db } from '@/lib/db'
import { getSession } from '@/lib/session'
import { revalidatePath } from 'next/cache'

async function requireAdmin() {
  const session = await getSession()
  if (session?.role !== 'admin') throw new Error('Unauthorized')
}

export async function upsertBudgetItem(data: {
  id?: number
  name: string
  category: string
  unitCost: number
  quantity: number
}) {
  await requireAdmin()
  if (data.id) {
    await db.budgetItem.update({
      where: { id: data.id },
      data: { name: data.name, category: data.category, unitCost: data.unitCost, quantity: data.quantity },
    })
  } else {
    const last = await db.budgetItem.findFirst({ orderBy: { order: 'desc' } })
    await db.budgetItem.create({
      data: { name: data.name, category: data.category, unitCost: data.unitCost, quantity: data.quantity, order: (last?.order ?? 0) + 1 },
    })
  }
  revalidatePath('/admin/budget')
}

export async function deleteBudgetItem(id: number) {
  await requireAdmin()
  await db.budgetItem.delete({ where: { id } })
  revalidatePath('/admin/budget')
}

export async function setEntryFee(fee: number) {
  await requireAdmin()
  const existing = await db.showcaseSettings.findFirst()
  if (existing) {
    await db.showcaseSettings.update({ where: { id: existing.id }, data: { entryFee: fee } })
  } else {
    await db.showcaseSettings.create({ data: { entryFee: fee } })
  }
  revalidatePath('/admin/budget')
}

export async function setStudioAttendees(studioId: number, attendees: number) {
  await requireAdmin()
  await db.studioBudget.upsert({
    where: { studioId },
    create: { studioId, attendees },
    update: { attendees },
  })
  revalidatePath('/admin/budget')
}

export async function setStudioPaid(studioId: number, paid: boolean) {
  await requireAdmin()
  await db.studioBudget.upsert({
    where: { studioId },
    create: { studioId, paid },
    update: { paid },
  })
  revalidatePath('/admin/budget')
}
