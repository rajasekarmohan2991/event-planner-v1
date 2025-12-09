"use client"
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'

export default function OrdersListPage() {
  const params = useParams<{ id: string }>()
  const eventId = String(params?.id || '')
  const router = useRouter()
  const [items, setItems] = useState<Array<{ id: string; buyerEmail?: string | null; totalInr?: number | null; paymentStatus?: string | null; createdAt: string }>>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('')

  const load = async () => {
    try {
      setLoading(true)
      setError(null)
      const params = new URLSearchParams()
      if (q.trim()) params.set('q', q.trim())
      if (status) params.set('status', status)
      const res = await fetch(`/api/events/${eventId}/orders?${params.toString()}`)
      if (!res.ok) throw new Error(`Failed (${res.status})`)
      const data = await res.json()
      setItems(Array.isArray(data.items) ? data.items : [])
    } catch (e: any) {
      setError(e?.message || 'Failed to load orders')
    } finally { setLoading(false) }
  }

  useEffect(() => { if (eventId) load() /* eslint-disable-next-line */ }, [eventId])

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-xl font-semibold">Orders</h1>
        <p className="text-sm text-muted-foreground">Event ID: {eventId}</p>
      </header>

      <div className="flex gap-2 items-end">
        <div>
          <label className="block text-xs text-slate-500">Search</label>
          <input value={q} onChange={e=>setQ(e.target.value)} className="rounded border px-3 py-2 text-sm" placeholder="email or order id" />
        </div>
        <div>
          <label className="block text-xs text-slate-500">Status</label>
          <select value={status} onChange={e=>setStatus(e.target.value)} className="rounded border px-3 py-2 text-sm">
            <option value="">All</option>
            <option value="PAID">PAID</option>
            <option value="PENDING">PENDING</option>
            <option value="FAILED">FAILED</option>
            <option value="REFUNDED">REFUNDED</option>
          </select>
        </div>
        <button onClick={load} className="rounded-md bg-indigo-600 text-white px-3 py-2 text-sm">Apply</button>
      </div>

      {loading ? (
        <div className="rounded border bg-white p-4 text-sm">Loading…</div>
      ) : error ? (
        <div className="rounded border bg-rose-50 p-4 text-sm text-rose-700">{error}</div>
      ) : items.length === 0 ? (
        <div className="rounded border bg-white p-6 text-sm text-muted-foreground">No orders found.</div>
      ) : (
        <div className="rounded-lg border overflow-hidden bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="text-left px-4 py-3">Order</th>
                <th className="text-left px-4 py-3">Buyer</th>
                <th className="text-left px-4 py-3">Amount</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">Created</th>
              </tr>
            </thead>
            <tbody>
              {items.map(it => (
                <tr key={it.id} className="border-t hover:bg-slate-50 cursor-pointer" onClick={()=> router.push(`/events/${eventId}/orders/${it.id}`)}>
                  <td className="px-4 py-3 font-medium truncate">{it.id}</td>
                  <td className="px-4 py-3">{it.buyerEmail || '—'}</td>
                  <td className="px-4 py-3">₹{(it.totalInr ?? 0).toLocaleString()}</td>
                  <td className="px-4 py-3">{it.paymentStatus || '—'}</td>
                  <td className="px-4 py-3">{new Date(it.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
