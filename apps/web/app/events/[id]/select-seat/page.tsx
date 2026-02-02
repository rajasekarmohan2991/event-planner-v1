"use client"

import { useState, useEffect } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { Armchair, CheckCircle, XCircle, Loader2 } from 'lucide-react'

interface Seat {
  id: string
  seatNumber: string
  seatCategory: string
  rowNumber: string
  sectionName: string
  status: string
  priceInr: number
}

export default function SeatSelectionPage() {
  const params = useParams<{ id: string }>()
  const searchParams = useSearchParams()
  const router = useRouter()
  const inviteId = searchParams?.get('invite')

  const [loading, setLoading] = useState(true)
  const [seats, setSeats] = useState<Seat[]>([])
  const [selectedSeat, setSelectedSeat] = useState<string | null>(null)
  const [inviteData, setInviteData] = useState<any>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!inviteId) {
      setError('Invalid invite link')
      setLoading(false)
      return
    }

    fetchInviteAndSeats()
  }, [inviteId])

  const fetchInviteAndSeats = async () => {
    try {
      // Fetch invite details
      const inviteRes = await fetch(`/api/events/${params.id}/invites/${inviteId}`)
      if (!inviteRes.ok) throw new Error('Invalid invite')
      const invite = await inviteRes.json()
      
      if (invite.approval_status !== 'APPROVED') {
        setError('This invite has not been approved yet')
        setLoading(false)
        return
      }

      setInviteData(invite)

      // Fetch available seats
      const seatsRes = await fetch(`/api/events/${params.id}/seats/availability`)
      if (!seatsRes.ok) throw new Error('Failed to load seats')
      const seatsData = await seatsRes.json()
      
      setSeats(seatsData.seats || [])
      setLoading(false)
    } catch (err: any) {
      setError(err.message || 'Failed to load seat information')
      setLoading(false)
    }
  }

  const handleSeatSelect = async () => {
    if (!selectedSeat) return

    setSubmitting(true)
    try {
      const res = await fetch(`/api/events/${params.id}/invites/select-seat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inviteId,
          seatId: selectedSeat
        })
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to select seat')
      }

      const data = await res.json()
      
      // Redirect to payment
      router.push(`/events/${params.id}/payment?invite=${inviteId}&seat=${selectedSeat}`)
    } catch (err: any) {
      alert(err.message || 'Failed to select seat')
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading seat information...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Unable to Load Seats</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    )
  }

  const groupedSeats = seats.reduce((acc, seat) => {
    const category = seat.seatCategory || 'General'
    if (!acc[category]) acc[category] = []
    acc[category].push(seat)
    return acc
  }, {} as Record<string, Seat[]>)

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6">
            <h1 className="text-3xl font-bold mb-2">Select Your Seat</h1>
            <p className="text-indigo-100">
              Welcome {inviteData?.invitee_name}! Please choose your preferred seat.
            </p>
          </div>

          {/* Seat Selection */}
          <div className="p-6">
            {Object.keys(groupedSeats).length === 0 ? (
              <div className="text-center py-12">
                <Armchair className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No seats available at this time.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(groupedSeats).map(([category, categorySeats]) => (
                  <div key={category}>
                    <h3 className="text-lg font-bold mb-3 text-gray-900">{category} Seats</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                      {categorySeats.map((seat) => (
                        <button
                          key={seat.id}
                          onClick={() => setSelectedSeat(seat.id)}
                          disabled={seat.status !== 'AVAILABLE'}
                          className={`
                            p-4 rounded-lg border-2 transition-all
                            ${selectedSeat === seat.id 
                              ? 'border-indigo-600 bg-indigo-50 ring-2 ring-indigo-600' 
                              : seat.status === 'AVAILABLE'
                                ? 'border-gray-300 hover:border-indigo-400 hover:bg-indigo-50'
                                : 'border-gray-200 bg-gray-100 cursor-not-allowed opacity-50'
                            }
                          `}
                        >
                          <div className="flex flex-col items-center">
                            <Armchair className={`w-6 h-6 mb-2 ${selectedSeat === seat.id ? 'text-indigo-600' : 'text-gray-600'}`} />
                            <div className="text-sm font-bold">{seat.seatNumber}</div>
                            <div className="text-xs text-gray-500">Row {seat.rowNumber}</div>
                            {seat.priceInr > 0 && (
                              <div className="text-xs font-semibold text-green-600 mt-1">
                                ₹{seat.priceInr}
                              </div>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Legend */}
            <div className="flex gap-6 mt-8 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-gray-300 rounded"></div>
                <span className="text-sm text-gray-600">Available</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-indigo-600 bg-indigo-50 rounded"></div>
                <span className="text-sm text-gray-600">Selected</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-gray-200 bg-gray-100 rounded"></div>
                <span className="text-sm text-gray-600">Unavailable</span>
              </div>
            </div>

            {/* Confirm Button */}
            {selectedSeat && (
              <div className="mt-6 flex justify-end">
                <button
                  onClick={handleSeatSelect}
                  disabled={submitting}
                  className="px-8 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-semibold"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      Confirm Seat & Proceed to Payment
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
