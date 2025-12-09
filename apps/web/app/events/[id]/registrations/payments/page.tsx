"use client"

import { useEffect, useState } from 'react'
import { CreditCard, ExternalLink, RefreshCw } from 'lucide-react'

type Payment = {
  id: number
  eventId: number
  ticketId: number
  ticketName: string
  stripePaymentIntentId: string
  amountInMinor: number
  currency: string
  status: string
  metadataJson: string
  createdAt: string
}

type StripeConfig = {
  publishableKey: string
}

export default function PaymentsPage({ params }: { params: { id: string } }) {
  const [payments, setPayments] = useState<Payment[]>([])
  const [stripeConfig, setStripeConfig] = useState<StripeConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [creatingPayment, setCreatingPayment] = useState(false)

  // Load payments and Stripe config
  useEffect(() => {
    const loadData = async () => {
      try {
        const base = process.env.NEXT_PUBLIC_API_BASE_URL || ''
        const [paymentsRes, configRes] = await Promise.all([
          fetch(`${base}/api/events/${params.id}/payments`),
          fetch(`${base}/api/events/${params.id}/payments/stripe-config`)
        ])

        if (paymentsRes.ok) {
          const paymentsData = await paymentsRes.json()
          setPayments(Array.isArray(paymentsData) ? paymentsData : [])
        }

        if (configRes.ok) {
          const configData = await configRes.json()
          setStripeConfig(configData)
        }
      } catch (error) {
        console.error('Failed to load data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [params.id])

  const formatAmount = (amountInMinor: number, currency: string) => {
    const amount = amountInMinor / 100
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'SUCCEEDED': return 'bg-green-100 text-green-800'
      case 'PENDING': return 'bg-yellow-100 text-yellow-800'
      case 'PROCESSING': return 'bg-blue-100 text-blue-800'
      case 'FAILED': return 'bg-red-100 text-red-800'
      case 'CANCELLED': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const refreshPayments = async () => {
    setLoading(true)
    try {
      const base = process.env.NEXT_PUBLIC_API_BASE_URL || ''
      const res = await fetch(`${base}/api/events/${params.id}/payments`)
      if (res.ok) {
        const data = await res.json()
        setPayments(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error('Failed to refresh payments:', error)
    } finally {
      setLoading(false)
    }
  }

  const createTestPayment = async () => {
    setCreatingPayment(true)
    try {
      const base = process.env.NEXT_PUBLIC_API_BASE_URL || ''
      // For demo: create payment for first available ticket
      const res = await fetch(`${base}/api/events/${params.id}/payments/create-intent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketId: 1, // This should be dynamically determined
          quantity: 1,
          metadata: { test: true }
        })
      })

      if (res.ok) {
        await refreshPayments()
      } else {
        const error = await res.text()
        alert('Failed to create test payment: ' + error)
      }
    } catch (error) {
      alert('Failed to create test payment: ' + (error as Error).message)
    } finally {
      setCreatingPayment(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading payments...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Payments</h1>
          <p className="text-sm text-muted-foreground">Event ID: {params.id}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={refreshPayments}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={createTestPayment}
            disabled={creatingPayment}
            className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            <CreditCard className="h-4 w-4" />
            {creatingPayment ? 'Creating...' : 'Test Payment'}
          </button>
        </div>
      </div>

      {stripeConfig && (
        <div className="rounded-lg border bg-blue-50 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-blue-900">Stripe Integration</h3>
              <p className="text-sm text-blue-700">
                Publishable Key: {stripeConfig.publishableKey.substring(0, 12)}...
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
                Connected
              </span>
              <a
                href="https://dashboard.stripe.com/test/apikeys"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800"
              >
                <ExternalLink className="h-3 w-3" />
                Dashboard
              </a>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-lg border bg-white">
        <div className="border-b px-6 py-4">
          <h3 className="text-base font-medium">Payment History ({payments.length})</h3>
        </div>
        <div className="p-6">
          {payments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No payments yet</p>
              <p className="text-sm">Create a test payment to see it here</p>
            </div>
          ) : (
            <div className="space-y-4">
              {payments.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between rounded-lg border p-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="font-medium">{payment.ticketName}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatAmount(payment.amountInMinor, payment.currency)} • {formatDate(payment.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(payment.status)}`}>
                      {payment.status}
                    </span>
                    {payment.stripePaymentIntentId && (
                      <a
                        href={`https://dashboard.stripe.com/test/payments/${payment.stripePaymentIntentId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="rounded-lg border bg-amber-50 p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100">
              <span className="text-sm font-medium text-amber-800">!</span>
            </div>
          </div>
          <div>
            <h4 className="font-medium text-amber-900">Test Mode Active</h4>
            <p className="text-sm text-amber-700">
              All payments are processed in Stripe test mode. Use test card numbers like 4242 4242 4242 4242.
              Webhook endpoint: <code className="bg-amber-100 px-1 py-0.5 rounded">/api/webhooks/stripe</code>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
