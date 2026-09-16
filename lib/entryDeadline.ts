export const ENTRY_DEADLINE = new Date('2026-09-14T00:00:00')

export function isPastEntryDeadline() {
  return new Date() > ENTRY_DEADLINE
}
