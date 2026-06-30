import { db } from '@/lib/db'
import { getSession } from '@/lib/session'
import FeedbackPrint, { StudentFeedback } from '@/app/components/FeedbackPrint'

export const dynamic = 'force-dynamic'

export default async function StudioFeedbackPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const session = await getSession()
  if (session?.role !== 'studio' || session.studioSlug !== slug) return null

  const studio = await db.studio.findUnique({ where: { slug }, include: { students: true } })
  if (!studio) return <p>Studio not found</p>

  const studentIds = studio.students.map(s => s.id)

  const [openThumbs, openNotes, judges, heats] = await Promise.all([
    db.openThumb.findMany({
      where: { studentId: { in: studentIds } },
      include: { judge: true, category: true, heat: { include: { danceType: true } } },
    }),
    db.openNote.findMany({
      where: { studentId: { in: studentIds } },
      include: { judge: true, heat: { include: { danceType: true } } },
    }),
    db.judge.findMany({ orderBy: { name: 'asc' } }),
    db.heat.findMany({ where: { category: 'open' }, orderBy: { number: 'asc' }, include: { danceType: true } }),
  ])

  const students = studio.students
    .map(s => ({ id: s.id, firstName: s.firstName, lastName: s.lastName, studio: { name: studio.name } }))
    .sort((a, b) => a.lastName.localeCompare(b.lastName) || a.firstName.localeCompare(b.firstName))

  const studentData: StudentFeedback[] = students.map(student => {
    const heatIds = new Set([
      ...openThumbs.filter(t => t.studentId === student.id).map(t => t.heatId),
      ...openNotes.filter(n => n.studentId === student.id).map(n => n.heatId),
    ])

    const studentHeats = heats
      .filter(h => heatIds.has(h.id))
      .map(heat => ({
        heatId: heat.id,
        heatNumber: heat.number,
        dance: heat.danceType.name,
        judges: judges.map(judge => ({
          judgeId: judge.id,
          judgeName: judge.name,
          thumbs: openThumbs
            .filter(t => t.studentId === student.id && t.heatId === heat.id && t.judgeId === judge.id)
            .map(t => ({ categoryId: t.categoryId, categoryName: t.category.name, sentiment: t.sentiment as 'up' | 'down' })),
          note: openNotes.find(n => n.studentId === student.id && n.heatId === heat.id && n.judgeId === judge.id)?.note ?? null,
        })).filter(j => j.thumbs.length > 0 || j.note),
      }))

    return {
      studentId: student.id,
      name: `${student.firstName} ${student.lastName}`,
      studioName: studio.name,
      heats: studentHeats,
    }
  })

  return (
    <div className="max-w-3xl">
      <FeedbackPrint students={studentData} />
    </div>
  )
}
