'use client'

import { useState, useTransition } from 'react'
import { updateStudioBillingConfig, updateStudentBilling, updateLunchGuest, removeLunchGuest } from '@/app/actions/billing'

type Config = {
  depositAmount: number
  requiresDeposit: boolean
  heatPrice: number
  lunchTicketPrice: number
  maxFreeHeats: number
}

type Billing = {
  freeHeats: number
  lunchTickets: number
  isKeyClub: boolean
  depositPaid: boolean
  depositDate: string | null
  depositInitials: string | null
  pifPaid: boolean
  pifDate: string | null
  pifInitials: string | null
  notes: string | null
} | null

type LunchGuestRow = {
  id: number
  name: string
  guestOf: string | null
  guestOfStudentId: number | null
  lunchTickets: number
  paid: boolean
  paidDate: string | null
  paidInitials: string | null
}

type StudentRow = {
  id: number
  firstName: string
  lastName: string
  heatCount: number
  billing: Billing
}

function fmt(n: number) {
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function computeTotals(s: StudentRow, cfg: Config, guestLunchTickets = 0) {
  const b = s.billing
  const freeHeats = Math.min(b?.freeHeats ?? 0, cfg.maxFreeHeats)
  const billableHeats = Math.max(0, s.heatCount - freeHeats)
  const base = s.heatCount > 0 ? cfg.depositAmount : 0
  const heatCost = billableHeats * cfg.heatPrice
  const ownLunchTickets = b?.lunchTickets ?? 0
  const totalLunchTickets = ownLunchTickets + guestLunchTickets
  const lunchCost = totalLunchTickets * cfg.lunchTicketPrice
  const subtotalWithBase = base + heatCost
  const subtotalFinal = subtotalWithBase + lunchCost
  const kcDiscount = (b?.isKeyClub ?? false) ? subtotalFinal * 0.05 : 0
  const total = subtotalFinal - kcDiscount
  const paid = (b?.pifPaid ?? false)
    ? total
    : (b?.depositPaid ?? false)
      ? Math.min(cfg.depositAmount, total)
      : 0
  const remaining = Math.max(0, total - paid)
  return { base, freeHeats, billableHeats, heatCost, ownLunchTickets, guestLunchTickets, totalLunchTickets, lunchCost, subtotalWithBase, subtotalFinal, kcDiscount, total, paid, remaining }
}

function remainingColor(remaining: number) {
  if (remaining === 0) return '#166534'
  if (remaining < 500) return '#92400e'
  return '#991b1b'
}

function remainingBg(remaining: number) {
  if (remaining === 0) return '#dcfce7'
  if (remaining < 500) return '#fef3c7'
  return '#fee2e2'
}

export default function StudentsTab({
  slug,
  config: initialConfig,
  students: initialStudents,
  lunchGuests: initialLunchGuests,
}: {
  slug: string
  config: Config
  students: StudentRow[]
  lunchGuests: LunchGuestRow[]
}) {
  const [isPending, startTransition] = useTransition()
  const [config, setConfig] = useState<Config>(initialConfig)
  const [configOpen, setConfigOpen] = useState(false)
  const [students, setStudents] = useState<StudentRow[]>(initialStudents)
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [lunchGuests, setLunchGuests] = useState<LunchGuestRow[]>(initialLunchGuests)

  function getBilling(s: StudentRow): NonNullable<Billing> {
    return s.billing ?? {
      freeHeats: 0, lunchTickets: 0, isKeyClub: false,
      depositPaid: false, depositDate: null, depositInitials: null,
      pifPaid: false, pifDate: null, pifInitials: null, notes: null,
    }
  }

  function patchStudent(id: number, patch: Partial<NonNullable<Billing>>) {
    setStudents(prev => prev.map(s => s.id === id
      ? { ...s, billing: { ...getBilling(s), ...patch } }
      : s
    ))
  }

  function saveField(studentId: number, data: Parameters<typeof updateStudentBilling>[2]) {
    startTransition(async () => { await updateStudentBilling(slug, studentId, data) })
  }

  function saveConfig(next: Config) {
    setConfig(next)
    startTransition(async () => { await updateStudioBillingConfig(slug, next) })
  }

  // Guests linked to a student roll up into that student's total
  function guestTicketsFor(studentId: number) {
    return lunchGuests.filter(g => g.guestOfStudentId === studentId).reduce((s, g) => s + g.lunchTickets, 0)
  }
  function linkedGuestsFor(studentId: number) {
    return lunchGuests.filter(g => g.guestOfStudentId === studentId)
  }
  // Standalone guests have no linked student
  const standaloneGuests = lunchGuests.filter(g => g.guestOfStudentId === null)

  // Sort: heat count desc; PIF students split to bottom section
  const activeStudents = [...students]
    .filter(s => !getBilling(s).pifPaid)
    .sort((a, b) => b.heatCount - a.heatCount)
  const pifStudents = [...students]
    .filter(s => getBilling(s).pifPaid)
    .sort((a, b) => b.heatCount - a.heatCount)
  const sortedStudents = [...activeStudents, ...pifStudents]

  const grandTotal = students.reduce((sum, s) => sum + computeTotals(s, config, guestTicketsFor(s.id)).total, 0)
    + standaloneGuests.reduce((sum, g) => sum + g.lunchTickets * config.lunchTicketPrice, 0)
  const grandRemaining = students.reduce((sum, s) => sum + computeTotals(s, config, guestTicketsFor(s.id)).remaining, 0)
    + standaloneGuests.filter(g => !g.paid).reduce((sum, g) => sum + g.lunchTickets * config.lunchTicketPrice, 0)

  // Summary rows: active students + unpaid standalone guests sorted by remaining; PIF/paid at bottom
  type SummaryRow =
    | { kind: 'student'; data: StudentRow; remaining: number; total: number }
    | { kind: 'guest'; data: LunchGuestRow; remaining: number; total: number }

  const activeRows: SummaryRow[] = activeStudents.map(s => {
    const { remaining, total } = computeTotals(s, config, guestTicketsFor(s.id))
    return { kind: 'student', data: s, remaining, total }
  })
  const unpaidGuestRows: SummaryRow[] = standaloneGuests
    .filter(g => !g.paid)
    .map(g => {
      const total = g.lunchTickets * config.lunchTicketPrice
      return { kind: 'guest', data: g, remaining: total, total }
    })
  const owingRows: SummaryRow[] = [...activeRows, ...unpaidGuestRows]
    .sort((a, b) => b.remaining - a.remaining)
  const pifStudentRows: SummaryRow[] = pifStudents.map(s => {
    const { remaining, total } = computeTotals(s, config, guestTicketsFor(s.id))
    return { kind: 'student', data: s, remaining, total }
  })
  const paidGuestRows: SummaryRow[] = standaloneGuests
    .filter(g => g.paid)
    .map(g => {
      const total = g.lunchTickets * config.lunchTicketPrice
      return { kind: 'guest', data: g, remaining: 0, total }
    })
  const summaryRows: SummaryRow[] = [...owingRows, ...pifStudentRows, ...paidGuestRows]

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', maxWidth: 860, margin: '0 auto' }}>

      {/* Config bar */}
      <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, marginBottom: 16, overflow: 'hidden' }}>
        <button
          onClick={() => setConfigOpen(o => !o)}
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: '#f8fafc', border: 'none', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}
        >
          <span>Pricing Configuration</span>
          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
            Deposit ${config.depositAmount} · Heats ${config.heatPrice} · Lunch ${config.lunchTicketPrice} · Free heats up to {config.maxFreeHeats}
            {' '}· {configOpen ? '▲' : '▼'}
          </span>
        </button>
        {configOpen && (
          <div style={{ padding: '12px 14px', display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-end', borderTop: '1px solid #e2e8f0' }}>
            {([
              ['depositAmount', 'Entry fee / deposit ($)', 'number'],
              ['heatPrice', 'Heat price ($)', 'number'],
              ['lunchTicketPrice', 'Lunch ticket ($)', 'number'],
              ['maxFreeHeats', 'Max free heats', 'number'],
            ] as const).map(([field, label]) => (
              <label key={field} style={{ display: 'flex', flexDirection: 'column', gap: 3, fontSize: '0.78rem', fontWeight: 500 }}>
                {label}
                <input
                  type="number"
                  value={config[field]}
                  onChange={e => setConfig(c => ({ ...c, [field]: field === 'maxFreeHeats' ? parseInt(e.target.value) : parseFloat(e.target.value) }))}
                  onBlur={() => saveConfig(config)}
                  style={{ width: 90, padding: '4px 8px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: '0.82rem' }}
                />
              </label>
            ))}
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', fontWeight: 500, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={config.requiresDeposit}
                onChange={e => { const next = { ...config, requiresDeposit: e.target.checked }; saveConfig(next) }}
              />
              Deposit required
            </label>
          </div>
        )}
      </div>

      {/* Summary strip */}
      <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, marginBottom: 20, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
          <thead>
            <tr style={{ background: '#f8fafc' }}>
              <th style={thS}>Student</th>
              <th style={thS}>Heats</th>
              <th style={thS}>Deposit</th>
              <th style={thS}>Paid in Full</th>
              <th style={{ ...thS, textAlign: 'right', paddingRight: 12 }}>Remaining</th>
            </tr>
          </thead>
          <tbody>
            {summaryRows.map((row, idx) => {
              const isPifSection = row.kind === 'guest'
                ? (row.data as LunchGuestRow).paid
                : (row.data as StudentRow).billing?.pifPaid ?? false
              const showDivider = isPifSection && (idx === 0 || !(summaryRows[idx - 1].kind === 'guest'
                ? (summaryRows[idx - 1].data as LunchGuestRow).paid
                : (summaryRows[idx - 1].data as StudentRow).billing?.pifPaid ?? false))
              const key = row.kind === 'student' ? `s-${row.data.id}` : `g-${row.data.id}`
              const isExpanded = row.kind === 'student' && expandedId === row.data.id

              if (row.kind === 'guest') {
                const g = row.data as LunchGuestRow
                return (
                  <>
                    {showDivider && (
                      <tr key={`divider-${key}`}>
                        <td colSpan={5} style={{ padding: '5px 10px', fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#94a3b8', background: '#f8fafc', borderTop: '2px solid #e2e8f0' }}>
                          Paid in Full
                        </td>
                      </tr>
                    )}
                    <tr key={key} style={{ borderTop: '1px solid #f1f5f9', background: idx % 2 === 0 ? '#fff' : '#fafafa' }}>
                      <td style={tdS}>
                        <span>{g.name}</span>
                        {g.guestOf && <span style={{ fontSize: '0.72rem', color: '#94a3b8', marginLeft: 6 }}>guest of {g.guestOf}</span>}
                        <span style={{ fontSize: '0.7rem', background: '#f0f9ff', color: '#0369a1', borderRadius: 4, padding: '1px 5px', fontWeight: 600, marginLeft: 6 }}>🥗 lunch</span>
                      </td>
                      <td style={{ ...tdS, textAlign: 'center', color: '#cbd5e1' }}>—</td>
                      <td style={{ ...tdS, textAlign: 'center', color: '#cbd5e1' }}>—</td>
                      <td style={{ ...tdS, textAlign: 'center' }}>
                        {g.paid
                          ? <span style={chipPif}>{[g.paidDate, g.paidInitials].filter(Boolean).join(' · ') || 'paid'}</span>
                          : <span style={{ color: '#cbd5e1' }}>—</span>}
                      </td>
                      <td style={{ ...tdS, textAlign: 'right', paddingRight: 12, fontVariantNumeric: 'tabular-nums' }}>
                        <span style={{ background: remainingBg(row.remaining), color: remainingColor(row.remaining), borderRadius: 4, padding: '1px 7px', fontWeight: 600, fontSize: '0.78rem' }}>
                          {fmt(row.remaining)}
                        </span>
                      </td>
                    </tr>
                  </>
                )
              }

              const s = row.data as StudentRow
              const b = getBilling(s)
              return (
                <>
                  {showDivider && (
                    <tr key={`divider-${key}`}>
                      <td colSpan={5} style={{ padding: '5px 10px', fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#94a3b8', background: '#f8fafc', borderTop: '2px solid #e2e8f0' }}>
                        Paid in Full
                      </td>
                    </tr>
                  )}
                  <tr
                    key={key}
                    onClick={() => setExpandedId(isExpanded ? null : s.id)}
                    style={{ borderTop: '1px solid #f1f5f9', cursor: 'pointer', background: isExpanded ? '#f0f7ff' : idx % 2 === 0 ? '#fff' : '#fafafa' }}
                  >
                    <td style={tdS}>{s.firstName} {s.lastName}</td>
                    <td style={{ ...tdS, textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>{s.heatCount}</td>
                    <td style={{ ...tdS, textAlign: 'center' }}>
                      {b.depositPaid
                        ? <span style={chipDep}>{[b.depositDate, b.depositInitials].filter(Boolean).join(' · ') || 'paid'}</span>
                        : <span style={{ color: '#cbd5e1' }}>—</span>}
                    </td>
                    <td style={{ ...tdS, textAlign: 'center' }}>
                      {b.pifPaid
                        ? <span style={chipPif}>{[b.pifDate, b.pifInitials].filter(Boolean).join(' · ') || 'paid'}</span>
                        : <span style={{ color: '#cbd5e1' }}>—</span>}
                    </td>
                    <td style={{ ...tdS, textAlign: 'right', paddingRight: 12, fontVariantNumeric: 'tabular-nums' }}>
                      <span style={{ background: remainingBg(row.remaining), color: remainingColor(row.remaining), borderRadius: 4, padding: '1px 7px', fontWeight: 600, fontSize: '0.78rem' }}>
                        {row.total === 0 ? '—' : fmt(row.remaining)}
                      </span>
                    </td>
                  </tr>
                </>
              )
            })}
            <tr style={{ borderTop: '2px solid #e2e8f0', background: '#f8fafc', fontWeight: 700 }}>
              <td style={tdS}>Total</td>
              <td style={{ ...tdS, textAlign: 'center' }}>{students.reduce((s, r) => s + r.heatCount, 0)}</td>
              <td style={tdS} />
              <td style={tdS} />
              <td style={{ ...tdS, textAlign: 'right', paddingRight: 12, fontVariantNumeric: 'tabular-nums' }}>
                {fmt(grandRemaining)} / {fmt(grandTotal)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Student cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {sortedStudents.map((s, idx) => {
          const b = getBilling(s)
          const gGuests = linkedGuestsFor(s.id)
          const t = computeTotals(s, config, guestTicketsFor(s.id))
          const isExpanded = expandedId === s.id
          const showPifDivider = b.pifPaid && (idx === 0 || !getBilling(sortedStudents[idx - 1]).pifPaid)

          return (<>
            {showPifDivider && (
              <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: '#94a3b8', paddingTop: 6 }}>
                Paid in Full
              </div>
            )}
            <div key={s.id} style={{ border: '1px solid #e2e8f0', borderRadius: 10, overflow: 'hidden' }}>
              {/* Card header */}
              <button
                onClick={() => setExpandedId(isExpanded ? null : s.id)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 14px', background: isExpanded ? '#f0f7ff' : '#f8fafc',
                  border: 'none', cursor: 'pointer', textAlign: 'left',
                }}
              >
                <span style={{ fontWeight: 700, fontSize: '0.9rem', flex: 1 }}>{s.firstName} {s.lastName}</span>
                <span style={{ fontSize: '0.78rem', color: '#64748b' }}>{s.heatCount} heat{s.heatCount !== 1 ? 's' : ''}</span>
                {b.isKeyClub && <span style={{ fontSize: '0.7rem', background: '#fef9c3', color: '#713f12', borderRadius: 4, padding: '1px 6px', fontWeight: 600 }}>Key Club</span>}
                {b.depositPaid && !b.pifPaid && <span style={{ fontSize: '0.7rem', background: '#dbeafe', color: '#1e40af', borderRadius: 4, padding: '1px 6px', fontWeight: 600 }}>Deposit ✓</span>}
                {b.pifPaid && <span style={{ fontSize: '0.7rem', background: '#dcfce7', color: '#166534', borderRadius: 4, padding: '1px 6px', fontWeight: 600 }}>Paid in Full ✓</span>}
                {t.total > 0 && (
                  <span style={{
                    background: remainingBg(t.remaining),
                    color: remainingColor(t.remaining),
                    borderRadius: 4, padding: '2px 8px', fontWeight: 700, fontSize: '0.8rem',
                  }}>
                    {fmt(t.remaining)} remaining
                  </span>
                )}
                <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>{isExpanded ? '▲' : '▼'}</span>
              </button>

              {isExpanded && (
                <div style={{ padding: '14px 16px', borderTop: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: 14 }}>

                  {/* Adjustable inputs */}
                  <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                    <label style={labelStyle}>
                      Free heats (max {config.maxFreeHeats})
                      <input
                        type="number" min={0} max={config.maxFreeHeats}
                        value={b.freeHeats}
                        onChange={e => patchStudent(s.id, { freeHeats: Math.min(parseInt(e.target.value) || 0, config.maxFreeHeats) })}
                        onBlur={e => saveField(s.id, { freeHeats: Math.min(parseInt(e.target.value) || 0, config.maxFreeHeats) })}
                        style={inputStyle}
                      />
                    </label>
                    <label style={labelStyle}>
                      Lunch tickets
                      <input
                        type="number" min={0}
                        value={b.lunchTickets}
                        onChange={e => patchStudent(s.id, { lunchTickets: parseInt(e.target.value) || 0 })}
                        onBlur={e => saveField(s.id, { lunchTickets: parseInt(e.target.value) || 0 })}
                        style={inputStyle}
                      />
                    </label>
                    <label style={{ ...labelStyle, flexDirection: 'row', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={b.isKeyClub}
                        onChange={e => { patchStudent(s.id, { isKeyClub: e.target.checked }); saveField(s.id, { isKeyClub: e.target.checked }) }}
                      />
                      Key Club (5% off)
                    </label>
                  </div>

                  {/* Financial breakdown */}
                  <div style={{ background: '#f8fafc', borderRadius: 8, padding: '10px 14px', fontSize: '0.82rem' }}>
                    <div style={rowStyle}><span>Base / entry fee</span><span>{fmt(t.base)}</span></div>
                    <div style={rowStyle}>
                      <span>Heats ({s.heatCount}{t.freeHeats > 0 ? ` − ${t.freeHeats} free` : ''} = {t.billableHeats} × {fmt(config.heatPrice)})</span>
                      <span>{fmt(t.heatCost)}</span>
                    </div>
                    {t.totalLunchTickets > 0 && (
                      <div style={rowStyle}>
                        <span>
                          Lunch ({t.totalLunchTickets} × {fmt(config.lunchTicketPrice)}
                          {gGuests.length > 0 && (
                            <span style={{ color: '#64748b', fontSize: '0.78rem' }}>
                              {' '}— {t.ownLunchTickets} own{gGuests.length > 0 ? ` + ${t.guestLunchTickets} guest${t.guestLunchTickets !== 1 ? 's' : ''}: ${gGuests.map(g => g.name).join(', ')}` : ''}
                            </span>
                          )}
                          )
                        </span>
                        <span>{fmt(t.lunchCost)}</span>
                      </div>
                    )}
                    <div style={{ ...rowStyle, borderTop: '1px solid #e2e8f0', marginTop: 6, paddingTop: 6 }}>
                      <span>Subtotal</span><span>{fmt(t.subtotalFinal)}</span>
                    </div>
                    {b.isKeyClub && (
                      <div style={{ ...rowStyle, color: '#713f12' }}>
                        <span>Key Club discount (5%)</span><span>−{fmt(t.kcDiscount)}</span>
                      </div>
                    )}
                    <div style={{ ...rowStyle, borderTop: '1px solid #cbd5e1', marginTop: 6, paddingTop: 6, fontWeight: 700, fontSize: '0.88rem' }}>
                      <span>Total</span><span>{fmt(t.total)}</span>
                    </div>
                    <div style={{ ...rowStyle, color: '#64748b' }}>
                      <span>Paid</span><span>{fmt(t.paid)}</span>
                    </div>
                    <div style={{ ...rowStyle, fontWeight: 700, color: remainingColor(t.remaining) }}>
                      <span>Remaining</span><span>{fmt(t.remaining)}</span>
                    </div>
                  </div>

                  {/* Payment tracking */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {/* Deposit row */}
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer', minWidth: 110 }}>
                        <input
                          type="checkbox"
                          checked={b.depositPaid}
                          onChange={e => { patchStudent(s.id, { depositPaid: e.target.checked }); saveField(s.id, { depositPaid: e.target.checked }) }}
                        />
                        Deposit paid
                      </label>
                      <input
                        type="text" placeholder="Date"
                        value={b.depositDate ?? ''}
                        onChange={e => patchStudent(s.id, { depositDate: e.target.value })}
                        onBlur={e => saveField(s.id, { depositDate: e.target.value || null })}
                        style={{ ...inputStyle, width: 90 }}
                        disabled={!b.depositPaid}
                      />
                      <input
                        type="text" placeholder="Initials"
                        value={b.depositInitials ?? ''}
                        onChange={e => patchStudent(s.id, { depositInitials: e.target.value })}
                        onBlur={e => saveField(s.id, { depositInitials: e.target.value || null })}
                        style={{ ...inputStyle, width: 70 }}
                        disabled={!b.depositPaid}
                      />
                    </div>
                    {/* PIF row */}
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer', minWidth: 110 }}>
                        <input
                          type="checkbox"
                          checked={b.pifPaid}
                          onChange={e => { patchStudent(s.id, { pifPaid: e.target.checked }); saveField(s.id, { pifPaid: e.target.checked }) }}
                        />
                        Paid in full
                      </label>
                      <input
                        type="text" placeholder="Date"
                        value={b.pifDate ?? ''}
                        onChange={e => patchStudent(s.id, { pifDate: e.target.value })}
                        onBlur={e => saveField(s.id, { pifDate: e.target.value || null })}
                        style={{ ...inputStyle, width: 90 }}
                        disabled={!b.pifPaid}
                      />
                      <input
                        type="text" placeholder="Initials"
                        value={b.pifInitials ?? ''}
                        onChange={e => patchStudent(s.id, { pifInitials: e.target.value })}
                        onBlur={e => saveField(s.id, { pifInitials: e.target.value || null })}
                        style={{ ...inputStyle, width: 70 }}
                        disabled={!b.pifPaid}
                      />
                    </div>
                  </div>

                  {/* Notes */}
                  <label style={labelStyle}>
                    Notes
                    <textarea
                      rows={2}
                      value={b.notes ?? ''}
                      onChange={e => patchStudent(s.id, { notes: e.target.value })}
                      onBlur={e => saveField(s.id, { notes: e.target.value || null })}
                      style={{ padding: '5px 8px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: '0.82rem', resize: 'vertical', fontFamily: 'inherit' }}
                    />
                  </label>
                </div>
              )}
            </div>
          </>)
        })}
      </div>

      {/* Lunch guests section — standalone guests only (linked guests roll into student billing) */}
      <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, marginTop: 24, overflow: 'hidden' }}>
        <div style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontWeight: 600, fontSize: '0.82rem' }}>Lunch-Only Guests</span>
          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{standaloneGuests.length} guest{standaloneGuests.length !== 1 ? 's' : ''} · {fmt(standaloneGuests.reduce((s, g) => s + g.lunchTickets * config.lunchTicketPrice, 0))} total</span>
        </div>

        {/* Guest rows */}
        {standaloneGuests.length > 0 && (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                <th style={thS}>Name</th>
                <th style={thS}>Guest of</th>
                <th style={{ ...thS, textAlign: 'center' }}>Tickets</th>
                <th style={{ ...thS, textAlign: 'center' }}>Paid</th>
                <th style={{ ...thS, textAlign: 'right', paddingRight: 12 }}>Total</th>
                <th style={thS} />
              </tr>
            </thead>
            <tbody>
              {standaloneGuests.map(g => (
                <tr key={g.id} style={{ borderTop: '1px solid #f1f5f9' }}>
                  <td style={tdS}>{g.name}</td>
                  <td style={{ ...tdS, color: '#64748b' }}>{g.guestOf ?? '—'}</td>
                  <td style={{ ...tdS, textAlign: 'center' }}>
                    <input
                      type="number" min={1}
                      value={g.lunchTickets}
                      onChange={e => setLunchGuests(prev => prev.map(x => x.id === g.id ? { ...x, lunchTickets: parseInt(e.target.value) || 1 } : x))}
                      onBlur={e => startTransition(async () => { await updateLunchGuest(slug, g.id, { lunchTickets: parseInt(e.target.value) || 1 }) })}
                      style={{ ...inputStyle, width: 48, textAlign: 'center' }}
                    />
                  </td>
                  <td style={{ ...tdS, textAlign: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                      <input
                        type="checkbox"
                        checked={g.paid}
                        onChange={e => {
                          const paid = e.target.checked
                          setLunchGuests(prev => prev.map(x => x.id === g.id ? { ...x, paid } : x))
                          startTransition(async () => { await updateLunchGuest(slug, g.id, { paid }) })
                        }}
                      />
                      {g.paid && (
                        <span style={chipPif}>{[g.paidDate, g.paidInitials].filter(Boolean).join(' · ') || 'paid'}</span>
                      )}
                    </div>
                    {g.paid && (
                      <div style={{ display: 'flex', gap: 4, justifyContent: 'center', marginTop: 4 }}>
                        <input
                          type="text" placeholder="Date"
                          value={g.paidDate ?? ''}
                          onChange={e => setLunchGuests(prev => prev.map(x => x.id === g.id ? { ...x, paidDate: e.target.value } : x))}
                          onBlur={e => startTransition(async () => { await updateLunchGuest(slug, g.id, { paidDate: e.target.value || null }) })}
                          style={{ ...inputStyle, width: 70 }}
                        />
                        <input
                          type="text" placeholder="Init"
                          value={g.paidInitials ?? ''}
                          onChange={e => setLunchGuests(prev => prev.map(x => x.id === g.id ? { ...x, paidInitials: e.target.value } : x))}
                          onBlur={e => startTransition(async () => { await updateLunchGuest(slug, g.id, { paidInitials: e.target.value || null }) })}
                          style={{ ...inputStyle, width: 48 }}
                        />
                      </div>
                    )}
                  </td>
                  <td style={{ ...tdS, textAlign: 'right', paddingRight: 12, fontVariantNumeric: 'tabular-nums' }}>
                    <span style={{
                      background: g.paid ? '#dcfce7' : '#fee2e2',
                      color: g.paid ? '#166534' : '#991b1b',
                      borderRadius: 4, padding: '1px 7px', fontWeight: 600, fontSize: '0.78rem',
                    }}>
                      {fmt(g.lunchTickets * config.lunchTicketPrice)}
                    </span>
                  </td>
                  <td style={{ ...tdS, textAlign: 'right' }}>
                    <button
                      onClick={() => {
                        setLunchGuests(prev => prev.filter(x => x.id !== g.id))
                        startTransition(async () => { await removeLunchGuest(slug, g.id) })
                      }}
                      style={{ fontSize: '0.75rem', color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 6px' }}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <div style={{ padding: '10px 14px', borderTop: '1px solid #e2e8f0' }}>
          <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: 0 }}>Add lunch guests from the Head Count tab.</p>
        </div>
      </div>

    </div>
  )
}

const thS: React.CSSProperties = { padding: '8px 10px', fontWeight: 600, fontSize: '0.78rem', textAlign: 'left', color: '#475569' }
const tdS: React.CSSProperties = { padding: '8px 10px', fontSize: '0.82rem' }
const rowStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', padding: '2px 0', fontVariantNumeric: 'tabular-nums' }
const labelStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 3, fontSize: '0.78rem', fontWeight: 500 }
const inputStyle: React.CSSProperties = { padding: '4px 8px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: '0.82rem', width: 60 }
const chipDep: React.CSSProperties = { display: 'inline-block', background: '#dcfce7', color: '#166534', borderRadius: 5, padding: '2px 7px', fontSize: '0.72rem', fontWeight: 500, fontFamily: 'ui-monospace, monospace', borderLeft: '3px solid #15803d', whiteSpace: 'nowrap' }
const chipPif: React.CSSProperties = { display: 'inline-block', background: '#ccfbf1', color: '#0f766e', borderRadius: 5, padding: '2px 7px', fontSize: '0.72rem', fontWeight: 500, fontFamily: 'ui-monospace, monospace', borderLeft: '3px solid #0f766e', whiteSpace: 'nowrap' }
