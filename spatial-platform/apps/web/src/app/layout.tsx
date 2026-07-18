import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Spatial Platform',
  description: 'Build, explore, and share 3D worlds',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
