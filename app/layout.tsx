import type { Metadata, Viewport } from 'next'
import './globals.css'
import AuthWrapper from './components/AuthWrapper'
import ServiceWorkerRegistration from './components/ServiceWorkerRegistration'

export const metadata: Metadata = {
  title: 'STV Neuenhof – Geräteturnen',
  description: 'Wettkampf-Bewertung für den Turnverein STV Neuenhof',
  manifest: '/manifest.json',
  applicationName: 'STV Neuenhof',
  icons: {
    icon: [
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180' }],
  },
  // iOS liest das Manifest nicht — ohne diese Angaben öffnet der
  // Homescreen-Eintrag die Seite in Safari statt als eigenständige App.
  appleWebApp: {
    capable: true,
    title: 'STV Neuenhof',
    statusBarStyle: 'default',
  },
  formatDetection: { telephone: false },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#f29411',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="de">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-screen bg-slate-100">
        <ServiceWorkerRegistration />
        <AuthWrapper>
          <div className="max-w-lg mx-auto min-h-screen">
            {children}
          </div>
        </AuthWrapper>
      </body>
    </html>
  )
}
