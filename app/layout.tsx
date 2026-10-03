import type { Metadata } from 'next'
import './globals.css'
import MovedNotice from '@/components/MovedNotice'

export const metadata: Metadata = {
  title: 'Team Spirit Showcase',
  description: 'Dance showcase management system',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full antialiased" style={{ backgroundColor: 'var(--surface)', color: 'var(--text)' }}>
        <MovedNotice />
        {children}
      </body>
    </html>
  )
}
