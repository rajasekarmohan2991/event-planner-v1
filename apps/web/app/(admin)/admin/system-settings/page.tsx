'use client'

import { useState } from 'react'
import { Shield, Database, DollarSign } from 'lucide-react'
import PermissionsMatrix from '@/components/admin/PermissionsMatrix'
import ModuleAccessMatrix from '@/components/admin/ModuleAccessMatrix'
import CurrencySettings from '@/components/admin/CurrencySettings'
import BackButton from '@/components/ui/back-button'

export default function SystemSettingsPage() {
  const [activeTab, setActiveTab] = useState<'permissions' | 'modules' | 'currency'>('permissions')

  return (
    <div className="p-6 space-y-6">
      {/* Back Button */}
      <BackButton fallbackUrl="/admin" />

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
        <p className="text-sm text-gray-500 mt-1">
          Configure system-wide settings and permissions
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-8 overflow-x-auto">
          <button
            onClick={() => setActiveTab('permissions')}
            className={`flex items-center gap-2 px-1 py-4 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${activeTab === 'permissions'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
          >
            <Shield className="w-4 h-4" />
            Permissions Matrix
          </button>

          <button
            onClick={() => setActiveTab('currency')}
            className={`flex items-center gap-2 px-1 py-4 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${activeTab === 'currency'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
          >
            <DollarSign className="w-4 h-4" />
            Currency
          </button>

          <button
            onClick={() => setActiveTab('modules')}
            className={`flex items-center gap-2 px-1 py-4 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${activeTab === 'modules'
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
      <div className="bg-white rounded-lg p-0">
        {activeTab === 'permissions' && <PermissionsMatrix />}
        {activeTab === 'currency' && (
          <div className="border rounded-xl p-0 overflow-hidden border-none shadow-none">
            <CurrencySettings />
          </div>
        )}
        {activeTab === 'modules' && <ModuleAccessMatrix />}
      </div>
    </div>
  )
}
