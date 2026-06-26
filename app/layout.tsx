import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Showcase 2026',
  description: 'Dance showcase management system',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full antialiased" style={{ backgroundColor: 'var(--surface)', color: 'var(--text)' }}>
        {children}
      </body>
    </html>
  )
}
