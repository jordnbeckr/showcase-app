'use server'

import { createSession, deleteSession } from '@/lib/session'
import { db } from '@/lib/db'
import { redirect } from 'next/navigation'
import * as crypto from 'crypto'

type ActionState = { error: string } | undefined

function hash(s: string) {
  return crypto.createHash('sha256').update(s).digest('hex')
}

export async function adminLogin(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const password = formData.get('password') as string
  if (password !== process.env.ADMIN_PASSWORD) {
    return { error: 'Invalid password' }
  }
  await createSession({ role: 'admin' })
  redirect('/admin')
}

export async function studioLogin(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const slug = formData.get('studio') as string
  const password = formData.get('password') as string

  const studio = await db.studio.findUnique({ where: { slug } })
  if (!studio || studio.passwordHash !== hash(password)) {
    return { error: 'Invalid studio or password' }
  }

  await createSession({
    role: 'studio',
    studioId: studio.id,
    studioSlug: studio.slug,
    studioName: studio.name,
  })
  redirect(`/studio/${studio.slug}`)
}

export async function logout() {
  await deleteSession()
  redirect('/')
}
