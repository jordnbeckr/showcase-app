'use client'

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="text-sm px-4 py-2 font-medium text-white no-print"
      style={{ backgroundColor: '#333', borderRadius: 4 }}
    >
      Print All Sheets
    </button>
  )
}
