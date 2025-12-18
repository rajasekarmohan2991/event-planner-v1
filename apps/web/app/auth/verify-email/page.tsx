import { redirect } from 'next/navigation'
import VerifyEmailClient from './VerifyEmailClient'
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

import { verifyEmailToken } from '@/lib/email-verification'

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
    const result = await verifyEmailToken(token, email, name)

    if (!result.success) {
      // Special handling: if verifying an already-verified user, treat it as success
      if (result.message === 'Already verified') {
        return redirect('/auth/login?verified=1')
      }

      return (
        <VerifyEmailClient
          status="error"
          message={result.error || 'Verification failed. Please request a new link.'}
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
