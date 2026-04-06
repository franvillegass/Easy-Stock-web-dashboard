import type { Metadata } from 'next'
import { Syne, DM_Mono } from 'next/font/google'

const syne = Syne({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['400', '500', '600', '700', '800']
})

const dmMono = DM_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  weight: ['300', '400', '500']
})

export const metadata: Metadata = {
  title: 'EasyStock Dashboard',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${syne.variable} ${dmMono.variable}`}>
      <body style={{ margin: 0, fontFamily: 'var(--font-display)', background: '#080a0e', color: '#e8eaf0', overflowX: 'hidden', lineHeight: 1.6 }}>
        {children}
      </body>
    </html>
  )
}