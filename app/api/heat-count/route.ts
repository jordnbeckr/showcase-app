import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (session?.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { danceTypeId, count } = await req.json()
  if (typeof danceTypeId !== 'number' || typeof count !== 'number' || count < 0) {
    return NextResponse.json({ error: 'Invalid' }, { status: 400 })
  }

  const existing = await db.heat.findMany({ where: { danceTypeId }, orderBy: { number: 'asc' } })

  if (count > existing.length) {
    const maxHeat = await db.heat.aggregate({ _max: { number: true } })
    let nextNum = (maxHeat._max.number ?? 0) + 1
    for (let i = 0; i < count - existing.length; i++) {
      await db.heat.create({ data: { number: nextNum++, danceTypeId } })
    }
  } else if (count < existing.length) {
    const toRemove = existing.slice(count)
    for (const heat of toRemove) {
      const entryCount = await db.heatEntry.count({ where: { heatId: heat.id } })
      if (entryCount > 0) return NextResponse.json({ error: `Heat #${heat.number} has entries` }, { status: 409 })
      await db.heat.delete({ where: { id: heat.id } })
    }
  }

  return NextResponse.json({ ok: true })
}
