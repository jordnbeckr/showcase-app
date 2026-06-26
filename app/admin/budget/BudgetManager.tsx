'use client'

import { upsertBudgetItem, deleteBudgetItem, setEntryFee, setStudioAttendees, setStudioPaid } from '@/app/actions/budget'
import { useState, useTransition } from 'react'

type BudgetItem = {
  id: number
  name: string
  category: 'participation' | 'attendee'
  unitCost: number
  quantity: number
}

type StudioRow = {
  id: number
  name: string
  participantCount: number
  entryCount: number
  attendees: number
  paid: boolean
}

type Props = {
  budgetItems: BudgetItem[]
  entryFee: number
  studios: StudioRow[]
}

function fmt(n: number) {
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default function BudgetManager({ budgetItems, entryFee, studios }: Props) {
  const [pending, startTransition] = useTransition()

  const [feeInput, setFeeInput] = useState(entryFee.toString())
  const [newName, setNewName] = useState('')
  const [newCategory, setNewCategory] = useState<'participation' | 'attendee'>('participation')
  const [newCost, setNewCost] = useState('')
  const [newQty, setNewQty] = useState('1')

  // Per-studio spectator inputs (studioId → string)
  const [spectatorInputs, setSpectatorInputs] = useState<Record<number, string>>(
    Object.fromEntries(studios.map(s => [s.id, s.attendees.toString()]))
  )

  // Derived totals
  const participationPool = budgetItems.filter(i => i.category === 'participation').reduce((s, i) => s + i.unitCost * i.quantity, 0)
  const spectatorPool = budgetItems.filter(i => i.category === 'attendee').reduce((s, i) => s + i.unitCost * i.quantity, 0)

  const totalParticipants = studios.reduce((s, s2) => s + s2.participantCount, 0)
  const totalSpectators = studios.reduce((s, s2) => s + (parseInt(spectatorInputs[s2.id] ?? '0') || 0), 0)
  const totalHeadcount = totalParticipants + totalSpectators

  // Participant fee = (participation pool + spectator pool) / participants
  const participantFee = totalParticipants > 0 ? (participationPool + spectatorPool) / totalParticipants : 0
  // Spectator fee = spectator pool / (participants + spectators)
  const spectatorFee = totalHeadcount > 0 ? spectatorPool / totalHeadcount : 0

  function handleSaveFee() {
    const fee = parseFloat(feeInput)
    if (isNaN(fee)) return
    startTransition(async () => { await setEntryFee(fee) })
  }

  function handleAddItem() {
    const cost = parseFloat(newCost)
    const qty = parseInt(newQty)
    if (!newName.trim() || isNaN(cost) || isNaN(qty)) return
    startTransition(async () => {
      await upsertBudgetItem({ name: newName.trim(), category: newCategory, unitCost: cost, quantity: qty })
      setNewName('')
      setNewCost('')
      setNewQty('1')
    })
  }

  function handleDeleteItem(id: number, name: string) {
    if (!confirm(`Delete "${name}"?`)) return
    startTransition(async () => { await deleteBudgetItem(id) })
  }

  function handleSaveSpectators(studioId: number) {
    const n = parseInt(spectatorInputs[studioId] ?? '0') || 0
    startTransition(async () => { await setStudioAttendees(studioId, n) })
  }

  function handleTogglePaid(studioId: number, current: boolean) {
    startTransition(async () => { await setStudioPaid(studioId, !current) })
  }

  return (
    <div className="space-y-6">

      {/* Entry Fee */}
      <div className="card p-4">
        <div className="font-semibold text-sm mb-3">Entry Fee (per heat entry)</div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <span className="text-sm" style={{ color: 'var(--muted)' }}>$</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={feeInput}
              onChange={e => setFeeInput(e.target.value)}
              className="field"
              style={{ width: 100 }}
            />
          </div>
          <button
            onClick={handleSaveFee}
            disabled={pending}
            className="text-sm px-4 py-1.5 font-medium text-white disabled:opacity-50"
            style={{ backgroundColor: '#333', borderRadius: 4 }}
          >
            Save
          </button>
          <span className="text-xs" style={{ color: 'var(--muted)' }}>
            Applied to each studio's total heat entry count
          </span>
        </div>
      </div>

      {/* Cost Items */}
      <div className="card overflow-hidden">
        <div className="px-4 py-3 font-semibold text-sm" style={{ borderBottom: '1px solid var(--border)' }}>
          Cost Items
        </div>

        {/* Summary: derived fees */}
        <div className="px-4 py-3 flex gap-6" style={{ borderBottom: '1px solid var(--border)', backgroundColor: '#fafafa' }}>
          <div>
            <span className="text-xs font-medium" style={{ color: 'var(--muted)' }}>Participation Pool</span>
            <div className="text-base font-bold" style={{ color: '#1d4ed8' }}>{fmt(participationPool)}</div>
          </div>
          <div style={{ width: 1, backgroundColor: 'var(--border)' }} />
          <div>
            <span className="text-xs font-medium" style={{ color: 'var(--muted)' }}>Attendance Pool</span>
            <div className="text-base font-bold" style={{ color: '#7c3aed' }}>{fmt(spectatorPool)}</div>
          </div>
          <div style={{ width: 1, backgroundColor: 'var(--border)' }} />
          <div>
            <span className="text-xs font-medium" style={{ color: 'var(--muted)' }}>Participant Fee</span>
            <div className="text-base font-bold">{fmt(participantFee)}/person</div>
            {totalParticipants > 0 && (
              <div className="text-xs" style={{ color: 'var(--muted)' }}>
                ({fmt(participationPool)} + {fmt(spectatorPool)}) ÷ {totalParticipants} participants
              </div>
            )}
          </div>
          <div style={{ width: 1, backgroundColor: 'var(--border)' }} />
          <div>
            <span className="text-xs font-medium" style={{ color: 'var(--muted)' }}>Spectator Fee</span>
            <div className="text-base font-bold">{fmt(spectatorFee)}/person</div>
            {totalHeadcount > 0 && (
              <div className="text-xs" style={{ color: 'var(--muted)' }}>
                {fmt(spectatorPool)} ÷ {totalHeadcount} ({totalParticipants} participants + {totalSpectators} spectators)
              </div>
            )}
          </div>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>Item</th>
              <th style={{ width: 140 }}>Category</th>
              <th style={{ width: 90, textAlign: 'right' }}>Unit Cost</th>
              <th style={{ width: 70, textAlign: 'center' }}>Qty</th>
              <th style={{ width: 100, textAlign: 'right' }}>Total</th>
              <th style={{ width: 60 }}></th>
            </tr>
          </thead>
          <tbody>
            {budgetItems.length === 0 && (
              <tr><td colSpan={6} style={{ color: 'var(--muted)', fontStyle: 'italic', textAlign: 'center' }}>No cost items yet</td></tr>
            )}
            {budgetItems.map(item => (
              <tr key={item.id}>
                <td className="font-medium">{item.name}</td>
                <td>
                  <span
                    style={{
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      padding: '2px 7px',
                      borderRadius: 10,
                      backgroundColor: item.category === 'participation' ? '#dbeafe' : '#ede9fe',
                      color: item.category === 'participation' ? '#1d4ed8' : '#7c3aed',
                    }}
                  >
                    {item.category === 'participation' ? 'Participation' : 'Attendance'}
                  </span>
                </td>
                <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{fmt(item.unitCost)}</td>
                <td style={{ textAlign: 'center', color: 'var(--muted)' }}>×{item.quantity}</td>
                <td style={{ textAlign: 'right', fontWeight: 600 }}>{fmt(item.unitCost * item.quantity)}</td>
                <td>
                  <button onClick={() => handleDeleteItem(item.id, item.name)} disabled={pending} className="text-xs" style={{ color: '#dc2626' }}>
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Add item form */}
        <div className="px-4 py-4" style={{ borderTop: '1px solid var(--border)', backgroundColor: '#fafafa' }}>
          <div className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--muted)' }}>Add Item</div>
          <div className="flex gap-2 flex-wrap">
            <input
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="Item name…"
              className="field"
              style={{ width: 200 }}
            />
            <select
              value={newCategory}
              onChange={e => setNewCategory(e.target.value as 'participation' | 'attendee')}
              className="field"
              style={{ width: 150 }}
            >
              <option value="participation">Participation</option>
              <option value="attendee">Attendance</option>
            </select>
            <div className="flex items-center gap-1">
              <span className="text-sm" style={{ color: 'var(--muted)' }}>$</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={newCost}
                onChange={e => setNewCost(e.target.value)}
                placeholder="0.00"
                className="field"
                style={{ width: 90 }}
              />
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xs" style={{ color: 'var(--muted)' }}>×</span>
              <input
                type="number"
                min="1"
                value={newQty}
                onChange={e => setNewQty(e.target.value)}
                className="field"
                style={{ width: 70 }}
              />
            </div>
            <button
              onClick={handleAddItem}
              disabled={pending || !newName.trim() || !newCost}
              className="text-sm px-4 py-1.5 font-medium text-white disabled:opacity-50"
              style={{ backgroundColor: '#333', borderRadius: 4 }}
            >
              Add
            </button>
          </div>
        </div>
      </div>

      {/* Studio Breakdown */}
      <div className="card overflow-hidden">
        <div className="px-4 py-3 font-semibold text-sm" style={{ borderBottom: '1px solid var(--border)' }}>
          Studio Dues Breakdown
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Studio</th>
              <th style={{ width: 90, textAlign: 'center' }}>Participants</th>
              <th style={{ width: 100, textAlign: 'center' }}>Spectators</th>
              <th style={{ width: 100, textAlign: 'right' }}>Entries</th>
              <th style={{ width: 110, textAlign: 'right' }}>Entry Cost</th>
              <th style={{ width: 120, textAlign: 'right' }}>Participant Cost</th>
              <th style={{ width: 110, textAlign: 'right' }}>Spectator Cost</th>
              <th style={{ width: 110, textAlign: 'right' }}>Total Due</th>
              <th style={{ width: 80, textAlign: 'center' }}>Paid</th>
            </tr>
            <tr style={{ backgroundColor: '#f5f5f5' }}>
              <td colSpan={3} />
              <td style={{ textAlign: 'right', fontSize: '0.72rem', color: 'var(--muted)', fontWeight: 500, paddingTop: 4, paddingBottom: 4 }}>
                × {fmt(entryFee)}
              </td>
              <td />
              <td style={{ textAlign: 'right', fontSize: '0.72rem', color: 'var(--muted)', fontWeight: 500, paddingTop: 4, paddingBottom: 4 }}>
                × {fmt(participantFee)}/person
              </td>
              <td style={{ textAlign: 'right', fontSize: '0.72rem', color: 'var(--muted)', fontWeight: 500, paddingTop: 4, paddingBottom: 4 }}>
                × {fmt(spectatorFee)}/person
              </td>
              <td colSpan={2} />
            </tr>
          </thead>
          <tbody>
            {studios.map(studio => {
              const spectators = parseInt(spectatorInputs[studio.id] ?? '0') || 0
              const entryCost = studio.entryCount * entryFee
              const participantCost = studio.participantCount * participantFee
              const spectatorCost = spectators * spectatorFee
              const totalDue = entryCost + participantCost + spectatorCost

              return (
                <tr
                  key={studio.id}
                  style={{
                    backgroundColor: studio.paid ? '#f0fdf4' : undefined,
                    opacity: pending ? 0.7 : 1,
                  }}
                >
                  <td>
                    <span className="font-medium">{studio.name}</span>
                    {studio.paid && (
                      <span
                        style={{
                          marginLeft: 8,
                          fontSize: '0.65rem',
                          fontWeight: 700,
                          padding: '1px 6px',
                          borderRadius: 10,
                          backgroundColor: '#16a34a',
                          color: 'white',
                          letterSpacing: '0.05em',
                          textTransform: 'uppercase',
                        }}
                      >
                        PAID
                      </span>
                    )}
                  </td>
                  <td style={{ textAlign: 'center', color: 'var(--muted)' }}>{studio.participantCount}</td>
                  <td style={{ textAlign: 'center' }}>
                    <div className="flex items-center gap-1 justify-center">
                      <input
                        type="number"
                        min="0"
                        value={spectatorInputs[studio.id] ?? '0'}
                        onChange={e => setSpectatorInputs(prev => ({ ...prev, [studio.id]: e.target.value }))}
                        onBlur={() => handleSaveSpectators(studio.id)}
                        className="field"
                        style={{ width: 64, textAlign: 'center', padding: '2px 6px' }}
                      />
                    </div>
                  </td>
                  <td style={{ textAlign: 'right', color: 'var(--muted)', fontSize: '0.85rem' }}>
                    {studio.entryCount} × {fmt(entryFee)}
                  </td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{fmt(entryCost)}</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{fmt(participantCost)}</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{fmt(spectatorCost)}</td>
                  <td style={{ textAlign: 'right', fontWeight: 700, fontSize: '0.95rem' }}>{fmt(totalDue)}</td>
                  <td style={{ textAlign: 'center' }}>
                    <button
                      onClick={() => handleTogglePaid(studio.id, studio.paid)}
                      disabled={pending}
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        border: studio.paid ? '2px solid #16a34a' : '2px solid #d1d5db',
                        backgroundColor: studio.paid ? '#16a34a' : 'white',
                        color: studio.paid ? 'white' : '#9ca3af',
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto',
                      }}
                      title={studio.paid ? 'Mark as unpaid' : 'Mark as paid'}
                    >
                      {studio.paid ? '✓' : ''}
                    </button>
                  </td>
                </tr>
              )
            })}

            {/* Totals row */}
            {studios.length > 0 && (() => {
              const totalEntryCost = studios.reduce((s, studio) => s + studio.entryCount * entryFee, 0)
              const totalParticipantCost = studios.reduce((s, studio) => s + studio.participantCount * participantFee, 0)
              const totalSpectatorCost = studios.reduce((s, studio) => {
                const n = parseInt(spectatorInputs[studio.id] ?? '0') || 0
                return s + n * spectatorFee
              }, 0)
              const grandTotal = totalEntryCost + totalParticipantCost + totalSpectatorCost
              return (
                <tr style={{ backgroundColor: '#f5f5f5', fontWeight: 700 }}>
                  <td style={{ fontSize: '0.8rem', color: '#444' }}>Total</td>
                  <td style={{ textAlign: 'center', fontSize: '0.85rem' }}>{totalParticipants}</td>
                  <td style={{ textAlign: 'center', fontSize: '0.85rem' }}>{totalSpectators}</td>
                  <td></td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{fmt(totalEntryCost)}</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{fmt(totalParticipantCost)}</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{fmt(totalSpectatorCost)}</td>
                  <td style={{ textAlign: 'right', fontSize: '1rem' }}>{fmt(grandTotal)}</td>
                  <td></td>
                </tr>
              )
            })()}
          </tbody>
        </table>
      </div>
    </div>
  )
}
