"use client"

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { CheckCircle, XCircle, Clock, RefreshCw, Users, Mail, Ticket } from 'lucide-react'

type RegistrationApproval = { 
  id: string
  registrationId: string
  attendeeName: string
  email: string
  phone?: string
  ticketType: string
  ticketPrice: number
  requestedAt: string
  status: 'PENDING' | 'APPROVED' | 'DENIED'
  notes?: string
}

export default function RegistrationApprovalsPage() {
  const params = useParams<{ id: string }>()
  const eventId = String(params?.id || '')
  const [items, setItems] = useState<RegistrationApproval[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actingId, setActingId] = useState<string | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  const load = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch(`/api/events/${eventId}/registrations/approvals`, { cache: 'no-store' })
      if (!res.ok) throw new Error(`Failed to load (${res.status})`)
      const data = await res.json()
      setItems(Array.isArray(data) ? data : data.approvals || [])
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
      const res = await fetch(`/api/events/${eventId}/registrations/approvals`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          registrationIds: [registrationId], 
          action: action === 'approve' ? 'approve' : 'reject',
          notes: action === 'deny' ? 'Registration denied by admin' : null
        })
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || error.message || 'Action failed')
      }
      const result = await res.json()
      console.log('✅ Action completed:', result)
      await load()
    } catch (e: any) {
      console.error('❌ Action error:', e)
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
            <Users className="h-5 w-5" />
            Registration Approvals
          </h1>
          <p className="text-sm text-muted-foreground">Event ID: {eventId}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <div className={`w-2 h-2 rounded-full ${autoRefresh ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
            <span>{autoRefresh ? 'Live Updates' : 'Manual Mode'}</span>
            <span>• Last updated: {lastUpdated.toLocaleTimeString()}</span>
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
            <p className="text-gray-600">Loading approvals...</p>
          </div>
        </div>
      ) : error ? (
        <div className="rounded-md border bg-red-50 p-4 text-sm text-red-700 flex items-center gap-2">
          <XCircle className="h-4 w-4" />
          {error}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-lg border bg-white p-12 text-center">
          <Clock className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Pending Registrations</h3>
          <p className="text-muted-foreground">All registrations have been processed or no approvals are required.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map(item => (
            <div key={item.id} className="rounded-lg border bg-white p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                      <Users className="h-5 w-5 text-indigo-600" />
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
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Ticket Type:</span>
                      <div className="flex items-center gap-1 mt-1">
                        <Ticket className="h-3 w-3 text-gray-400" />
                        <span className="font-medium">{item.ticketType}</span>
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-600">Price:</span>
                      <div className="font-medium mt-1">{formatCurrency(item.ticketPrice)}</div>
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

                  {item.notes && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-md">
                      <span className="text-gray-600 text-sm">Notes:</span>
                      <p className="text-sm mt-1">{item.notes}</p>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2 ml-6">
                  <button
                    className={`inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium ${actingId === item.id ? 'opacity-60 pointer-events-none' : ''}`}
                    onClick={() => act(item.registrationId, 'approve')}
                    disabled={actingId === item.id}
                  >
                    <CheckCircle className="h-4 w-4" />
                    Approve
                  </button>
                  <button
                    className={`inline-flex items-center gap-2 px-4 py-2 border border-red-300 text-red-700 rounded-md hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium ${actingId === item.id ? 'opacity-60 pointer-events-none' : ''}`}
                    onClick={() => act(item.registrationId, 'deny')}
                    disabled={actingId === item.id}
                  >
                    <XCircle className="h-4 w-4" />
                    Deny
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
