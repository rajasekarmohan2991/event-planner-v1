'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default function CreateEventPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to the stepper-based event creation page
    router.push('/events/new')
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting to event creation wizard...</p>
      </div>
    </div>
  )
}
