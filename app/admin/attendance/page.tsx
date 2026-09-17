import { db } from '@/lib/db'
import AttendanceManager from './AttendanceManager'

export const dynamic = 'force-dynamic'

export default async function AttendancePage() {
  const [studios, instructorRows] = await Promise.all([
    db.studio.findMany({
      include: {
        students: { orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }] },
      },
      orderBy: { name: 'asc' },
    }),
    db.instructor.findMany({
      include: { studio: true },
      orderBy: [{ name: 'asc' }],
    }),
  ])

  type StudioWithStudents = typeof studios[number]
  const allStudents = studios.flatMap((s: StudioWithStudents) =>
    s.students.map((st: StudioWithStudents['students'][number]) => ({
      id: st.id,
      name: `${st.firstName} ${st.lastName}`,
      role: st.role,
      studioName: s.name,
      checkedIn: st.checkedIn,
      leaderNumber: st.leaderNumber,
    }))
  )

  const allInstructors = instructorRows.map(i => ({
    id: i.id,
    name: i.name,
    role: i.role,
    studioName: i.studio.name,
    checkedIn: i.checkedIn,
    leaderNumber: i.leaderNumber,
  }))

  const checkedInStudents = allStudents.filter(s => s.checkedIn).length
  const checkedInInstructors = allInstructors.filter(i => i.checkedIn).length

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div className="flex items-end gap-4">
        <div>
          <h1 className="text-xl font-bold text-center">Attendance</h1>
          <p className="text-sm mt-0.5 text-center" style={{ color: 'var(--muted)' }}>Check in students and instructors as they arrive.</p>
        </div>
        <div className="ml-auto text-right">
          <div className="text-2xl font-bold text-center">{checkedInStudents + checkedInInstructors} / {allStudents.length + allInstructors.length}</div>
          <div className="text-xs" style={{ color: 'var(--muted)' }}>checked in</div>
        </div>
      </div>
      <AttendanceManager students={allStudents} instructors={allInstructors} />
    </div>
  )
}
