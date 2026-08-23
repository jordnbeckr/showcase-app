'use client'

import { useState, useEffect, useTransition } from 'react'
import { setPlanEntry, clearPlanEntry, publishPlanEntries, addPlanEventEntry, removePlanEventEntry } from '@/app/actions/plan'

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

type HeatCount = { danceTypeId: number; category: 'closed' | 'open'; count: number }
type CompEvent = { id: number; name: string; heatCount: number; isAmateur: boolean }

const EVENT_PALETTE = [
  { bg: '#ede9fe', border: '#7c3aed', chip: '#ddd6fe', chipText: '#4c1d95' }, // violet
  { bg: '#fce7f3', border: '#be185d', chip: '#fbcfe8', chipText: '#831843' }, // rose
  { bg: '#fff7ed', border: '#c2410c', chip: '#fed7aa', chipText: '#7c2d12' }, // orange
  { bg: '#ecfdf5', border: '#065f46', chip: '#a7f3d0', chipText: '#064e3b' }, // emerald
  { bg: '#eff6ff', border: '#1d4ed8', chip: '#bfdbfe', chipText: '#1e3a8a' }, // blue
  { bg: '#fef9c3', border: '#a16207', chip: '#fef08a', chipText: '#713f12' }, // yellow
]
const AMATEUR_PALETTE = { bg: '#f9fafb', border: '#9ca3af', chip: '#f3f4f6', chipText: '#374151' }

// Strip trailing " A", " B", " 1", " 2" etc. to group related events together
function eventGroupKey(name: string) {
  return name.replace(/\s+[A-Z\d]$/i, '').trim()
}

function buildEventPaletteMap(events: CompEvent[]) {
  const map = new Map<string, typeof EVENT_PALETTE[number]>()
  let idx = 0
  for (const evt of events) {
    if (evt.isAmateur) continue
    const key = eventGroupKey(evt.name)
    if (!map.has(key)) { map.set(key, EVENT_PALETTE[idx % EVENT_PALETTE.length]); idx++ }
  }
  return map
}
type PlanEventEntry = { id: number; instructorId: number; studentId: number; eventId: number; isPublished: boolean }

interface Props {
  slug: string
  instructors: Instructor[]
  students: Student[]
  danceTypes: DanceType[]
  events: CompEvent[]
  planEntries: PlanEntry[]
  planEventEntries: PlanEventEntry[]
  heatCounts: HeatCount[]
}

const SLOTS = [1, 2, 3, 4, 5, 6]

export default function PlanGrid({ slug, instructors, students, danceTypes, events, planEntries, planEventEntries, heatCounts }: Props) {
  function availableSlots(danceTypeId: number, category: 'closed' | 'open') {
    return heatCounts.find(h => h.danceTypeId === danceTypeId && h.category === category)?.count ?? 0
  }
  const [activeInstructorId, setActiveInstructorId] = useState(instructors[0]?.id ?? 0)
  const [activeStudentId, setActiveStudentId] = useState<number | null>(null)
  const [isPending, startTransition] = useTransition()
  const [publishResult, setPublishResult] = useState<{ published: number; skipped: number } | null>(null)
  const [studentSearch, setStudentSearch] = useState('')

  // Local optimistic copies — update immediately on click, sync from server after revalidation
  const [localEntries, setLocalEntries] = useState<PlanEntry[]>(planEntries)
  useEffect(() => { setLocalEntries(planEntries) }, [planEntries])

  const [localEventEntries, setLocalEventEntries] = useState<PlanEventEntry[]>(planEventEntries)
  useEffect(() => { setLocalEventEntries(planEventEntries) }, [planEventEntries])

  // Event picker state
  const [openEventPicker, setOpenEventPicker] = useState<number | null>(null) // eventId
  const [eventStudentSearch, setEventStudentSearch] = useState('')

  const unpublishedCount = localEntries.filter(e => !e.isPublished).length + localEventEntries.filter(e => !e.isPublished).length
  const instrEntries = localEntries.filter(e => e.instructorId === activeInstructorId)

  function getEntry(danceTypeId: number, category: 'closed' | 'open', slotIndex: number) {
    return instrEntries.find(e => e.danceTypeId === danceTypeId && e.category === category && e.slotIndex === slotIndex) ?? null
  }

  const duplicateFirstNames = new Set(
    students.map(s => s.firstName.toLowerCase()).filter((n, _, arr) => arr.filter(x => x === n).length > 1)
  )

  function studentLabel(id: number, short = false) {
    const s = students.find(s => s.id === id)
    if (!s) return '?'
    const isDupe = duplicateFirstNames.has(s.firstName.toLowerCase())
    if (short || isDupe) return isDupe ? `${s.firstName} ${s.lastName[0]}.` : s.firstName
    return `${s.firstName} ${s.lastName}`
  }

  function handleCellClick(danceTypeId: number, category: 'closed' | 'open', slotIndex: number) {
    const existing = getEntry(danceTypeId, category, slotIndex)
    if (existing) {
      if (existing.isPublished) return
      // Optimistic remove
      setLocalEntries(prev => prev.filter(e => e.id !== existing.id))
      startTransition(async () => { await clearPlanEntry(slug, existing.id) })
    } else {
      if (!activeStudentId) return
      const tempId = -(Date.now())
      const tempEntry: PlanEntry = {
        id: tempId,
        instructorId: activeInstructorId,
        studentId: activeStudentId,
        danceTypeId,
        category,
        slotIndex,
        isPublished: false,
      }
      // Optimistic add
      setLocalEntries(prev => [...prev, tempEntry])
      startTransition(async () => {
        await setPlanEntry(slug, activeInstructorId, activeStudentId, danceTypeId, category, slotIndex)
      })
    }
  }

  function handleAddEventEntry(studentId: number, eventId: number) {
    const tempEntry: PlanEventEntry = {
      id: -(Date.now()),
      instructorId: activeInstructorId,
      studentId,
      eventId,
      isPublished: false,
    }
    setLocalEventEntries(prev => [...prev, tempEntry])
    setOpenEventPicker(null)
    setEventStudentSearch('')
    startTransition(async () => { await addPlanEventEntry(slug, activeInstructorId, studentId, eventId) })
  }

  function handleRemoveEventEntry(id: number) {
    setLocalEventEntries(prev => prev.filter(e => e.id !== id))
    startTransition(async () => { await removePlanEventEntry(slug, id) })
  }

  function handlePublish() {
    startTransition(async () => {
      const result = await publishPlanEntries(slug)
      setPublishResult(result)
    })
  }

  const filteredStudents = studentSearch
    ? students.filter(s => `${s.firstName} ${s.lastName}`.toLowerCase().includes(studentSearch.toLowerCase()))
    : students

  const activeStudent = students.find(s => s.id === activeStudentId)

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif' }}>

      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>Heat Planning</h1>
          <p style={{ fontSize: '0.78rem', color: '#64748b', marginTop: 3 }}>
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
              border: 'none', borderRadius: 6,
              padding: '8px 16px', fontWeight: 600, fontSize: '0.82rem',
              cursor: unpublishedCount === 0 ? 'default' : 'pointer',
              display: 'flex', alignItems: 'center', gap: 7,
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
          const eventHeatCount = (entries: typeof localEventEntries) =>
            entries.reduce((sum, e) => sum + (events.find(ev => ev.id === e.eventId)?.heatCount ?? 1), 0)
          const totalCount = localEntries.filter(e => e.instructorId === inst.id).length
            + eventHeatCount(localEventEntries.filter(e => e.instructorId === inst.id))
          const unpubCount = localEntries.filter(e => e.instructorId === inst.id && !e.isPublished).length
            + eventHeatCount(localEventEntries.filter(e => e.instructorId === inst.id && !e.isPublished))
          const active = inst.id === activeInstructorId
          return (
            <button key={inst.id} onClick={() => setActiveInstructorId(inst.id)} style={{
              padding: '7px 11px', border: 'none', background: 'none',
              borderBottom: active ? '2px solid #3b82f6' : '2px solid transparent',
              marginBottom: -2, fontWeight: active ? 700 : 500,
              color: active ? '#3b82f6' : '#64748b',
              cursor: 'pointer', fontSize: '0.82rem', whiteSpace: 'nowrap',
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              {inst.name}
              {totalCount > 0 && (
                <span style={{ background: '#e2e8f0', color: '#475569', borderRadius: 10, fontSize: '0.65rem', padding: '1px 6px', fontWeight: 700 }}>
                  {totalCount}
                </span>
              )}
              {unpubCount > 0 && (
                <span style={{ background: '#3b82f6', color: '#fff', borderRadius: 10, fontSize: '0.65rem', padding: '1px 6px', fontWeight: 700 }}>
                  {unpubCount}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Student selector bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '9px 14px', background: '#f8fafc',
        border: '1px solid #e2e8f0', borderRadius: 8, marginBottom: 14, flexWrap: 'wrap',
      }}>
        <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#64748b', whiteSpace: 'nowrap' }}>
          Filling for
        </span>

        {/* Dropdown */}
        <select
          value={activeStudentId ?? ''}
          onChange={e => setActiveStudentId(e.target.value ? Number(e.target.value) : null)}
          style={{
            padding: '5px 10px', border: '1px solid #cbd5e1', borderRadius: 6,
            background: '#fff', color: '#0f172a', fontSize: '0.82rem',
            fontFamily: 'inherit', minWidth: 180,
          }}
        >
          <option value="">— Select student —</option>
          {students.map(s => (
            <option key={s.id} value={s.id}>{s.firstName} {s.lastName}</option>
          ))}
        </select>

        <span style={{ fontSize: '0.76rem', color: '#94a3b8' }}>or search:</span>

        {/* Search with dropdown */}
        <div style={{ position: 'relative', minWidth: 180, maxWidth: 240 }}>
          <input
            placeholder="Search…"
            value={studentSearch}
            onChange={e => setStudentSearch(e.target.value)}
            onBlur={() => setTimeout(() => setStudentSearch(''), 150)}
            style={{
              width: '100%', padding: '5px 10px',
              border: '1px solid #cbd5e1', borderRadius: 6,
              background: '#fff', color: '#0f172a', fontSize: '0.82rem',
            }}
          />
          {studentSearch && (
            <div style={{
              position: 'absolute', top: '100%', left: 0, right: 0,
              background: '#fff', border: '1px solid #e2e8f0', borderRadius: 6,
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 50,
              maxHeight: 200, overflowY: 'auto',
            }}>
              {filteredStudents.slice(0, 20).map(s => (
                <button key={s.id} onMouseDown={() => { setActiveStudentId(s.id); setStudentSearch('') }} style={{
                  display: 'block', width: '100%', textAlign: 'left',
                  padding: '6px 12px', border: 'none',
                  background: s.id === activeStudentId ? '#eff6ff' : 'transparent',
                  cursor: 'pointer', fontSize: '0.82rem', color: '#0f172a',
                }}>
                  {s.firstName} {s.lastName}{s.id === activeStudentId ? ' ✓' : ''}
                </button>
              ))}
            </div>
          )}
        </div>

        {activeStudent && (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: '#dbeafe', color: '#1e40af',
            borderRadius: 6, padding: '4px 10px', fontSize: '0.82rem', fontWeight: 600,
          }}>
            {activeStudent.firstName} {activeStudent.lastName}
            <button onClick={() => setActiveStudentId(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#1e40af', opacity: 0.6, fontSize: '0.85rem', lineHeight: 1 }}>×</button>
          </span>
        )}

        <span style={{ fontSize: '0.75rem', color: activeStudentId ? '#94a3b8' : '#f59e0b', marginLeft: 'auto', fontWeight: activeStudentId ? 400 : 500 }}>
          {activeStudentId ? 'Click a cell to place · Click a filled cell to remove' : '↑ Select a student first'}
        </span>
      </div>

      {/* Grid */}
      <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: 8 }}>
        <table style={{ borderCollapse: 'collapse', minWidth: 900, width: '100%', tableLayout: 'fixed' }}>
          <colgroup>
            <col style={{ width: 150 }} />
            {SLOTS.map(s => <col key={`c-${s}`} style={{ width: 96 }} />)}
            {SLOTS.map(s => <col key={`o-${s}`} style={{ width: 96 }} />)}
          </colgroup>
          <thead>
            <tr>
              <th style={{ ...thBase, background: '#f8fafc', borderRight: '2px solid #cbd5e1', position: 'sticky', left: 0, zIndex: 2 }} />
              <th colSpan={6} style={{ ...thBase, background: '#eff6ff', color: '#3b82f6', textAlign: 'center', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', borderRight: '2px solid #3b82f6' }}>
                Closed
              </th>
              <th colSpan={6} style={{ ...thBase, background: '#f0fdf4', color: '#16a34a', textAlign: 'center', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Open
              </th>
            </tr>
            <tr>
              <th style={{ ...thSlot, textAlign: 'left', paddingLeft: 12, background: '#f8fafc', borderRight: '2px solid #cbd5e1', position: 'sticky', left: 0, zIndex: 2 }}>Dance</th>
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
                  padding: '7px 12px', fontWeight: 600, fontSize: '0.82rem',
                  background: idx % 2 === 0 ? '#f8fafc' : '#fff',
                  borderRight: '2px solid #cbd5e1', whiteSpace: 'nowrap',
                  position: 'sticky', left: 0, zIndex: 1,
                }}>
                  {dance.name}
                </td>
                {(['closed', 'open'] as const).map(cat => {
                  const available = availableSlots(dance.id, cat)
                  return SLOTS.map(slot => {
                    const entry = getEntry(dance.id, cat, slot)
                    const isLast = slot === 6 && cat === 'closed'
                    const isUnavailable = slot > available
                    const canPlace = !entry && !isUnavailable && activeStudentId !== null
                    const canRemove = entry && !entry.isPublished

                    return (
                      <td
                        key={`${cat}-${slot}`}
                        onClick={() => !isUnavailable && handleCellClick(dance.id, cat, slot)}
                        title={
                          isUnavailable ? `No heat ${slot} for this dance` :
                          entry ? (entry.isPublished ? 'Already published' : 'Click to remove') :
                          activeStudentId ? 'Click to place' : 'Select a student first'
                        }
                        style={{
                          padding: '4px 4px', textAlign: 'center', verticalAlign: 'middle', height: 36,
                          background: isUnavailable
                            ? '#c8cdd5'
                            : cat === 'closed' ? (idx % 2 === 0 ? '#eff6ff' : '#f5f9ff') : (idx % 2 === 0 ? '#f0fdf4' : '#f5fdf7'),
                          borderRight: isLast ? '2px solid #3b82f6' : `1px solid ${cat === 'closed' ? '#dbeafe' : '#dcfce7'}`,
                          cursor: (canPlace || canRemove) ? 'pointer' : 'default',
                          transition: 'filter 0.1s',
                        }}
                        onMouseEnter={e => { if (canPlace || canRemove) (e.currentTarget as HTMLElement).style.filter = 'brightness(0.93)' }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.filter = '' }}
                      >
                        {isUnavailable ? (
                          <span style={{ color: '#6b7280', fontSize: '0.7rem', userSelect: 'none' }}>—</span>
                        ) : entry ? (
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 3,
                            background: entry.isPublished ? '#f1f5f9' : (cat === 'closed' ? '#dbeafe' : '#dcfce7'),
                            color: entry.isPublished ? '#94a3b8' : (cat === 'closed' ? '#1e40af' : '#15803d'),
                            borderRadius: 4, padding: '2px 6px',
                            fontSize: '0.72rem', fontWeight: 600, whiteSpace: 'nowrap',
                          }}>
                            {entry.isPublished && <span style={{ fontSize: '0.6rem' }}>✓</span>}
                            {studentLabel(entry.studentId, true)}
                          </span>
                        ) : (
                          <span style={{
                            color: canPlace ? (cat === 'closed' ? '#93c5fd' : '#86efac') : '#e2e8f0',
                            fontSize: '1.1rem', lineHeight: 1, userSelect: 'none',
                          }}>+</span>
                        )}
                      </td>
                    )
                  })
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Competitive Events section ── */}
      {events.length > 0 && (
        <div style={{ marginTop: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>Competitive Events</h2>
            <span style={{ fontSize: '0.76rem', color: '#64748b' }}>
              Assign students to events — publish creates the entry and adds them to all component heats.
            </span>
          </div>

          <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden' }}>
            <table style={{ borderCollapse: 'collapse', width: '100%' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #cbd5e1' }}>
                  <th style={{ ...thSlot, textAlign: 'left', paddingLeft: 14, width: 220 }}>Event</th>
                  <th style={{ ...thSlot, textAlign: 'left', paddingLeft: 10 }}>Students</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const palMap = buildEventPaletteMap(events)
                  let amateurSectionShown = false
                  return events.map((evt, idx) => {
                  const pal = evt.isAmateur ? AMATEUR_PALETTE : palMap.get(eventGroupKey(evt.name))!
                  const evtEntries = localEventEntries.filter(e => e.instructorId === activeInstructorId && e.eventId === evt.id)
                  const assignedIds = new Set(evtEntries.map(e => e.studentId))
                  const isPickerOpen = openEventPicker === evt.id
                  const filtered = students.filter(s =>
                    !assignedIds.has(s.id) &&
                    `${s.firstName} ${s.lastName}`.toLowerCase().includes(eventStudentSearch.toLowerCase())
                  )
                  const showAmateurDivider = evt.isAmateur && !amateurSectionShown
                  if (showAmateurDivider) amateurSectionShown = true

                  return (
                    <>
                      {showAmateurDivider && (
                        <tr key={`divider-${evt.id}`}>
                          <td colSpan={2} style={{ padding: '6px 14px', background: '#f1f5f9', borderTop: '2px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' }}>
                            <span style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#94a3b8' }}>Amateur</span>
                          </td>
                        </tr>
                      )}
                    <tr key={evt.id} style={{ borderBottom: idx < events.length - 1 ? '1px solid #e2e8f0' : undefined, background: pal.bg }}>
                      <td style={{ padding: '10px 14px', fontWeight: 600, fontSize: '0.82rem', whiteSpace: 'nowrap', borderRight: `2px solid ${pal.border}`, verticalAlign: 'top', borderLeft: `4px solid ${pal.border}` }}>
                        {evt.name}
                        <div style={{ fontSize: '0.7rem', fontWeight: 400, color: '#94a3b8', marginTop: 2 }}>
                          {evt.heatCount} heat{evt.heatCount !== 1 ? 's' : ''}
                        </div>
                      </td>
                      <td style={{ padding: '8px 10px', verticalAlign: 'middle', background: '#fff' }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
                          {evtEntries.map(e => (
                            <span key={e.id} style={{
                              display: 'inline-flex', alignItems: 'center', gap: 4,
                              background: e.isPublished ? '#f1f5f9' : pal.chip,
                              color: e.isPublished ? '#94a3b8' : pal.chipText,
                              borderRadius: 4, padding: '3px 8px',
                              fontSize: '0.78rem', fontWeight: 600,
                            }}>
                              {e.isPublished && <span style={{ fontSize: '0.6rem' }}>✓</span>}
                              {studentLabel(e.studentId)}
                              {!e.isPublished && (
                                <button onClick={() => handleRemoveEventEntry(e.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'inherit', opacity: 0.5, fontSize: '0.8rem', lineHeight: 1 }}>×</button>
                              )}
                            </span>
                          ))}

                          {isPickerOpen ? (
                            <div style={{ position: 'relative' }}>
                              <input
                                autoFocus
                                placeholder="Search student…"
                                value={eventStudentSearch}
                                onChange={e => setEventStudentSearch(e.target.value)}
                                onBlur={() => setTimeout(() => { setOpenEventPicker(null); setEventStudentSearch('') }, 150)}
                                style={{ padding: '4px 8px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: '0.8rem', width: 160 }}
                              />
                              {(
                                <div style={{
                                  position: 'absolute', top: '100%', left: 0, zIndex: 50,
                                  background: '#fff', border: '1px solid #e2e8f0', borderRadius: 6,
                                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                  maxHeight: 180, overflowY: 'auto', minWidth: 180,
                                }}>
                                  {filtered.length === 0
                                    ? <div style={{ padding: '8px 12px', fontSize: '0.8rem', color: '#94a3b8' }}>No students found</div>
                                    : filtered.slice(0, 20).map(s => (
                                      <button key={s.id} onMouseDown={() => handleAddEventEntry(s.id, evt.id)} style={{
                                        display: 'block', width: '100%', textAlign: 'left',
                                        padding: '6px 12px', border: 'none', background: 'transparent',
                                        cursor: 'pointer', fontSize: '0.8rem', color: '#0f172a',
                                      }}>
                                        {s.firstName} {s.lastName}
                                      </button>
                                    ))
                                  }
                                </div>
                              )}
                            </div>
                          ) : (
                            <button
                              onClick={() => { setOpenEventPicker(evt.id); setEventStudentSearch('') }}
                              style={{
                                background: 'none', border: '1px dashed #cbd5e1', borderRadius: 4,
                                color: '#94a3b8', cursor: 'pointer', fontSize: '0.75rem', padding: '3px 10px',
                              }}
                            >
                              + Add
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                    </>
                  )
                })
                })()}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

const thBase: React.CSSProperties = { padding: '7px 4px', borderBottom: 'none' }

const thSlot: React.CSSProperties = {
  padding: '5px 4px', fontSize: '0.68rem', fontWeight: 600,
  textAlign: 'center', color: '#64748b',
  borderBottom: '2px solid #cbd5e1',
  fontVariantNumeric: 'tabular-nums', letterSpacing: '0.04em',
}
