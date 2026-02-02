'use client'

import { useEffect, useState } from 'react'
import { Building2, Check, X, DollarSign } from 'lucide-react'

export default function ExhibitorApprovalsPage() {
  const [pending, setPending] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [amounts, setAmounts] = useState<Record<string, string>>({})

  useEffect(() => {
    fetch('/api/exhibitors/pending-approvals')
      .then(r => r.json())
      .then(d => { setPending(d.exhibitors || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const approve = async (id: string, eventId: string) => {
    const amt = amounts[id]
    if (!amt || parseFloat(amt) <= 0) return alert('Enter valid amount')
    if (!confirm(`Approve with ₹${amt}?`)) return
    
    try {
      await fetch(`/api/events/${eventId}/exhibitors/${id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ finalAmount: parseFloat(amt) })
      })
      alert('Approved! Email sent.')
      window.location.reload()
    } catch (e) { alert('Failed') }
  }

  const reject = async (id: string, eventId: string) => {
    const reason = prompt('Reason:')
    if (reason === null) return
    
    try {
      await fetch(`/api/events/${eventId}/exhibitors/${id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      })
      alert('Rejected')
      window.location.reload()
    } catch (e) { alert('Failed') }
  }

  if (loading) return <div className="p-8">Loading...</div>

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Exhibitor Approvals</h1>

        {pending.length === 0 ? (
          <div className="bg-white rounded-lg p-12 text-center">
            <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Pending Approvals</h3>
          </div>
        ) : (
          <div className="space-y-4">
            {pending.map((ex) => (
              <div key={ex.id} className="bg-white rounded-lg p-6 border-l-4 border-yellow-400">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-2">{ex.companyName}</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
                      <div>Contact: {ex.contactName}</div>
                      <div>Email: {ex.contactEmail}</div>
                      <div>Phone: {ex.contactPhone}</div>
                      <div>Event: {ex.eventName}</div>
                      <div>Booth: {ex.boothSize} ({ex.boothType})</div>
                      <div>Booths: {ex.numberOfBooths}</div>
                      <div>Calculated: ₹{ex.totalAmount}</div>
                      <div>Date: {new Date(ex.createdAt).toLocaleDateString()}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4" />
                      <input
                        type="number"
                        placeholder="Final Amount"
                        value={amounts[ex.id] || ex.totalAmount}
                        onChange={(e) => setAmounts({...amounts, [ex.id]: e.target.value})}
                        className="px-3 py-2 border rounded-lg w-40"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => approve(ex.id, ex.eventId)}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                    >
                      <Check className="w-4 h-4" />
                      Approve
                    </button>
                    <button
                      onClick={() => reject(ex.id, ex.eventId)}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
                    >
                      <X className="w-4 h-4" />
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
