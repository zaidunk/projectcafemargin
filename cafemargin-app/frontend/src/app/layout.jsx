import './globals.css'
import Providers from './providers'

export const metadata = {
  title: 'CafeMargin',
  description: 'Strategic Data Analytics Platform for Cafes',
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
