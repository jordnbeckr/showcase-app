'use server'

import { db } from '@/lib/db'
import { getSession } from '@/lib/session'
import { revalidatePath } from 'next/cache'

async function requireStudio(studioSlug: string) {
  const session = await getSession()
  if (session?.role !== 'studio' || session.studioSlug !== studioSlug) {
    throw new Error('Unauthorized')
  }
  const studio = await db.studio.findUnique({ where: { slug: studioSlug } })
  if (!studio) throw new Error('Studio not found')
  return studio
}

// --- Students ---

export async function addStudent(studioSlug: string, formData: FormData) {
  const studio = await requireStudio(studioSlug)
  const firstName = (formData.get('firstName') as string).trim()
  const lastName = (formData.get('lastName') as string).trim()
  const role = formData.get('role') as string
  if (!firstName || !lastName || !role) return { error: 'All fields required' }
  await db.student.create({ data: { firstName, lastName, role, studioId: studio.id } })
  revalidatePath(`/studio/${studioSlug}/roster`)
  revalidatePath(`/studio/${studioSlug}/heats`)
}

export async function updateStudent(studioSlug: string, studentId: number, formData: FormData) {
  const studio = await requireStudio(studioSlug)
  const student = await db.student.findFirst({ where: { id: studentId, studioId: studio.id } })
  if (!student) return { error: 'Student not found' }
  const firstName = (formData.get('firstName') as string).trim()
  const lastName = (formData.get('lastName') as string).trim()
  const role = formData.get('role') as string
  await db.student.update({ where: { id: studentId }, data: { firstName, lastName, role } })
  revalidatePath(`/studio/${studioSlug}/roster`)
  revalidatePath(`/studio/${studioSlug}/heats`)
}

export async function deleteStudent(studioSlug: string, studentId: number) {
  const studio = await requireStudio(studioSlug)
  const student = await db.student.findFirst({ where: { id: studentId, studioId: studio.id } })
  if (!student) return { error: 'Student not found' }
  await db.student.delete({ where: { id: studentId } })
  revalidatePath(`/studio/${studioSlug}/roster`)
  revalidatePath(`/studio/${studioSlug}/heats`)
}

// --- Heat entries ---

export async function addHeatEntry(
  studioSlug: string,
  heatId: number,
  studentId: number,
  instructorId: number
) {
  const studio = await requireStudio(studioSlug)

  // Verify student belongs to this studio
  const student = await db.student.findFirst({ where: { id: studentId, studioId: studio.id } })
  if (!student) return { error: 'Student not found' }

  // Verify instructor belongs to this studio
  const instructor = await db.instructor.findFirst({ where: { id: instructorId, studioId: studio.id } })
  if (!instructor) return { error: 'Instructor not found' }

  // Check heat capacity
  const heat = await db.heat.findUnique({ where: { id: heatId }, include: { entries: true } })
  if (!heat) return { error: 'Heat not found' }
  if (heat.entries.length >= heat.maxCapacity) return { error: 'Heat is full' }

  try {
    await db.heatEntry.create({ data: { heatId, studentId, instructorId } })
  } catch {
    return { error: 'Student already signed up for this heat' }
  }

  revalidatePath(`/studio/${studioSlug}/heats`)
  revalidatePath('/admin/master')
  revalidatePath('/view')
}

export async function addEventEntry(
  studioSlug: string,
  eventId: number,
  studentId: number,
  instructorId: number
) {
  const studio = await requireStudio(studioSlug)

  const student = await db.student.findFirst({ where: { id: studentId, studioId: studio.id } })
  if (!student) return { error: 'Student not found' }

  const instructor = await db.instructor.findFirst({ where: { id: instructorId, studioId: studio.id } })
  if (!instructor) return { error: 'Instructor not found' }

  const event = await db.event.findUnique({
    where: { id: eventId },
    include: {
      heats: {
        include: { heat: { include: { entries: true } } },
        orderBy: { heat: { number: 'asc' } },
      },
    },
  })
  if (!event) return { error: 'Event not found' }
  if (event.heats.length === 0) return { error: 'Event has no heats assigned yet' }

  type EventHeatWithEntries = typeof event.heats[number]['heat']
  const heats: EventHeatWithEntries[] = event.heats.map((eh: typeof event.heats[number]) => eh.heat)

  // Check student not already enrolled in this event (via StudentEvent)
  const alreadyEnrolled = await db.studentEvent.findFirst({ where: { studentId, eventId } })
  if (alreadyEnrolled) return { error: 'Student already signed up for this event' }

  // Check capacity on every heat
  for (const heat of heats) {
    if (heat.entries.length >= heat.maxCapacity) {
      return { error: `Heat #${heat.number} is full (${heat.maxCapacity}/${heat.maxCapacity})` }
    }
  }

  const heatIds = heats.map((h: EventHeatWithEntries) => h.id)
  await db.$transaction([
    db.studentEvent.create({ data: { studentId, eventId, instructorId } }),
    // Remove any orphaned entries for this student in these heats before creating fresh ones
    db.heatEntry.deleteMany({ where: { studentId, heatId: { in: heatIds } } }),
    db.heatEntry.createMany({ data: heatIds.map(heatId => ({ heatId, studentId, instructorId })) }),
  ])

  revalidatePath(`/studio/${studioSlug}/heats`)
  revalidatePath('/admin/master')
  revalidatePath('/view')
}

export async function removeEventEntry(
  studioSlug: string,
  eventId: number,
  studentId: number
): Promise<{ error: string } | null> {
  await requireStudio(studioSlug)
  const eventHeatRows = await db.eventHeat.findMany({ where: { eventId } })
  const eventHeatIds = eventHeatRows.map((eh: { eventId: number; heatId: number }) => eh.heatId)
  await db.$transaction([
    db.studentEvent.deleteMany({ where: { studentId, eventId } }),
    db.heatEntry.deleteMany({ where: { studentId, heatId: { in: eventHeatIds } } }),
  ])
  revalidatePath(`/studio/${studioSlug}/heats`)
  revalidatePath('/admin/master')
  revalidatePath('/view')
  return null
}

export async function addAmateurEventEntry(
  studioSlug: string,
  eventId: number,
  leaderId: number,
  followerId: number
) {
  const studio = await requireStudio(studioSlug)

  const leader = await db.student.findFirst({ where: { id: leaderId, studioId: studio.id } })
  const follower = await db.student.findFirst({ where: { id: followerId, studioId: studio.id } })
  if (!leader || !follower) return { error: 'Students not found' }
  if (leaderId === followerId) return { error: 'Leader and follower must be different students' }

  const event = await db.event.findUnique({
    where: { id: eventId },
    include: { heats: { include: { heat: { include: { entries: true } } }, orderBy: { heat: { number: 'asc' } } } },
  })
  if (!event) return { error: 'Event not found' }
  if (event.heats.length === 0) return { error: 'Event has no heats assigned yet' }

  const alreadyLeader = await db.studentEvent.findFirst({ where: { studentId: leaderId, eventId } })
  const alreadyFollower = await db.studentEvent.findFirst({ where: { studentId: followerId, eventId } })
  if (alreadyLeader) return { error: `${leader.firstName} is already enrolled in this event` }
  if (alreadyFollower) return { error: `${follower.firstName} is already enrolled in this event` }

  for (const eh of event.heats) {
    if (eh.heat.entries.length + 2 > eh.heat.maxCapacity) {
      return { error: `Heat #${eh.heat.number} doesn't have room for both students` }
    }
  }

  const heatIds = event.heats.map(eh => eh.heatId)
  await db.$transaction([
    db.studentEvent.create({ data: { studentId: leaderId, eventId, partnerStudentId: followerId } }),
    db.studentEvent.create({ data: { studentId: followerId, eventId, partnerStudentId: leaderId } }),
    db.heatEntry.deleteMany({ where: { studentId: { in: [leaderId, followerId] }, heatId: { in: heatIds } } }),
    db.heatEntry.createMany({
      data: [
        ...heatIds.map(heatId => ({ heatId, studentId: leaderId, partnerStudentId: followerId })),
        ...heatIds.map(heatId => ({ heatId, studentId: followerId, partnerStudentId: leaderId })),
      ],
    }),
  ])

  revalidatePath(`/studio/${studioSlug}/heats`)
  revalidatePath('/admin/master')
  revalidatePath('/view')
}

export async function removeAmateurEventEntry(
  studioSlug: string,
  eventId: number,
  studentId: number
) {
  await requireStudio(studioSlug)
  const enrollment = await db.studentEvent.findFirst({ where: { studentId, eventId } })
  const partnerId = enrollment?.partnerStudentId ?? null

  const eventHeatRows = await db.eventHeat.findMany({ where: { eventId } })
  const heatIds = eventHeatRows.map(eh => eh.heatId)

  const deleteIds = partnerId ? [studentId, partnerId] : [studentId]
  await db.$transaction([
    db.studentEvent.deleteMany({ where: { studentId: { in: deleteIds }, eventId } }),
    db.heatEntry.deleteMany({ where: { studentId: { in: deleteIds }, heatId: { in: heatIds } } }),
  ])

  revalidatePath(`/studio/${studioSlug}/heats`)
  revalidatePath('/admin/master')
  revalidatePath('/view')
  return null
}

export async function removeHeatEntry(studioSlug: string, entryId: number) {
  const studio = await requireStudio(studioSlug)
  const entry = await db.heatEntry.findFirst({
    where: { id: entryId, student: { studioId: studio.id } },
  })
  if (!entry) return { error: 'Entry not found' }
  await db.heatEntry.delete({ where: { id: entryId } })
  revalidatePath(`/studio/${studioSlug}/heats`)
  revalidatePath('/admin/master')
  revalidatePath('/view')
}

export async function addAmateurHeatEntry(
  studioSlug: string,
  heatId: number,
  leaderId: number,
  followerId: number
) {
  const studio = await requireStudio(studioSlug)

  const leader = await db.student.findFirst({ where: { id: leaderId, studioId: studio.id } })
  const follower = await db.student.findFirst({ where: { id: followerId, studioId: studio.id } })
  if (!leader || !follower) return { error: 'Students not found' }
  if (leaderId === followerId) return { error: 'Leader and follower must be different students' }

  const heat = await db.heat.findUnique({ where: { id: heatId }, include: { entries: true } })
  if (!heat) return { error: 'Heat not found' }
  if (heat.entries.length + 2 > heat.maxCapacity) return { error: 'Not enough capacity for both students' }

  const alreadyLeader = await db.heatEntry.findFirst({ where: { heatId, studentId: leaderId } })
  const alreadyFollower = await db.heatEntry.findFirst({ where: { heatId, studentId: followerId } })
  if (alreadyLeader) return { error: `${leader.firstName} is already in this heat` }
  if (alreadyFollower) return { error: `${follower.firstName} is already in this heat` }

  await db.heatEntry.createMany({
    data: [
      { heatId, studentId: leaderId, partnerStudentId: followerId },
      { heatId, studentId: followerId, partnerStudentId: leaderId },
    ],
  })

  revalidatePath(`/studio/${studioSlug}/heats`)
  revalidatePath('/admin/master')
  revalidatePath('/view')
}

export async function removeAmateurHeatEntry(
  studioSlug: string,
  heatId: number,
  leaderId: number
) {
  const studio = await requireStudio(studioSlug)

  const leaderEntry = await db.heatEntry.findFirst({
    where: { heatId, studentId: leaderId, student: { studioId: studio.id }, instructorId: null },
  })
  if (!leaderEntry) return { error: 'Entry not found' }
  const partnerId = leaderEntry.partnerStudentId

  await db.heatEntry.deleteMany({
    where: {
      heatId,
      studentId: partnerId ? { in: [leaderId, partnerId] } : leaderId,
      instructorId: null,
    },
  })

  revalidatePath(`/studio/${studioSlug}/heats`)
  revalidatePath('/admin/master')
  revalidatePath('/view')
}

export async function reassignHeatEntry(
  studioSlug: string,
  entryId: number,
  changes: { instructorId?: number; studentId?: number }
) {
  const studio = await requireStudio(studioSlug)
  const entry = await db.heatEntry.findFirst({
    where: { id: entryId, student: { studioId: studio.id } },
  })
  if (!entry) return { error: 'Entry not found' }
  await db.heatEntry.update({ where: { id: entryId }, data: changes })
  revalidatePath(`/studio/${studioSlug}/heatsheet`)
  revalidatePath(`/studio/${studioSlug}/heats`)
  revalidatePath('/admin/master')
}

// --- Shows ---

export async function addProShow(studioSlug: string, formData: FormData) {
  const studio = await requireStudio(studioSlug)
  await db.proShow.create({
    data: {
      studioId: studio.id,
      partnership: (formData.get('partnership') as string).trim(),
      dances: (formData.get('dances') as string).trim(),
      songTitle: (formData.get('songTitle') as string | null)?.trim() || null,
      artist: (formData.get('artist') as string | null)?.trim() || null,
      musicLink: (formData.get('musicLink') as string | null)?.trim() || null,
      notes: (formData.get('notes') as string | null)?.trim() || null,
    },
  })
  revalidatePath(`/studio/${studioSlug}/shows`)
}

export async function deleteProShow(studioSlug: string, id: number) {
  const studio = await requireStudio(studioSlug)
  await db.proShow.deleteMany({ where: { id, studioId: studio.id } })
  revalidatePath(`/studio/${studioSlug}/shows`)
}

export async function addStudentShow(studioSlug: string, formData: FormData) {
  const studio = await requireStudio(studioSlug)
  const studentIds = (formData.getAll('studentIds') as string[]).map(Number).filter(Boolean)
  const instructorIds = (formData.getAll('instructorIds') as string[]).map(Number).filter(Boolean)
  const dances = (formData.get('dances') as string).trim()
  if (!dances) return { error: 'Dances required' }
  await db.studentShow.create({
    data: {
      studioId: studio.id,
      dances,
      songTitle: (formData.get('songTitle') as string | null)?.trim() || null,
      artist: (formData.get('artist') as string | null)?.trim() || null,
      musicLink: (formData.get('musicLink') as string | null)?.trim() || null,
      notes: (formData.get('notes') as string | null)?.trim() || null,
      students: studentIds.length > 0 ? { connect: studentIds.map(id => ({ id })) } : undefined,
      instructors: instructorIds.length > 0 ? { connect: instructorIds.map(id => ({ id })) } : undefined,
    },
  })
  revalidatePath(`/studio/${studioSlug}/shows`)
}

export async function deleteStudentShow(studioSlug: string, id: number) {
  const studio = await requireStudio(studioSlug)
  await db.studentShow.deleteMany({ where: { id, studioId: studio.id } })
  revalidatePath(`/studio/${studioSlug}/shows`)
}
