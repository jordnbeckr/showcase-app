import { db } from '@/lib/db'
import { getSession } from '@/lib/session'
import ResultsView from './ResultsView'

export const dynamic = 'force-dynamic'

export default async function StudioResultsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const session = await getSession()
  if (session?.role !== 'studio' || session.studioSlug !== slug) return null

  const studio = await db.studio.findUnique({
    where: { slug },
    include: { students: { orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }] } },
  })
  if (!studio) return <p>Studio not found</p>

  const studentIds = studio.students.map(s => s.id)

  const scores = await db.closedScore.findMany({
    where: { studentId: { in: studentIds } },
    include: { heat: { include: { danceType: true } } },
    orderBy: { heat: { number: 'asc' } },
  })

  type StudentResult = {
    studentId: number
    name: string
    role: string
    heats: { heatNumber: number; dance: string; placement: string }[]
    goldCount: number
    silverCount: number
    bronzeCount: number
  }

  const studentResults: StudentResult[] = studio.students
    .map(s => {
      const studentScores = scores.filter(sc => sc.studentId === s.id)
      const heats = studentScores.map(sc => ({
        heatNumber: sc.heat.number,
        dance: sc.heat.danceType.name,
        placement: sc.placement,
      }))
      return {
        studentId: s.id,
        name: `${s.firstName} ${s.lastName}`,
        role: s.role,
        heats,
        goldCount: heats.filter(h => h.placement === 'Gold').length,
        silverCount: heats.filter(h => h.placement === 'Silver').length,
        bronzeCount: heats.filter(h => h.placement === 'Bronze').length,
      }
    })
    .filter(s => s.heats.length > 0)

  const totalGold = studentResults.reduce((n, s) => n + s.goldCount, 0)
  const totalSilver = studentResults.reduce((n, s) => n + s.silverCount, 0)
  const totalBronze = studentResults.reduce((n, s) => n + s.bronzeCount, 0)

  return (
    <ResultsView
      studioName={studio.name}
      students={studentResults}
      totalGold={totalGold}
      totalSilver={totalSilver}
      totalBronze={totalBronze}
    />
  )
}
