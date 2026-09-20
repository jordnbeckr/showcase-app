'use client'

export default function JudgeError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="p-6 max-w-lg mx-auto mt-8 card space-y-3">
      <h2 className="font-bold text-sm text-red-700">Something went wrong loading the score sheet</h2>
      <pre className="text-xs overflow-auto p-3 rounded" style={{ backgroundColor: '#fef2f2', color: '#991b1b' }}>
        {error.message}
        {'\n\n'}
        {error.stack}
      </pre>
      <button
        onClick={reset}
        className="text-sm px-3 py-1.5 rounded font-medium text-white"
        style={{ backgroundColor: '#1e3a5f' }}
      >
        Try again
      </button>
    </div>
  )
}
