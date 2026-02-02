"use client"

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useRef } from 'react'
import { getDashboardRoute } from '@/lib/roles-config'
import { UserRole } from '@/lib/roles-config'
import { LoadingScreen } from '@/components/ui/LoadingScreen'

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const hasRedirected = useRef(false)

  useEffect(() => {
    // Prevent multiple redirects
    if (hasRedirected.current) return

    // Immediate redirect if not authenticated
    if (status === 'unauthenticated') {
      hasRedirected.current = true
      router.replace('/auth/login')
      return
    }


    // Redirect authenticated users to their dashboard
    if (status === 'authenticated' && session) {
      const userRole = (session as any)?.user?.role as UserRole
      const dashboardRoute = userRole ? getDashboardRoute(userRole) : '/dashboard/user'

      hasRedirected.current = true
      router.replace(dashboardRoute)
    }
    // If status is 'loading', we just wait. The user sees the premium loader.
  }, [session, status, router])

  return (
    <LoadingScreen
      message={status === 'loading' ? 'Initializing Dashboard...' : 'Redirecting...'}
    />
  )
}
