'use client'

import { useState, useTransition } from 'react'
import { addPlanEntry, removePlanEntry, publishPlanEntries } from '@/app/actions/plan'

type Instructor = { id: number; name: string }
type Student = { id: number; firstName: string; lastName: string }
type DanceType = { id: number; name: string }
type PlanEntry = {
  id: number
  instructorId: number
  studentId: number
  danceTypeId: number
  category: 'closed' | 'open'
  isPublished: boolean
  studentName: string
}

interface Props {
  slug: string
  instructors: Instructor[]
  students: Student[]
  danceTypes: DanceType[]
  planEntries: PlanEntry[]
}

export default function PlanGrid({ slug, instructors, students, danceTypes, planEntries }: Props) {
  const [activeInstructorId, setActiveInstructorId] = useState(instructors[0]?.id ?? 0)
  const [isPending, startTransition] = useTransition()
  const [publishResult, setPublishResult] = useState<{ published: number; skipped: number } | null>(null)

  // picker state
  const [pickerCell, setPickerCell] = useState<{ danceTypeId: number; category: 'closed' | 'open' } | null>(null)
  const [search, setSearch] = useState('')

  const entriesForInstructor = planEntries.filter(e => e.instructorId === activeInstructorId)

  function entriesForCell(danceTypeId: number, category: 'closed' | 'open') {
    return entriesForInstructor.filter(e => e.danceTypeId === danceTypeId && e.category === category)
  }

  function handleAdd(studentId: number) {
    if (!pickerCell) return
    startTransition(async () => {
      await addPlanEntry(slug, activeInstructorId, studentId, pickerCell.danceTypeId, pickerCell.category)
      setPickerCell(null)
      setSearch('')
    })
  }

  function handleRemove(id: number) {
    startTransition(async () => {
      await removePlanEntry(slug, id)
    })
  }

  function handlePublish() {
    startTransition(async () => {
      const result = await publishPlanEntries(slug)
      setPublishResult(result)
    })
  }

  const unpublishedCount = planEntries.filter(e => !e.isPublished).length

  const filteredStudents = students.filter(s =>
    `${s.firstName} ${s.lastName}`.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Heat Planning</h1>
          <p style={{ fontSize: '0.8rem', color: 'var(--muted)', margin: '4px 0 0' }}>
            Plan your heats privately, then publish to add them to the heat sheet.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {publishResult && (
            <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
              ✓ {publishResult.published} added{publishResult.skipped > 0 ? `, ${publishResult.skipped} skipped` : ''}
            </span>
          )}
          <button
            onClick={handlePublish}
            disabled={isPending || unpublishedCount === 0}
            style={{
              padding: '8px 16px',
              borderRadius: 6,
              border: 'none',
              background: unpublishedCount === 0 ? 'var(--border)' : 'var(--header)',
              color: unpublishedCount === 0 ? 'var(--muted)' : 'white',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: unpublishedCount === 0 ? 'default' : 'pointer',
            }}
          >
            {unpublishedCount > 0 ? `Publish ${unpublishedCount} entr${unpublishedCount === 1 ? 'y' : 'ies'}` : 'All published'}
          </button>
        </div>
      </div>

      {/* Instructor tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '2px solid var(--border)', paddingBottom: 0 }}>
        {instructors.map(inst => {
          const count = planEntries.filter(e => e.instructorId === inst.id && !e.isPublished).length
          const active = inst.id === activeInstructorId
          return (
            <button
              key={inst.id}
              onClick={() => { setActiveInstructorId(inst.id); setPickerCell(null) }}
              style={{
                padding: '8px 16px',
                border: 'none',
                borderBottom: active ? '2px solid var(--header)' : '2px solid transparent',
                background: 'none',
                fontWeight: active ? 700 : 400,
                color: active ? 'var(--header)' : 'var(--muted)',
                cursor: 'pointer',
                fontSize: '0.875rem',
                marginBottom: -2,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              {inst.name}
              {count > 0 && (
                <span style={{
                  background: 'var(--header)',
                  color: 'white',
                  borderRadius: 10,
                  fontSize: '0.7rem',
                  padding: '1px 6px',
                  fontWeight: 700,
                }}>
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Grid */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 500 }}>
          <thead>
            <tr>
              <th style={thStyle}>Dance</th>
              <th style={{ ...thStyle, color: '#2563eb' }}>Closed</th>
              <th style={{ ...thStyle, color: '#16a34a' }}>Open</th>
            </tr>
          </thead>
          <tbody>
            {danceTypes.map((dance, idx) => (
              <tr key={dance.id} style={{ background: idx % 2 === 0 ? 'transparent' : 'var(--row-alt, rgba(0,0,0,0.02))' }}>
                <td style={danceCellStyle}>{dance.name}</td>
                {(['closed', 'open'] as const).map(cat => {
                  const cellEntries = entriesForCell(dance.id, cat)
                  const isOpen = pickerCell?.danceTypeId === dance.id && pickerCell?.category === cat
                  return (
                    <td key={cat} style={entryCellStyle}>
                      {/* Existing entries */}
                      {cellEntries.map(e => (
                        <span key={e.id} style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          background: e.isPublished ? 'var(--border)' : (cat === 'closed' ? '#dbeafe' : '#dcfce7'),
                          color: e.isPublished ? 'var(--muted)' : (cat === 'closed' ? '#1e40af' : '#15803d'),
                          borderRadius: 4,
                          padding: '2px 8px',
                          fontSize: '0.8rem',
                          fontWeight: 500,
                          margin: '2px',
                        }}>
                          {e.isPublished && <span title="Published" style={{ fontSize: '0.65rem' }}>✓</span>}
                          {e.studentName}
                          {!e.isPublished && (
                            <button
                              onClick={() => handleRemove(e.id)}
                              disabled={isPending}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, lineHeight: 1, color: 'inherit', opacity: 0.6, fontSize: '0.75rem' }}
                            >
                              ×
                            </button>
                          )}
                        </span>
                      ))}

                      {/* Add button / picker */}
                      {isOpen ? (
                        <div style={{ marginTop: 4 }}>
                          <input
                            autoFocus
                            placeholder="Search student…"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            style={{
                              width: '100%',
                              padding: '4px 8px',
                              border: '1px solid var(--border)',
                              borderRadius: 4,
                              fontSize: '0.8rem',
                              marginBottom: 4,
                            }}
                          />
                          <div style={{ maxHeight: 160, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 4 }}>
                            {filteredStudents.length === 0 ? (
                              <div style={{ padding: '6px 10px', fontSize: '0.8rem', color: 'var(--muted)' }}>No students found</div>
                            ) : filteredStudents.map(s => {
                              const alreadyAdded = cellEntries.some(e => e.studentId === s.id)
                              return (
                                <button
                                  key={s.id}
                                  onClick={() => !alreadyAdded && handleAdd(s.id)}
                                  disabled={alreadyAdded || isPending}
                                  style={{
                                    display: 'block',
                                    width: '100%',
                                    textAlign: 'left',
                                    padding: '5px 10px',
                                    border: 'none',
                                    background: alreadyAdded ? 'var(--border)' : 'transparent',
                                    cursor: alreadyAdded ? 'default' : 'pointer',
                                    fontSize: '0.8rem',
                                    color: alreadyAdded ? 'var(--muted)' : 'inherit',
                                  }}
                                >
                                  {s.firstName} {s.lastName}
                                  {alreadyAdded && ' ✓'}
                                </button>
                              )
                            })}
                          </div>
                          <button
                            onClick={() => { setPickerCell(null); setSearch('') }}
                            style={{ marginTop: 4, fontSize: '0.75rem', color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => { setPickerCell({ danceTypeId: dance.id, category: cat }); setSearch('') }}
                          style={{
                            background: 'none',
                            border: '1px dashed var(--border)',
                            borderRadius: 4,
                            color: 'var(--muted)',
                            cursor: 'pointer',
                            fontSize: '0.75rem',
                            padding: '2px 8px',
                            margin: '2px',
                          }}
                        >
                          + Add
                        </button>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

const thStyle: React.CSSProperties = {
  textAlign: 'left',
  padding: '8px 12px',
  fontSize: '0.8rem',
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  borderBottom: '2px solid var(--border)',
  color: 'var(--muted)',
}

const danceCellStyle: React.CSSProperties = {
  padding: '8px 12px',
  fontWeight: 600,
  fontSize: '0.875rem',
  borderBottom: '1px solid var(--border)',
  whiteSpace: 'nowrap',
  width: 140,
}

const entryCellStyle: React.CSSProperties = {
  padding: '6px 8px',
  borderBottom: '1px solid var(--border)',
  verticalAlign: 'top',
  minWidth: 200,
}
