'use client'

export const dynamic = 'force-dynamic'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import {
  Settings, Globe, Database, Mail, Server, Lock, Coins, Edit2, Image, Upload, Trash2, Bell, Shield, Save, Calendar
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

  // User Preferences State
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    smsNotifications: false,
    eventReminders: true,
    marketingEmails: false
  })
  const [privacy, setPrivacy] = useState({
    profileVisibility: 'public',
    showEmail: false,
    showPhone: false
  })
  const [savingPrefs, setSavingPrefs] = useState(false)

  const handleSavePrefs = async () => {
    setSavingPrefs(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 1000))
      toast({ title: "Preferences saved successfully!" })
    } catch {
      toast({ title: "Failed to save preferences", variant: "destructive" })
    } finally {
      setSavingPrefs(false)
    }
  }

  // Company Logo state
  const [companyLogo, setCompanyLogo] = useState<string | null>(null)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const logoInputRef = useRef<HTMLInputElement>(null)

  // Company Banner state
  const [companyBanner, setCompanyBanner] = useState<string | null>(null)
  const [uploadingBanner, setUploadingBanner] = useState(false)
  const bannerInputRef = useRef<HTMLInputElement>(null)

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

    // Fetch company logo
    fetch('/api/super-admin/settings/logo')
      .then(res => res.json())
      .then(data => {
        if (data.logo) setCompanyLogo(data.logo)
      })
      .catch(err => console.error('Failed to fetch logo', err))

    // Fetch company banner
    fetch('/api/super-admin/settings/banner')
      .then(res => res.json())
      .then(data => {
        if (data.banner) setCompanyBanner(data.banner)
      })
      .catch(err => console.error('Failed to fetch banner', err))
  }, [])

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'Max size is 5MB', variant: 'destructive' })
      return
    }

    setUploadingLogo(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', 'logo')

      const res = await fetch('/api/uploads', {
        method: 'POST',
        body: formData
      })

      if (res.ok) {
        const data = await res.json()
        const logoUrl = data.url || data.secure_url

        // Save logo URL to settings
        await fetch('/api/super-admin/settings/logo', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ logo: logoUrl })
        })

        setCompanyLogo(logoUrl)
        toast({ title: 'Logo uploaded successfully!' })
      } else {
        throw new Error('Upload failed')
      }
    } catch (error) {
      toast({ title: 'Failed to upload logo', variant: 'destructive' })
    } finally {
      setUploadingLogo(false)
    }
  }

  const handleDeleteLogo = async () => {
    if (!window.confirm('Are you sure you want to remove the company logo?')) return

    try {
      const res = await fetch('/api/super-admin/settings/logo', {
        method: 'DELETE'
      })

      if (res.ok) {
        setCompanyLogo(null)
        toast({ title: 'Logo removed successfully' })
      } else {
        throw new Error('Failed to delete logo')
      }
    } catch (error) {
      toast({ title: 'Failed to remove logo', variant: 'destructive' })
    }
  }

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'Max size is 5MB', variant: 'destructive' })
      return
    }

    setUploadingBanner(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', 'banner')

      const res = await fetch('/api/uploads', {
        method: 'POST',
        body: formData
      })

      if (res.ok) {
        const data = await res.json()
        const bannerUrl = data.url || data.secure_url

        // Save banner URL to settings
        await fetch('/api/super-admin/settings/banner', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ banner: bannerUrl })
        })

        setCompanyBanner(bannerUrl)
        toast({ title: 'Banner uploaded successfully!' })
      } else {
        throw new Error('Upload failed')
      }
    } catch (error) {
      toast({ title: 'Failed to upload banner', variant: 'destructive' })
    } finally {
      setUploadingBanner(false)
    }
  }

  const handleDeleteBanner = async () => {
    if (!window.confirm('Are you sure you want to remove the company banner?')) return

    try {
      const res = await fetch('/api/super-admin/settings/banner', {
        method: 'DELETE'
      })

      if (res.ok) {
        setCompanyBanner(null)
        toast({ title: 'Banner removed successfully' })
      } else {
        throw new Error('Failed to delete banner')
      }
    } catch (error) {
      toast({ title: 'Failed to remove banner', variant: 'destructive' })
    }
  }

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
          Settings
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage system configuration and personal preferences
        </p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-white border p-1 rounded-lg">
          <TabsTrigger value="overview" className="data-[state=active]:bg-gray-100">Overview</TabsTrigger>
          <TabsTrigger value="notifications" className="data-[state=active]:bg-gray-100">Notifications</TabsTrigger>
          <TabsTrigger value="privacy" className="data-[state=active]:bg-gray-100">Privacy</TabsTrigger>
          <TabsTrigger value="language" className="data-[state=active]:bg-gray-100">Language</TabsTrigger>
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

            {/* Company Logo */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-lg">
                    <Image className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Company Logo</h3>
                    <p className="text-xs text-gray-500">Upload organization photo</p>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-center gap-4">
                {companyLogo ? (
                  <div className="relative w-32 h-32 group">
                    <div className="w-full h-full rounded-lg border border-gray-200 overflow-hidden bg-white flex items-center justify-center">
                      <img src={companyLogo} alt="Company Logo" className="w-full h-full object-contain p-2" />
                    </div>
                    {/* Overlay Actions */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-3">
                      <Button
                        size="icon"
                        variant="secondary"
                        className="h-9 w-9 hover:scale-105 transition-transform"
                        onClick={() => logoInputRef.current?.click()}
                        title="Change Logo"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="destructive"
                        className="h-9 w-9 hover:scale-105 transition-transform bg-red-600 hover:bg-red-700 text-white border-0"
                        onClick={handleDeleteLogo}
                        title="Remove Logo"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="w-24 h-24 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50">
                    <Image className="h-8 w-8 text-gray-400" />
                  </div>
                )}
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-700">{companyLogo ? 'Logo Uploaded' : 'No Logo Uploaded'}</p>
                  <p className="text-xs text-gray-500">Recommended: Square image, at least 200x200px</p>
                  <p className="text-xs text-gray-500">Max size: 5MB (JPG, PNG, SVG, GIF)</p>
                </div>
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
                {!companyLogo && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => logoInputRef.current?.click()}
                    disabled={uploadingLogo}
                    className="w-full"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {uploadingLogo ? 'Uploading...' : 'Upload Logo'}
                  </Button>
                )}
              </div>
            </div>

            {/* Company Banner */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-pink-50 text-pink-600 rounded-lg">
                    <Image className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Company Banner</h3>
                    <p className="text-xs text-gray-500">Upload banner for company card</p>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-center gap-4">
                {companyBanner ? (
                  <div className="relative w-full h-32 group">
                    <div className="w-full h-full rounded-lg border border-gray-200 overflow-hidden bg-white flex items-center justify-center">
                      <img src={companyBanner} alt="Company Banner" className="w-full h-full object-cover" />
                    </div>
                    {/* Overlay Actions */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-3">
                      <Button
                        size="icon"
                        variant="secondary"
                        className="h-9 w-9 hover:scale-105 transition-transform"
                        onClick={() => bannerInputRef.current?.click()}
                        title="Change Banner"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="destructive"
                        className="h-9 w-9 hover:scale-105 transition-transform bg-red-600 hover:bg-red-700 text-white border-0"
                        onClick={handleDeleteBanner}
                        title="Remove Banner"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-32 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50">
                    <Image className="h-8 w-8 text-gray-400" />
                  </div>
                )}
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-700">{companyBanner ? 'Banner Uploaded' : 'No Banner Uploaded'}</p>
                  <p className="text-xs text-gray-500">Recommended: Wide image, 800x300px</p>
                  <p className="text-xs text-gray-500">Max size: 5MB (JPG, PNG)</p>
                </div>
                <input
                  ref={bannerInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleBannerUpload}
                  className="hidden"
                />
                {!companyBanner && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => bannerInputRef.current?.click()}
                    disabled={uploadingBanner}
                    className="w-full"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {uploadingBanner ? 'Uploading...' : 'Upload Banner'}
                  </Button>
                )}
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
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow h-full">
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

        <TabsContent value="notifications" className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="max-w-2xl">
              <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
                <Bell className="w-5 h-5 text-indigo-600" />
                Notification Preferences
              </h2>
              <p className="text-sm text-gray-600 mb-6">Manage how you receive notifications</p>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="font-semibold text-gray-900">Email Notifications</div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifications.emailNotifications}
                      onChange={(e) => setNotifications({ ...notifications, emailNotifications: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="font-semibold text-gray-900">Push Notifications</div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifications.eventReminders}
                      onChange={(e) => setNotifications({ ...notifications, eventReminders: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="font-semibold text-gray-900">SMS Notifications</div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifications.smsNotifications}
                      onChange={(e) => setNotifications({ ...notifications, smsNotifications: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-200 mt-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-indigo-600" />
                  Content Preferences
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="font-semibold text-gray-900">Event Reminders</div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notifications.eventReminders}
                        onChange={(e) => setNotifications({ ...notifications, eventReminders: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="font-semibold text-gray-900">Weekly Digest</div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notifications.marketingEmails}
                        onChange={(e) => setNotifications({ ...notifications, marketingEmails: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gray-200"></div>
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-6 mt-4 border-t">
                <Button onClick={handleSavePrefs} disabled={savingPrefs}>
                  {savingPrefs ? 'Saving...' : 'Save Preferences'}
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="privacy" className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="max-w-2xl">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-indigo-600" />
                Privacy Settings
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Profile Visibility</label>
                  <Select
                    value={privacy.profileVisibility}
                    onValueChange={(val) => setPrivacy({ ...privacy, profileVisibility: val })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select visibility" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">Public</SelectItem>
                      <SelectItem value="private">Private</SelectItem>
                      <SelectItem value="contacts">Contacts Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <label className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer">
                  <input
                    type="checkbox"
                    checked={privacy.showEmail}
                    onChange={(e) => setPrivacy({ ...privacy, showEmail: e.target.checked })}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <div>
                    <div className="font-medium">Show Email Address</div>
                    <div className="text-sm text-gray-500">Allow others to see your email</div>
                  </div>
                </label>
                <label className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer">
                  <input
                    type="checkbox"
                    checked={privacy.showPhone}
                    onChange={(e) => setPrivacy({ ...privacy, showPhone: e.target.checked })}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <div>
                    <div className="font-medium">Show Phone Number</div>
                    <div className="text-sm text-gray-500">Allow others to see your phone number</div>
                  </div>
                </label>
              </div>
              <div className="flex justify-end pt-6 mt-4 border-t">
                <Button onClick={handleSavePrefs} disabled={savingPrefs}>
                  {savingPrefs ? 'Saving...' : 'Save Preferences'}
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="language" className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="max-w-2xl">
              <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
                <Globe className="w-5 h-5 text-indigo-600" />
                Language & Region
              </h2>
              <p className="text-sm text-gray-600 mb-6">Set your language and timezone preferences</p>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold mb-3 text-gray-900">Language</label>
                  <Select defaultValue="en">
                    <SelectTrigger>
                      <SelectValue placeholder="Select Language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                      <SelectItem value="de">German</SelectItem>
                      <SelectItem value="hi">Hindi</SelectItem>
                      <SelectItem value="ta">Tamil</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-3 text-gray-900">Time Zone</label>
                  <Select defaultValue="Asia/Kolkata">
                    <SelectTrigger>
                      <SelectValue placeholder="Select Timezone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UTC">UTC</SelectItem>
                      <SelectItem value="Asia/Kolkata">India Standard Time (IST)</SelectItem>
                      <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                      <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                      <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                      <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                      <SelectItem value="Europe/London">London (GMT)</SelectItem>
                      <SelectItem value="Europe/Paris">Paris (CET)</SelectItem>
                      <SelectItem value="Asia/Tokyo">Tokyo (JST)</SelectItem>
                      <SelectItem value="Australia/Sydney">Sydney (AEDT)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end pt-6 mt-4 border-t">
                <Button onClick={handleSavePrefs} disabled={savingPrefs}>
                  <Save className="w-4 h-4 mr-2" />
                  {savingPrefs ? 'Saving...' : 'Save Changes'}
                </Button>
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
