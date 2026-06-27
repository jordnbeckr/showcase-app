'use client'

import { addProShow, deleteProShow, addStudentShow, deleteStudentShow } from '@/app/actions/studio'
import { useState, useTransition, useRef, useEffect } from 'react'

type ProShowEntry = {
  id: number
  partnership: string
  dances: string
  songTitle: string | null
  artist: string | null
  musicLink: string | null
  notes: string | null
}

type StudentShowEntry = {
  id: number
  students: string[]
  instructors: string[]
  dances: string
  songTitle: string | null
  artist: string | null
  musicLink: string | null
  notes: string | null
}

type Person = { id: number; name: string }

function Field({ label, name, placeholder, required }: { label: string; name: string; placeholder?: string; required?: boolean }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}{required && ' *'}</label>
      <input
        name={name}
        placeholder={placeholder}
        required={required}
        className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
      />
    </div>
  )
}

function TagPicker({
  label,
  fieldName,
  options,
  required,
}: {
  label: string
  fieldName: string
  options: Person[]
  required?: boolean
}) {
  const [selected, setSelected] = useState<Person[]>([])
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const available = options.filter(
    o => !selected.some(s => s.id === o.id) &&
      (query === '' || o.name.toLowerCase().includes(query.toLowerCase()))
  )

  function add(person: Person) {
    setSelected(prev => [...prev, person])
    setQuery('')
  }

  function remove(id: number) {
    setSelected(prev => prev.filter(p => p.id !== id))
  }

  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}{required && ' *'}</label>

      {/* Hidden inputs carry selected IDs to the form */}
      {selected.map(p => (
        <input key={p.id} type="hidden" name={fieldName} value={p.id} />
      ))}

      <div
        ref={ref}
        className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus-within:ring-2 focus-within:ring-black min-h-[36px] flex flex-wrap gap-1 items-center cursor-text"
        onClick={() => { setOpen(true); (ref.current?.querySelector('input') as HTMLElement)?.focus() }}
      >
        {selected.map(p => (
          <span
            key={p.id}
            className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full"
            style={{ backgroundColor: '#e8e8e8', border: '1px solid #ccc' }}
          >
            {p.name}
            <button
              type="button"
              onClick={e => { e.stopPropagation(); remove(p.id) }}
              style={{ color: '#888', fontWeight: 700, lineHeight: 1 }}
            >×</button>
          </span>
        ))}
        <input
          type="text"
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          placeholder={selected.length === 0 ? 'Type to search…' : ''}
          className="flex-1 min-w-[120px] outline-none bg-transparent text-sm"
          style={{ border: 'none', padding: '1px 2px' }}
        />
      </div>

      {open && available.length > 0 && (
        <div
          className="border border-gray-200 rounded-lg mt-1 shadow-sm overflow-hidden"
          style={{ maxHeight: 180, overflowY: 'auto' }}
        >
          {available.map(p => (
            <button
              key={p.id}
              type="button"
              onMouseDown={e => { e.preventDefault(); add(p) }}
              className="w-full text-left px-3 py-1.5 text-sm hover:bg-gray-50"
              style={{ borderBottom: '1px solid #f0f0f0' }}
            >
              {p.name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function ShowsManager({
  slug,
  students,
  instructors,
  proShows,
  studentShows,
}: {
  slug: string
  students: Person[]
  instructors: Person[]
  proShows: ProShowEntry[]
  studentShows: StudentShowEntry[]
}) {
  const [pending, startTransition] = useTransition()
  const [tab, setTab] = useState<'pro' | 'student'>('pro')
  const [formKey, setFormKey] = useState(0)

  function handleDeletePro(id: number) {
    if (!confirm('Remove this Pro Show entry?')) return
    startTransition(() => deleteProShow(slug, id))
  }

  function handleDeleteStudent(id: number) {
    if (!confirm('Remove this Student Show entry?')) return
    startTransition(() => deleteStudentShow(slug, id))
  }

  function handleAddStudent(formData: FormData) {
    startTransition(async () => {
      const result = await addStudentShow(slug, formData)
      if (!result?.error) setFormKey(k => k + 1)
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-2 border-b border-gray-200">
        {(['pro', 'student'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === t ? 'border-black text-black' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t === 'pro' ? 'Pro Show' : 'Student Show'}
          </button>
        ))}
      </div>

      {tab === 'pro' && (
        <div className="space-y-4">
          {proShows.length === 0 && <p className="text-sm text-gray-400 italic">No Pro Show entries yet</p>}
          {proShows.map(entry => (
            <div key={entry.id} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-semibold">{entry.partnership}</div>
                  <div className="text-sm text-gray-600">{entry.dances}</div>
                  {entry.songTitle && <div className="text-sm text-gray-500">"{entry.songTitle}" — {entry.artist}</div>}
                  {entry.musicLink && (
                    <a href={entry.musicLink} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline">
                      Music link
                    </a>
                  )}
                  {entry.notes && <div className="text-xs text-gray-400 mt-1">{entry.notes}</div>}
                </div>
                <button onClick={() => handleDeletePro(entry.id)} disabled={pending} className="text-xs text-red-500 hover:text-red-700">Remove</button>
              </div>
            </div>
          ))}

          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="font-semibold text-sm mb-3">Add Pro Show Entry</h3>
            <form action={addProShow.bind(null, slug)} className="space-y-3">
              <Field label="Partnership / Group" name="partnership" placeholder="e.g. Jordan Becker & Jane Doe" required />
              <Field label="Dance(s)" name="dances" placeholder="e.g. Waltz, Tango" required />
              <Field label="Song Title" name="songTitle" required />
              <Field label="Artist" name="artist" placeholder="Optional" />
              <Field label="Music Link (Google Drive / Dropbox)" name="musicLink" required />
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Notes / Costume / Special Requests</label>
                <textarea name="notes" rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-black" />
              </div>
              <button type="submit" disabled={pending} className="bg-black text-white text-sm px-4 py-2 rounded-lg hover:bg-gray-800 disabled:opacity-50">Add Entry</button>
            </form>
          </div>
        </div>
      )}

      {tab === 'student' && (
        <div className="space-y-4">
          {studentShows.length === 0 && <p className="text-sm text-gray-400 italic">No Student Show entries yet</p>}
          {studentShows.map(entry => (
            <div key={entry.id} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex justify-between items-start">
                <div className="space-y-0.5">
                  <div className="font-semibold">{entry.students.length > 0 ? entry.students.join(', ') : <span className="text-gray-400 italic">No students</span>}</div>
                  {entry.instructors.length > 0 && <div className="text-sm text-gray-600">with {entry.instructors.join(', ')}</div>}
                  <div className="text-sm text-gray-600">{entry.dances}</div>
                  {entry.songTitle && <div className="text-sm text-gray-500">"{entry.songTitle}" — {entry.artist}</div>}
                  {entry.musicLink && (
                    <a href={entry.musicLink} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline">Music link</a>
                  )}
                  {entry.notes && <div className="text-xs text-gray-400 mt-1">{entry.notes}</div>}
                </div>
                <button onClick={() => handleDeleteStudent(entry.id)} disabled={pending} className="text-xs text-red-500 hover:text-red-700">Remove</button>
              </div>
            </div>
          ))}

          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="font-semibold text-sm mb-3">Add Student Show Entry</h3>
            <form key={formKey} action={handleAddStudent} className="space-y-3">
              <TagPicker label="Student(s)" fieldName="studentIds" options={students} />
              <TagPicker label="Instructor(s)" fieldName="instructorIds" options={instructors} />
              <Field label="Dance(s)" name="dances" placeholder="e.g. Medley" required />
              <Field label="Song Title" name="songTitle" required />
              <Field label="Artist" name="artist" placeholder="Optional" />
              <Field label="Music Link (Google Drive / Dropbox)" name="musicLink" required />
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Notes / Costume / Special Requests</label>
                <textarea name="notes" rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-black" />
              </div>
              <button type="submit" disabled={pending} className="bg-black text-white text-sm px-4 py-2 rounded-lg hover:bg-gray-800 disabled:opacity-50">Add Entry</button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
