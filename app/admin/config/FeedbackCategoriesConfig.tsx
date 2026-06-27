'use client'

import { addFeedbackCategory, deleteFeedbackCategory } from '@/app/actions/admin'
import { useState, useTransition } from 'react'

type CategoryRow = { id: number; name: string; order: number }

export default function FeedbackCategoriesConfig({ categories }: { categories: CategoryRow[] }) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleAdd(formData: FormData) {
    startTransition(async () => {
      const result = await addFeedbackCategory(formData)
      if (result?.error) setError(result.error)
    })
  }

  function handleDelete(id: number, name: string) {
    if (!confirm(`Remove category "${name}"? Existing thumbs for this category will be deleted.`)) return
    startTransition(async () => { await deleteFeedbackCategory(id) })
  }

  return (
    <div className="space-y-4">
      <p className="text-xs" style={{ color: 'var(--muted)' }}>
        These categories appear as thumbs up/down options for judges scoring open heats.
      </p>

      {error && (
        <div className="text-sm px-3 py-2 flex justify-between" style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: 4, color: '#dc2626' }}>
          {error}
          <button onClick={() => setError(null)} className="font-bold">×</button>
        </div>
      )}

      <div className="card overflow-hidden">
        {categories.map((cat, i) => (
          <div key={cat.id} className="flex items-center gap-3 px-4 py-2.5" style={{ borderTop: i > 0 ? '1px solid var(--border)' : undefined }}>
            <span className="text-sm flex-1 font-medium">{cat.name}</span>
            <button onClick={() => handleDelete(cat.id, cat.name)} disabled={pending} className="text-xs" style={{ color: '#dc2626' }}>Remove</button>
          </div>
        ))}
        {categories.length === 0 && (
          <p className="px-4 py-3 text-sm italic" style={{ color: 'var(--muted)' }}>No categories</p>
        )}

        <div className="px-5 py-4" style={{ borderTop: categories.length > 0 ? '1px solid var(--border)' : undefined, backgroundColor: '#fafafa' }}>
          <div className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--muted)' }}>Add Category</div>
          <form action={handleAdd} className="flex gap-2">
            <input name="name" placeholder="e.g. Timing" required className="field flex-1" />
            <button type="submit" disabled={pending} className="text-sm px-4 py-1.5 font-medium text-white" style={{ backgroundColor: '#333', borderRadius: 4 }}>
              Add
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
