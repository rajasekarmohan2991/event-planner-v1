"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { VirtualRegistrationForm } from "./forms"
import { Armchair, CheckCircle, XCircle, AlertCircle, Clock, MapPin } from "lucide-react"
import { useLocationDetection } from "@/hooks/useLocationDetection"

type RegistrationType = "general" | "vip" | "virtual"

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

export default function RegisterPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { location, updateLocation } = useLocationDetection()
  const [type, setType] = useState<RegistrationType>("general")
  const [step, setStep] = useState<1 | 2>(1)
  const [hasSeats, setHasSeats] = useState(false)
  const [checkingSeats, setCheckingSeats] = useState(true)
  const [inviteData, setInviteData] = useState<InviteData | null>(null)
  const [inviteLoading, setInviteLoading] = useState(false)
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [dietaryOptions, setDietaryOptions] = useState<string[]>([])
  const [ticketClasses, setTicketClasses] = useState<any[]>([])
  const [selectedTicketClass, setSelectedTicketClass] = useState<any | null>(null)
  const [loadingTickets, setLoadingTickets] = useState(false)
  const [showLocationSelector, setShowLocationSelector] = useState(false)

  // Load dietary restrictions from lookup API
  useEffect(() => {
    fetch('/api/lookups/by-name/dietary_restrictions')
      .then(r => r.json())
      .then(data => {
        if (data.options && Array.isArray(data.options)) {
          setDietaryOptions(data.options.map((opt: any) => opt.label || opt.value))
        } else {
          // Fallback to hardcoded options
          setDietaryOptions(["None", "Vegetarian", "Glutten Allergy", "Lactose Allergy", "Nut Allergy", "Shellfish Allergy"])
        }
      })
      .catch(() => {
        // Fallback to hardcoded options on error
        setDietaryOptions(["None", "Vegetarian", "Glutten Allergy", "Lactose Allergy", "Nut Allergy", "Shellfish Allergy"])
      })
  }, [])

  // Fetch ticket classes when event has seats
  useEffect(() => {
    if (hasSeats && !checkingSeats) {
      setLoadingTickets(true)
      fetch(`/api/events/${params.id}/tickets`)
        .then(r => r.json())
        .then(data => {
          if (data.tickets && data.tickets.length > 0) {
            setTicketClasses(data.tickets)
            // Auto-select first available ticket class
            const firstAvailable = data.tickets.find((t: any) => !t.isSoldOut)
            if (firstAvailable) {
              setSelectedTicketClass(firstAvailable)
            }
          }
        })
        .catch(err => console.error('Failed to fetch ticket classes:', err))
        .finally(() => setLoadingTickets(false))
    }
  }, [hasSeats, checkingSeats, params.id])

  // Check invite code if present in URL
  useEffect(() => {
    const inviteCode = searchParams?.get('invite')
    if (inviteCode) {
      setInviteLoading(true)
      fetch(`/api/events/${params.id}/invites/verify?code=${inviteCode}`)
        .then(r => r.json())
        .then(data => {
          if (data.valid) {
            setInviteData(data)
            setInviteError(null)
          } else {
            setInviteError(data.error || 'Invalid invite code')
            setInviteData(null)
          }
        })
        .catch(err => {
          setInviteError('Failed to verify invite code')
          setInviteData(null)
        })
        .finally(() => setInviteLoading(false))
    }
  }, [searchParams, params.id])

  // Check if event has seat selection available (runs in background, doesn't block form display)
  useEffect(() => {
    const checkSeats = async () => {
      try {
        const res = await fetch(`/api/events/${params.id}/seats/availability`, {
          cache: 'no-store'
        })
        if (res.ok) {
          const data = await res.json()

          // If no seats but floor plan exists, trigger generation
          if (data.totalSeats === 0 && data.floorPlan) {
            console.log('[REGISTER] No seats found but floor plan exists, triggering generation...')
            try {
              const genRes = await fetch(`/api/events/${params.id}/seats/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({})
              })

              if (genRes.ok) {
                console.log('[REGISTER] Seat generation successful, re-checking...')
                // Re-check after generation with a small delay
                await new Promise(resolve => setTimeout(resolve, 1000))
                const recheckRes = await fetch(`/api/events/${params.id}/seats/availability`, {
                  cache: 'no-store'
                })
                if (recheckRes.ok) {
                  const recheckData = await recheckRes.json()
                  console.log('[REGISTER] Re-check result:', { totalSeats: recheckData.totalSeats })
                  setHasSeats(recheckData.totalSeats > 0)
                } else {
                  console.log('[REGISTER] Re-check failed, assuming no seats')
                  setHasSeats(false)
                }
              } else {
                console.error('[REGISTER] Seat generation failed:', await genRes.text())
                setHasSeats(false)
              }
            } catch (genError) {
              console.error('[REGISTER] Failed to generate seats:', genError)
              setHasSeats(false)
            }
          } else {
            console.log('[REGISTER] Seats check result:', { totalSeats: data.totalSeats })
            setHasSeats(data.totalSeats > 0)
          }
        } else {
          // API returned error - no seats available
          console.log('[REGISTER] Seats API returned error, assuming no seats')
          setHasSeats(false)
        }
      } catch (error) {
        // Network error or API doesn't exist - allow registration without seats
        console.log('[REGISTER] Seats check failed (this is OK), allowing registration without seat selection:', error)
        setHasSeats(false)
      }
    }
    // Run seat check in background without blocking form display
    checkSeats()
    // Set checkingSeats to false immediately so form shows right away
    setCheckingSeats(false)
  }, [params.id])

  // Restore type from URL or localStorage
  useEffect(() => {
    const urlType = searchParams?.get('type') as RegistrationType
    if (urlType && ["general", "vip", "virtual"].includes(urlType)) {
      setType(urlType)
    } else {
      const stored = localStorage.getItem(`registration:${params.id}:type`)
      if (stored) setType(stored as RegistrationType)
    }
  }, [params.id, searchParams])

  // Persist type to URL and localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(`registration:${params.id}:type`, type)
      const url = new URL(window.location.href)
      url.searchParams.set('type', type)
      router.replace(url.pathname + url.search, { scroll: false })
    }
  }, [type, params.id, router])

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Invite Code Validation Banner */}
        {inviteLoading && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-blue-600 animate-spin" />
              <p className="text-blue-800 font-medium">Verifying invite code...</p>
            </div>
          </div>
        )}

        {inviteData && inviteData.valid && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div className="flex-1">
                <p className="font-semibold text-green-800">✅ Invite Code Verified!</p>
                <p className="text-sm text-green-700 mt-1">
                  Welcome{inviteData.inviteeName ? ` ${inviteData.inviteeName}` : ''}! Your invitation is valid.
                  {inviteData.category && ` Category: ${inviteData.category}`}
                  {inviteData.organization && ` | Organization: ${inviteData.organization}`}
                </p>
                {inviteData.discountCode && (
                  <p className="text-sm text-green-700 mt-1">
                    💰 Discount Code: <code className="bg-green-100 px-2 py-0.5 rounded">{inviteData.discountCode}</code>
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {inviteError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3">
              <XCircle className="w-5 h-5 text-red-600" />
              <div className="flex-1">
                <p className="font-semibold text-red-800">❌ Invalid Invite Code</p>
                <p className="text-sm text-red-700 mt-1">{inviteError}</p>
                <p className="text-sm text-red-600 mt-2">
                  This event requires a valid invitation. Please contact the event organizer.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Location Selector - For booking for friends in different cities */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  Booking for someone in: <span className="text-blue-600">{location?.city || 'Detecting...'}</span>
                </p>
                <p className="text-xs text-gray-600 mt-0.5">
                  Change location if booking for a friend in a different city
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowLocationSelector(!showLocationSelector)}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
            >
              {showLocationSelector ? 'Close' : 'Change Location'}
            </button>
          </div>

          {showLocationSelector && (
            <div className="mt-4 pt-4 border-t border-blue-200">
              <p className="text-sm font-medium text-gray-700 mb-3">Select City:</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {['Chennai', 'Mumbai', 'Bangalore', 'Delhi', 'Hyderabad', 'Pune', 'Kolkata', 'Ahmedabad'].map((city) => (
                  <button
                    key={city}
                    type="button"
                    onClick={() => {
                      updateLocation({ city, state: '', country: 'India', latitude: 0, longitude: 0 })
                      setShowLocationSelector(false)
                    }}
                    className={`px-3 py-2 text-sm rounded-lg border transition-all ${location?.city === city
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                      }`}
                  >
                    {city}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Ticket Class Selection (for events with seats) */}
        {!checkingSeats && hasSeats && ticketClasses.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg border-2 border-indigo-200 p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <Armchair className="w-6 h-6 text-indigo-600" />
              <h3 className="text-xl font-bold text-gray-900">Select Your Ticket Class</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              This event has reserved seating. Choose your ticket class to see available seats.
            </p>

            {loadingTickets ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                <p className="text-sm text-gray-500 mt-2">Loading ticket options...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {ticketClasses.map((ticket) => (
                  <div
                    key={ticket.id}
                    onClick={() => !ticket.isSoldOut && setSelectedTicketClass(ticket)}
                    className={`
                      relative border-2 rounded-lg p-4 cursor-pointer transition-all
                      ${selectedTicketClass?.id === ticket.id
                        ? 'border-indigo-600 bg-indigo-50 shadow-md'
                        : ticket.isSoldOut
                          ? 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
                          : 'border-gray-300 hover:border-indigo-400 hover:shadow-sm'
                      }
                    `}
                  >
                    {ticket.isSoldOut && (
                      <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
                        SOLD OUT
                      </div>
                    )}

                    <div className="flex items-center gap-2 mb-2">
                      <input
                        type="radio"
                        name="ticketClass"
                        checked={selectedTicketClass?.id === ticket.id}
                        onChange={() => !ticket.isSoldOut && setSelectedTicketClass(ticket)}
                        disabled={ticket.isSoldOut}
                        className="w-4 h-4 text-indigo-600"
                      />
                      <h4 className="font-bold text-lg text-gray-900">{ticket.name}</h4>
                    </div>

                    {ticket.description && (
                      <p className="text-xs text-gray-600 mb-3">{ticket.description}</p>
                    )}

                    <div className="space-y-1">
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-bold text-indigo-600">
                          ₹{ticket.priceInRupees}
                        </span>
                        <span className="text-sm text-gray-500">per seat</span>
                      </div>

                      <div className="text-xs text-gray-600">
                        {ticket.available > 0 ? (
                          <span className="text-green-600 font-medium">
                            ✓ {ticket.available} seats available
                          </span>
                        ) : (
                          <span className="text-red-600 font-medium">
                            ✗ No seats available
                          </span>
                        )}
                      </div>

                      {ticket.minPurchase && ticket.minPurchase > 1 && (
                        <div className="text-xs text-gray-500">
                          Min: {ticket.minPurchase} seats
                        </div>
                      )}

                      {ticket.maxPurchase && (
                        <div className="text-xs text-gray-500">
                          Max: {ticket.maxPurchase} seats
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {selectedTicketClass && (
              <div className="mt-6 p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-indigo-900">
                      Selected: <span className="font-bold">{selectedTicketClass.name}</span>
                    </p>
                    <p className="text-xs text-indigo-700 mt-1">
                      ₹{selectedTicketClass.priceInRupees} per seat • {selectedTicketClass.available} available
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      // Save ticket class and redirect to seat selection
                      localStorage.setItem(`registration:${params.id}:ticketClass`, JSON.stringify(selectedTicketClass))
                      router.push(`/events/${params.id}/register-with-seats?ticketClass=${selectedTicketClass.id}`)
                    }}
                    className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
                  >
                    Continue to Seat Selection →
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Fallback seat banner (if no ticket classes) - Direct link to seat selection */}
        {!checkingSeats && hasSeats && ticketClasses.length === 0 && !loadingTickets && (
          <div className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg shadow-lg p-6 mb-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/20 rounded-lg">
                  <Armchair className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Reserved Seating Event</h3>
                  <p className="text-indigo-100 mt-1">
                    This event has reserved seating. Select your seats first before completing registration.
                  </p>
                </div>
              </div>
              <button
                onClick={() => router.push(`/events/${params.id}/register-with-seats`)}
                className="px-6 py-3 bg-white text-indigo-600 rounded-lg font-semibold hover:bg-indigo-50 transition-colors whitespace-nowrap"
              >
                Select Seats →
              </button>
            </div>
          </div>
        )}

        {/* Show the regular registration form - always visible */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <h1 className="text-2xl font-bold mb-2">Event Registration</h1>
          <p className="text-sm text-slate-600 mb-6">Event ID: {params.id}</p>

          {/* Horizontal stepper */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 flex items-center">
                <div className={`flex items-center gap-2 ${step >= 1 ? 'text-indigo-600' : 'text-slate-400'}`}>
                  <span className={`h-6 w-6 rounded-full border flex items-center justify-center text-xs ${step >= 1 ? 'bg-indigo-600 text-white border-indigo-600' : ''}`}>1</span>
                  <span className="text-sm font-medium">Select Type</span>
                </div>
                <div className={`mx-3 h-px flex-1 ${step >= 2 ? 'bg-indigo-600' : 'bg-slate-200'}`} />
                <div className={`flex items-center gap-2 ${step >= 2 ? 'text-indigo-600' : 'text-slate-400'}`}>
                  <span className={`h-6 w-6 rounded-full border flex items-center justify-center text-xs ${step >= 2 ? 'bg-indigo-600 text-white border-indigo-600' : ''}`}>2</span>
                  <span className="text-sm font-medium">Fill Details</span>
                </div>
              </div>
              <div className="ml-4">
                {step === 2 ? (
                  <button className="text-sm px-3 py-1.5 rounded border" onClick={() => setStep(1)}>Back</button>
                ) : (
                  <button className="text-sm px-3 py-1.5 rounded bg-indigo-600 text-white" onClick={() => setStep(2)}>Continue</button>
                )}
              </div>
            </div>
          </div>

          {/* Step 1: Registration Type Selector */}
          {step === 1 && (
            <div className="space-y-3">
              <label className="text-sm font-medium text-slate-700">Select Registration Type</label>
              <div className="space-y-2">
                <label className="flex items-center gap-3 p-3 border rounded-md cursor-pointer hover:bg-slate-50">
                  <input
                    type="radio"
                    name="registrationType"
                    value="general"
                    checked={type === "general"}
                    onChange={(e) => setType(e.target.value as RegistrationType)}
                    className="w-4 h-4"
                  />
                  <div>
                    <div className="font-medium">General Admission Registration</div>
                    <div className="text-xs text-slate-500">Standard event attendance</div>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 border rounded-md cursor-pointer hover:bg-slate-50">
                  <input
                    type="radio"
                    name="registrationType"
                    value="vip"
                    checked={type === "vip"}
                    onChange={(e) => setType(e.target.value as RegistrationType)}
                    className="w-4 h-4"
                  />
                  <div>
                    <div className="font-medium">VIP Registration</div>
                    <div className="text-xs text-slate-500">Premium access with exclusive benefits</div>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 border rounded-md cursor-pointer hover:bg-slate-50">
                  <input
                    type="radio"
                    name="registrationType"
                    value="virtual"
                    checked={type === "virtual"}
                    onChange={(e) => setType(e.target.value as RegistrationType)}
                    className="w-4 h-4"
                  />
                  <div>
                    <div className="font-medium">Virtual Attendee Registration</div>
                    <div className="text-xs text-slate-500">Join remotely via online platform</div>
                  </div>
                </label>

              </div>
            </div>
          )}

          {/* Step 2: Conditional Form Rendering */}
          {step === 2 && (
            <>
              {type === "general" && <GeneralRegistrationForm eventId={params.id} hasSeats={hasSeats} inviteData={inviteData} />}
              {type === "vip" && <VipRegistrationForm eventId={params.id} hasSeats={hasSeats} inviteData={inviteData} />}
              {type === "virtual" && <VirtualRegistrationForm eventId={params.id} inviteData={inviteData} />}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// General Admission Registration Form
function GeneralRegistrationForm({ eventId, hasSeats, inviteData }: { eventId: string, hasSeats: boolean, inviteData: InviteData | null }) {
  const router = useRouter()
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: inviteData?.email || "",
    gender: "",
    phone: "",
    emergencyContact: "",
    parking: "",
    attendanceMode: "" as "IN_PERSON" | "VIRTUAL" | "",
    dietaryRestrictions: [] as string[],
    activities: [] as string[]
  })
  const [promoCode, setPromoCode] = useState("")
  const [promoDiscount, setPromoDiscount] = useState<any>(null)
  const [promoError, setPromoError] = useState("")
  const [validatingPromo, setValidatingPromo] = useState(false)
  const [ticketPrice, setTicketPrice] = useState(0) // Dynamic price from event (default: free)
  const [eventData, setEventData] = useState<any>(null)
  const [sessions, setSessions] = useState<any[]>([])
  const [dietaryOptions, setDietaryOptions] = useState<string[]>([])

  // Load dietary restrictions from lookup API
  useEffect(() => {
    fetch('/api/lookups/by-name/dietary_restrictions')
      .then(r => r.json())
      .then(data => {
        if (data.options && Array.isArray(data.options)) {
          setDietaryOptions(data.options.map((opt: any) => opt.label || opt.value))
        } else {
          setDietaryOptions(["None", "Vegetarian", "Gluten Allergy", "Lactose Allergy", "Nut Allergy", "Shellfish Allergy"])
        }
      })
      .catch(() => {
        setDietaryOptions(["None", "Vegetarian", "Gluten Allergy", "Lactose Allergy", "Nut Allergy", "Shellfish Allergy"])
      })
  }, [])

  // Fetch event data, pricing, and sessions
  useEffect(() => {
    const fetchEventData = async () => {
      try {
        const res = await fetch(`/api/events/${eventId}`)
        if (res.ok) {
          const event = await res.json()
          setEventData(event)

          // Auto-set attendance mode for non-HYBRID events
          if (event.eventMode === 'IN_PERSON') {
            setFormData(prev => ({ ...prev, attendanceMode: 'IN_PERSON' }))
          } else if (event.eventMode === 'VIRTUAL') {
            setFormData(prev => ({ ...prev, attendanceMode: 'VIRTUAL' }))
          }
          // For HYBRID, user must choose

          // Convert price from INR to paise (multiply by 100)
          // Only use event price, no demo overrides unless explicitly requested
          const urlParams = new URLSearchParams(window.location.search)
          const demoPrice = urlParams.get('demoPrice')

          // Only apply demo price if explicitly set, otherwise use event price or 0
          let priceInPaise = 0
          if (demoPrice && demoPrice !== '0') {
            priceInPaise = parseInt(demoPrice) * 100
          } else if (event.priceInr && event.priceInr > 0) {
            priceInPaise = event.priceInr * 100
          }

          setTicketPrice(priceInPaise)
        }
      } catch (error) {
        console.error('Failed to fetch event data:', error)
      }
    }

    const fetchSessions = async () => {
      try {
        const res = await fetch(`/api/events/${eventId}/sessions`)
        if (res.ok) {
          const data = await res.json()
          // Handle both array and object response formats
          const apiSessionData = Array.isArray(data) ? data : (data.sessions || [])
          setSessions(apiSessionData)
        }
      } catch (error) {
        console.error('Failed to fetch sessions:', error)
      }
    }

    fetchEventData()
    fetchSessions()
  }, [eventId])

  const validatePromoCode = async () => {
    if (!promoCode.trim()) return
    setValidatingPromo(true)
    setPromoError("")
    try {
      const res = await fetch(`/api/events/${eventId}/promo-codes/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: promoCode, orderAmount: ticketPrice })
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Re-check seat availability at submission time to ensure accuracy
    console.log('[REGISTRATION] Checking seat availability before submission...')
    let currentHasSeats = hasSeats

    try {
      const seatCheckRes = await fetch(`/api/events/${eventId}/seats/availability`, {
        cache: 'no-store'
      })
      if (seatCheckRes.ok) {
        const seatData = await seatCheckRes.json()
        // If seats found OR if a floor plan exists (even if seats generation pending/failed)
        // we should route to seat selection to avoid charging 'General' price for a seated event
        currentHasSeats = seatData.totalSeats > 0 || (!!seatData.floorPlan)
        console.log('[REGISTRATION] Fresh seat check result:', {
          totalSeats: seatData.totalSeats,
          hasFloorPlan: !!seatData.floorPlan,
          routingToSeats: currentHasSeats
        })
      }
    } catch (error) {
      console.log('[REGISTRATION] Seat check failed at submission, using cached value:', currentHasSeats)
    }

    // Check if seats are available for this event
    if (currentHasSeats) {
      // Store form data and redirect to seat selection
      console.log('[REGISTRATION] Seats available! Redirecting to seat selection...')
      localStorage.setItem(`registration:${eventId}:formData`, JSON.stringify({
        ...formData,
        ticketPrice,
        promoDiscount,
        type: 'GENERAL'
      }))
      router.push(`/events/${eventId}/register-with-seats`)
      return
    }

    console.log('[REGISTRATION] No seats available, proceeding with direct registration...')
    // Proceed with normal registration if no seats
    const finalAmount = promoDiscount ? promoDiscount.finalAmount : ticketPrice

    console.log('[REGISTRATION] Submitting registration...')

    const res = await fetch(`/api/events/${eventId}/registrations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        type: 'GENERAL',
        data: {
          ...formData,
          totalPrice: ticketPrice,
          promoCode: promoDiscount?.code
        }
      })
    })

    console.log('[REGISTRATION] Response status:', res.status)

    if (res.ok) {
      const data = await res.json()
      console.log('[REGISTRATION] Success!', data)

      // Store registration data for payment page
      localStorage.setItem('pendingRegistration', JSON.stringify(data))

      // Redirect to payment page
      if (finalAmount > 0) {
        alert('Registration successful! Redirecting to payment...')
        router.push(`/events/${eventId}/register/payment?registrationId=${data.id}`)
      } else {
        alert('Registration successful!')
        router.push(`/events/${eventId}`)
      }
    } else {
      const errorData = await res.json().catch(() => ({ error: 'Unknown error' }))
      console.error('[REGISTRATION] Error:', errorData)
      alert(`Registration failed: ${errorData.message || errorData.error || 'Please try again'}`)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border p-6 space-y-6">
      <h2 className="text-xl font-semibold border-b pb-3">General Admission Registration</h2>

      {/* Name */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">First Name</label>
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
          <label className="block text-sm font-medium mb-1">Last Name</label>
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
        <label className="block text-sm font-medium mb-1">Email</label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          placeholder="sample@example.com"
          className="w-full rounded-md border px-3 py-2 text-sm"
          required
        />
      </div>

      {/* Gender */}
      <div>
        <label className="block text-sm font-medium mb-2">Gender</label>
        <div className="flex gap-4">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="gender"
              value="Male"
              checked={formData.gender === "Male"}
              onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
            />
            <span className="text-sm">Male</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="gender"
              value="Female"
              checked={formData.gender === "Female"}
              onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
            />
            <span className="text-sm">Female</span>
          </label>
        </div>
      </div>

      {/* Phone */}
      <div>
        <label className="block text-sm font-medium mb-1">Phone</label>
        <input
          type="tel"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          className="w-full rounded-md border px-3 py-2 text-sm"
          required
        />
      </div>

      {/* Emergency Contact */}
      <div>
        <label className="block text-sm font-medium mb-1">Emergency Contact</label>
        <input
          type="text"
          value={formData.emergencyContact}
          onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
          className="w-full rounded-md border px-3 py-2 text-sm"
        />
      </div>

      {/* Parking */}
      <div>
        <label className="block text-sm font-medium mb-2">Do you require parking?</label>
        <div className="flex gap-4">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="parking"
              value="Yes"
              checked={formData.parking === "Yes"}
              onChange={(e) => setFormData({ ...formData, parking: e.target.value })}
            />
            <span className="text-sm">Yes</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="parking"
              value="No"
              checked={formData.parking === "No"}
              onChange={(e) => setFormData({ ...formData, parking: e.target.value })}
            />
            <span className="text-sm">No</span>
          </label>
        </div>
      </div>

      {/* Attendance Mode - Only show for HYBRID events */}
      {eventData?.eventMode === 'HYBRID' && (
        <div>
          <label className="block text-sm font-medium mb-2">How will you attend?</label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="attendanceMode"
                value="IN_PERSON"
                checked={formData.attendanceMode === "IN_PERSON"}
                onChange={(e) => setFormData({ ...formData, attendanceMode: e.target.value as "IN_PERSON" })}
                required
              />
              <span className="text-sm">In Person</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="attendanceMode"
                value="VIRTUAL"
                checked={formData.attendanceMode === "VIRTUAL"}
                onChange={(e) => setFormData({ ...formData, attendanceMode: e.target.value as "VIRTUAL" })}
                required
              />
              <span className="text-sm">Virtual</span>
            </label>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            This event supports both in-person and virtual attendance. Please select your preferred mode.
          </p>
        </div>
      )}

      {/* Dietary Restrictions */}
      <div>
        <label className="block text-sm font-medium mb-2">Do you have dietary restrictions?</label>
        <div className="space-y-2">
          {dietaryOptions.length > 0 ? (
            dietaryOptions.map(option => (
              <label key={option} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  value={option}
                  checked={formData.dietaryRestrictions.includes(option)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setFormData({ ...formData, dietaryRestrictions: [...formData.dietaryRestrictions, option] })
                    } else {
                      setFormData({ ...formData, dietaryRestrictions: formData.dietaryRestrictions.filter(d => d !== option) })
                    }
                  }}
                  className="rounded border-gray-300"
                />
                <span className="text-sm">{option}</span>
              </label>
            ))
          ) : (
            <div className="text-sm text-gray-500">Loading dietary options...</div>
          )}
        </div>
        {/* Text input for other dietary restrictions */}
        <div className="mt-3">
          <label className="block text-xs text-gray-600 mb-1">Other dietary restrictions (optional)</label>
          <input
            type="text"
            placeholder="e.g., Vegan, Halal, Kosher"
            className="w-full px-3 py-2 border rounded-lg text-sm"
            onChange={(e) => {
              if (e.target.value && !formData.dietaryRestrictions.includes(e.target.value)) {
                setFormData({ ...formData, dietaryRestrictions: [...formData.dietaryRestrictions, e.target.value] })
              }
            }}
          />
        </div>
      </div>

      {/* Sessions - Only show if sessions exist */}
      {sessions.length > 0 && (
        <div>
          <label className="block text-sm font-medium mb-2">What sessions will you attend?</label>
          <div className="space-y-2">
            {sessions.map(session => (
              <label key={session.id} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  value={session.title}
                  checked={formData.activities.includes(session.title)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setFormData({ ...formData, activities: [...formData.activities, session.title] })
                    } else {
                      setFormData({ ...formData, activities: formData.activities.filter(a => a !== session.title) })
                    }
                  }}
                />
                <span className="text-sm">
                  {session.title}
                  {session.track && <span className="text-xs text-gray-500 ml-1">({session.track})</span>}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}


      {/* Promo Code Section */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold mb-4">Payment & Promo Code</h3>

        <div className="bg-slate-50 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Ticket Price:</span>
            <span className="text-lg font-semibold">₹{(ticketPrice / 100).toFixed(2)}</span>
          </div>
          {promoDiscount && (
            <>
              <div className="flex items-center justify-between mb-2 text-green-600">
                <span className="text-sm font-medium">Discount ({promoDiscount.code}):</span>
                <span className="text-lg font-semibold">-₹{(promoDiscount.calculatedDiscount / 100).toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                <span className="text-sm font-medium">Final Amount:</span>
                <span className="text-xl font-bold text-indigo-600">₹{(promoDiscount.finalAmount / 100).toFixed(2)}</span>
              </div>
            </>
          )}
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium">Have a promo code?</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={promoCode}
              onChange={(e) => {
                setPromoCode(e.target.value.toUpperCase())
                setPromoError("")
              }}
              placeholder="Enter promo code"
              className="flex-1 rounded-md border px-3 py-2 text-sm uppercase"
              disabled={validatingPromo}
            />
            <button
              type="button"
              onClick={validatePromoCode}
              disabled={!promoCode.trim() || validatingPromo}
              className="rounded-md bg-slate-600 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {validatingPromo ? 'Validating...' : 'Apply'}
            </button>
          </div>
          {promoError && (
            <p className="text-sm text-red-600">{promoError}</p>
          )}
          {promoDiscount && (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Promo code applied successfully!</span>
              <button
                type="button"
                onClick={() => {
                  setPromoCode("")
                  setPromoDiscount(null)
                }}
                className="text-slate-600 hover:text-slate-800 underline"
              >
                Remove
              </button>
            </div>
          )}
        </div>
      </div>

      <button
        type="submit"
        className="w-full rounded-md bg-indigo-600 px-4 py-3 text-white font-medium hover:bg-indigo-700"
      >
        Submit Registration
      </button>
    </form>
  )
}

// VIP Registration Form
function VipRegistrationForm({ eventId, hasSeats, inviteData }: { eventId: string, hasSeats: boolean, inviteData: InviteData | null }) {
  const router = useRouter()
  const [formData, setFormData] = useState({
    prefix: "",
    firstName: "",
    lastName: "",
    preferredPronouns: "",
    email: inviteData?.email || "",
    workPhone: "",
    cellPhone: "",
    jobTitle: "",
    company: "",
    flightArrival: "",
    flightDeparture: "",
    pickupLocation: "",
    dropoffLocation: "",
    spouseInfo: "",
    vipNetworking: "",
    eventGifts: ""
  })
  const [promoCode, setPromoCode] = useState("")
  const [promoDiscount, setPromoDiscount] = useState<any>(null)
  const [promoError, setPromoError] = useState("")
  const [validatingPromo, setValidatingPromo] = useState(false)
  const [ticketPrice, setTicketPrice] = useState(0) // Dynamic VIP price from event (default: free)
  const [eventData, setEventData] = useState<any>(null)
  const [sessions, setSessions] = useState<any[]>([])

  // Fetch event data, VIP pricing, and sessions
  useEffect(() => {
    const fetchEventData = async () => {
      try {
        const res = await fetch(`/api/events/${eventId}`)
        if (res.ok) {
          const event = await res.json()
          setEventData(event)
          // VIP is typically 3x the base price, but default to 0 if no price set
          const urlParams = new URLSearchParams(window.location.search)
          const demoPrice = urlParams.get('demoPrice')

          // Only apply demo price if explicitly set, otherwise use event price or 0
          let vipPriceInPaise = 0
          if (demoPrice && demoPrice !== '0') {
            vipPriceInPaise = parseInt(demoPrice) * 3 * 100
          } else if (event.priceInr && event.priceInr > 0) {
            vipPriceInPaise = event.priceInr * 3 * 100
          }

          setTicketPrice(vipPriceInPaise)
        }
      } catch (error) {
        console.error('Failed to fetch event data:', error)
      }
    }

    const fetchSessions = async () => {
      try {
        const res = await fetch(`/api/events/${eventId}/sessions`)
        if (res.ok) {
          const data = await res.json()
          // Handle both array and object response formats
          const apiSessionData = Array.isArray(data) ? data : (data.sessions || [])
          setSessions(apiSessionData)
        }
      } catch (error) {
        console.error('Failed to fetch sessions:', error)
      }
    }

    fetchEventData()
    fetchSessions()
  }, [eventId])

  const validatePromoCode = async () => {
    if (!promoCode.trim()) return
    setValidatingPromo(true)
    setPromoError("")
    try {
      const res = await fetch(`/api/events/${eventId}/promo-codes/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: promoCode, orderAmount: ticketPrice, ticketId: 'vip' })
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Check if seats are available for this event
    if (hasSeats) {
      // Store form data and redirect to seat selection
      const finalAmount = promoDiscount ? promoDiscount.finalAmount : ticketPrice
      localStorage.setItem(`registration:${eventId}:formData`, JSON.stringify({
        ...formData,
        ticketPrice: finalAmount,
        promoCode: promoDiscount?.code,
        type: 'VIP'
      }))
      router.push(`/events/${eventId}/register/seats?ticketClass=VIP`)
      return
    }

    const finalAmount = promoDiscount ? promoDiscount.finalAmount : ticketPrice
    const res = await fetch(`/api/events/${eventId}/registrations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        type: 'VIP',
        email: formData.email,
        phone: formData.cellPhone || formData.workPhone,
        firstName: formData.firstName,
        lastName: formData.lastName,
        ticketId: 'vip',
        totalPrice: ticketPrice,
        priceInr: finalAmount,
        promoCode: promoDiscount?.code,
        data: formData
      })
    })
    if (res.ok) {
      const data = await res.json()
      // Record dummy payment for history if successful
      if (finalAmount > 0) {
        await fetch(`/api/events/${eventId}/registrations/${data.id}/payment`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            paymentMethod: 'DUMMY',
            amount: finalAmount / 100,
            status: 'COMPLETED'
          })
        }).catch(() => { })
      }
      // Store registration data for payment page
      localStorage.setItem('pendingRegistration', JSON.stringify(data))
      alert('VIP Registration successful! Redirecting to payment...')
      // Redirect to payment page with registration ID
      router.push(`/events/${eventId}/register/payment?registrationId=${data.id}`)
    } else {
      const msg = await res.text().catch(() => 'Failed to submit')
      alert(msg)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border p-6 space-y-6">
      <h2 className="text-xl font-semibold border-b pb-3">VIP Registration</h2>

      {/* Prefix */}
      <div>
        <label className="block text-sm font-medium mb-1">Prefix</label>
        <input
          type="text"
          value={formData.prefix}
          onChange={(e) => setFormData({ ...formData, prefix: e.target.value })}
          className="w-full rounded-md border px-3 py-2 text-sm"
        />
      </div>

      {/* Name */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">First Name</label>
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
          <label className="block text-sm font-medium mb-1">Last Name</label>
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

      {/* Preferred Pronouns */}
      <div>
        <label className="block text-sm font-medium mb-1">Preferred Pronouns</label>
        <input
          type="text"
          value={formData.preferredPronouns}
          onChange={(e) => setFormData({ ...formData, preferredPronouns: e.target.value })}
          className="w-full rounded-md border px-3 py-2 text-sm"
        />
      </div>

      {/* Email */}
      <div>
        <label className="block text-sm font-medium mb-1">Email</label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          placeholder="sample@example.com"
          className="w-full rounded-md border px-3 py-2 text-sm"
          required
        />
      </div>

      {/* Work Phone */}
      <div>
        <label className="block text-sm font-medium mb-1">Work Phone</label>
        <input
          type="tel"
          value={formData.workPhone}
          onChange={(e) => setFormData({ ...formData, workPhone: e.target.value })}
          className="w-full rounded-md border px-3 py-2 text-sm"
        />
      </div>

      {/* Cell Phone */}
      <div>
        <label className="block text-sm font-medium mb-1">Cell Phone</label>
        <input
          type="tel"
          value={formData.cellPhone}
          onChange={(e) => setFormData({ ...formData, cellPhone: e.target.value })}
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
          className="w-full rounded-md border px-3 py-2 text-sm"
        />
      </div>

      {/* Flight arrival time */}
      <div>
        <label className="block text-sm font-medium mb-1">Flight arrival time (to be picked up)</label>
        <input
          type="text"
          value={formData.flightArrival}
          onChange={(e) => setFormData({ ...formData, flightArrival: e.target.value })}
          className="w-full rounded-md border px-3 py-2 text-sm"
        />
      </div>

      {/* Flight departure time */}
      <div>
        <label className="block text-sm font-medium mb-1">Flight departure time (to be dropped off)</label>
        <input
          type="text"
          value={formData.flightDeparture}
          onChange={(e) => setFormData({ ...formData, flightDeparture: e.target.value })}
          className="w-full rounded-md border px-3 py-2 text-sm"
        />
      </div>

      {/* Pickup Location */}
      <div>
        <label className="block text-sm font-medium mb-1">Where do you want to be picked up?</label>
        <input
          type="text"
          value={formData.pickupLocation}
          onChange={(e) => setFormData({ ...formData, pickupLocation: e.target.value })}
          className="w-full rounded-md border px-3 py-2 text-sm"
        />
      </div>

      {/* Dropoff Location */}
      <div>
        <label className="block text-sm font-medium mb-1">Where do you want to be dropped off?</label>
        <input
          type="text"
          value={formData.dropoffLocation}
          onChange={(e) => setFormData({ ...formData, dropoffLocation: e.target.value })}
          className="w-full rounded-md border px-3 py-2 text-sm"
        />
      </div>

      {/* Spouse Info */}
      <div>
        <label className="block text-sm font-medium mb-1">Will your spouse attend? Leave name and contact info if so.</label>
        <input
          type="text"
          value={formData.spouseInfo}
          onChange={(e) => setFormData({ ...formData, spouseInfo: e.target.value })}
          className="w-full rounded-md border px-3 py-2 text-sm"
        />
      </div>

      {/* VIP Networking */}
      <div>
        <label className="block text-sm font-medium mb-2">Are you interested in attending the VIP Networking event?</label>
        <div className="flex gap-4">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="vipNetworking"
              value="Yes"
              checked={formData.vipNetworking === "Yes"}
              onChange={(e) => setFormData({ ...formData, vipNetworking: e.target.value })}
            />
            <span className="text-sm">Yes</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="vipNetworking"
              value="No"
              checked={formData.vipNetworking === "No"}
              onChange={(e) => setFormData({ ...formData, vipNetworking: e.target.value })}
            />
            <span className="text-sm">No</span>
          </label>
        </div>
      </div>

      {/* Event Gifts */}
      <div>
        <label className="block text-sm font-medium mb-2">Would you like to be sent event gifts?</label>
        <div className="flex gap-4">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="eventGifts"
              value="Yes"
              checked={formData.eventGifts === "Yes"}
              onChange={(e) => setFormData({ ...formData, eventGifts: e.target.value })}
            />
            <span className="text-sm">Yes</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="eventGifts"
              value="No"
              checked={formData.eventGifts === "No"}
              onChange={(e) => setFormData({ ...formData, eventGifts: e.target.value })}
            />
            <span className="text-sm">No</span>
          </label>
        </div>
      </div>

      {/* Promo Code Section */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold mb-4">Payment & Promo Code</h3>

        <div className="bg-slate-50 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">VIP Ticket Price:</span>
            <span className="text-lg font-semibold">₹{(ticketPrice / 100).toFixed(2)}</span>
          </div>
          {promoDiscount && (
            <>
              <div className="flex items-center justify-between mb-2 text-green-600">
                <span className="text-sm font-medium">Discount ({promoDiscount.code}):</span>
                <span className="text-lg font-semibold">-₹{(promoDiscount.calculatedDiscount / 100).toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                <span className="text-sm font-medium">Final Amount:</span>
                <span className="text-xl font-bold text-indigo-600">₹{(promoDiscount.finalAmount / 100).toFixed(2)}</span>
              </div>
            </>
          )}
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium">Have a promo code?</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={promoCode}
              onChange={(e) => {
                setPromoCode(e.target.value.toUpperCase())
                setPromoError("")
              }}
              placeholder="Enter promo code"
              className="flex-1 rounded-md border px-3 py-2 text-sm uppercase"
              disabled={validatingPromo}
            />
            <button
              type="button"
              onClick={validatePromoCode}
              disabled={!promoCode.trim() || validatingPromo}
              className="rounded-md bg-slate-600 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {validatingPromo ? 'Validating...' : 'Apply'}
            </button>
          </div>
          {promoError && (
            <p className="text-sm text-red-600">{promoError}</p>
          )}
          {promoDiscount && (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Promo code applied successfully!</span>
              <button
                type="button"
                onClick={() => {
                  setPromoCode("")
                  setPromoDiscount(null)
                }}
                className="text-slate-600 hover:text-slate-800 underline"
              >
                Remove
              </button>
            </div>
          )}
        </div>
      </div>

      <button
        type="submit"
        className="w-full rounded-md bg-indigo-600 px-4 py-3 text-white font-medium hover:bg-indigo-700"
      >
        Submit VIP Registration
      </button>
    </form>
  )
}

