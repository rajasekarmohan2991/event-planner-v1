"use client"

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useRef } from 'react'
import { getDashboardRoute } from '@/lib/roles-config'
import { UserRole } from '@/lib/roles-config'

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

    // Wait for session to load, but with a hard timeout
    if (status === 'loading') {
      const timeout = setTimeout(() => {
        if (!hasRedirected.current) {
          console.warn('Session timeout - redirecting to login')
          hasRedirected.current = true
          router.replace('/auth/login')
        }
      }, 3000) // Reduced to 3 seconds

      return () => clearTimeout(timeout)
    }

    // Redirect authenticated users to their dashboard
    if (status === 'authenticated' && session) {
      const userRole = (session as any)?.user?.role as UserRole
      const dashboardRoute = userRole ? getDashboardRoute(userRole) : '/dashboard/user'

      hasRedirected.current = true
      router.replace(dashboardRoute)
    }
  }, [session, status, router])

  // Show minimal loading state
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-3"></div>
        <p className="text-sm text-gray-600">
          {status === 'loading' ? 'Loading...' : 'Redirecting...'}
        </p>
      </div>
    </div>
  )
}
