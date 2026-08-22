'use client'

import { useState, useTransition } from 'react'
import { setPlanEntry, clearPlanEntry, publishPlanEntries } from '@/app/actions/plan'

type Instructor = { id: number; name: string }
type Student = { id: number; firstName: string; lastName: string }
type DanceType = { id: number; name: string }
type PlanEntry = {
  id: number
  instructorId: number
  studentId: number
  danceTypeId: number
  category: 'closed' | 'open'
  slotIndex: number
  isPublished: boolean
}

interface Props {
  slug: string
  instructors: Instructor[]
  students: Student[]
  danceTypes: DanceType[]
  planEntries: PlanEntry[]
}

const SLOTS = [1, 2, 3, 4, 5, 6]

export default function PlanGrid({ slug, instructors, students, danceTypes, planEntries }: Props) {
  const [activeInstructorId, setActiveInstructorId] = useState(instructors[0]?.id ?? 0)
  const [activeStudentId, setActiveStudentId] = useState<number | null>(null)
  const [isPending, startTransition] = useTransition()
  const [publishResult, setPublishResult] = useState<{ published: number; skipped: number } | null>(null)
  const [studentSearch, setStudentSearch] = useState('')

  const unpublishedCount = planEntries.filter(e => !e.isPublished).length
  const instrEntries = planEntries.filter(e => e.instructorId === activeInstructorId)

  function getEntry(danceTypeId: number, category: 'closed' | 'open', slotIndex: number) {
    return instrEntries.find(e => e.danceTypeId === danceTypeId && e.category === category && e.slotIndex === slotIndex) ?? null
  }

  function studentName(id: number) {
    const s = students.find(s => s.id === id)
    return s ? `${s.firstName} ${s.lastName[0]}.` : '?'
  }

  function handleCellClick(danceTypeId: number, category: 'closed' | 'open', slotIndex: number) {
    const existing = getEntry(danceTypeId, category, slotIndex)
    if (existing) {
      if (existing.isPublished) return
      startTransition(async () => {
        await clearPlanEntry(slug, existing.id)
      })
    } else {
      if (!activeStudentId) return
      startTransition(async () => {
        await setPlanEntry(slug, activeInstructorId, activeStudentId, danceTypeId, category, slotIndex)
      })
    }
  }

  function handlePublish() {
    startTransition(async () => {
      const result = await publishPlanEntries(slug)
      setPublishResult(result)
    })
  }

  const filteredStudents = students.filter(s =>
    `${s.firstName} ${s.lastName}`.toLowerCase().includes(studentSearch.toLowerCase())
  )

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif' }}>

      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>Heat Planning</h1>
          <p style={{ fontSize: '0.78rem', color: 'var(--muted, #64748b)', marginTop: 3 }}>
            Private draft — only visible to your studio. Publish when ready.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {publishResult && (
            <span style={{ fontSize: '0.78rem', color: '#15803d' }}>
              ✓ {publishResult.published} added{publishResult.skipped > 0 ? `, ${publishResult.skipped} skipped` : ''}
            </span>
          )}
          <button
            onClick={handlePublish}
            disabled={isPending || unpublishedCount === 0}
            style={{
              background: unpublishedCount === 0 ? '#e2e8f0' : '#1e293b',
              color: unpublishedCount === 0 ? '#94a3b8' : '#fff',
              border: 'none',
              borderRadius: 6,
              padding: '8px 16px',
              fontWeight: 600,
              fontSize: '0.82rem',
              cursor: unpublishedCount === 0 ? 'default' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 7,
            }}
          >
            {unpublishedCount > 0 ? 'Publish' : 'All published'}
            {unpublishedCount > 0 && (
              <span style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 10, padding: '1px 7px', fontSize: '0.72rem', fontWeight: 700 }}>
                {unpublishedCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Instructor tabs */}
      <div style={{ display: 'flex', gap: 2, borderBottom: '2px solid #e2e8f0', marginBottom: 14, overflowX: 'auto' }}>
        {instructors.map(inst => {
          const count = planEntries.filter(e => e.instructorId === inst.id && !e.isPublished).length
          const active = inst.id === activeInstructorId
          return (
            <button
              key={inst.id}
              onClick={() => setActiveInstructorId(inst.id)}
              style={{
                padding: '7px 16px',
                border: 'none',
                background: 'none',
                borderBottom: active ? '2px solid #3b82f6' : '2px solid transparent',
                marginBottom: -2,
                fontWeight: active ? 700 : 500,
                color: active ? '#3b82f6' : '#64748b',
                cursor: 'pointer',
                fontSize: '0.82rem',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              {inst.name}
              {count > 0 && (
                <span style={{ background: '#3b82f6', color: '#fff', borderRadius: 10, fontSize: '0.65rem', padding: '1px 6px', fontWeight: 700 }}>
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Student selector bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '9px 14px',
        background: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: 8,
        marginBottom: 14,
        flexWrap: 'wrap',
      }}>
        <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#64748b', whiteSpace: 'nowrap' }}>
          Filling for
        </span>

        {activeStudentId ? (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: '#dbeafe', color: '#1e40af',
            borderRadius: 6, padding: '4px 10px',
            fontSize: '0.82rem', fontWeight: 600,
          }}>
            {students.find(s => s.id === activeStudentId)?.firstName} {students.find(s => s.id === activeStudentId)?.lastName}
            <button onClick={() => setActiveStudentId(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#1e40af', opacity: 0.6, fontSize: '0.85rem', lineHeight: 1 }}>×</button>
          </span>
        ) : (
          <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontStyle: 'italic' }}>no student selected</span>
        )}

        <span style={{ fontSize: '0.76rem', color: '#94a3b8' }}>or switch:</span>

        {/* Inline search */}
        <div style={{ position: 'relative', flex: 1, minWidth: 180, maxWidth: 260 }}>
          <input
            placeholder="Search student…"
            value={studentSearch}
            onChange={e => setStudentSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '5px 10px',
              border: '1px solid #cbd5e1',
              borderRadius: 6,
              fontSize: '0.82rem',
              background: '#fff',
              color: '#0f172a',
            }}
          />
          {studentSearch && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              background: '#fff',
              border: '1px solid #e2e8f0',
              borderRadius: 6,
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              zIndex: 50,
              maxHeight: 200,
              overflowY: 'auto',
            }}>
              {filteredStudents.slice(0, 20).map(s => (
                <button
                  key={s.id}
                  onClick={() => { setActiveStudentId(s.id); setStudentSearch('') }}
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    padding: '6px 12px',
                    border: 'none',
                    background: s.id === activeStudentId ? '#eff6ff' : 'transparent',
                    cursor: 'pointer',
                    fontSize: '0.82rem',
                    color: '#0f172a',
                  }}
                >
                  {s.firstName} {s.lastName}
                  {s.id === activeStudentId && ' ✓'}
                </button>
              ))}
            </div>
          )}
        </div>

        {activeStudentId ? (
          <span style={{ fontSize: '0.75rem', color: '#94a3b8', marginLeft: 'auto' }}>
            Click any empty cell to place · Click a filled cell to remove
          </span>
        ) : (
          <span style={{ fontSize: '0.75rem', color: '#f59e0b', marginLeft: 'auto', fontWeight: 500 }}>
            ↑ Select a student first
          </span>
        )}
      </div>

      {/* Grid */}
      <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: 8 }}>
        <table style={{ borderCollapse: 'collapse', minWidth: 900, width: '100%', tableLayout: 'fixed' }}>
          <colgroup>
            <col style={{ width: 110 }} />
            {SLOTS.map(s => <col key={`c-${s}`} style={{ width: 86 }} />)}
            {SLOTS.map(s => <col key={`o-${s}`} style={{ width: 86 }} />)}
          </colgroup>
          <thead>
            {/* Group row */}
            <tr>
              <th style={{ ...thBase, background: '#f8fafc', borderRight: '2px solid #cbd5e1' }}></th>
              <th colSpan={6} style={{ ...thBase, background: '#eff6ff', color: '#3b82f6', textAlign: 'center', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', borderRight: '2px solid #3b82f6' }}>
                Closed
              </th>
              <th colSpan={6} style={{ ...thBase, background: '#f0fdf4', color: '#16a34a', textAlign: 'center', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Open
              </th>
            </tr>
            {/* Slot labels */}
            <tr>
              <th style={{ ...thSlot, textAlign: 'left', paddingLeft: 12, background: '#f8fafc', borderRight: '2px solid #cbd5e1' }}>Dance</th>
              {SLOTS.map(s => (
                <th key={`ch-${s}`} style={{ ...thSlot, background: '#eff6ff', borderRight: s === 6 ? '2px solid #3b82f6' : '1px solid #dbeafe' }}>H{s}</th>
              ))}
              {SLOTS.map(s => (
                <th key={`oh-${s}`} style={{ ...thSlot, background: '#f0fdf4', borderRight: s < 6 ? '1px solid #dcfce7' : undefined }}>H{s}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {danceTypes.map((dance, idx) => (
              <tr key={dance.id} style={{ borderBottom: idx < danceTypes.length - 1 ? '1px solid #e2e8f0' : undefined }}>
                <td style={{
                  padding: '7px 12px',
                  fontWeight: 600,
                  fontSize: '0.82rem',
                  background: idx % 2 === 0 ? '#f8fafc' : '#fff',
                  borderRight: '2px solid #cbd5e1',
                  whiteSpace: 'nowrap',
                }}>
                  {dance.name}
                </td>
                {(['closed', 'open'] as const).map(cat =>
                  SLOTS.map(slot => {
                    const entry = getEntry(dance.id, cat, slot)
                    const isLast = slot === 6 && cat === 'closed'
                    const isEmpty = !entry
                    const canPlace = isEmpty && activeStudentId !== null
                    const canRemove = entry && !entry.isPublished
                    const isPublished = entry?.isPublished

                    return (
                      <td
                        key={`${cat}-${slot}`}
                        onClick={() => handleCellClick(dance.id, cat, slot)}
                        style={{
                          padding: '5px 5px',
                          textAlign: 'center',
                          verticalAlign: 'middle',
                          height: 36,
                          background: cat === 'closed' ? (idx % 2 === 0 ? '#eff6ff' : '#f5f9ff') : (idx % 2 === 0 ? '#f0fdf4' : '#f5fdf7'),
                          borderRight: isLast ? '2px solid #3b82f6' : `1px solid ${cat === 'closed' ? '#dbeafe' : '#dcfce7'}`,
                          cursor: canPlace || canRemove ? 'pointer' : 'default',
                          transition: 'background 0.1s',
                        }}
                        onMouseEnter={e => {
                          if (canPlace || canRemove) (e.currentTarget as HTMLElement).style.background = cat === 'closed' ? '#dbeafe' : '#bbf7d0'
                        }}
                        onMouseLeave={e => {
                          (e.currentTarget as HTMLElement).style.background = cat === 'closed' ? (idx % 2 === 0 ? '#eff6ff' : '#f5f9ff') : (idx % 2 === 0 ? '#f0fdf4' : '#f5fdf7')
                        }}
                      >
                        {entry ? (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 3,
                            background: isPublished ? '#f1f5f9' : (cat === 'closed' ? '#dbeafe' : '#dcfce7'),
                            color: isPublished ? '#94a3b8' : (cat === 'closed' ? '#1e40af' : '#15803d'),
                            borderRadius: 4,
                            padding: '2px 6px',
                            fontSize: '0.72rem',
                            fontWeight: 600,
                            whiteSpace: 'nowrap',
                          }}>
                            {isPublished && <span style={{ fontSize: '0.6rem' }}>✓</span>}
                            {studentName(entry.studentId)}
                          </span>
                        ) : (
                          <span style={{
                            color: canPlace ? (cat === 'closed' ? '#93c5fd' : '#86efac') : '#e2e8f0',
                            fontSize: '1rem',
                            lineHeight: 1,
                            userSelect: 'none',
                          }}>
                            +
                          </span>
                        )}
                      </td>
                    )
                  })
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

const thBase: React.CSSProperties = {
  padding: '7px 4px',
  borderBottom: 'none',
}

const thSlot: React.CSSProperties = {
  padding: '5px 4px',
  fontSize: '0.68rem',
  fontWeight: 600,
  textAlign: 'center',
  color: '#64748b',
  borderBottom: '2px solid #cbd5e1',
  fontVariantNumeric: 'tabular-nums',
  letterSpacing: '0.04em',
}
