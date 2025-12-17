import { Metadata, Viewport } from 'next'
import LoginClient from '@/components/auth/LoginClient'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Login | Ayphen',
  description: 'Sign in to your account',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  alternates: { canonical: '/auth/login' },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function LoginPage() {
  return <LoginClient />
}
