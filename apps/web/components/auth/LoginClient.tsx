'use client'

import { AuthLayout } from '@/components/auth/AuthLayout'
import { LoginForm } from '@/components/auth/LoginForm'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { getDashboardRoute, UserRole } from '@/lib/roles-config'

export default function LoginClient() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      // Direct redirect to role-specific dashboard to avoid middleware double-redirect
      const role = (session.user as any).role as UserRole
      const target = role ? getDashboardRoute(role) : '/dashboard'
      router.replace(target)
    }
  }, [status, session, router])

  // Show loading state while checking session
  if (status === 'loading') {
    return (
      <AuthLayout
        lottieSrc="/animations/signin.json"
        animationPlacement="left"
        disableBackgroundAnimations
        title="Welcome"
        subtitle="Loading..."
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
      subtitle="Sign in to your account to continue"
    >
      <div className="w-full">
        <LoginForm />
      </div>
    </AuthLayout>
  )
}
