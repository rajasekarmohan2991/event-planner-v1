"use client"

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { Scan, X, Check, AlertCircle, ArrowLeft } from 'lucide-react'
import { useZxingScanner } from '@/app/lib/useZxingScanner'

export default function EventCheckinScannerPage() {
  const params = useParams()
  const eventId = params?.id as string
  const { data: session, status } = useSession()
  const router = useRouter()

  const [result, setResult] = useState<any | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [checkingIn, setCheckingIn] = useState(false)
  const [checkInResult, setCheckInResult] = useState<any | null>(null)

  const { videoRef, start, stop, active, error: scannerError } = useZxingScanner({
    onDecode: (result) => {
      handleQRDetected(result)
    }
  })

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
    }
  }, [status, router])

  // Start scanner automatically on mount
  useEffect(() => {
    start()
    return () => {
      stop()
    }
  }, [])

  const handleQRDetected = (text: string) => {
    stop()
    try {
      let attendeeData: any

      if (text.startsWith('http')) {
        const url = new URL(text)

        // 1. Try to get token from query param (base64 encoded JSON)
        const token = url.searchParams.get('token')
        if (token) {
          try {
            const decoded = atob(token)
            attendeeData = JSON.parse(decoded)
          } catch (e) {
            console.error('Failed to parse token from URL')
          }
        }

        // 2. If no token, check for registrationId in query
        if (!attendeeData) {
          const regId = url.searchParams.get('registrationId')
          if (regId) {
            attendeeData = { registrationId: regId, eventId }
          }
        }

        // 3. Fallback to path-based: .../checkin/[registrationId]
        if (!attendeeData) {
          const parts = url.pathname.split('/')
          const regId = parts[parts.length - 1]
          if (regId && regId !== 'checkin') {
            attendeeData = {
              registrationId: regId,
              eventId: eventId,
              isUrl: true
            }
          }
        }

        if (!attendeeData) throw new Error('Could not identify registration in URL')

      } else {
        // Handle JSON format
        attendeeData = JSON.parse(text)
      }

      setResult(attendeeData)
      // Auto check-in
      processCheckIn(attendeeData)
    } catch (e) {
      console.error('QR Parse error:', e)
      setError('Invalid QR Code format')
    }
  }

  const processCheckIn = async (attendeeData: any) => {
    try {
      setCheckingIn(true)
      setError(null)

      // Validate event ID match
      if (attendeeData.eventId && attendeeData.eventId !== eventId) {
        throw new Error('This ticket is for a different event')
      }

      const response = await fetch(`/api/events/${eventId}/event-day/checkin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registrationId: attendeeData.registrationId,
          email: attendeeData.email
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Check-in failed')
      }

      setCheckInResult({
        success: true,
        attendee: attendeeData,
        ...data
      })
    } catch (err: any) {
      setError(err.message || 'Check-in failed')
      setCheckInResult({ success: false })
    } finally {
      setCheckingIn(false)
    }
  }

  const resetScanner = () => {
    setResult(null)
    setError(null)
    setCheckInResult(null)
    start()
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/80 to-transparent z-10 flex justify-between items-center">
        <button onClick={() => router.back()} className="p-2 rounded-full bg-white/10 backdrop-blur-sm">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-bold">Scanner</h1>
        <div className="w-10" />
      </div>

      {/* Scanner View */}
      {!result && !checkInResult && (
        <div className="relative h-screen flex flex-col">
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            muted
            playsInline
          />

          {/* Overlay */}
          <div className="absolute inset-0 border-[40px] border-black/50 flex items-center justify-center">
            <div className="w-64 h-64 border-2 border-white/50 rounded-lg relative">
              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-green-500 -mt-1 -ml-1"></div>
              <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-green-500 -mt-1 -mr-1"></div>
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-green-500 -mb-1 -ml-1"></div>
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-green-500 -mb-1 -mr-1"></div>
            </div>
          </div>

          {/* Status Text */}
          <div className="absolute bottom-20 left-0 right-0 text-center p-4">
            <p className="text-white/80 mb-2">Align QR code within the frame</p>
            {scannerError && (
              <p className="text-red-400 text-sm bg-black/60 p-2 rounded inline-block">{scannerError}</p>
            )}
          </div>
        </div>
      )}

      {/* Processing / Result View */}
      {(result || checkInResult) && (
        <div className="h-screen flex items-center justify-center p-6 bg-gray-900">
          <div className="bg-white text-gray-900 w-full max-w-sm rounded-2xl p-6 text-center shadow-xl">
            {checkingIn && (
              <div className="py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                <h3 className="text-xl font-bold">Checking In...</h3>
              </div>
            )}

            {!checkingIn && error && (
              <div className="py-4">
                <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <X className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-red-600 mb-2">Check-in Failed</h3>
                <p className="text-gray-600 mb-6">{error}</p>
                <button onClick={resetScanner} className="w-full py-3 bg-gray-900 text-white rounded-xl font-semibold">
                  Scan Next
                </button>
              </div>
            )}

            {!checkingIn && checkInResult?.success && (
              <div className="py-4">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-green-600 mb-1">Checked In!</h3>
                <p className="text-gray-500 text-sm mb-4">{new Date().toLocaleTimeString()}</p>

                <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
                  <p className="text-xs text-gray-500 uppercase font-bold mb-1">Attendee</p>
                  <p className="font-bold text-lg">{checkInResult.attendee.email}</p>
                  <p className="text-gray-600">ID: {checkInResult.attendee.registrationId}</p>
                </div>

                <button onClick={resetScanner} className="w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold shadow-lg shadow-indigo-200">
                  Scan Next
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
