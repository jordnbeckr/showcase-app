'use server'

import { db } from '@/lib/db'

export async function logActivity(entry: {
  studioSlug?: string
  actor?: string
  action: string
  subject: string
  details?: string
}) {
  try {
    await db.activityLog.create({ data: entry })
  } catch {
    // never let logging break the real action
  }
}
