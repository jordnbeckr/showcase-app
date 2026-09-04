export default function DeadlineBanner() {
  const now = new Date()
  const entryDeadline = new Date('2026-09-14T00:00:00')
  const headcountDeadline = new Date('2026-09-15T00:00:00')
  const msPerDay = 1000 * 60 * 60 * 24

  const daysToEntry = Math.ceil((entryDeadline.getTime() - now.getTime()) / msPerDay)
  const daysToHead = Math.ceil((headcountDeadline.getTime() - now.getTime()) / msPerDay)

  const days = daysToEntry > 0 ? daysToEntry : daysToHead > 0 ? daysToHead : null
  const label = daysToEntry > 0
    ? `Entry deadline in ${days} day${days === 1 ? '' : 's'} — Mon 9/14`
    : daysToHead > 0
    ? `Head count deadline in ${days} day${days === 1 ? '' : 's'} — Tue 9/15`
    : null

  if (!label) return null

  let bg: string, color: string, border: string
  if (days !== null && days <= 2) {
    bg = '#fef2f2'; color = '#991b1b'; border = '#fca5a5'
  } else if (days !== null && days <= 5) {
    bg = '#fffbeb'; color = '#92400e'; border = '#fcd34d'
  } else {
    bg = 'var(--surface2, #f3f4f6)'; color = 'var(--muted)'; border = 'var(--border)'
  }

  return (
    <div style={{
      backgroundColor: bg,
      color,
      border: `1px solid ${border}`,
      borderRadius: 8,
      padding: '10px 16px',
      textAlign: 'center',
      fontSize: '0.875rem',
      fontWeight: 600,
      letterSpacing: '0.01em',
      marginBottom: 16,
    }}>
      ⏰ {label}
    </div>
  )
}
