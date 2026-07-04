import { db } from '@/lib/db'
import FeedbackPrint, { StudentFeedback } from '@/app/components/FeedbackPrint'

export const dynamic = 'force-dynamic'

export default async function AdminFeedbackPage() {
  const [students, openThumbs, openNotes, judges, heats] = await Promise.all([
    db.student.findMany({
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
      include: { studio: true },
    }),
    db.openThumb.findMany({
      include: {
        judge: true,
        category: true,
        heat: { include: { danceType: true } },
      },
    }),
    db.openNote.findMany({
      include: {
        judge: true,
        heat: { include: { danceType: true } },
      },
    }),
    db.judge.findMany({ orderBy: { name: 'asc' } }),
    db.heat.findMany({ where: { category: 'open' }, orderBy: { number: 'asc' }, include: { danceType: true } }),
  ])

  const studentData = buildStudentFeedback(students, heats, judges, openThumbs, openNotes)

  return (
    <div className="max-w-3xl mx-auto">
      <FeedbackPrint students={studentData} />
    </div>
  )
}

function buildStudentFeedback(
  students: { id: number; firstName: string; lastName: string; studio: { name: string } }[],
  heats: { id: number; number: number; danceType: { name: string } }[],
  judges: { id: number; name: string }[],
  openThumbs: { studentId: number; heatId: number; judgeId: number; categoryId: number; sentiment: string; category: { name: string }; heat: { id: number; number: number; danceType: { name: string } } }[],
  openNotes: { studentId: number; heatId: number; judgeId: number; note: string; heat: { id: number; number: number; danceType: { name: string } } }[],
): StudentFeedback[] {
  return students.map(student => {
    // Find all open heats this student has any feedback in
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
      studioName: student.studio.name,
      heats: studentHeats,
    }
  })
}
