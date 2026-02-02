'use client'

import Link from 'next/link'
import { Shield, ArrowLeft, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function AuthUnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
          <div className="mb-6">
            <div className="mx-auto w-20 h-20 bg-red-100 rounded-full flex items-center justify-center animate-pulse">
              <Shield className="w-10 h-10 text-red-600" />
            </div>
          </div>
          
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            Access Denied
          </h1>
          
          <p className="text-lg text-gray-600 mb-2">
            You don't have permission to access this area.
          </p>
          
          <p className="text-sm text-gray-500 mb-8">
            Please contact your administrator if you believe this is an error.
          </p>
          
          <div className="space-y-3">
            <Link href="/dashboard" className="block">
              <Button className="w-full bg-rose-600 hover:bg-rose-700">
                <Home className="w-4 h-4 mr-2" />
                Go to Dashboard
              </Button>
            </Link>
            
            <Link href="/" className="block">
              <Button variant="outline" className="w-full">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </Link>
          </div>
          
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              Error Code: 403 Forbidden
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Need help? Contact your organization administrator
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
