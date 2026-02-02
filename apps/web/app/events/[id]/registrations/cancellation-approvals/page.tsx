"use client"

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { XCircle, CheckCircle, Clock, RefreshCw, UserX, Mail, Ticket, DollarSign } from 'lucide-react'

type CancellationApproval = {
  id: string
  registrationId: string
  attendeeName: string
  email: string
  phone?: string
  ticketType: string
  ticketPrice: number
  originalPayment: number
  refundAmount: number
  cancellationReason?: string
  requestedAt: string
  status: 'PENDING' | 'APPROVED' | 'DENIED'
  notes?: string
}

export default function CancellationApprovalsPage() {
  const params = useParams<{ id: string }>()
  const eventId = String(params?.id || '')
  const [items, setItems] = useState<CancellationApproval[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actingId, setActingId] = useState<string | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setLastUpdated(new Date())
  }, [])

  const load = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch(`/api/events/${eventId}/registrations/cancellation-approvals`, { cache: 'no-store' })
      if (!res.ok) throw new Error(`Failed to load (${res.status})`)
      const data = await res.json()
      setItems(Array.isArray(data) ? data : data.items || [])
      setLastUpdated(new Date())
    } catch (e: any) {
      setError(e?.message || 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (eventId) {
      // Initial load
      load()
      
      // Auto-refresh every 15 seconds
      let interval: NodeJS.Timeout
      if (autoRefresh) {
        interval = setInterval(() => {
          load()
        }, 15000)
      }
      
      return () => {
        if (interval) clearInterval(interval)
      }
    }
  }, [eventId, autoRefresh])

  const act = async (registrationId: string, action: 'approve'|'deny') => {
    try {
      setActingId(registrationId)
      const res = await fetch(`/api/events/${eventId}/registrations/cancellation-approvals`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          registrationIds: [registrationId], 
          action: action === 'approve' ? 'approve' : 'reject',
          refundAmount: 0, // Can be enhanced to ask user for refund amount
          refundMode: 'NONE'
        })
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.message || 'Action failed')
      }
      const result = await res.json()
      console.log('✅ Cancellation action completed:', result)
      await load()
    } catch (e: any) {
      console.error('❌ Cancellation action error:', e)
      alert(e.message || 'Action failed')
    } finally { setActingId(null) }
  }

  const manualRefresh = async () => {
    await load()
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(amount)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold flex items-center gap-2">
            <UserX className="h-5 w-5" />
            Cancellation Approvals
          </h1>
          <p className="text-sm text-muted-foreground">Event ID: {eventId}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <div className={`w-2 h-2 rounded-full ${autoRefresh ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
            <span>{autoRefresh ? 'Live Updates' : 'Manual Mode'}</span>
            <span>• Last updated: {lastUpdated?.toLocaleTimeString() || 'Never'}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className="px-3 py-1.5 text-sm border rounded-md hover:bg-gray-50"
            >
              {autoRefresh ? 'Disable Auto-refresh' : 'Enable Auto-refresh'}
            </button>
            <button
              onClick={manualRefresh}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent mx-auto mb-4"></div>
            <p className="text-gray-600">Loading cancellation requests...</p>
          </div>
        </div>
      ) : error ? (
        <div className="rounded-md border bg-red-50 p-4 text-sm text-red-700 flex items-center gap-2">
          <XCircle className="h-4 w-4" />
          {error}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-lg border bg-white p-12 text-center">
          <UserX className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Cancellation Requests</h3>
          <p className="text-muted-foreground">No pending cancellation requests found for this event.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map(item => (
            <div key={item.id} className="rounded-lg border bg-white p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                      <UserX className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{item.attendeeName}</h3>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {item.email}
                        </div>
                        {item.phone && (
                          <div className="flex items-center gap-1">
                            <span>📱</span>
                            {item.phone}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm mb-4">
                    <div>
                      <span className="text-gray-600">Ticket Type:</span>
                      <div className="flex items-center gap-1 mt-1">
                        <Ticket className="h-3 w-3 text-gray-400" />
                        <span className="font-medium">{item.ticketType}</span>
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-600">Original Payment:</span>
                      <div className="font-medium mt-1">{formatCurrency(item.originalPayment)}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Refund Amount:</span>
                      <div className="font-medium mt-1 text-green-600">{formatCurrency(item.refundAmount)}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Requested:</span>
                      <div className="font-medium mt-1">{new Date(item.requestedAt).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}</div>
                    </div>
                  </div>

                  {item.cancellationReason && (
                    <div className="mb-4 p-3 bg-gray-50 rounded-md">
                      <span className="text-gray-600 text-sm font-medium">Cancellation Reason:</span>
                      <p className="text-sm mt-1">{item.cancellationReason}</p>
                    </div>
                  )}

                  {item.notes && (
                    <div className="mb-4 p-3 bg-yellow-50 rounded-md">
                      <span className="text-gray-600 text-sm font-medium">Admin Notes:</span>
                      <p className="text-sm mt-1">{item.notes}</p>
                    </div>
                  )}

                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">Processing Fee:</span>
                      <span className="font-medium">{formatCurrency(item.originalPayment - item.refundAmount)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2 ml-6">
                  <button
                    className={`inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium ${actingId === item.id ? 'opacity-60 pointer-events-none' : ''}`}
                    onClick={() => act(item.registrationId, 'approve')}
                    disabled={actingId === item.id}
                  >
                    <CheckCircle className="h-4 w-4" />
                    Approve Refund
                  </button>
                  <button
                    className={`inline-flex items-center gap-2 px-4 py-2 border border-red-300 text-red-700 rounded-md hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium ${actingId === item.id ? 'opacity-60 pointer-events-none' : ''}`}
                    onClick={() => act(item.registrationId, 'deny')}
                    disabled={actingId === item.id}
                  >
                    <XCircle className="h-4 w-4" />
                    Deny Request
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
