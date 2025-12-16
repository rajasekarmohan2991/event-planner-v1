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
