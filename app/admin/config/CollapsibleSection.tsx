'use client'

import { useState } from 'react'

export default function CollapsibleSection({
  title,
  defaultOpen = false,
  children,
}: {
  title: string
  defaultOpen?: boolean
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="card overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
        style={{ borderBottom: open ? '1px solid var(--border)' : undefined }}
      >
        <span className="font-semibold text-sm">{title}</span>
        <span className="text-xs" style={{ color: 'var(--muted)' }}>{open ? '▾' : '›'}</span>
      </button>
      {open && <div className="p-4">{children}</div>}
    </div>
  )
}
