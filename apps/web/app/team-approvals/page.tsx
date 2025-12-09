'use client'

import { useEffect, useState } from 'react'
import { UserCheck, UserX, Mail, Calendar } from 'lucide-react'

export default function TeamApprovalsPage() {
  const [pending, setPending] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)

  useEffect(() => {
    loadPending()
  }, [])

  const loadPending = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/team/pending-approvals')
      if (!res.ok) throw new Error('Failed to load')
      const data = await res.json()
      setPending(data.members || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (eventId: string, email: string) => {
    if (!confirm(`Approve ${email}?`)) return
    try {
      setProcessing(email)
      const res = await fetch(`/api/events/${eventId}/team/approve?email=${encodeURIComponent(email)}`, {
        method: 'POST'
      })
      if (!res.ok) throw new Error('Failed')
      alert('Approved!')
      await loadPending()
    } catch (e: any) {
      alert(e.message || 'Failed')
    } finally {
      setProcessing(null)
    }
  }

  const handleReject = async (eventId: string, email: string) => {
    if (!confirm(`Reject ${email}?`)) return
    try {
      setProcessing(email)
      const res = await fetch(`/api/events/${eventId}/team/reject?email=${encodeURIComponent(email)}`, {
        method: 'POST'
      })
      if (!res.ok) throw new Error('Failed')
      alert('Rejected')
      await loadPending()
    } catch (e: any) {
      alert(e.message || 'Failed')
    } finally {
      setProcessing(null)
    }
  }

  if (loading) return <div className="p-8">Loading...</div>

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Team Member Approvals</h1>

        {pending.length === 0 ? (
          <div className="bg-white rounded-lg p-12 text-center">
            <UserCheck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Pending Approvals</h3>
          </div>
        ) : (
          <div className="space-y-4">
            {pending.map((m) => (
              <div key={`${m.eventId}-${m.email}`} className="bg-white rounded-lg p-6 border-l-4 border-yellow-400">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-2">{m.name || m.email}</h3>
                    <div className="text-sm text-gray-600 space-y-1">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        {m.email}
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Event: {m.eventName}
                      </div>
                      <div>Role: {m.role}</div>
                      <div className="text-xs text-gray-500">
                        Invited by {m.invitedBy} on {new Date(m.invitedAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => handleApprove(m.eventId, m.email)}
                      disabled={processing === m.email}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                    >
                      <UserCheck className="w-4 h-4 inline mr-1" />
                      Approve
                    </button>
                    <button
                      onClick={() => handleReject(m.eventId, m.email)}
                      disabled={processing === m.email}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                    >
                      <UserX className="w-4 h-4 inline mr-1" />
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
