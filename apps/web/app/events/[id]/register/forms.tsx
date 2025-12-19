"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

// Shared interface for invite data
interface InviteData {
  valid: boolean
  email?: string
  inviteCode?: string
  inviteeName?: string
  category?: string
  organization?: string
  discountCode?: string
  error?: string
}

// Virtual Attendee Registration Form
export function VirtualRegistrationForm({ eventId, inviteData }: { eventId: string; inviteData?: InviteData | null }) {
  const router = useRouter()
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: inviteData?.email || "",
    phone: "",
    sessionPreferences: [] as string[]
  })
  const [sessions, setSessions] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  // Fetch event sessions
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const response = await fetch(`/api/events/${eventId}/sessions`)
        if (response.ok) {
          const data = await response.json()
          // Handle both array and object response formats
          const sessionList = Array.isArray(data) ? data : (data.sessions || [])
          setSessions(sessionList)
        }
      } catch (error) {
        console.error('Error fetching sessions:', error)
      }
    }
    fetchSessions()
  }, [eventId])

  const handleSessionToggle = (sessionId: string) => {
    setFormData(prev => ({
      ...prev,
      sessionPreferences: prev.sessionPreferences.includes(sessionId)
        ? prev.sessionPreferences.filter(id => id !== sessionId)
        : [...prev.sessionPreferences, sessionId]
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch(`/api/events/${eventId}/registrations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ type: 'VIRTUAL', data: formData })
      })

      if (res.ok) {
        const registrationData = await res.json()
        // Store registration data for payment page
        localStorage.setItem('pendingRegistration', JSON.stringify(registrationData))
        // Redirect to payment page
        router.push(`/events/${eventId}/register/payment?registrationId=${registrationData.id}`)
      } else {
        const error = await res.json().catch(() => ({ message: 'Failed to submit' }))
        alert(error.message || 'Registration failed')
      }
    } catch (error) {
      alert('Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border p-6 space-y-6">
      <h2 className="text-xl font-semibold border-b pb-3">Event Registration</h2>

      {/* Name */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">First Name *</label>
          <input
            type="text"
            value={formData.firstName}
            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
            placeholder="First Name"
            className="w-full rounded-md border px-3 py-2 text-sm"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Last Name *</label>
          <input
            type="text"
            value={formData.lastName}
            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
            placeholder="Last Name"
            className="w-full rounded-md border px-3 py-2 text-sm"
            required
          />
        </div>
      </div>

      {/* Email */}
      <div>
        <label className="block text-sm font-medium mb-1">Email *</label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          placeholder="your.email@example.com"
          className="w-full rounded-md border px-3 py-2 text-sm"
          required
        />
      </div>

      {/* Phone */}
      <div>
        <label className="block text-sm font-medium mb-1">Phone</label>
        <input
          type="tel"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          placeholder="+1 (555) 123-4567"
          className="w-full rounded-md border px-3 py-2 text-sm"
        />
      </div>

      {/* Session Preferences */}
      {sessions.length > 0 && (
        <div>
          <label className="block text-sm font-medium mb-2">Session Preferences</label>
          <div className="space-y-2 max-h-48 overflow-y-auto border rounded-md p-3">
            {sessions.map((session) => (
              <label key={session.id} className="flex items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={formData.sessionPreferences.includes(session.id)}
                  onChange={() => handleSessionToggle(session.id)}
                  className="mt-0.5"
                />
                <div>
                  <div className="font-medium">{session.title}</div>
                  {session.startTime && (
                    <div className="text-xs text-gray-500">
                      {new Date(session.startTime).toLocaleString()}
                    </div>
                  )}
                  {session.speaker && (
                    <div className="text-xs text-gray-600">Speaker: {session.speaker}</div>
                  )}
                </div>
              </label>
            ))}
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50"
      >
        {loading ? 'Submitting...' : 'Submit Registration'}
      </button>
    </form>
  )
}

// Speaker Registration Form
export function SpeakerRegistrationForm({ eventId }: { eventId: string }) {
  const router = useRouter()
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    jobTitle: "",
    company: "",
    sessionPreferences: [] as string[]
  })
  const [sessions, setSessions] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  // Fetch event sessions
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const response = await fetch(`/api/events/${eventId}/sessions`)
        if (response.ok) {
          const data = await response.json()
          // Handle both array and object response formats
          const sessionList = Array.isArray(data) ? data : (data.sessions || [])
          setSessions(sessionList)
        }
      } catch (error) {
        console.error('Error fetching sessions:', error)
      }
    }
    fetchSessions()
  }, [eventId])

  const handleSessionToggle = (sessionId: string) => {
    setFormData(prev => ({
      ...prev,
      sessionPreferences: prev.sessionPreferences.includes(sessionId)
        ? prev.sessionPreferences.filter(id => id !== sessionId)
        : [...prev.sessionPreferences, sessionId]
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch(`/api/events/${eventId}/registrations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ type: 'SPEAKER', data: formData })
      })

      if (res.ok) {
        const registrationData = await res.json()
        localStorage.setItem('pendingRegistration', JSON.stringify(registrationData))
        router.push(`/events/${eventId}/register/payment?registrationId=${registrationData.id}`)
      } else {
        const error = await res.json().catch(() => ({ message: 'Failed to submit' }))
        alert(error.message || 'Registration failed')
      }
    } catch (error) {
      alert('Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border p-6 space-y-6">
      <h2 className="text-xl font-semibold border-b pb-3">Speaker Registration</h2>

      {/* Name */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">First Name *</label>
          <input
            type="text"
            value={formData.firstName}
            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
            placeholder="First Name"
            className="w-full rounded-md border px-3 py-2 text-sm"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Last Name *</label>
          <input
            type="text"
            value={formData.lastName}
            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
            placeholder="Last Name"
            className="w-full rounded-md border px-3 py-2 text-sm"
            required
          />
        </div>
      </div>

      {/* Email */}
      <div>
        <label className="block text-sm font-medium mb-1">Email *</label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          placeholder="your.email@example.com"
          className="w-full rounded-md border px-3 py-2 text-sm"
          required
        />
      </div>

      {/* Phone */}
      <div>
        <label className="block text-sm font-medium mb-1">Phone</label>
        <input
          type="tel"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          placeholder="+1 (555) 123-4567"
          className="w-full rounded-md border px-3 py-2 text-sm"
        />
      </div>

      {/* Job Title */}
      <div>
        <label className="block text-sm font-medium mb-1">Job Title</label>
        <input
          type="text"
          value={formData.jobTitle}
          onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
          placeholder="e.g. Senior Developer"
          className="w-full rounded-md border px-3 py-2 text-sm"
        />
      </div>

      {/* Company */}
      <div>
        <label className="block text-sm font-medium mb-1">Company</label>
        <input
          type="text"
          value={formData.company}
          onChange={(e) => setFormData({ ...formData, company: e.target.value })}
          placeholder="e.g. Tech Corp"
          className="w-full rounded-md border px-3 py-2 text-sm"
        />
      </div>

      {/* Session Preferences */}
      {sessions.length > 0 && (
        <div>
          <label className="block text-sm font-medium mb-2">Session Preferences</label>
          <div className="space-y-2 max-h-48 overflow-y-auto border rounded-md p-3">
            {sessions.map((session) => (
              <label key={session.id} className="flex items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={formData.sessionPreferences.includes(session.id)}
                  onChange={() => handleSessionToggle(session.id)}
                  className="mt-0.5"
                />
                <div>
                  <div className="font-medium">{session.title}</div>
                  {session.startTime && (
                    <div className="text-xs text-gray-500">
                      {new Date(session.startTime).toLocaleString()}
                    </div>
                  )}
                  {session.speaker && (
                    <div className="text-xs text-gray-600">Speaker: {session.speaker}</div>
                  )}
                </div>
              </label>
            ))}
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50"
      >
        {loading ? 'Submitting...' : 'Submit Speaker Registration'}
      </button>
    </form>
  )
}

