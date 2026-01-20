'use client'

export const dynamic = 'force-dynamic'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import {
  Settings, Globe, Database, Mail, Server, Lock, Coins, Edit2
} from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AVAILABLE_CURRENCIES, getCurrencyByCode } from '@/lib/currency'
import { useToast } from '@/components/ui/use-toast'

export default function SuperAdminSettingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()

  const [currencySettings, setCurrencySettings] = useState({ globalCurrency: 'USD' })
  const [isEditingCurrency, setIsEditingCurrency] = useState(false)
  const [selectedCurrency, setSelectedCurrency] = useState('USD')
  const [savingCurrency, setSavingCurrency] = useState(false)

  useEffect(() => {
    // Fetch currency settings
    fetch('/api/super-admin/settings/currency')
      .then(res => res.json())
      .then(data => {
        if (data.globalCurrency) {
          setCurrencySettings(data)
          setSelectedCurrency(data.globalCurrency)
        }
      })
      .catch(err => console.error('Failed to fetch currency settings', err))
  }, [])

  const handleSaveCurrency = async () => {
    setSavingCurrency(true)
    try {
      const res = await fetch('/api/super-admin/settings/currency', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ globalCurrency: selectedCurrency })
      })

      if (res.ok) {
        setCurrencySettings(prev => ({ ...prev, globalCurrency: selectedCurrency }))
        setIsEditingCurrency(false)
        toast({ title: "Currency updated", description: `Global currency set to ${selectedCurrency}` })
      } else {
        throw new Error('Failed to update')
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to update currency", variant: "destructive" })
    } finally {
      setSavingCurrency(false)
    }
  }

  useEffect(() => {
    if (status === 'loading') return
    if (!session || (session.user as any)?.role !== 'SUPER_ADMIN') {
      router.push('/dashboard')
    }
  }, [session, status, router])

  if (status === 'loading') {
    return <div className="p-6">Loading...</div>
  }

  const systemInfo = {
    version: 'v1.0.0',
    environment: process.env.NODE_ENV || 'Development',
    uptime: '2h 15m'
  }

  const displayCurrency = getCurrencyByCode(currencySettings.globalCurrency)

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2 text-gray-900">
          <Settings className="h-6 w-6" />
          System Settings
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Configure system-wide settings and permissions
        </p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-white border p-1 rounded-lg">
          <TabsTrigger value="overview" className="data-[state=active]:bg-gray-100">Overview</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
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

            {/* Currency Summary Card */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow h-full relative group">
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="icon" onClick={() => setIsEditingCurrency(true)}>
                  <Edit2 className="h-4 w-4 text-gray-500" />
                </Button>
              </div>
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
                  <span className="font-medium text-gray-900">{displayCurrency.code} ({displayCurrency.symbol})</span>
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
          </div>
        </TabsContent>

      </Tabs>

      <Dialog open={isEditingCurrency} onOpenChange={setIsEditingCurrency}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Global Currency</DialogTitle>
            <DialogDescription>
              This will update the base currency for the entire system and the super admin tenant.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
              <SelectTrigger>
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                {AVAILABLE_CURRENCIES.map(c => (
                  <SelectItem key={c.code} value={c.code}>
                    {c.code} - {c.name} ({c.symbol})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditingCurrency(false)}>Cancel</Button>
            <Button onClick={handleSaveCurrency} disabled={savingCurrency}>
              {savingCurrency ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
