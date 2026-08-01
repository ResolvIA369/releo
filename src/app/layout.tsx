import type { Metadata, Viewport } from 'next'
import { ErrorBoundary } from '@/shared/components/ErrorBoundary'
import { BrowserCheck } from '@/shared/components/BrowserCheck'
import { AppProvider } from '@/shared/components/AppProvider'
import { PWARegister } from '@/shared/components/PWARegister'
import { WakeLock } from '@/shared/components/WakeLock'
import './globals.css'

export const metadata: Metadata = {
  // Sin esto, Next resuelve las imágenes de OG contra http://localhost:3000
  // y el preview del link se rompe al compartir la app por WhatsApp.
  metadataBase: new URL('https://releo.resolvia.online'),
  title: 'REleo — Lee y Diviértete',
  description: 'Aplicación educativa basada en el método Doman para enseñar a leer a niños pequeños. Con Leo el león y la Seño Sofía.',
  manifest: '/manifest.webmanifest',
  openGraph: {
    title: 'REleo — Lee y Diviértete',
    description: 'Aprende a leer jugando con Leo el león y la Seño Sofía. Método Doman para niños.',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'REleo - Lee y Diviértete' }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'REleo — Lee y Diviértete',
    description: 'Aprende a leer jugando con Leo el león y la Seño Sofía. Método Doman para niños.',
    images: ['/og-image.png'],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'REleo',
  },
}

export const viewport: Viewport = {
  themeColor: '#6366f1',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        {/* El preload de Leo y Sofía vive en (main)/layout.tsx: solo hace falta
            dentro de la app, no en la landing pública. */}
      </head>
      <body>
        <ErrorBoundary>
          <BrowserCheck>
            <AppProvider>
              {children}
              <PWARegister />
              <WakeLock />
            </AppProvider>
          </BrowserCheck>
        </ErrorBoundary>
      </body>
    </html>
  )
}
