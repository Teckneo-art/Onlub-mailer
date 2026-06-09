import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ONLUB Mailer',
  description: 'Outil de campagne email ONLUB',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  )
}
