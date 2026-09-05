import type { ReactNode } from 'react'
import './globals.css'

export const metadata = {
  title: 'Digital Poster Gallery',
  description: 'A curated, mobile-first extension of the physical exhibition.',
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="robots" content="noindex,nofollow,noarchive" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@400;700&family=Source+Sans+3:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <main className="min-h-screen">{children}</main>
      </body>
    </html>
  )
}
