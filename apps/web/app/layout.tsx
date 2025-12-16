import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import AppProviders from '@/components/AppProviders'
import { ThemeProvider } from '@/components/theme-provider'
import { ToastProvider } from '@/contexts/toast-context'
import { Toaster } from '@/components/ui/toaster'
import AppFrame from '@/components/layout/AppFrame'
import { cn } from '@/lib/utils'

// Font configuration
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
  weight: ['400', '500', '600', '700']
})

// Metadata configuration
export const metadata: Metadata = {
  title: 'Ayphen',
  description: 'Plan and manage your events with ease',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  openGraph: {
    title: 'Ayphen',
    description: 'Plan and manage your events with ease',
    type: 'website',
    locale: 'en_US',
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png' },
    ],
    other: [
      {
        rel: 'manifest',
        url: '/site.webmanifest',
      },
    ],
  },
}

// Viewport configuration
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#ffffff',
  colorScheme: 'light',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className={cn(
        inter.variable,
        'min-h-screen bg-background text-foreground font-sans antialiased'
      )}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <AppProviders>
            <ToastProvider>
              <AppFrame>{children}</AppFrame>
              <Toaster />
            </ToastProvider>
          </AppProviders>
        </ThemeProvider>
      </body>
    </html>
  )
}
