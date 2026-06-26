'use client'

import { addProShow, deleteProShow, addStudentShow, deleteStudentShow } from '@/app/actions/studio'
import { useState, useTransition } from 'react'

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
  instructors: string
  dances: string
  songTitle: string | null
  artist: string | null
  musicLink: string | null
  notes: string | null
}

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

export default function ShowsManager({
  slug,
  students,
  instructors,
  proShows,
  studentShows,
}: {
  slug: string
  students: { id: number; name: string }[]
  instructors: { id: number; name: string }[]
  proShows: ProShowEntry[]
  studentShows: StudentShowEntry[]
}) {
  const [pending, startTransition] = useTransition()
  const [tab, setTab] = useState<'pro' | 'student'>('pro')

  function handleDeletePro(id: number) {
    if (!confirm('Remove this Pro Show entry?')) return
    startTransition(() => deleteProShow(slug, id))
  }

  function handleDeleteStudent(id: number) {
    if (!confirm('Remove this Student Show entry?')) return
    startTransition(() => deleteStudentShow(slug, id))
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
                      🎵 Music link
                    </a>
                  )}
                  {entry.notes && <div className="text-xs text-gray-400 mt-1">{entry.notes}</div>}
                </div>
                <button
                  onClick={() => handleDeletePro(entry.id)}
                  disabled={pending}
                  className="text-xs text-red-500 hover:text-red-700"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}

          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="font-semibold text-sm mb-3">Add Pro Show Entry</h3>
            <form action={addProShow.bind(null, slug)} className="space-y-3">
              <Field label="Partnership / Group" name="partnership" placeholder="e.g. Jordan Becker & Jane Doe" required />
              <Field label="Dance(s)" name="dances" placeholder="e.g. Waltz, Tango" required />
              <Field label="Song Title" name="songTitle" placeholder="Optional" />
              <Field label="Artist" name="artist" placeholder="Optional" />
              <Field label="Music Link (Google Drive / Dropbox)" name="musicLink" placeholder="Optional" />
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Notes / Costume / Special Requests</label>
                <textarea
                  name="notes"
                  rows={2}
                  className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>
              <button
                type="submit"
                disabled={pending}
                className="bg-black text-white text-sm px-4 py-2 rounded-lg hover:bg-gray-800 disabled:opacity-50"
              >
                Add Entry
              </button>
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
                <div>
                  <div className="font-semibold">{entry.students.join(', ')}</div>
                  <div className="text-sm text-gray-600">Instructors: {entry.instructors}</div>
                  <div className="text-sm text-gray-600">{entry.dances}</div>
                  {entry.songTitle && <div className="text-sm text-gray-500">"{entry.songTitle}" — {entry.artist}</div>}
                  {entry.musicLink && (
                    <a href={entry.musicLink} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline">
                      🎵 Music link
                    </a>
                  )}
                  {entry.notes && <div className="text-xs text-gray-400 mt-1">{entry.notes}</div>}
                </div>
                <button
                  onClick={() => handleDeleteStudent(entry.id)}
                  disabled={pending}
                  className="text-xs text-red-500 hover:text-red-700"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}

          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="font-semibold text-sm mb-3">Add Student Show Entry</h3>
            <form action={addStudentShow.bind(null, slug)} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Student(s) *</label>
                <select
                  name="studentIds"
                  multiple
                  required
                  size={Math.min(students.length, 6)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                >
                  {students.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-400 mt-1">Hold Ctrl/Cmd to select multiple</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Instructor(s) *</label>
                <input
                  name="instructors"
                  required
                  placeholder={instructors.map(i => i.name).join(', ')}
                  defaultValue={instructors.map(i => i.name).join(', ')}
                  className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>
              <Field label="Dance(s)" name="dances" placeholder="e.g. Medley" required />
              <Field label="Song Title" name="songTitle" placeholder="Optional" />
              <Field label="Artist" name="artist" placeholder="Optional" />
              <Field label="Music Link (Google Drive / Dropbox)" name="musicLink" placeholder="Optional" />
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Notes / Costume / Special Requests</label>
                <textarea
                  name="notes"
                  rows={2}
                  className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>
              <button
                type="submit"
                disabled={pending}
                className="bg-black text-white text-sm px-4 py-2 rounded-lg hover:bg-gray-800 disabled:opacity-50"
              >
                Add Entry
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
