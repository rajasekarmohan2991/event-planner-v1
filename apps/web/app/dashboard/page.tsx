"use client"

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getDashboardRoute } from '@/lib/roles-config'
import { UserRole } from '@/lib/roles-config'

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [redirecting, setRedirecting] = useState(false)

  useEffect(() => {
    // Prevent multiple redirects
    if (redirecting) return

    // Add timeout protection - if we're stuck loading for more than 5 seconds, force redirect to login
    const timeout = setTimeout(() => {
      if (status === 'loading') {
        console.warn('Session loading timeout - redirecting to login')
        setRedirecting(true)
        router.push('/auth/login')
      }
    }, 5000)

    if (status === 'loading') return () => clearTimeout(timeout)

    if (!session) {
      setRedirecting(true)
      router.push('/auth/login')
      clearTimeout(timeout)
      return
    }

    const userRole = (session as any)?.user?.role as UserRole
    if (userRole) {
      const dashboardRoute = getDashboardRoute(userRole)
      setRedirecting(true)
      router.push(dashboardRoute)
    } else {
      // Default fallback for users without defined roles
      setRedirecting(true)
      router.push('/dashboard/user')
    }

    clearTimeout(timeout)
  }, [session, status, router, redirecting])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting to your dashboard...</p>
      </div>
    </div>
  )
}
