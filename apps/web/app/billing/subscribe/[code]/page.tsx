"use client"

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'

export default function SubscriptionPayPage() {
  const params = useParams<{ code: string }>()
  const router = useRouter()
  const code = String(params?.code || '')

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [details, setDetails] = useState<any>(null)
  const [email, setEmail] = useState('')
  const [activating, setActivating] = useState(false)
  const [activated, setActivated] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const res = await fetch(`/api/billing/subscribe/${code}`, { cache: 'no-store' })
        if (!res.ok) {
          setError('Invalid or expired link')
          return
        }
        const data = await res.json()
        setDetails(data)
        if (data.email) setEmail(data.email)
      } catch (e:any) {
        setError('Failed to load link')
      } finally {
        setLoading(false)
      }
    }
    if (code) load()
  }, [code])

  const payAndActivate = async () => {
    try {
      setActivating(true)
      const res = await fetch(`/api/billing/subscribe/${code}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email || undefined })
      })
      if (!res.ok) {
        setError('Activation failed')
        return
      }
      setActivated(true)
    } finally {
      setActivating(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-pulse text-gray-500">Loading…</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="bg-white border rounded-xl p-6 w-full max-w-md text-center">
          <div className="text-red-600 font-semibold mb-2">Subscription Link Error</div>
          <div className="text-sm text-gray-600 mb-4">{error}</div>
          <button onClick={()=> router.push('/')} className="px-4 py-2 bg-gray-900 text-white rounded">Go Home</button>
        </div>
      </div>
    )
  }

  const amount = (Number(details?.amountInr || 0)).toLocaleString('en-IN')

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-blue-50 p-6">
      <div className="bg-white border rounded-2xl shadow-sm p-6 w-full max-w-lg">
        <div className="mb-4">
          <div className="text-xs text-gray-500">Subscription</div>
          <div className="text-xl font-semibold">{details?.plan} – {details?.period}</div>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
          <div className="bg-gray-50 rounded p-3">
            <div className="text-gray-600 text-xs">Tenant</div>
            <div className="font-semibold truncate" title={details?.tenantId}>{details?.tenantId}</div>
          </div>
          <div className="bg-gray-50 rounded p-3">
            <div className="text-gray-600 text-xs">Amount</div>
            <div className="font-semibold">₹{amount}</div>
          </div>
        </div>
        {!activated ? (
          <div className="space-y-4">
            <div>
              <label className="block text-xs mb-1">Billing Email</label>
              <input className="w-full border rounded px-3 py-2" type="email" value={email} onChange={(e)=> setEmail(e.target.value)} />
            </div>
            <button disabled={activating} onClick={payAndActivate} className="w-full py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50">
              {activating ? 'Processing…' : `Pay ₹${amount} & Activate`}
            </button>
            <div className="text-xs text-gray-500 text-center">Payment is simulated for now. Clicking the button activates your plan.</div>
          </div>
        ) : (
          <div className="text-center space-y-3">
            <div className="text-green-600 font-semibold">Subscription Activated</div>
            <div className="text-sm text-gray-600">Your plan is now active. You can close this page.</div>
            <button onClick={()=> router.push('/')} className="px-4 py-2 bg-gray-900 text-white rounded">Go Home</button>
          </div>
        )}
      </div>
    </div>
  )
}
