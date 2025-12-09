"use client";

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'

interface TenantRow {
  id: string
  name: string
  slug: string
  plan: string
  status: string
  billingEmail?: string
  trialDaysLeft?: number
  subscriptionEndsAt?: string
}

export default function BillingPage() {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(true)
  const [tenants, setTenants] = useState<TenantRow[]>([])
  const [error, setError] = useState<string>('')

  // Upgrade modal state
  const [showModal, setShowModal] = useState(false)
  const [selectedTenant, setSelectedTenant] = useState<TenantRow | null>(null)
  const [plan, setPlan] = useState<'PRO'|'ENTERPRISE'>('PRO')
  const [period, setPeriod] = useState<'MONTHLY'|'YEARLY'>('MONTHLY')
  const [amountInr, setAmountInr] = useState<number>(4999)
  const [email, setEmail] = useState<string>('')
  const [creating, setCreating] = useState(false)
  const [createdLink, setCreatedLink] = useState<{code:string, payUrl:string}|null>(null)

  useEffect(() => {
    // Only SUPER_ADMIN can view this page
    if (!session) return
    const role = String((session as any)?.user?.role || '')
    if (role !== 'SUPER_ADMIN') {
      setError('You do not have permission to view Billing. Only SUPER_ADMIN can access this page.')
      setLoading(false)
      return
    }
    fetchTenants()
  }, [session])

  async function fetchTenants() {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/billing/tenants', { credentials: 'include' })
      if (!res.ok) {
        setError('Failed to load companies')
        return
      }
      const data = await res.json()
      setTenants(data.tenants || [])
    } catch (e:any) {
      setError('Failed to load companies')
    } finally {
      setLoading(false)
    }
  }

  function defaultAmount(p: 'PRO'|'ENTERPRISE', per: 'MONTHLY'|'YEARLY') {
    const base = p === 'PRO' ? 4999 : 14999
    return per === 'MONTHLY' ? base : base * 12
  }

  function openUpgrade(t: TenantRow) {
    setSelectedTenant(t)
    setPlan('PRO')
    setPeriod('MONTHLY')
    setAmountInr(defaultAmount('PRO', 'MONTHLY'))
    setEmail(t.billingEmail || '')
    setCreatedLink(null)
    setShowModal(true)
  }

  async function createLink() {
    if (!selectedTenant) return
    try {
      setCreating(true)
      setCreatedLink(null)
      const res = await fetch('/api/admin/billing/subscription-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ tenantId: selectedTenant.id, plan, period, amountInr: Number(amountInr||0), email: email||undefined })
      })
      if (res.ok) {
        const d = await res.json()
        setCreatedLink({ code: d.code, payUrl: d.payUrl })
      }
    } finally {
      setCreating(false)
    }
  }

  useEffect(() => {
    setAmountInr(defaultAmount(plan, period))
  }, [plan, period])

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Billing & Subscription</h1>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded">{error}</div>
      )}

      {loading ? (
        <div className="text-gray-500">Loading companies…</div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tenants.map(t => (
            <div key={t.id} className="bg-white border rounded-lg p-5 shadow-sm">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="text-sm text-gray-500">Company</div>
                  <div className="font-semibold">{t.name}</div>
                </div>
                <span className={`text-xs px-2 py-1 rounded ${String(t.status).toUpperCase()==='ACTIVE'?'bg-green-100 text-green-700':'bg-yellow-100 text-yellow-700'}`}>{t.status || '-'}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="bg-gray-50 rounded p-2">
                  <div className="text-gray-600 text-xs">Plan</div>
                  <div className="font-semibold">{t.plan || 'FREE'}</div>
                </div>
                <div className="bg-gray-50 rounded p-2">
                  <div className="text-gray-600 text-xs">Trial Left</div>
                  <div className="font-semibold">{t.trialDaysLeft ?? '-'}</div>
                </div>
                <div className="bg-gray-50 rounded p-2 col-span-2">
                  <div className="text-gray-600 text-xs">Subscription Ends</div>
                  <div className="font-semibold">{t.subscriptionEndsAt ? new Date(t.subscriptionEndsAt).toLocaleDateString() : '-'}</div>
                </div>
              </div>
              <div className="mt-4">
                <button onClick={()=>openUpgrade(t)} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded">Upgrade</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && selectedTenant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg p-6 shadow-xl">
            <div className="mb-4">
              <div className="text-xs text-gray-500">Upgrade</div>
              <div className="text-lg font-semibold">{selectedTenant.name}</div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <label className="block text-xs mb-1">Plan</label>
                <select className="w-full border rounded px-2 py-2" value={plan} onChange={(e)=> setPlan(e.target.value as any)}>
                  <option value="PRO">PRO</option>
                  <option value="ENTERPRISE">ENTERPRISE</option>
                </select>
              </div>
              <div>
                <label className="block text-xs mb-1">Period</label>
                <select className="w-full border rounded px-2 py-2" value={period} onChange={(e)=> setPeriod(e.target.value as any)}>
                  <option value="MONTHLY">Monthly</option>
                  <option value="YEARLY">Yearly</option>
                </select>
              </div>
              <div>
                <label className="block text-xs mb-1">Amount (INR)</label>
                <input className="w-full border rounded px-2 py-2" type="number" value={amountInr} onChange={(e)=> setAmountInr(parseInt(e.target.value||'0'))} />
              </div>
              <div>
                <label className="block text-xs mb-1">Billing Email</label>
                <input className="w-full border rounded px-2 py-2" type="email" value={email} onChange={(e)=> setEmail(e.target.value)} />
              </div>
            </div>
            <div className="mt-4 flex gap-2 items-center">
              <button disabled={creating} onClick={createLink} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50">{creating? 'Creating…' : 'Create & Send Link'}</button>
              <button onClick={()=> setShowModal(false)} className="px-4 py-2 border rounded">Close</button>
            </div>
            {createdLink?.payUrl && (
              <div className="mt-4">
                <label className="block text-xs mb-1">Payment Link</label>
                <input readOnly className="w-full border rounded px-2 py-2 text-xs" value={createdLink.payUrl} />
                <a href={createdLink.payUrl} target="_blank" className="text-xs text-indigo-600 underline">Open Link</a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
