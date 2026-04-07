import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'EasyStock Dashboard',
  description: 'Panel de gestión EasyStock',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body style={{ margin: 0, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', background: '#f7f7f7', color: '#111' }}>
        {children}
      </body>
    </html>
  )
}