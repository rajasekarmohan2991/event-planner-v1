'use client'

export const dynamic = 'force-dynamic'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Settings, Globe, Bell, Lock, ArrowLeft, CreditCard, Mail } from 'lucide-react'
import { CompanyLogoUpload } from '@/components/admin/CompanyLogoUpload'

export default function CompanySettingsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const params = useParams()
  const companyId = params?.id as string

  const [loading, setLoading] = useState(true)
  const [companyName, setCompanyName] = useState('')
  const [billing, setBilling] = useState<any>(null)
  const [creating, setCreating] = useState(false)
  const [plan, setPlan] = useState<'PRO' | 'ENTERPRISE'>('PRO')
  const [period, setPeriod] = useState<'MONTHLY' | 'YEARLY'>('MONTHLY')
  const [amountInr, setAmountInr] = useState<number>(4999)
  const [email, setEmail] = useState<string>('')
  const [createdLink, setCreatedLink] = useState<{ code: string, payUrl: string } | null>(null)

  useEffect(() => {
    async function loadData() {
      if (!companyId) return

      try {
        setLoading(true)
        const companyRes = await fetch(`/api/super-admin/companies/${companyId}`)
        if (companyRes.ok) {
          const data = await companyRes.json()
          setCompanyName(data.company.name)
          if (data.company?.billingEmail) setEmail(data.company.billingEmail)
        }
        const tenantsRes = await fetch('/api/admin/billing/tenants', { credentials: 'include' })
        if (tenantsRes.ok) {
          const d = await tenantsRes.json()
          const t = (d.tenants || []).find((x: any) => String(x.id) === String(companyId))
          if (t) {
            setBilling(t)
            if (!email && t.billingEmail) setEmail(t.billingEmail)
          }
        }
      } catch (error) {
        console.error('Error loading company:', error)
      } finally {
        setLoading(false)
      }
    }

    if (companyId) {
      loadData()
    }
  }, [companyId])

  useEffect(() => {
    if (plan === 'PRO' && period === 'MONTHLY') setAmountInr((prev) => prev || 4999)
    if (plan === 'PRO' && period === 'YEARLY') setAmountInr((prev) => prev || 4999 * 12)
    if (plan === 'ENTERPRISE' && period === 'MONTHLY') setAmountInr((prev) => prev || 14999)
    if (plan === 'ENTERPRISE' && period === 'YEARLY') setAmountInr((prev) => prev || 14999 * 12)
  }, [plan, period])

  const createLink = async () => {
    try {
      setCreating(true)
      setCreatedLink(null)
      const res = await fetch('/api/admin/billing/subscription-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ tenantId: companyId, plan, period, amountInr: Number(amountInr || 0), email: email || undefined })
      })
      if (res.ok) {
        const d = await res.json()
        setCreatedLink({ code: d.code, payUrl: d.payUrl })
        const tenantsRes = await fetch('/api/admin/billing/tenants', { credentials: 'include' })
        if (tenantsRes.ok) {
          const j = await tenantsRes.json()
          const t = (j.tenants || []).find((x: any) => String(x.id) === String(companyId))
          if (t) setBilling(t)
        }
      }
    } finally {
      setCreating(false)
    }
  }

  const fmtDate = (d?: string) => d ? new Date(d).toLocaleDateString() : '-'

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
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-200/50 p-6">
        <div className="flex flex-col gap-4">
          <button
            onClick={() => router.push(`/super-admin/companies/${companyId}`)}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors w-fit"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Company Details</span>
          </button>

          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center text-purple-600">
              <Settings className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                {companyName} Settings
              </h1>
              <p className="text-gray-600 mt-1">Configure company settings and preferences</p>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* General Settings */}
        <div className="bg-white rounded-lg border shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Globe className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold">General</h3>
              <p className="text-sm text-gray-600">Basic configuration</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm">Company Name</span>
              <span className="text-sm font-medium">{companyName}</span>
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

        {/* Logo Upload */}
        <div className="bg-white rounded-lg border shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <Settings className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <h3 className="font-semibold">Company Logo</h3>
              <p className="text-sm text-gray-600">Upload organization photo</p>
            </div>
          </div>
          <CompanyLogoUpload companyId={companyId} />
        </div>

        {/* Email Settings */}
        <div className="bg-white rounded-lg border shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Mail className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold">Communication</h3>
              <p className="text-sm text-gray-600">Email & Notification settings</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm">Email Service</span>
              <span className="text-sm text-green-600 font-medium">Active</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Marketing Emails</span>
              <span className="text-sm text-gray-500">Enabled</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Support Email</span>
              <span className="text-sm text-gray-500">support@{companyName.toLowerCase().replace(/\s+/g, '')}.com</span>
            </div>
          </div>
        </div>

        {/* Security Settings */}
        <div className="bg-white rounded-lg border shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-red-100 rounded-lg">
              <Lock className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <h3 className="font-semibold">Security</h3>
              <p className="text-sm text-gray-600">Access and authentication</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm">SSO</span>
              <span className="text-sm text-gray-500">Disabled</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">2FA</span>
              <span className="text-sm text-yellow-600 font-medium">Optional</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Password Policy</span>
              <span className="text-sm text-green-600 font-medium">Standard</span>
            </div>
          </div>
        </div>

        {/* Billing Settings removed for super-admin company settings; Billing is managed centrally */}

        {/* Notifications */}
        <div className="bg-white rounded-lg border shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Bell className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <h3 className="font-semibold">Notifications</h3>
              <p className="text-sm text-gray-600">Alert preferences</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm">Email Alerts</span>
              <span className="text-sm text-green-600 font-medium">Enabled</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Push Notifications</span>
              <span className="text-sm text-gray-500">Disabled</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
