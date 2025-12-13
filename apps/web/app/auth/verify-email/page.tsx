import { redirect } from 'next/navigation'
import VerifyEmailClient from './VerifyEmailClient'
import { headers } from 'next/headers'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { XCircle } from 'lucide-react'

export const dynamic = 'force-dynamic'

interface VerifyEmailPageProps {
  searchParams: {
    token?: string
    email?: string
    name?: string
  }
}

// Note: Metadata moved to layout.tsx since this is now a client component

export default async function VerifyEmailPage({ searchParams }: VerifyEmailPageProps) {
  const { token, email, name } = searchParams

  if (!token || !email) {
    return (
      <VerifyEmailClient 
        status="error" 
        message="Missing verification parameters. Please open the link from your email or request a new one." 
      />
    )
  }
  try {
    const h = headers()
    const host = h.get('x-forwarded-host') || h.get('host') || ''
    const proto = h.get('x-forwarded-proto') || 'https'
    const envBase = (process.env.NEXTAUTH_URL || '').replace(/\/$/, '')
    const baseUrl = envBase || (host ? `${proto}://${host}` : '')
    const apiUrl = `${baseUrl}/api/auth/verify`
    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ token, email, name }),
      cache: 'no-store',
    })

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      return (
        <VerifyEmailClient 
          status="error" 
          message={data?.error || 'Verification failed. Please request a new link.'} 
        />
      )
    }

    // Success
    return redirect('/auth/login?verified=1')
  } catch (error) {
    console.error('Email verification error:', error)
    return (
      <div className="container flex h-screen w-screen flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="mx-auto flex w-full max-w-md flex-col space-y-6 text-center p-8 bg-white rounded-lg shadow-sm border">
          <div className="w-16 h-16 mx-auto rounded-full bg-red-100 flex items-center justify-center">
            <XCircle className="h-10 w-10 text-red-500" />
          </div>
          
          <div className="space-y-4">
            <h1 className="text-2xl font-bold text-gray-900">Verification Failed</h1>
            <p className="text-gray-600">
              An error occurred while verifying your email. Please try again later.
            </p>
            
            <div className="pt-4">
              <Button asChild>
                <Link href="/auth/login">
                  Back to Login
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }
}
