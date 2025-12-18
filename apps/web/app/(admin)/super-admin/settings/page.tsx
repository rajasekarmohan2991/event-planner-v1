'use client'

export const dynamic = 'force-dynamic'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import {
  Settings, Shield, Coins, Globe, Database, CreditCard, Mail,
  Bell, Info, Server, Lock
} from 'lucide-react'
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

  // Mock data for the UI to match the requested design
  const systemInfo = {
    version: 'v1.0.0',
    environment: process.env.NODE_ENV || 'Development',
    uptime: '2h 15m'
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2 text-gray-900">
          <Settings className="h-6 w-6" />
          System Settings
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Configure system-wide settings and preferences
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

        {/* General Settings */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg">
                <Globe className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">General</h3>
                <p className="text-xs text-gray-500">Basic system configuration</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Site Name</span>
              <span className="font-medium text-gray-900">AyPhen Planner</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Time Zone</span>
              <span className="font-medium text-gray-900">UTC+05:30</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Language</span>
              <span className="font-medium text-gray-900">English</span>
            </div>
          </div>
        </div>

        {/* Database */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-green-50 text-green-600 rounded-lg">
                <Database className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Database</h3>
                <p className="text-xs text-gray-500">Database configuration</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Status</span>
              <span className="font-medium text-green-600">Connected</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Type</span>
              <span className="font-medium text-gray-900">PostgreSQL</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Version</span>
              <span className="font-medium text-gray-900">16.x</span>
            </div>
          </div>
        </div>

        {/* Subscription (Read-Only Info) */}
        <Link href="/admin/settings/billing">
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow h-full cursor-pointer">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-lg">
                  <CreditCard className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Subscription</h3>
                  <p className="text-xs text-gray-500">Plan and billing</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Current Plan</span>
                <span className="font-medium text-indigo-600">Enterprise</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Status</span>
                <span className="font-medium text-green-600">Active</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Renewal</span>
                <span className="font-medium text-gray-900">Dec 31, 2025</span>
              </div>
            </div>
          </div>
        </Link>

        {/* Currency Link */}
        <Link href="/super-admin/settings/currency">
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow h-full cursor-pointer">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-yellow-50 text-yellow-600 rounded-lg">
                  <Coins className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Currency</h3>
                  <p className="text-xs text-gray-500">Payment & Exchange</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Base Currency</span>
                <span className="font-medium text-gray-900">INR (₹)</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Multi-currency</span>
                <span className="font-medium text-green-600">Enabled</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Provider</span>
                <span className="font-medium text-gray-900">ExchangeRate API</span>
              </div>
            </div>
          </div>
        </Link>


        {/* Email */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-purple-50 text-purple-600 rounded-lg">
                <Mail className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Email</h3>
                <p className="text-xs text-gray-500">Email service configuration</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Service</span>
              <span className="font-medium text-gray-900">SMTP / AWS SES</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Status</span>
              <span className="font-medium text-green-600">Active</span>
            </div>
            <div className="flex flex-col gap-1 text-sm">
              <span className="text-gray-600">From Address</span>
              <span className="font-medium text-gray-900 truncate">noreply@ayphen.com</span>
            </div>
          </div>
        </div>

        {/* Security */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-red-50 text-red-600 rounded-lg">
                <Lock className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Security</h3>
                <p className="text-xs text-gray-500">Security and authentication</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Two-Factor Auth</span>
              <span className="font-medium text-orange-600">Optional</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Session Timeout</span>
              <span className="font-medium text-gray-900">24 hours</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Password Policy</span>
              <span className="font-medium text-green-600">Strong</span>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-yellow-50 text-yellow-600 rounded-lg">
                <Bell className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Notifications</h3>
                <p className="text-xs text-gray-500">Notification preferences</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Email Notifications</span>
              <span className="font-medium text-green-600">Enabled</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Push Notifications</span>
              <span className="font-medium text-gray-400">Disabled</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Admin Alerts</span>
              <span className="font-medium text-green-600">Enabled</span>
            </div>
          </div>
        </div>

        {/* System Info */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gray-100 text-gray-600 rounded-lg">
                <Server className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">System Info</h3>
                <p className="text-xs text-gray-500">Runtime environment</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Version</span>
              <span className="font-medium text-gray-900">{systemInfo.version}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Environment</span>
              <span className="font-medium text-blue-600">{systemInfo.environment}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Uptime</span>
              <span className="font-medium text-gray-900">{systemInfo.uptime}</span>
            </div>
          </div>
        </div>

        {/* Permissions Link */}
        <Link href="/admin/settings/permissions">
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow h-full cursor-pointer">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-purple-50 text-purple-600 rounded-lg">
                  <Shield className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Permissions</h3>
                  <p className="text-xs text-gray-500">Role & Access Control</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Roles</span>
                <span className="font-medium text-gray-900">5 Defined</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Policy</span>
                <span className="font-medium text-green-600">Strict</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Last Audit</span>
                <span className="font-medium text-gray-900">Today</span>
              </div>
            </div>
          </div>
        </Link>

      </div>
    </div>
  )
}
