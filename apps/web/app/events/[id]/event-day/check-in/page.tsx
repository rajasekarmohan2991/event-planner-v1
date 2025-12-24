"use client"
import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import { CheckCircle, User, Search, Loader2, QrCode, X } from 'lucide-react'
import { BrowserMultiFormatReader } from '@zxing/library'
import { toast } from 'sonner'

export default function CheckInPage() {
  const params = useParams()
  const eventId = params?.id as string
  const [registrations, setRegistrations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [scanning, setScanning] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (!eventId) return
    fetch(`/api/events/${eventId}/registrations`)
      .then(r => r.json())
      .then(d => setRegistrations(d.registrations || []))
      .finally(() => setLoading(false))
  }, [eventId])

  useEffect(() => {
    if (!scanning) return

    const codeReader = new BrowserMultiFormatReader()

    const timeout = setTimeout(() => {
      if (videoRef.current) {
        // Use default camera by passing undefined (not null)
        codeReader.decodeFromVideoDevice(undefined, videoRef.current, (result, err) => {
          if (result) {
            const text = result.getText()
            handleScanText(text)
            setScanning(false)
            codeReader.reset()
          }
        }).catch(err => {
          console.error("Scanner error:", err)
        })
      }
    }, 100)

    return () => {
      clearTimeout(timeout)
      codeReader.reset()
    }
  }, [scanning])

  const handleCheckIn = async (id: string, fromScanner = false) => {
    const registration = registrations.find(r => r.id === id)

    if (!registration) {
      if (fromScanner) toast.error("Invalid QR Code: Registration not found")
      return
    }

    if (registration.checkInStatus === 'CHECKED_IN') {
      if (fromScanner) toast.info(`${registration.attendeeName} is already checked in`)
      return
    }

    try {
      const res = await fetch(`/api/events/${eventId}/check-in`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ registrationId: id })
      })

      if (res.ok) {
        setRegistrations(prev => prev.map(r => r.id === id ? { ...r, checkInStatus: 'CHECKED_IN' } : r))
        toast.success(`Checked in ${registration.attendeeName}`)
      } else {
        toast.error("Failed to check in")
      }
    } catch (error) {
      toast.error("Error checking in")
    }
  }

  const handleScanText = async (text: string) => {
    // Try URL with token param first (supports QR that encodes a link)
    try {
      const maybeUrl = new URL(text)
      const tokenParam = maybeUrl.searchParams.get('token') || maybeUrl.searchParams.get('qr') || maybeUrl.searchParams.get('t')
      if (tokenParam) {
        const res = await fetch(`/api/events/${eventId}/checkin-emergency`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: tokenParam })
        })
        const data = await res.json().catch(() => ({}))
        if (res.ok) {
          // Try to infer registrationId from token
          try {
            const decoded = atob(tokenParam)
            const parsed = JSON.parse(decoded)
            if (parsed?.registrationId) {
              setRegistrations(prev => prev.map(r => r.id === String(parsed.registrationId) ? { ...r, checkInStatus: 'CHECKED_IN' } : r))
            }
          } catch { }
          // Ensure UI sync even if token couldn't be decoded locally
          try {
            const r = await fetch(`/api/events/${eventId}/registrations`)
            const d = await r.json()
            if (d?.registrations) setRegistrations(d.registrations)
          } catch { }
          toast.success(data?.already ? 'Already checked in' : 'Checked in successfully')
        } else {
          toast.error(data?.message || 'Check-in failed')
        }
        return
      }
    } catch { }

    // Try to parse as JSON
    try {
      const parsed = JSON.parse(text)
      if (parsed && parsed.registrationId) {
        // Use token-based simple check-in
        const token = btoa(JSON.stringify(parsed))
        const res = await fetch(`/api/events/${eventId}/checkin-emergency`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token })
        })
        const data = await res.json().catch(() => ({}))
        if (res.ok) {
          setRegistrations(prev => prev.map(r => r.id === String(parsed.registrationId) ? { ...r, checkInStatus: 'CHECKED_IN' } : r))
          toast.success(data?.already ? 'Already checked in' : 'Checked in successfully')
        } else {
          toast.error(data?.message || 'Check-in failed')
        }
        return
      }
    } catch { }
    // Try to treat as base64 token
    try {
      const decoded = atob(text)
      const parsed = JSON.parse(decoded)
      if (parsed && parsed.registrationId) {
        const res = await fetch(`/api/events/${eventId}/checkin-emergency`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: text })
        })
        const data = await res.json().catch(() => ({}))
        if (res.ok) {
          setRegistrations(prev => prev.map(r => r.id === String(parsed.registrationId) ? { ...r, checkInStatus: 'CHECKED_IN' } : r))
          try {
            const r = await fetch(`/api/events/${eventId}/registrations`)
            const d = await r.json()
            if (d?.registrations) setRegistrations(d.registrations)
          } catch { }
          toast.success(data?.already ? 'Already checked in' : 'Checked in successfully')
        } else {
          toast.error(data?.message || 'Check-in failed')
        }
        return
      }
    } catch { }
    // Fallback: assume text is registration ID
    await handleCheckIn(text, true)
  }

  const filtered = registrations.filter(r =>
    r.attendeeName?.toLowerCase().includes(search.toLowerCase()) ||
    r.email?.toLowerCase().includes(search.toLowerCase())
  )

  const stats = {
    total: registrations.length,
    checkedIn: registrations.filter(r => r.checkInStatus === 'CHECKED_IN').length
  }

  if (loading) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="w-8 h-8 animate-spin" /></div>

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <h1 className="text-3xl font-bold">Event Check-In</h1>
        <button
          onClick={() => setScanning(!scanning)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${scanning
              ? 'bg-red-100 text-red-700 hover:bg-red-200'
              : 'bg-indigo-600 text-white hover:bg-indigo-700'
            }`}
        >
          {scanning ? (
            <>
              <X className="w-5 h-5" />
              Stop Scanning
            </>
          ) : (
            <>
              <QrCode className="w-5 h-5" />
              Scan QR Code
            </>
          )}
        </button>
      </div>

      {scanning && (
        <div className="mb-8 p-4 bg-black rounded-xl overflow-hidden shadow-lg mx-auto max-w-md">
          <div className="relative aspect-square bg-black rounded-lg overflow-hidden">
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 border-2 border-white/30 rounded-lg pointer-events-none">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border-2 border-green-500 rounded-lg shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]" />
            </div>
            <div className="absolute bottom-4 left-0 right-0 text-center text-white text-sm font-medium bg-black/50 py-2">
              Align QR code within the frame
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-lg border p-4 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <User className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-sm font-medium text-gray-600">Total Registrations</p>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white rounded-lg border p-4 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-sm font-medium text-gray-600">Checked In</p>
          </div>
          <p className="text-3xl font-bold text-green-600">{stats.checkedIn}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg border shadow-sm p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase">Attendee</th>
                <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="text-right p-4 text-xs font-semibold text-gray-500 uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={3} className="p-8 text-center text-gray-500">
                    No registrations found
                  </td>
                </tr>
              ) : (
                filtered.map(reg => (
                  <tr key={reg.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4">
                      <div className="font-medium text-gray-900">{reg.attendeeName || 'N/A'}</div>
                      <div className="text-sm text-gray-500">{reg.email}</div>
                    </td>
                    <td className="p-4">
                      {reg.checkInStatus === 'CHECKED_IN' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircle className="w-3 h-3" /> Checked In
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      {reg.checkInStatus !== 'CHECKED_IN' && (
                        <button
                          onClick={() => handleCheckIn(reg.id)}
                          className="px-3 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded hover:bg-indigo-700 transition-colors"
                        >
                          Check In
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
