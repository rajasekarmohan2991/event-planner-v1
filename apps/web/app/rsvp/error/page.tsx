'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { XCircle } from 'lucide-react'

function RSVPErrorContent() {
  const searchParams = useSearchParams()
  const message = searchParams.get('message') || 'Something went wrong'

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 mb-6">
            <div className="flex items-center justify-center mb-4">
              <XCircle className="w-16 h-16 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-center mb-2 text-red-600">
              RSVP Error
            </h1>
            <p className="text-center text-gray-600">
              {decodeURIComponent(message)}
            </p>
          </div>

          <div className="text-center space-y-4">
            <p className="text-sm text-gray-600">
              If you continue to experience issues, please contact the event organizer.
            </p>
            <a
              href="/"
              className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Go to Home
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function RSVPErrorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    }>
      <RSVPErrorContent />
    </Suspense>
  )
}
