'use client'

import { useEffect, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'

interface Registration {
  id: string
  eventId: string
  email?: string
  priceInr?: number
  status: string
  createdAt: string
}

export default function MyTicketsPage() {
  const [regs, setRegs] = useState<Registration[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        setError(null)
        const res = await fetch('/api/account/my-tickets', { credentials: 'include' })
        const data = await res.json()
        if (!res.ok) {
          throw new Error(data?.error || 'Failed to load tickets')
        }
        setRegs(data.registrations || [])
      } catch (e: any) {
        setError(e?.message || 'Failed to load tickets')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) return <div className="p-6">Loading your tickets...</div>
  if (error) return <div className="p-6 text-red-600">{error}</div>

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Tickets</h1>
        <p className="text-sm text-gray-600">Show the QR code at entry. Keep this page handy on event day.</p>
      </div>

      {regs.length === 0 && (
        <div className="p-6 border rounded bg-gray-50">No tickets found.</div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {regs.map(r => (
          <div key={r.id} className="rounded-lg border bg-white p-4 space-y-3">
            <div className="text-sm text-gray-600">Registration</div>
            <div className="text-lg font-semibold">#{r.id.slice(0, 8)}</div>
            <div className="text-xs text-gray-500">Event: {r.eventId}</div>
            <div className="text-xs">Status: <span className="font-medium">{r.status}</span></div>
            <div className="text-xs">Booked On: {new Date(r.createdAt).toLocaleString()}</div>
            {typeof r.priceInr === 'number' && (
              <div className="text-sm font-semibold">Paid: ₹{r.priceInr}</div>
            )}
            <div className="flex items-center justify-center pt-2">
              <div className="bg-white p-3 rounded border">
                <QRCodeSVG value={`${window.location.origin}/events/${r.eventId}/checkin/${r.id}`} size={160} level="M" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
