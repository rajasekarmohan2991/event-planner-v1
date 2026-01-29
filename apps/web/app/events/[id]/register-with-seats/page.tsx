'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { SeatSelector } from '@/components/events/SeatSelector'
import { IndianRupee, Clock, CheckCircle, CreditCard, Smartphone } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'

type Seat = {
  id: string
  section: string
  rowNumber: string
  seatNumber: string
  basePrice: number
}

export default function RegisterWithSeatsPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const eventId = params?.id as string



  const [step, setStep] = useState(1) // 1: Seat Selection, 2: Details, 3: Payment, 4: Success
  const [selectedSeats, setSelectedSeats] = useState<Seat[]>([])
  const [totalPrice, setTotalPrice] = useState(0)
  const [convenienceFee, setConvenienceFee] = useState(0)
  const [taxAmount, setTaxAmount] = useState(0)
  const [reservationExpiry, setReservationExpiry] = useState<Date | null>(null)
  const [timeRemaining, setTimeRemaining] = useState<number>(0)
  const [numberOfAttendees, setNumberOfAttendees] = useState(1)
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'razorpay' | 'dummy'>('dummy')

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
    jobTitle: '',
    gender: '',
    emergencyContact: '',
    parking: '',
    dietaryRestrictions: [] as string[],
    activities: [] as string[]
  })

  const [loading, setLoading] = useState(false)
  const [reservationId, setReservationId] = useState<string | null>(null)
  const [registrationId, setRegistrationId] = useState<string | null>(null)
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [promoCode, setPromoCode] = useState('')
  const [promoDiscount, setPromoDiscount] = useState<any>(null)
  const [promoError, setPromoError] = useState('')
  const [validatingPromo, setValidatingPromo] = useState(false)
  const [availablePromoCodes, setAvailablePromoCodes] = useState<any[]>([])
  const [loadingPromoCodes, setLoadingPromoCodes] = useState(false)
  const [inviteInfo, setInviteInfo] = useState<any | null>(null)
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [ticketClass, setTicketClass] = useState<any | null>(null)

  // Track lifecycle for auto-extend and cleanup
  const lastExtendedAtRef = useRef<number>(0)
  const extendingRef = useRef<boolean>(false)
  const releaseScheduledRef = useRef<boolean>(false)

  // Load ticket class from URL or localStorage
  useEffect(() => {
    const ticketClassId = searchParams?.get('ticketClass')

    if (ticketClassId) {
      // Fetch ticket class details from API
      fetch(`/api/events/${eventId}/tickets/${ticketClassId}`)
        .then(res => res.json())
        .then(data => {
          if (data && !data.error) {
            setTicketClass(data)
            console.log('🎫 Ticket class loaded from API:', data)
          }
        })
        .catch(err => console.error('Failed to fetch ticket class:', err))
    } else {
      // Fallback to localStorage
      const saved = localStorage.getItem(`registration:${eventId}:ticketClass`)
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          setTicketClass(parsed)
          console.log('🎫 Ticket class loaded from localStorage:', parsed)
        } catch (e) {
          console.error('Failed to parse saved ticket class:', e)
        }
      }
    }
  }, [eventId, searchParams])

  // Load saved form data from localStorage
  useEffect(() => {
    const savedData = localStorage.getItem(`registration:${eventId}:formData`)
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData)
        setFormData(prev => ({ ...prev, ...parsed }))
        if (parsed.promoDiscount) {
          setPromoDiscount(parsed.promoDiscount)
          setPromoCode(parsed.promoDiscount.code)
        }
      } catch (error) {
        console.error('Failed to load saved form data:', error)
      }
    }
  }, [eventId])

  // If invite code is present, verify it and prefill email
  useEffect(() => {
    const inviteCode = searchParams?.get('invite')
    if (!eventId || !inviteCode) return

    const verifyInvite = async () => {
      try {
        const res = await fetch(`/api/events/${eventId}/invites/verify?code=${encodeURIComponent(inviteCode)}`)
        const data = await res.json()
        if (!res.ok || !data.valid) {
          setInviteError(data.error || 'Invalid or expired invite code')
          setInviteInfo(null)
          return
        }
        setInviteInfo(data)
        setInviteError(null)
        // Prefill email from invite if not already set
        if (data.email && !formData.email) {
          setFormData(prev => ({ ...prev, email: data.email }))
        }
      } catch (error) {
        setInviteError('Failed to verify invite code')
        setInviteInfo(null)
      }
    }

    verifyInvite()
  }, [eventId, searchParams])

  // Fetch available promo codes
  useEffect(() => {
    const fetchPromoCodes = async () => {
      setLoadingPromoCodes(true)
      try {
        const res = await fetch(`/api/events/${eventId}/promo-codes/active`)
        if (res.ok) {
          const data = await res.json()
          setAvailablePromoCodes(data.promoCodes || [])
        }
      } catch (error) {
        console.error('Failed to fetch promo codes:', error)
      } finally {
        setLoadingPromoCodes(false)
      }
    }
    fetchPromoCodes()
  }, [eventId])

  // Timer for reservation expiry
  useEffect(() => {
    if (!reservationExpiry) return

    const interval = setInterval(() => {
      const now = new Date().getTime()
      const expiry = new Date(reservationExpiry).getTime()
      const remaining = Math.max(0, expiry - now)

      setTimeRemaining(Math.floor(remaining / 1000))

      if (remaining <= 0) {
        alert('Your seat reservation has expired. Please select seats again.')
        setStep(1)
        setReservationExpiry(null)
        setSelectedSeats([])
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [reservationExpiry])

  // Warn at 60s and auto-extend near expiry when on details/payment step
  useEffect(() => {
    if (!reservationExpiry) return
    if (timeRemaining === 60) {
      try { alert('Your reservation will expire in 1 minute. Completing payment will auto-extend if needed.') } catch { }
    }
    const shouldExtend = (step === 2 || step === 3) && timeRemaining > 0 && timeRemaining <= 120
    const now = Date.now()
    const recentlyExtended = now - lastExtendedAtRef.current < 120000 // 2 minutes throttle
    if (shouldExtend && !extendingRef.current && !recentlyExtended && selectedSeats.length > 0) {
      extendingRef.current = true
        ; (async () => {
          try {
            const res = await fetch(`/api/events/${eventId}/seats/extend`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({ seatIds: selectedSeats.map(s => s.id) })
            })
            if (res.ok) {
              const data = await res.json()
              if (data.expiresAt) setReservationExpiry(new Date(data.expiresAt))
              lastExtendedAtRef.current = Date.now()
            }
          } catch { }
          extendingRef.current = false
        })()
    }
  }, [timeRemaining, step, reservationExpiry, selectedSeats, eventId])

  // Release seats on tab close/navigation if not completed
  useEffect(() => {
    const releaseSeats = () => {
      if (!selectedSeats.length || step >= 4) return
      const payload = JSON.stringify({ seatIds: selectedSeats.map(s => s.id) })
      try {
        // Prefer keepalive fetch for reliability
        fetch(`/api/events/${eventId}/seats/reserve`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: payload,
          keepalive: true,
          credentials: 'include'
        }).catch(() => { })
      } catch { }
    }
    const onBeforeUnload = () => { releaseSeats() }
    const onPageHide = () => { releaseSeats() }
    window.addEventListener('beforeunload', onBeforeUnload)
    window.addEventListener('pagehide', onPageHide)
    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload)
      window.removeEventListener('pagehide', onPageHide)
    }
  }, [selectedSeats, step, eventId])

  const handleSeatsSelected = useCallback((seats: Seat[], price: number) => {
    setSelectedSeats(seats)
    // Auto-set number of attendees to match selected seats count
    setNumberOfAttendees(seats.length || 1)
    // Calculate price correctly - each seat is one ticket
    const seatsTotal = seats.reduce((sum, seat) => sum + Number(seat.basePrice), 0)
    const discounted = promoDiscount ? Number(promoDiscount.finalAmount) : seatsTotal
    // Convenience fee: 2% of base + ₹15 flat
    const conv = Math.round(seatsTotal * 0.02) + 15
    // Tax: 18% GST on base price
    const tax = Math.round(seatsTotal * 0.18)
    setConvenienceFee(conv)
    setTaxAmount(tax)
    setTotalPrice(discounted + conv + tax)
  }, [promoDiscount])

  const calculateTotalPrice = (seats: Seat[], attendees: number, discount: any = null) => {
    // Each seat is one ticket - don't multiply by attendees (attendees = seats.length)
    const seatsTotal = seats.reduce((sum, seat) => sum + Number(seat.basePrice), 0)
    // Apply discount if available
    const discounted = discount ? Number(discount.finalAmount) : seatsTotal
    // Convenience fee: 2% of base + ₹15 flat
    const conv = Math.round(seatsTotal * 0.02) + 15
    // Tax: 18% GST on (base price only, not on convenience fee)
    const tax = Math.round(seatsTotal * 0.18)
    setConvenienceFee(conv)
    setTaxAmount(tax)
    // Total = discounted base + convenience + tax
    const total = discounted + conv + tax
    setTotalPrice(Math.round(total * 100) / 100)
  }

  // Recalculate when attendees or promo changes
  useEffect(() => {
    if (selectedSeats.length > 0) {
      calculateTotalPrice(selectedSeats, numberOfAttendees, promoDiscount)
    }
  }, [numberOfAttendees, promoDiscount])

  const validatePromoCode = async () => {
    if (!promoCode.trim()) return
    setValidatingPromo(true)
    setPromoError("")
    try {
      // Calculate base total for promo code application - sum of all seat prices
      const baseTotal = selectedSeats.reduce((sum, seat) => sum + Number(seat.basePrice), 0)

      const res = await fetch(`/api/events/${eventId}/promo-codes/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: promoCode, orderAmount: baseTotal })
      })
      if (res.ok) {
        const data = await res.json()
        setPromoDiscount(data)
      } else {
        const err = await res.json().catch(() => ({ error: 'Invalid promo code' }))
        setPromoError(err.error || 'Invalid promo code')
        setPromoDiscount(null)
      }
    } catch (error) {
      setPromoError('Failed to validate promo code')
      setPromoDiscount(null)
    } finally {
      setValidatingPromo(false)
    }
  }

  const handleReserveSeats = async () => {
    console.log('🪑 [SEAT RESERVE] Starting seat reservation process...')
    console.log('🪑 [SEAT RESERVE] Selected seats:', selectedSeats)
    console.log('🪑 [SEAT RESERVE] Number of seats:', selectedSeats.length)

    if (selectedSeats.length === 0) {
      console.error('❌ [SEAT RESERVE] No seats selected!')
      alert('Please select at least one seat')
      return
    }

    setLoading(true)
    console.log('🪑 [SEAT RESERVE] Loading state set to true')

    try {
      const seatIds = selectedSeats.map(s => s.id)
      console.log('🪑 [SEAT RESERVE] Seat IDs to reserve:', seatIds)
      console.log('🪑 [SEAT RESERVE] API endpoint:', `/api/events/${eventId}/seats/reserve`)

      const res = await fetch(`/api/events/${eventId}/seats/reserve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seatIds: seatIds
        })
      })

      console.log('🪑 [SEAT RESERVE] Response status:', res.status)
      console.log('🪑 [SEAT RESERVE] Response OK:', res.ok)

      if (res.ok) {
        const data = await res.json()
        console.log('✅ [SEAT RESERVE] Success! Response data:', data)
        console.log('✅ [SEAT RESERVE] Expiry time:', data.expiresAt)
        console.log('✅ [SEAT RESERVE] Reservation ID:', data.reservations[0]?.id)

        setReservationExpiry(new Date(data.expiresAt))
        setReservationId(data.reservations[0]?.id)
        setStep(2) // Move to details step
        console.log('✅ [SEAT RESERVE] Moving to step 2 (details)')
      } else {
        const error = await res.json()
        console.error('❌ [SEAT RESERVE] Failed! Error:', error)
        console.error('❌ [SEAT RESERVE] Error message:', error.error)
        alert(error.error || 'Failed to reserve seats')
      }
    } catch (error) {
      console.error('❌ [SEAT RESERVE] Exception caught:', error)
      console.error('❌ [SEAT RESERVE] Error details:', error)
      alert('Error reserving seats')
    } finally {
      setLoading(false)
      console.log('🪑 [SEAT RESERVE] Loading state set to false')
    }
  }

  const handleProceedToPayment = () => {
    // Validate form
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone) {
      alert('Please fill all required fields')
      return
    }
    setStep(3) // Move to payment selection
  }

  const handlePayment = async () => {
    setLoading(true)
    try {
      // Create registration with payment info
      // Backend expects: { data: { email, firstName, lastName, ... }, type, ticketId?, totalPrice }
      const regRes = await fetch(`/api/events/${eventId}/registrations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: {
            email: formData.email,
            firstName: formData.firstName,
            lastName: formData.lastName,
            phone: formData.phone,
            company: formData.company,
            jobTitle: formData.jobTitle,
            gender: formData.gender,
            emergencyContact: formData.emergencyContact,
            parking: formData.parking,
            dietaryRestrictions: formData.dietaryRestrictions,
            activities: formData.activities,
            numberOfAttendees,
            ticketId: ticketClass?.id, // NEW: Include ticket class ID
            seats: selectedSeats.map(s => ({
              id: s.id,
              section: s.section,
              row: s.rowNumber,
              seat: s.seatNumber,
              price: s.basePrice
            })),
            inviteCode: inviteInfo?.inviteCode,
            paymentMethod,
            paymentStatus: paymentMethod === 'dummy' ? 'PAID' : 'PENDING',
          },
          type: 'SEATED',
          totalPrice: Math.round(totalPrice), // In rupees, not paise
          promoCode: promoDiscount?.code || null,
        })
      })

      if (!regRes.ok) {
        throw new Error('Failed to create registration')
      }

      const registration = await regRes.json()
      setRegistrationId(registration.id)

      // For dummy payment, auto-confirm
      if (paymentMethod === 'dummy') {
        // Confirm seat reservations
        await fetch(`/api/events/${eventId}/seats/confirm`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            seatIds: selectedSeats.map(s => s.id),
            registrationId: registration.id,
            paymentStatus: 'PAID'
          })
        })

        // Record payment in history and send confirmation email
        await fetch(`/api/events/${eventId}/registrations/${registration.id}/payment`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            paymentMethod: 'DUMMY',
            amount: totalPrice,
            status: 'COMPLETED'
          })
        }).catch(err => console.error('Payment record failed:', err))

        // Generate QR code data in JSON format for the scanner
        // We also include the check-in URL for generic scanners
        const qrData = JSON.stringify({
          registrationId: registration.id,
          eventId: eventId,
          email: formData.email,
          name: `${formData.firstName} ${formData.lastName}`,
          type: 'SEATED',
          url: `${window.location.origin}/events/${eventId}/checkin/${registration.id}`
        })
        setQrCode(qrData)

        setStep(4) // Success
      } else {
        // For Stripe/Razorpay (not implemented): release seats and show error
        try {
          await fetch(`/api/events/${eventId}/seats/reserve`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ seatIds: selectedSeats.map(s => s.id) })
          })
        } catch { }
        alert(`${paymentMethod} integration coming soon! Seats released. Use Dummy payment for now.`)
        setLoading(false)
      }

    } catch (error: any) {
      alert(error.message || 'Error completing registration')
      // Release seats on error
      try {
        await fetch(`/api/events/${eventId}/seats/reserve`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ seatIds: selectedSeats.map(s => s.id) })
        })
      } catch { }
      setLoading(false)
    } finally {
      if (paymentMethod === 'dummy') {
        setLoading(false)
      }
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (!eventId) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-2">
            {[1, 2, 3, 4].map(num => (
              <div key={num} className="flex items-center">
                <div className={`
                  w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm
                  ${step >= num ? 'bg-indigo-600 text-white' : 'bg-gray-300 text-gray-600'}
                `}>
                  {num}
                </div>
                {num < 4 && (
                  <div className={`w-16 h-1 ${step > num ? 'bg-indigo-600' : 'bg-gray-300'}`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-center gap-12 mt-2 text-xs">
            <span className={step >= 1 ? 'text-indigo-600 font-medium' : 'text-gray-500'}>Seats</span>
            <span className={step >= 2 ? 'text-indigo-600 font-medium' : 'text-gray-500'}>Details</span>
            <span className={step >= 3 ? 'text-indigo-600 font-medium' : 'text-gray-500'}>Payment</span>
            <span className={step >= 4 ? 'text-indigo-600 font-medium' : 'text-gray-500'}>Success</span>
          </div>
        </div>

        {/* Timer (when seats are reserved) */}
        {reservationExpiry && step === 2 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-center gap-2 text-yellow-800">
              <Clock className="w-5 h-5" />
              <span className="font-semibold">
                Time remaining: {formatTime(timeRemaining)}
              </span>
            </div>
            <p className="text-center text-sm text-yellow-700 mt-1">
              Complete your registration before the timer expires
            </p>
          </div>
        )}

        {/* Step 1: Seat Selection */}
        {step === 1 && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h1 className="text-2xl font-bold mb-2">Select Your Seats</h1>

            {/* Ticket Class Info */}
            {ticketClass && (
              <div className="mb-6 p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-indigo-700">Ticket Class:</p>
                    <p className="text-lg font-bold text-indigo-900">{ticketClass.name}</p>
                    <p className="text-sm text-indigo-600 mt-1">
                      ₹{ticketClass.priceInRupees} per seat • {ticketClass.available} seats available
                    </p>
                  </div>
                  <button
                    onClick={() => router.push(`/events/${eventId}/register`)}
                    className="text-sm text-indigo-600 hover:text-indigo-800 underline"
                  >
                    Change Ticket Class
                  </button>
                </div>
              </div>
            )}

            <SeatSelector
              key={eventId} // specific stable key to prevent reconciliation errors
              eventId={eventId}
              ticketClassId={ticketClass?.id}
              onSeatSelect={(seats, price) => {
                // Override seat prices with ticket class price if available
                if (ticketClass?.priceInRupees) {
                  const seatsWithTicketPrice = seats.map(s => ({
                    ...s,
                    basePrice: ticketClass.priceInRupees
                  }))
                  handleSeatsSelected(seatsWithTicketPrice, seatsWithTicketPrice.length * ticketClass.priceInRupees)
                } else {
                  handleSeatsSelected(seats, price)
                }
              }}
              maxSeats={ticketClass?.maxPurchase || 10}
            />

            {/* Price Breakdown */}
            {selectedSeats.length > 0 && (
              <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <h3 className="font-semibold text-gray-700 mb-2">Price Details</h3>
                <div className="space-y-1 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>Base Price ({selectedSeats.length} seats):</span>
                    <span>₹{selectedSeats.reduce((sum, s) => sum + Number(s.basePrice), 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Convenience Fee (2% + ₹15):</span>
                    <span>₹{convenienceFee}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax (18% GST):</span>
                    <span>₹{taxAmount}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2 mt-2 font-bold text-gray-900 text-base">
                    <span>Total Payable:</span>
                    <span>₹{totalPrice}</span>
                  </div>
                </div>
                <p className="text-xs text-indigo-600 mt-3 flex items-center gap-1">
                  <IndianRupee className="w-3 h-3" />
                  Promo codes can be applied in the next step
                </p>
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <button
                onClick={handleReserveSeats}
                disabled={selectedSeats.length === 0 || loading}
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? 'Reserving...' : `Reserve ${selectedSeats.length} Seat(s)`}
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Registration Details */}
        {step === 2 && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h1 className="text-2xl font-bold mb-6">Your Details</h1>

            {/* Selected Seats Summary */}
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-indigo-900 mb-2">Your Selected Seats:</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {selectedSeats.map(seat => (
                  <div key={seat.id} className="text-sm">
                    <span className="font-medium">{seat.section}</span> - Row {seat.rowNumber}, Seat {seat.seatNumber}
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-indigo-200 flex items-center justify-between">
                <span className="font-bold text-indigo-900">Total Amount:</span>
                <span className="text-xl font-bold text-indigo-900 flex items-center gap-1">
                  <IndianRupee className="w-5 h-5" />
                  {totalPrice}
                </span>
              </div>
            </div>

            {/* Registration Form */}
            <form className="space-y-4">
              {/* Number of Attendees - auto-set from selected seats */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <label className="block text-sm font-semibold text-blue-900 mb-2">Number of Attendees *</label>
                <input
                  type="number"
                  min="1"
                  max={Math.max(selectedSeats.length, 10)}
                  value={numberOfAttendees}
                  onChange={(e) => setNumberOfAttendees(Math.max(1, Math.min(parseInt(e.target.value) || 1, selectedSeats.length || 10)))}
                  className="w-32 px-3 py-2 border rounded-md text-center font-bold"
                  disabled={selectedSeats.length > 0}
                />
                <p className="text-xs text-blue-700 mt-1">
                  {selectedSeats.reduce((sum, s) => sum + Number(s.basePrice), 0) > 0 ? (
                    <>Total for {selectedSeats.length} seat(s): ₹{selectedSeats.reduce((sum, s) => sum + Number(s.basePrice), 0)}</>
                  ) : (
                    <>Free Event - Platform fee applies</>
                  )}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">First Name *</label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Last Name *</label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Email *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Phone *</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Company</label>
                  <input
                    type="text"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Job Title</label>
                  <input
                    type="text"
                    value={formData.jobTitle}
                    onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
              </div>

              {/* Promo Code Section */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <label className="block text-sm font-semibold text-green-900 mb-2">Promo Code (Optional)</label>

                {/* Available Promo Codes */}
                {availablePromoCodes.length > 0 && !promoDiscount && (
                  <div className="mb-3 p-3 bg-white rounded-md border border-green-300">
                    <div className="text-xs font-semibold text-green-900 mb-2">🎉 Available Offers:</div>
                    <div className="space-y-2">
                      {availablePromoCodes.map((promo) => (
                        <div key={promo.id} className="flex items-center justify-between p-2 bg-green-50 rounded border border-green-200">
                          <div className="flex-1">
                            <div className="text-sm font-bold text-green-800">{promo.code}</div>
                            <div className="text-xs text-green-600">{promo.description}</div>
                            {promo.minOrderAmount > 0 && (
                              <div className="text-xs text-gray-500">Min order: ₹{promo.minOrderAmount}</div>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setPromoCode(promo.code)
                              setTimeout(() => validatePromoCode(), 100)
                            }}
                            className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                          >
                            Apply
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                    placeholder="Enter promo code"
                    className="flex-1 px-3 py-2 border rounded-md uppercase"
                  />
                  <button
                    type="button"
                    onClick={validatePromoCode}
                    disabled={validatingPromo || !promoCode.trim()}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-300"
                  >
                    {validatingPromo ? 'Checking...' : 'Apply'}
                  </button>
                </div>
                {promoError && (
                  <p className="text-xs text-red-600 mt-1">{promoError}</p>
                )}
                {promoDiscount && (
                  <p className="text-xs text-green-700 mt-1 font-semibold">
                    ✓ Promo applied! Discount: ₹{Math.round((selectedSeats.reduce((sum, s) => sum + Number(s.basePrice), 0) - Number(promoDiscount.finalAmount)) * 100) / 100}
                  </p>
                )}
              </div>
            </form>

            <div className="mt-6 flex justify-between">
              <button
                onClick={() => setStep(1)}
                className="px-6 py-3 border rounded-lg font-semibold hover:bg-gray-50"
              >
                Back to Seats
              </button>
              <button
                onClick={handleProceedToPayment}
                disabled={loading}
                className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-300 flex items-center gap-2"
              >
                {loading ? 'Processing...' : `Pay ₹${totalPrice} & Complete Registration`}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Payment Selection */}
        {step === 3 && (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h1 className="text-2xl font-bold mb-6">Select Payment Method</h1>

            <div className="space-y-4 mb-8">
              {/* Stripe - Coming Soon */}
              <div className="border-2 border-gray-300 rounded-lg p-6 opacity-50 cursor-not-allowed relative">
                <div className="absolute top-2 right-2 bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">Coming Soon</div>
                <div className="flex items-center gap-4">
                  <CreditCard className="w-8 h-8 text-gray-400" />
                  <div>
                    <h3 className="font-semibold text-gray-600">Stripe</h3>
                    <p className="text-sm text-gray-500">Credit/Debit Card, UPI</p>
                  </div>
                </div>
              </div>

              {/* Razorpay - Coming Soon */}
              <div className="border-2 border-gray-300 rounded-lg p-6 opacity-50 cursor-not-allowed relative">
                <div className="absolute top-2 right-2 bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">Coming Soon</div>
                <div className="flex items-center gap-4">
                  <Smartphone className="w-8 h-8 text-gray-400" />
                  <div>
                    <h3 className="font-semibold text-gray-600">Razorpay</h3>
                    <p className="text-sm text-gray-500">UPI, Cards, Wallets, Net Banking</p>
                  </div>
                </div>
              </div>

              {/* Dummy Payment - Active */}
              <div
                className={`border-2 rounded-lg p-6 cursor-pointer transition-all ${paymentMethod === 'dummy' ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:border-green-300'
                  }`}
                onClick={() => setPaymentMethod('dummy')}
              >
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold">
                    💳
                  </div>
                  <div>
                    <h3 className="font-semibold text-green-900">Test Payment (Dummy)</h3>
                    <p className="text-sm text-green-700">Auto-success for testing - No actual payment</p>
                  </div>
                  {paymentMethod === 'dummy' && (
                    <CheckCircle className="w-6 h-6 text-green-600 ml-auto" />
                  )}
                </div>
              </div>
            </div>

            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-6">
              <div className="flex justify-between items-center">
                <span className="font-semibold">Total Amount:</span>
                <span className="text-2xl font-bold text-indigo-900">₹{totalPrice}</span>
              </div>
              <div className="text-xs text-indigo-700 mt-2">
                {selectedSeats.length} seat(s)
                {promoDiscount && ` - Promo: ${promoDiscount.code}`}
                <div className="mt-2 text-gray-700">
                  <div>Base: ₹{selectedSeats.reduce((sum, s) => sum + Number(s.basePrice), 0)}</div>
                  <div>Convenience fee (2% + ₹15): ₹{convenienceFee}</div>
                  <div>Tax (18% GST): ₹{taxAmount}</div>
                </div>
              </div>
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setStep(2)}
                className="px-6 py-3 border rounded-lg font-semibold hover:bg-gray-50"
              >
                Back to Details
              </button>
              <button
                onClick={handlePayment}
                disabled={loading}
                className="px-8 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-300 flex items-center gap-2"
              >
                {loading ? 'Processing...' : `Complete Payment - ₹${totalPrice}`}
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Success with QR Code */}
        {step === 4 && qrCode && (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-green-600 mb-4">Payment Successful!</h1>
            <p className="text-gray-600 mb-8">
              Your registration is complete. Show this QR code at the event entrance.
            </p>

            {/* QR Code */}
            <div className="bg-white border-4 border-indigo-600 rounded-lg p-6 inline-block mb-6">
              <QRCodeSVG value={qrCode} size={256} level="H" />
            </div>

            {/* Registration Details */}
            <div className="bg-gray-50 rounded-lg p-6 mb-6 text-left max-w-md mx-auto">
              <h3 className="font-semibold mb-4 text-center">Registration Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Registration ID:</span>
                  <span className="font-medium">{registrationId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Name:</span>
                  <span className="font-medium">{formData.firstName} {formData.lastName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Email:</span>
                  <span className="font-medium">{formData.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Attendees:</span>
                  <span className="font-medium">{numberOfAttendees}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Seats:</span>
                  <span className="font-medium">
                    {selectedSeats.map(s => `${s.section}-${s.rowNumber}${s.seatNumber}`).join(', ')}
                  </span>
                </div>
                <div className="flex justify-between border-t pt-2 mt-2">
                  <span className="text-gray-600 font-semibold">Amount Paid:</span>
                  <span className="font-bold text-green-600">₹{totalPrice}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-4 justify-center">
              <button
                onClick={() => window.print()}
                className="px-6 py-3 border-2 border-indigo-600 text-indigo-600 rounded-lg font-semibold hover:bg-indigo-50"
              >
                Print Ticket
              </button>
              <button
                onClick={() => router.push(`/events/${eventId}/public`)}
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700"
              >
                Back to Event
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
