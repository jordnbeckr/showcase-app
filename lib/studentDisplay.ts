/**
 * Returns a display label for a student that adds a last initial
 * when another student in the roster shares the same first name.
 */
export function studentDisplayName(
  student: { firstName: string; lastName: string },
  allStudents: { firstName: string; lastName: string }[]
): string {
  const sameFirst = allStudents.filter(
    s => s.firstName.toLowerCase() === student.firstName.toLowerCase()
  )
  if (sameFirst.length > 1) {
    return `${student.firstName} ${student.lastName[0]}.`
  }
  return student.firstName
}
