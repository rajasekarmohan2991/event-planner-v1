import { Metadata, Viewport } from 'next'
import nextDynamic from 'next/dynamic'

const ForgotPasswordClient = nextDynamic(() => import('@/components/auth/ForgotPasswordClient'), { ssr: false })

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Forgot Password | Event Planner',
  description: 'Reset your password',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  alternates: { canonical: '/auth/forgot-password' },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function ForgotPasswordPage() {
  return <ForgotPasswordClient />
}
