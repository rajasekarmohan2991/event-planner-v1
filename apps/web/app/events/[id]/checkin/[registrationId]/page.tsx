'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

export default function CheckinPage() {
  const params = useParams<{ id: string; registrationId: string }>()
  const eventId = String(params?.id || '')
  const registrationId = String(params?.registrationId || '')
  const [status, setStatus] = useState<'pending' | 'success' | 'error'>('pending')
  const [message, setMessage] = useState<string>('Checking in...')

  useEffect(() => {
    const run = async () => {
      try {
        const res = await fetch(`/api/events/${eventId}/event-day/checkin`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ registrationId })
        })
        const data = await res.json()
        if (!res.ok) {
          setStatus('error')
          setMessage(data?.message || 'Check-in failed')
          return
        }
        setStatus('success')
        setMessage('Check-in successful')
      } catch (e: any) {
        setStatus('error')
        setMessage(e?.message || 'Check-in failed')
      }
    }
    if (eventId && registrationId) run()
  }, [eventId, registrationId])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className={`max-w-md w-full rounded-lg border p-6 text-center ${status==='success'?'border-green-300 bg-green-50': status==='error'?'border-red-300 bg-red-50':'border-gray-200 bg-white'}`}>
        <h1 className="text-2xl font-bold mb-2">Event Check-in</h1>
        <p className="text-sm text-gray-700">Event ID: {eventId}</p>
        <p className="text-sm text-gray-700 mb-4">Registration: {registrationId}</p>
        <div className="text-lg font-semibold">{message}</div>
        {status==='error' && (
          <div className="text-xs text-gray-600 mt-2">Ensure the staff device is logged in with Organizer/Staff permissions.</div>
        )}
      </div>
    </div>
  )
}
