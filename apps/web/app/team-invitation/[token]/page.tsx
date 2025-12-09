'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Check, X, Calendar } from 'lucide-react'

export default function TeamInvitationPage() {
  const params = useParams()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleAccept = async () => {
    if (!params?.token) return
    if (!confirm('Accept this team invitation?')) return
    
    setLoading(true)
    try {
      const res = await fetch(`/api/team-invitations/${params.token}/accept`, {
        method: 'POST'
      })
      
      if (res.ok) {
        setMessage('✅ Invitation accepted! You have joined the team.')
        setTimeout(() => router.push('/dashboard'), 2000)
      } else {
        const data = await res.json()
        setMessage(`❌ ${data.message || 'Failed to accept invitation'}`)
      }
    } catch (e) {
      setMessage('❌ Error accepting invitation')
    } finally {
      setLoading(false)
    }
  }

  const handleReject = async () => {
    if (!params?.token) return
    const reason = prompt('Reason for rejection (optional):')
    if (reason === null) return
    
    setLoading(true)
    try {
      const res = await fetch(`/api/team-invitations/${params.token}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      })
      
      if (res.ok) {
        setMessage('Invitation rejected')
        setTimeout(() => router.push('/'), 2000)
      } else {
        const data = await res.json()
        setMessage(`❌ ${data.message || 'Failed to reject invitation'}`)
      }
    } catch (e) {
      setMessage('❌ Error rejecting invitation')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-6">
          <Calendar className="w-16 h-16 text-blue-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Team Invitation</h1>
          <p className="text-gray-600">You've been invited to join an event team</p>
        </div>

        {message ? (
          <div className={`p-4 rounded-lg text-center ${message.startsWith('✅') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
            {message}
          </div>
        ) : (
          <div className="space-y-4">
            <button
              onClick={handleAccept}
              disabled={loading}
              className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Check className="w-5 h-5" />
              Accept Invitation
            </button>
            <button
              onClick={handleReject}
              disabled={loading}
              className="w-full px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <X className="w-5 h-5" />
              Reject Invitation
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
