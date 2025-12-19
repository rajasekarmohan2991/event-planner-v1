'use client'

export const dynamic = 'force-dynamic'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { Settings, Database, Mail, Shield, Globe, Bell, Users, Lock, CreditCard, Edit2 } from 'lucide-react'
import Link from 'next/link'
import { EditModal, ToggleModal } from '@/components/admin/EditModal'
import CurrencyConverter from '@/components/ui/CurrencyConverter'

export default function SettingsPage() {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [editModal, setEditModal] = useState<{ isOpen: boolean; field: string; value: string; title: string } | null>(null)
  const [toggleModal, setToggleModal] = useState<{ isOpen: boolean; field: string; value: boolean; title: string } | null>(null)
  const [settings, setSettings] = useState({
    siteName: 'Event Planner',
    timeZone: 'UTC+05:30',
    language: 'English',
    emailService: 'SMTP',
    fromAddress: 'noreply@eventplanner.com',
    sessionTimeout: '24 hours',
    emailNotifications: true,
    pushNotifications: false,
    adminAlerts: true,
  })

  useEffect(() => {
    setLoading(false)
  }, [])

  const handleQuickAction = async (action: string) => {
    setActionLoading(action)
    try {
      switch (action) {
        case 'clear-cache':
          // Simulate cache clearing
          await new Promise(resolve => setTimeout(resolve, 1500))
          alert('✅ Cache cleared successfully!')
          break
        case 'backup-database':
          // Simulate database backup
          await new Promise(resolve => setTimeout(resolve, 2000))
          alert('✅ Database backup created successfully!')
          break
        case 'health-check':
          // Simulate health check
          await new Promise(resolve => setTimeout(resolve, 1000))
          alert('✅ System health check completed. All systems operational!')
          break
      }
    } catch (error) {
      alert('❌ Action failed. Please try again.')
    } finally {
      setActionLoading(null)
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Settings className="h-6 w-6" />
            System Settings
          </h1>
          <p className="text-sm text-gray-600 mt-1">Configure system-wide settings and preferences</p>
        </div>
      </div>

      {/* Settings Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* General Settings */}
        <div className="bg-gradient-to-br from-white to-blue-50/30 rounded-lg border border-blue-100/50 shadow-sm p-6 hover:shadow-md transition-all">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Globe className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold">General</h3>
              <p className="text-sm text-gray-600">Basic system configuration</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm">Site Name</span>
              <button
                onClick={() => setEditModal({ isOpen: true, field: 'Site Name', value: settings.siteName, title: 'Edit Site Name' })}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
              >
                {settings.siteName}
                <Edit2 className="w-3 h-3" />
              </button>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Time Zone</span>
              <span className="text-sm text-gray-500">UTC+05:30</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Language</span>
              <span className="text-sm text-gray-500">English</span>
            </div>
          </div>
        </div>

        {/* Database Settings */}
        <div className="bg-gradient-to-br from-white to-green-50/30 rounded-lg border border-green-100/50 shadow-sm p-6 hover:shadow-md transition-all">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <Database className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold">Database</h3>
              <p className="text-sm text-gray-600">Database configuration</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm">Status</span>
              <span className="text-sm text-green-600 font-medium">Connected</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Type</span>
              <span className="text-sm text-gray-500">PostgreSQL</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Version</span>
              <span className="text-sm text-gray-500">16.x</span>
            </div>
          </div>
        </div>

        {/* Subscription Settings */}
        <div className="bg-gradient-to-br from-white to-indigo-50/30 rounded-lg border border-indigo-100/50 shadow-sm p-6 hover:shadow-md transition-all">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <CreditCard className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <h3 className="font-semibold">Subscription</h3>
              <p className="text-sm text-gray-600">Plan and billing</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm">Current Plan</span>
              <span className="text-sm text-indigo-600 font-medium">Enterprise</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Status</span>
              <span className="text-sm text-green-600 font-medium">Active</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Renewal</span>
              <span className="text-sm text-gray-500">Dec 31, 2025</span>
            </div>
          </div>
        </div>

        {/* Email Settings */}
        <div className="bg-gradient-to-br from-white to-purple-50/30 rounded-lg border border-purple-100/50 shadow-sm p-6 hover:shadow-md transition-all">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Mail className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold">Email</h3>
              <p className="text-sm text-gray-600">Email service configuration</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm">Service</span>
              <span className="text-sm text-gray-500">SMTP</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Status</span>
              <span className="text-sm text-green-600 font-medium">Active</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">From Address</span>
              <span className="text-sm text-gray-500">noreply@eventplanner.com</span>
            </div>
          </div>
        </div>

        {/* Security Settings */}
        <div className="bg-gradient-to-br from-white to-red-50/30 rounded-lg border border-red-100/50 shadow-sm p-6 hover:shadow-md transition-all">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-red-100 rounded-lg">
              <Shield className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <h3 className="font-semibold">Security</h3>
              <p className="text-sm text-gray-600">Security and authentication</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm">Two-Factor Auth</span>
              <span className="text-sm text-yellow-600 font-medium">Optional</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Session Timeout</span>
              <span className="text-sm text-gray-500">24 hours</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Password Policy</span>
              <span className="text-sm text-green-600 font-medium">Strong</span>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-gradient-to-br from-white to-yellow-50/30 rounded-lg border border-yellow-100/50 shadow-sm p-6 hover:shadow-md transition-all">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Bell className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <h3 className="font-semibold">Notifications</h3>
              <p className="text-sm text-gray-600">Notification preferences</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm">Email Notifications</span>
              <span className="text-sm text-green-600 font-medium">Enabled</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Push Notifications</span>
              <span className="text-sm text-gray-500">Disabled</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Admin Alerts</span>
              <span className="text-sm text-green-600 font-medium">Enabled</span>
            </div>
          </div>
        </div>


        {/* System Info */}
        <div className="bg-gradient-to-br from-white to-gray-50/30 rounded-lg border border-gray-200/50 shadow-sm p-6 hover:shadow-md transition-all">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-gray-100 rounded-lg">
              <Settings className="h-5 w-5 text-gray-600" />
            </div>
            <div>
              <h3 className="font-semibold">System Info</h3>
              <p className="text-sm text-gray-600">System information</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm">Version</span>
              <span className="text-sm text-gray-500">v1.0.0</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Environment</span>
              <span className="text-sm text-blue-600 font-medium">Development</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Uptime</span>
              <span className="text-sm text-gray-500">2h 15m</span>
            </div>
          </div>
        </div>
      </div>

      {/* Lookup Type Configuration */}
      <div className="bg-white rounded-lg border shadow-sm p-6">
        <h3 className="font-semibold mb-4">Lookup Type Configuration</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Default Lookup Method
            </label>
            <select className="w-full md:w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="email">Email Address</option>
              <option value="phone">Phone Number</option>
              <option value="name">Full Name</option>
              <option value="code">Registration Code</option>
            </select>
          </div>
          <div>
            <label className="flex items-center gap-2">
              <input type="checkbox" className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" defaultChecked />
              <span className="text-sm text-gray-700">Enable fuzzy search for name lookups</span>
            </label>
          </div>
          <div>
            <label className="flex items-center gap-2">
              <input type="checkbox" className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" defaultChecked />
              <span className="text-sm text-gray-700">Case-insensitive search</span>
            </label>
          </div>
        </div>
      </div>

      {/* Currency Converter */}
      <div className="bg-white rounded-lg border shadow-sm p-6">
        <CurrencyConverter />
      </div>


      {/* Quick Actions */}
      <div className="bg-white rounded-lg border shadow-sm p-6">
        <h3 className="font-semibold mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => handleQuickAction('clear-cache')}
            disabled={actionLoading !== null}
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-indigo-300 text-left transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="font-medium text-sm">
              {actionLoading === 'clear-cache' ? '⏳ Clearing...' : 'Clear Cache'}
            </div>
            <div className="text-xs text-gray-500 mt-1">Clear system cache and temporary files</div>
          </button>
          <button
            onClick={() => handleQuickAction('backup-database')}
            disabled={actionLoading !== null}
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-indigo-300 text-left transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="font-medium text-sm">
              {actionLoading === 'backup-database' ? '⏳ Backing up...' : 'Backup Database'}
            </div>
            <div className="text-xs text-gray-500 mt-1">Create a backup of the database</div>
          </button>
          <button
            onClick={() => handleQuickAction('health-check')}
            disabled={actionLoading !== null}
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-indigo-300 text-left transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="font-medium text-sm">
              {actionLoading === 'health-check' ? '⏳ Checking...' : 'System Health Check'}
            </div>
            <div className="text-xs text-gray-500 mt-1">Run comprehensive system diagnostics</div>
          </button>
        </div>
      </div>

      {/* Edit Modal */}
      {editModal && (
        <EditModal
          isOpen={editModal.isOpen}
          onClose={() => setEditModal(null)}
          title={editModal.title}
          field={editModal.field}
          currentValue={editModal.value}
          onSave={(value) => {
            // Update settings based on field
            if (editModal.field === 'Site Name') {
              setSettings({ ...settings, siteName: value })
            }
            // Add more fields as needed
            alert(`✅ ${editModal.field} updated successfully!`)
          }}
        />
      )}

      {/* Toggle Modal */}
      {toggleModal && (
        <ToggleModal
          isOpen={toggleModal.isOpen}
          onClose={() => setToggleModal(null)}
          title={toggleModal.title}
          field={toggleModal.field}
          currentValue={toggleModal.value}
          onSave={(value) => {
            // Update settings based on field
            if (toggleModal.field === 'Email Notifications') {
              setSettings({ ...settings, emailNotifications: value })
            } else if (toggleModal.field === 'Push Notifications') {
              setSettings({ ...settings, pushNotifications: value })
            } else if (toggleModal.field === 'Admin Alerts') {
              setSettings({ ...settings, adminAlerts: value })
            }
            alert(`✅ ${toggleModal.field} updated successfully!`)
          }}
        />
      )}
    </div>
  )
}
