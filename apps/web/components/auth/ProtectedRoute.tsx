'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'

export function ProtectedRoute({ 
  children, 
  requiredRole = 'ADMIN' 
}: { 
  children: React.ReactNode
  requiredRole?: 'ADMIN' | 'USER'
}) {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'unauthenticated') {
      const pathname = typeof window !== 'undefined' ? window.location.pathname : '/'
      router.push(`/auth/login?callbackUrl=${encodeURIComponent(pathname)}`)
    } else if (status === 'authenticated' && session?.user.role !== requiredRole) {
      router.push('/unauthorized')
    }
  }, [status, session, router, requiredRole])

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4 p-8 bg-white rounded-lg shadow-lg"
        >
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          <p className="text-gray-600">Verifying your access...</p>
        </motion.div>
      </div>
    )
  }

  if (status === 'authenticated' && session?.user.role === requiredRole) {
    return <>{children}</>
  }

  return null
}
