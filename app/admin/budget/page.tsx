import { db } from '@/lib/db'
import BudgetManager from './BudgetManager'

export const dynamic = 'force-dynamic'

export default async function BudgetPage() {
  const [budgetItems, showcaseSettings, studios, allEntries] = await Promise.all([
    db.budgetItem.findMany({ orderBy: { order: 'asc' } }),
    db.showcaseSettings.findFirst(),
    db.studio.findMany({
      orderBy: { name: 'asc' },
      include: { studioBudget: true },
    }),
    db.heatEntry.findMany({
      select: { studentId: true, instructorId: true, student: { select: { studioId: true } }, instructor: { select: { studioId: true } } },
    }),
  ])

  const studioData = studios.map(studio => {
    const entries = allEntries.filter(e => e.student.studioId === studio.id)
    const studentIds = new Set(entries.map(e => e.studentId))
    const instructorIds = new Set(entries.map(e => e.instructorId))
    return {
      id: studio.id,
      name: studio.name,
      participantCount: studentIds.size + instructorIds.size,
      entryCount: entries.length,
      attendees: studio.studioBudget?.attendees ?? 0,
      paid: studio.studioBudget?.paid ?? false,
    }
  })

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-center">Budget</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--muted)' }}>
          Manage showcase costs and studio dues.
        </p>
      </div>

      <BudgetManager
        budgetItems={budgetItems.map(i => ({
          id: i.id,
          name: i.name,
          category: i.category as 'participation' | 'attendee',
          unitCost: i.unitCost,
          quantity: i.quantity,
        }))}
        entryFee={showcaseSettings?.entryFee ?? 0}
        studios={studioData}
      />
    </div>
  )
}
