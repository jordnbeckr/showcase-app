'use client'

import { useState } from 'react'

type HeatResult = {
  heatNumber: number
  dance: string
  placement: string
}

type StudentResult = {
  studentId: number
  name: string
  role: string
  heats: HeatResult[]
  goldCount: number
  silverCount: number
  bronzeCount: number
}

type Props = {
  studioName: string
  students: StudentResult[]
  totalGold: number
  totalSilver: number
  totalBronze: number
}

function PlacementChip({ placement }: { placement: string }) {
  const styles: Record<string, React.CSSProperties> = {
    Gold:   { background: '#fef9c3', border: '1.5px solid #fbbf24', color: '#713f12' },
    Silver: { background: '#f1f5f9', border: '1.5px solid #94a3b8', color: '#1e293b' },
    Bronze: { background: '#fff7ed', border: '1.5px solid #f97316', color: '#7c2d12' },
  }
  const dotColors: Record<string, string> = {
    Gold: '#fbbf24', Silver: '#94a3b8', Bronze: '#f97316',
  }
  const s = styles[placement] ?? { background: '#f0f2f5', border: '1.5px solid #d4d9e0', color: '#5a6470' }
  const dot = dotColors[placement] ?? '#a0aab4'
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 7px', borderRadius: 3, fontSize: 11, fontWeight: 700, ...s }}>
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: dot, flexShrink: 0, display: 'inline-block' }} />
      {placement}
    </span>
  )
}

function MedalBadge({ count, placement, dim }: { count: number; placement: string; dim?: boolean }) {
  const styles: Record<string, React.CSSProperties> = {
    Gold:   { background: '#fef9c3', color: '#713f12' },
    Silver: { background: '#f1f5f9', color: '#1e293b' },
    Bronze: { background: '#fff7ed', color: '#7c2d12' },
  }
  const emoji: Record<string, string> = { Gold: '🥇', Silver: '🥈', Bronze: '🥉' }
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 3,
      padding: '2px 7px', borderRadius: 3, fontSize: 12, fontWeight: 800,
      ...(styles[placement] ?? {}),
      opacity: dim ? 0.35 : 1,
    }}>
      {emoji[placement] ?? ''} {count}
    </span>
  )
}

function StudentCard({ student, defaultOpen }: { student: StudentResult; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen ?? false)
  const hasAny = student.goldCount + student.silverCount + student.bronzeCount > 0

  function printOne() {
    const el = document.getElementById(`results-student-${student.studentId}`)
    if (!el) return
    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(`<!DOCTYPE html><html><head><title>${student.name} – Results</title>
<style>
  body { font-family: Arial, Helvetica, sans-serif; padding: 24px; color: #0f1923; font-size: 13px; }
  h2 { font-size: 16px; font-weight: 700; margin: 0 0 2px; }
  .sub { font-size: 11px; color: #5a6470; margin-bottom: 12px; }
  .tally { display: flex; gap: 12px; margin-bottom: 14px; }
  .medal { padding: 4px 10px; border-radius: 3px; font-weight: 800; font-size: 13px; }
  .gold   { background: #fef9c3; color: #713f12; }
  .silver { background: #f1f5f9; color: #1e293b; }
  .bronze { background: #fff7ed; color: #7c2d12; }
  table { width: 100%; border-collapse: collapse; }
  th { background: #e8ecf0; border: 1px solid #d4d9e0; padding: 5px 8px; text-align: left; font-size: 11px; font-weight: 600; }
  td { border: 1px solid #d4d9e0; padding: 5px 8px; }
  .chip { display: inline-flex; align-items: center; gap: 4px; padding: 2px 7px; border-radius: 3px; font-size: 11px; font-weight: 700; }
  .dot  { width: 7px; height: 7px; border-radius: 50%; display: inline-block; }
  .chip.gold   { background: #fef9c3; border: 1.5px solid #fbbf24; color: #713f12; }
  .chip.gold   .dot { background: #fbbf24; }
  .chip.silver { background: #f1f5f9; border: 1.5px solid #94a3b8; color: #1e293b; }
  .chip.silver .dot { background: #94a3b8; }
  .chip.bronze { background: #fff7ed; border: 1.5px solid #f97316; color: #7c2d12; }
  .chip.bronze .dot { background: #f97316; }
</style></head><body>
<h2>${student.name}</h2>
<div class="sub">${student.role} · Closed Heat Results</div>
<div class="tally">
  <span class="medal gold">🥇 ${student.goldCount}</span>
  <span class="medal silver">🥈 ${student.silverCount}</span>
  <span class="medal bronze">🥉 ${student.bronzeCount}</span>
</div>
<table>
  <thead><tr><th>#</th><th>Dance</th><th>Placement</th></tr></thead>
  <tbody>
    ${student.heats.map(h => `<tr>
      <td style="font-family:monospace;font-size:11px;color:#5a6470">${h.heatNumber}</td>
      <td>${h.dance}</td>
      <td><span class="chip ${h.placement.toLowerCase()}"><span class="dot"></span>${h.placement}</span></td>
    </tr>`).join('')}
  </tbody>
</table>
</body></html>`)
    win.document.close()
    win.print()
  }

  return (
    <div
      id={`results-student-${student.studentId}`}
      style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 4, marginBottom: 8, overflow: 'hidden' }}
    >
      {/* Card header */}
      <div
        style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
        onClick={() => setOpen(o => !o)}
      >
        <div style={{ flex: 1 }}>
          <span style={{ fontSize: 13, fontWeight: 700 }}>{student.name}</span>
          {' '}
          <span style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 400 }}>{student.role}</span>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <MedalBadge count={student.goldCount}   placement="Gold"   dim={student.goldCount === 0} />
          <MedalBadge count={student.silverCount} placement="Silver" dim={student.silverCount === 0} />
          <MedalBadge count={student.bronzeCount} placement="Bronze" dim={student.bronzeCount === 0} />
        </div>
        <button
          className="no-print"
          onClick={e => { e.stopPropagation(); printOne() }}
          style={{ marginLeft: 8, fontSize: 11, padding: '2px 8px', borderRadius: 3, border: '1px solid var(--border-dark)', background: 'var(--surface)', color: 'var(--muted)', cursor: 'pointer' }}
        >
          Print
        </button>
        <span style={{ color: 'var(--muted)', fontSize: 10, marginLeft: 2, transition: 'transform .15s', display: 'inline-block', transform: open ? 'rotate(90deg)' : 'none' }}>▶</span>
      </div>

      {/* Expanded detail */}
      {open && (
        <div style={{ borderTop: '1px solid var(--border)' }}>
          {!hasAny ? (
            <p style={{ padding: '8px 12px', fontSize: 12, color: 'var(--muted)', fontStyle: 'italic' }}>No placements recorded yet.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <tbody>
                {student.heats.map((h, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f0f2f5' }}>
                    <td style={{ padding: '5px 12px', fontFamily: 'monospace', fontSize: 11, color: 'var(--muted)', width: 36 }}>#{h.heatNumber}</td>
                    <td style={{ padding: '5px 12px', flex: 1 }}>{h.dance}</td>
                    <td style={{ padding: '5px 12px', textAlign: 'right' }}>
                      <PlacementChip placement={h.placement} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}

export default function ResultsView({ studioName, students, totalGold, totalSilver, totalBronze }: Props) {
  if (students.length === 0) {
    return (
      <p className="text-sm italic" style={{ color: 'var(--muted)' }}>
        No closed heat placements recorded yet.
      </p>
    )
  }

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          header, nav { display: none !important; }
          .results-student-block { page-break-after: always; }
          .results-student-block:last-child { page-break-after: avoid; }
        }
      `}</style>

      <div className="no-print" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700 }}>Closed Heat Results</h1>
          <button
            onClick={() => window.print()}
            style={{ fontSize: 12, padding: '4px 12px', borderRadius: 4, background: 'var(--accent)', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600 }}
          >
            Print all
          </button>
          <span style={{ fontSize: 12, color: 'var(--muted)' }}>{students.length} student{students.length !== 1 ? 's' : ''}</span>
        </div>
        <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 0 }}>
          Tap a student to see individual heats. Use Print to get a sheet for handout.
        </p>
      </div>

      {/* Studio summary bar */}
      <div style={{
        background: 'var(--header)', borderRadius: 4, padding: '10px 16px',
        display: 'flex', alignItems: 'center', gap: 20, marginBottom: 14,
      }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,.55)', letterSpacing: '0.06em', textTransform: 'uppercase', marginRight: 'auto' }}>
          {studioName} — Studio Total
        </span>
        {([
          { count: totalGold,   label: 'Gold',   color: '#fbbf24' },
          { count: totalSilver, label: 'Silver',  color: '#c0c8d4' },
          { count: totalBronze, label: 'Bronze',  color: '#f97316' },
        ] as const).map(({ count, label, color }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ fontSize: 22, fontWeight: 900, fontVariantNumeric: 'tabular-nums', color }}>{count}</span>
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'rgba(255,255,255,.45)' }}>{label}</span>
          </div>
        ))}
      </div>

      {/* Student cards */}
      {students.map(s => (
        <StudentCard key={s.studentId} student={s} />
      ))}
    </>
  )
}
