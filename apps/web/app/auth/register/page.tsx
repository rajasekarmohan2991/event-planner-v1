import { Metadata, Viewport } from 'next'
import nextDynamic from 'next/dynamic'

const RegisterClient = nextDynamic(() => import('@/components/auth/RegisterClient'), { ssr: false })

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Register | Event Planner',
  description: 'Create a new account to start planning your events',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  alternates: { canonical: '/auth/register' },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RegisterPage() {
  return <RegisterClient />
}
