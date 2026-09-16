'use client'

import { useState } from 'react'
import HeatRebalancer from './HeatRebalancer'

type Props = {
  children: React.ReactNode
  rebalancerHeats: React.ComponentProps<typeof HeatRebalancer>['heats']
  rebalancerStudios: React.ComponentProps<typeof HeatRebalancer>['studios']
  rebalancerEvents: React.ComponentProps<typeof HeatRebalancer>['events']
  heatCount: number
  entryCount: number
}

export default function MasterViewClient({ children, rebalancerHeats, rebalancerStudios, rebalancerEvents, heatCount, entryCount }: Props) {
  const [mode, setMode] = useState<'sheet' | 'rebalance'>('rebalance')

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Master Heat Sheet</h1>
          <p className="text-sm text-gray-500">All studios · {heatCount} heats · {entryCount} total entries</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setMode('sheet')}
            className="text-sm px-4 py-1.5 font-medium"
            style={{
              borderRadius: 6,
              border: '1px solid var(--border)',
              background: mode === 'sheet' ? 'var(--ink)' : 'var(--card)',
              color: mode === 'sheet' ? 'var(--page)' : 'var(--muted)',
            }}
          >
            Heat Sheet
          </button>
          <button
            onClick={() => setMode('rebalance')}
            className="text-sm px-4 py-1.5 font-medium"
            style={{
              borderRadius: 6,
              border: '1px solid var(--border)',
              background: mode === 'rebalance' ? 'var(--ink)' : 'var(--card)',
              color: mode === 'rebalance' ? 'var(--page)' : 'var(--muted)',
            }}
          >
            Rebalance
          </button>
        </div>
      </div>

      {mode === 'sheet' ? (
        children
      ) : (
        <div>
          <p className="text-xs mb-3" style={{ color: 'var(--muted)' }}>
            Drag students between heats to rebalance. Colored chips with ↓↑ arrows are in back-to-back heats — avoid moving those.
          </p>
          <HeatRebalancer heats={rebalancerHeats} studios={rebalancerStudios} events={rebalancerEvents} />
        </div>
      )}
    </div>
  )
}
