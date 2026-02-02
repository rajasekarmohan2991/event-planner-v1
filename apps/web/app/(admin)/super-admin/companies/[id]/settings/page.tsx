'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Settings, Globe, Bell, Lock, ArrowLeft, CreditCard, Mail, Trash2, Ban, CheckCircle, RefreshCw, AlertTriangle } from 'lucide-react'

export default function CompanySettingsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const params = useParams()
  const companyId = params?.id as string

  const [loading, setLoading] = useState(true)
  const [companyName, setCompanyName] = useState('')
  const [companyStatus, setCompanyStatus] = useState<'ACTIVE' | 'DISABLED'>('ACTIVE')
  const [billing, setBilling] = useState<any>(null)
  const [creating, setCreating] = useState(false)
  const [plan, setPlan] = useState<'PRO' | 'ENTERPRISE'>('PRO')
  const [period, setPeriod] = useState<'MONTHLY' | 'YEARLY'>('MONTHLY')
  const [amountInr, setAmountInr] = useState<number>(4999)
  const [email, setEmail] = useState<string>('')
  const [createdLink, setCreatedLink] = useState<{ code: string, payUrl: string } | null>(null)
  const [toggling, setToggling] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => {
    async function loadData() {
      if (!companyId) return

      try {
        setLoading(true)
        const companyRes = await fetch(`/api/super-admin/companies/${companyId}`)
        if (companyRes.ok) {
          const data = await companyRes.json()
          setCompanyName(data.company.name)
          setCompanyStatus(data.company.status || 'ACTIVE')
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

  const handleToggleStatus = async () => {
    if (toggling) return
    setToggling(true)
    const newStatus = companyStatus === 'ACTIVE' ? 'DISABLED' : 'ACTIVE'

    try {
      const response = await fetch(`/api/super-admin/companies/${companyId}/status`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })

      if (response.ok) {
        setCompanyStatus(newStatus)
        alert(`Company "${companyName}" ${newStatus === 'ACTIVE' ? 'enabled' : 'disabled'} successfully!`)
      } else {
        const data = await response.json()
        alert(`Failed to update status: ${data.error || data.message}`)
      }
    } catch (error: any) {
      console.error('Status toggle error:', error)
      alert(`Error: ${error.message}`)
    } finally {
      setToggling(false)
    }
  }

  const handleDeleteCompany = async () => {
    if (deleting) return
    setDeleting(true)

    try {
      const response = await fetch(`/api/super-admin/companies/${companyId}/delete`, {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      })

      if (response.ok) {
        alert(`Company "${companyName}" deleted successfully!`)
        router.push('/super-admin/companies')
      } else {
        const data = await response.json()
        alert(`Failed to delete: ${data.error || data.message}`)
      }
    } catch (error: any) {
      console.error('Delete error:', error)
      alert(`Error: ${error.message}`)
    } finally {
      setDeleting(false)
      setShowDeleteConfirm(false)
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

      {/* Danger Zone - Disable/Delete Company */}
      <div className="bg-white rounded-lg border border-red-200 shadow-sm p-6 mt-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-red-100 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-red-600" />
          </div>
          <div>
            <h3 className="font-semibold text-red-700">Danger Zone</h3>
            <p className="text-sm text-gray-600">Irreversible and destructive actions</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Company Status */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-900">
                {companyStatus === 'ACTIVE' ? 'Disable Company' : 'Enable Company'}
              </h4>
              <p className="text-sm text-gray-500">
                {companyStatus === 'ACTIVE'
                  ? 'Disabled companies cannot create events or access their dashboard.'
                  : 'Enable this company to restore full access.'}
              </p>
              <div className="mt-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${companyStatus === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                  Current Status: {companyStatus}
                </span>
              </div>
            </div>
            <button
              onClick={handleToggleStatus}
              disabled={toggling}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors disabled:opacity-50 ${companyStatus === 'ACTIVE'
                ? 'bg-amber-500 hover:bg-amber-600 text-white'
                : 'bg-green-500 hover:bg-green-600 text-white'
                }`}
            >
              {toggling ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : companyStatus === 'ACTIVE' ? (
                <>
                  <Ban className="h-4 w-4" />
                  Disable
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Enable
                </>
              )}
            </button>
          </div>

          {/* Delete Company */}
          <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-100">
            <div>
              <h4 className="font-medium text-red-900">Delete Company</h4>
              <p className="text-sm text-red-600">
                Permanently delete this company and all its data. This action cannot be undone.
              </p>
            </div>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            >
              <Trash2 className="h-4 w-4" />
              Delete Company
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-red-100 rounded-full">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Delete Company</h3>
            </div>

            <p className="text-gray-600 mb-4">
              Are you sure you want to permanently delete <strong>{companyName}</strong>?
            </p>

            <p className="text-sm text-gray-500 mb-4">This will delete:</p>
            <ul className="text-sm text-gray-600 mb-4 list-disc list-inside space-y-1">
              <li>All events and registrations</li>
              <li>All team members</li>
              <li>All invoices and financial data</li>
              <li>All settings and configurations</li>
            </ul>

            <p className="text-red-600 font-semibold mb-6">
              This action cannot be undone!
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteCompany}
                disabled={deleting}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deleting ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    Delete Company
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
