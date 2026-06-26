'use server'

import { db } from '@/lib/db'
import { getSession } from '@/lib/session'
import { revalidatePath } from 'next/cache'
import * as crypto from 'crypto'

async function requireAdmin() {
  const session = await getSession()
  if (session?.role !== 'admin') throw new Error('Unauthorized')
}

function hash(s: string) {
  return crypto.createHash('sha256').update(s).digest('hex')
}

// --- Dance Types ---

export async function addDanceType(formData: FormData) {
  await requireAdmin()
  const name = (formData.get('name') as string).trim()
  if (!name) return { error: 'Name required' }
  const maxOrder = await db.danceType.aggregate({ _max: { order: true } })
  await db.danceType.create({ data: { name, order: (maxOrder._max.order ?? 0) + 1 } })
  revalidatePath('/admin/config')
}

export async function deleteDanceType(id: number) {
  await requireAdmin()
  const heats = await db.heat.count({ where: { danceTypeId: id } })
  if (heats > 0) return { error: 'Remove all heats for this dance first' }
  await db.danceType.delete({ where: { id } })
  revalidatePath('/admin/config')
}

export async function renameDanceType(id: number, formData: FormData) {
  await requireAdmin()
  const name = (formData.get('name') as string).trim()
  if (!name) return { error: 'Name required' }
  await db.danceType.update({ where: { id }, data: { name } })
  revalidatePath('/admin/config')
  revalidatePath('/admin/master')
  revalidatePath('/view')
}

// --- Heats ---

export async function setHeatCount(danceTypeId: number, formData: FormData) {
  await requireAdmin()
  const count = parseInt(formData.get('count') as string)
  if (isNaN(count) || count < 0) return { error: 'Invalid count' }

  const existing = await db.heat.findMany({ where: { danceTypeId }, orderBy: { number: 'asc' } })

  if (count > existing.length) {
    // Add heats — get the max heat number globally
    const maxHeat = await db.heat.aggregate({ _max: { number: true } })
    let nextNum = (maxHeat._max.number ?? 0) + 1
    const toAdd = count - existing.length
    for (let i = 0; i < toAdd; i++) {
      await db.heat.create({ data: { number: nextNum++, danceTypeId } })
    }
  } else if (count < existing.length) {
    // Remove from the end, but only heats with no entries
    const toRemove = existing.slice(count)
    for (const heat of toRemove) {
      const entryCount = await db.heatEntry.count({ where: { heatId: heat.id } })
      if (entryCount > 0) return { error: `Heat #${heat.number} has entries — remove them first` }
      await db.heat.delete({ where: { id: heat.id } })
    }
  }

  revalidatePath('/admin/config')
  revalidatePath('/admin/master')
  revalidatePath('/view')
}

export async function addHeat(danceTypeId: number) {
  await requireAdmin()
  const maxHeat = await db.heat.aggregate({ _max: { number: true } })
  const nextNum = (maxHeat._max.number ?? 0) + 1
  await db.heat.create({ data: { number: nextNum, danceTypeId } })
  revalidatePath('/admin/config')
  revalidatePath('/admin/master')
}

export async function removeLastHeat(danceTypeId: number) {
  await requireAdmin()
  const heats = await db.heat.findMany({ where: { danceTypeId }, orderBy: { number: 'desc' } })
  if (heats.length === 0) return
  const last = heats[0]
  const entryCount = await db.heatEntry.count({ where: { heatId: last.id } })
  if (entryCount > 0) return { error: `Heat #${last.number} has ${entryCount} entries — remove them first` }
  await db.heat.delete({ where: { id: last.id } })
  revalidatePath('/admin/config')
  revalidatePath('/admin/master')
}

// --- Studios ---

export async function addStudio(formData: FormData) {
  await requireAdmin()
  const name = (formData.get('name') as string).trim()
  const password = (formData.get('password') as string).trim()
  if (!name || !password) return { error: 'Name and password required' }
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  try {
    const maxOrder = await db.studio.aggregate({ _max: { order: true } })
    await db.studio.create({
      data: { name, slug, passwordHash: hash(password), order: (maxOrder._max.order ?? 0) + 1 },
    })
  } catch {
    return { error: 'Studio name already exists' }
  }
  revalidatePath('/admin/config')
}

export async function updateStudioPassword(studioId: number, formData: FormData) {
  await requireAdmin()
  const password = (formData.get('password') as string).trim()
  if (!password) return { error: 'Password required' }
  await db.studio.update({ where: { id: studioId }, data: { passwordHash: hash(password) } })
  revalidatePath('/admin/config')
}

export async function deleteStudio(studioId: number) {
  await requireAdmin()
  await db.studio.delete({ where: { id: studioId } })
  revalidatePath('/admin/config')
}

// --- Instructors ---

export async function addInstructor(studioId: number, formData: FormData) {
  await requireAdmin()
  const name = (formData.get('name') as string).trim()
  if (!name) return { error: 'Name required' }
  await db.instructor.create({ data: { name, studioId } })
  revalidatePath('/admin/config')
  revalidatePath('/admin/master')
}

export async function removeInstructor(instructorId: number) {
  await requireAdmin()
  const entries = await db.heatEntry.count({ where: { instructorId } })
  if (entries > 0) return { error: 'Instructor has heat entries — reassign or remove them first' }
  await db.instructor.delete({ where: { id: instructorId } })
  revalidatePath('/admin/config')
  revalidatePath('/admin/master')
}

export async function moveInstructor(instructorId: number, formData: FormData) {
  await requireAdmin()
  const newStudioId = parseInt(formData.get('studioId') as string)
  await db.instructor.update({ where: { id: instructorId }, data: { studioId: newStudioId } })
  revalidatePath('/admin/config')
  revalidatePath('/admin/master')
}

// --- Heat Reordering ---

export async function reorderDanceTypes(orderedIds: number[]) {
  await requireAdmin()
  await db.$transaction(
    orderedIds.map((id, i) => db.danceType.update({ where: { id }, data: { order: i } }))
  )
  revalidatePath('/admin/config')
}

export async function reorderHeats(orderedIds: number[]) {
  await requireAdmin()
  // Two-pass to avoid unique constraint conflicts during renumbering
  await db.$transaction(async (tx: Omit<typeof db, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>) => {
    for (let i = 0; i < orderedIds.length; i++) {
      await tx.heat.update({ where: { id: orderedIds[i] }, data: { number: 100000 + i + 1 } })
    }
    for (let i = 0; i < orderedIds.length; i++) {
      await tx.heat.update({ where: { id: orderedIds[i] }, data: { number: i + 1 } })
    }
  })
  revalidatePath('/admin/config')
  revalidatePath('/admin/master')
  revalidatePath('/view')
}

// --- Leader Numbers ---

export async function setLeaderNumber(studentId: number, leaderNumber: number | null) {
  await requireAdmin()
  await db.student.update({ where: { id: studentId }, data: { leaderNumber } })
  revalidatePath('/admin/leaders')
}

export async function setInstructorLeaderNumber(instructorId: number, leaderNumber: number | null) {
  await requireAdmin()
  await db.instructor.update({ where: { id: instructorId }, data: { leaderNumber } })
  revalidatePath('/admin/leaders')
}

export async function setInstructorRole(instructorId: number, role: string) {
  await requireAdmin()
  await db.instructor.update({ where: { id: instructorId }, data: { role } })
  revalidatePath('/admin/leaders')
  revalidatePath('/admin/config')
}

export async function autoAssignLeaderNumbers() {
  await requireAdmin()
  const instructors = await db.instructor.findMany({
    where: { role: 'Leader' },
    orderBy: [{ name: 'asc' }],
  })
  const students = await db.student.findMany({
    where: { role: 'Leader' },
    orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
  })

  // Sort instructors by last name
  const sortedInstructors = [...instructors].sort((a, b) => {
    const aLast = a.name.trim().split(' ').pop() ?? a.name
    const bLast = b.name.trim().split(' ').pop() ?? b.name
    return aLast.localeCompare(bLast)
  })

  await db.$transaction(async (tx: Omit<typeof db, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>) => {
    for (let i = 0; i < sortedInstructors.length; i++) {
      await tx.instructor.update({ where: { id: sortedInstructors[i].id }, data: { leaderNumber: 100 + i } })
    }
    for (let i = 0; i < students.length; i++) {
      await tx.student.update({ where: { id: students[i].id }, data: { leaderNumber: 200 + i } })
    }
  })

  revalidatePath('/admin/leaders')
  revalidatePath('/admin/attendance')
}

// --- Attendance ---

export async function toggleCheckedIn(studentId: number) {
  await requireAdmin()
  const s = await db.student.findUnique({ where: { id: studentId } })
  if (!s) return
  await db.student.update({ where: { id: studentId }, data: { checkedIn: !s.checkedIn } })
  revalidatePath('/admin/attendance')
}

// --- Budget ---

// Budget item CRUD moved to app/actions/budget.ts

// --- Multi-dance Events ---

export async function addEvent(formData: FormData) {
  await requireAdmin()
  const name = (formData.get('name') as string).trim()
  if (!name) return { error: 'Event name required' }
  const maxOrder = await db.event.aggregate({ _max: { order: true } })
  await db.event.create({ data: { name, order: (maxOrder._max.order ?? 0) + 1 } })
  revalidatePath('/admin/config')
}

export async function renameEvent(eventId: number, formData: FormData) {
  await requireAdmin()
  const name = (formData.get('name') as string).trim()
  if (!name) return { error: 'Name required' }
  await db.event.update({ where: { id: eventId }, data: { name } })
  revalidatePath('/admin/config')
  revalidatePath('/view')
}

export async function deleteEvent(eventId: number) {
  await requireAdmin()
  await db.event.delete({ where: { id: eventId } })
  revalidatePath('/admin/config')
}

export async function addHeatToEvent(heatId: number, eventId: number) {
  await requireAdmin()
  await db.eventHeat.upsert({
    where: { eventId_heatId: { eventId, heatId } },
    create: { eventId, heatId },
    update: {},
  })
  revalidatePath('/admin/config')
}

export async function removeHeatFromEvent(heatId: number, eventId: number) {
  await requireAdmin()
  await db.eventHeat.deleteMany({ where: { eventId, heatId } })
  revalidatePath('/admin/config')
}
