import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'EasyStock Dashboard',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif', background: '#f5f5f5', color: '#111' }}>
        {children}
      </body>
    </html>
  )
}