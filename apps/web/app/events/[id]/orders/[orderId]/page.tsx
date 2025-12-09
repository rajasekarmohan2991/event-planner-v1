"use client"
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'

export default function OrderDetailPage() {
  const params = useParams<{ id: string; orderId: string }>()
  const router = useRouter()
  const eventId = String(params?.id || '')
  const orderId = String(params?.orderId || '')
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true); setError(null)
        const res = await fetch(`/api/events/${eventId}/orders/${orderId}`, { cache: 'no-store' })
        if (!res.ok) throw new Error(`Failed (${res.status})`)
        const j = await res.json()
        setData(j)
      } catch (e: any) {
        setError(e?.message || 'Failed to load order')
      } finally { setLoading(false) }
    }
    if (eventId && orderId) load()
  }, [eventId, orderId])

  if (loading) return <div className="p-4 rounded border bg-white text-sm">Loading…</div>
  if (error) return <div className="p-4 rounded border bg-rose-50 text-rose-700 text-sm">{error}</div>
  if (!data) return <div className="p-4 rounded border bg-white text-sm">Not found</div>

  const total = Number(data?.totalInr ?? 0)
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Order {data.id}</h1>
          <p className="text-sm text-muted-foreground">Event ID: {eventId}</p>
        </div>
        <button onClick={() => router.push(`/events/${eventId}/orders`)} className="rounded-md border px-3 py-1.5 text-sm hover:bg-slate-50">Back</button>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="rounded border bg-white p-4">
          <div className="font-medium">Buyer</div>
          <div className="mt-2 text-sm">{data?.buyerName || '—'}</div>
          <div className="text-sm text-muted-foreground">{data?.buyerEmail || '—'}</div>
        </div>
        <div className="rounded border bg-white p-4">
          <div className="font-medium">Payment</div>
          <div className="mt-2 text-sm">Status: <span className="font-semibold">{data?.paymentStatus || '—'}</span></div>
          <div className="text-sm">Reference: {data?.paymentRef || '—'}</div>
          <div className="text-sm">Created: {new Date(data?.createdAt).toLocaleString()}</div>
        </div>
        <div className="rounded border bg-white p-4">
          <div className="font-medium">Total</div>
          <div className="mt-2 text-2xl font-semibold">₹{total.toLocaleString()}</div>
        </div>
      </div>

      <div className="rounded-lg border overflow-hidden bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="text-left px-4 py-3">Item</th>
              <th className="text-left px-4 py-3">Ticket</th>
              <th className="text-left px-4 py-3">Qty</th>
              <th className="text-left px-4 py-3">Price</th>
            </tr>
          </thead>
          <tbody>
            {(data?.items || []).map((it: any) => (
              <tr key={it.id} className="border-t">
                <td className="px-4 py-3">{it.name || '—'}</td>
                <td className="px-4 py-3">{it.ticketId || '—'}</td>
                <td className="px-4 py-3">{it.qty}</td>
                <td className="px-4 py-3">₹{Number(it.priceInr || 0).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
