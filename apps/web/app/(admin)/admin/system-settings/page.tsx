'use client'

import { useState } from 'react'
import { Shield, Database } from 'lucide-react'
import PermissionsMatrix from '@/components/admin/PermissionsMatrix'
import ModuleAccessMatrix from '@/components/admin/ModuleAccessMatrix'

export default function SystemSettingsPage() {
  const [activeTab, setActiveTab] = useState<'permissions' | 'modules'>('permissions')

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
        <p className="text-sm text-gray-500 mt-1">
          Configure system-wide settings and permissions
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-8">
          <button
            onClick={() => setActiveTab('permissions')}
            className={`flex items-center gap-2 px-1 py-4 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'permissions'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Shield className="w-4 h-4" />
            Permissions Matrix
          </button>
          <button
            onClick={() => setActiveTab('modules')}
            className={`flex items-center gap-2 px-1 py-4 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'modules'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Database className="w-4 h-4" />
            Module Access
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'permissions' && <PermissionsMatrix />}
        {activeTab === 'modules' && <ModuleAccessMatrix />}
      </div>
    </div>
  )
}
