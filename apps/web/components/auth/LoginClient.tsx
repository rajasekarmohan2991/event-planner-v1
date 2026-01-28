'use client'

import { AuthLayout } from '@/components/auth/AuthLayout'
import { LoginForm } from '@/components/auth/LoginForm'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getDashboardRoute, UserRole } from '@/lib/roles-config'

export default function LoginClient() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isRedirecting, setIsRedirecting] = useState(false)

  useEffect(() => {
    console.log('[LoginClient] Session status:', status)
    console.log('[LoginClient] Session data:', session)

    if (status === 'authenticated' && session?.user && !isRedirecting) {
      console.log('[LoginClient] User authenticated, redirecting...')
      setIsRedirecting(true)

      // Direct redirect to role-specific dashboard
      const role = (session.user as any).role as UserRole
      const target = role ? getDashboardRoute(role) : '/dashboard'

      console.log('[LoginClient] Redirecting to:', target)

      // Use window.location for a hard redirect to ensure session is loaded
      window.location.href = target
    }
  }, [status, session, isRedirecting])

  // Show loading state while checking session or redirecting
  if (status === 'loading' || isRedirecting) {
    return (
      <AuthLayout
        lottieSrc="/animations/signin.json"
        animationPlacement="left"
        disableBackgroundAnimations
        title="Welcome"
        subtitle={isRedirecting ? "Redirecting..." : "Loading..."}
      >
        <div className="w-full flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      lottieSrc="/animations/signin.json"
      animationPlacement="left"
      disableBackgroundAnimations
      title="Welcome"
      hideIcon={true}
      subtitle={
        <span className="block mt-2 font-light">
          <span className="block font-medium text-gray-800 mb-1">Ticketing & Check-in made simple.</span>
          Create beautiful events, sell tickets, track RSVPs, and manage check-ins in one modern dashboard.
        </span>
      }
    >
      <div className="w-full">
        <LoginForm />
      </div>
    </AuthLayout>
  )
}
