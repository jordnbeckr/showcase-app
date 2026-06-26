'use client'

export default function PrintStudentButton({ sheetId }: { sheetId: string }) {
  function handlePrint() {
    const section = document.getElementById(sheetId)
    if (!section) return
    section.classList.add('printing-target')
    window.print()
    section.classList.remove('printing-target')
  }

  return (
    <button
      onClick={handlePrint}
      className="no-print text-xs px-3 py-1 font-medium text-white"
      style={{ backgroundColor: '#555', borderRadius: 4 }}
    >
      Print
    </button>
  )
}
