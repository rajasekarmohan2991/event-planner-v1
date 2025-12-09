'use client'

export const dynamic = 'force-dynamic'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Settings, Shield, Coins } from 'lucide-react'
import Link from 'next/link'

export default function SuperAdminSettingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return
    if (!session || session.user?.role !== 'SUPER_ADMIN') {
      router.push('/dashboard')
    }
  }, [session, status, router])

  if (status === 'loading') {
    return <div className="p-6">Loading...</div>
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Settings className="h-6 w-6" />
            System Settings
          </h1>
          <p className="text-sm text-gray-600 mt-1">Configure global system settings</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Permissions - reusing logic from existing modules */}
        <Link href="/admin/settings/permissions" className="block group">
          <div className="bg-white rounded-xl border shadow-sm p-6 transition-all duration-200 hover:shadow-md hover:border-purple-300">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-purple-100 rounded-xl group-hover:bg-purple-200 transition-colors">
                <Shield className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Permissions</h3>
                <p className="text-sm text-gray-600">Role & Access Control</p>
              </div>
            </div>
            <div className="text-sm text-gray-500">
              Manage user roles and system-wide permissions.
            </div>
          </div>
        </Link>
      </div>
    </div>
  )
}
