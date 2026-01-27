'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { ArrowLeft, Calendar, MapPin, User, Mail, Phone, Ticket, CheckCircle, Loader2, Armchair } from 'lucide-react'
import { SeatMap } from '@/components/seats/SeatMap'

interface EventData {
    id: string
    name: string
    startsAt: string
    venue: string
    city: string
    priceInr: number
    floorPlanId?: string
}

interface Seat {
    id: string
    priceInr: number
    seatLabel: string
}

export default function BookEventPage({ params }: { params: { id: string } }) {
    const router = useRouter()
    const { data: session, status } = useSession()
    const [event, setEvent] = useState<EventData | null>(null)
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [selectedSeats, setSelectedSeats] = useState<Seat[]>([])

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        quantity: 1
    })

    useEffect(() => {
        const fetchEvent = async () => {
            try {
                const res = await fetch(`/api/events/${params.id}`)
                if (res.ok) {
                    const data = await res.json()
                    setEvent(data)
                } else {
                    setError('Event not found')
                }
            } catch (err) {
                setError('Failed to load event')
            } finally {
                setLoading(false)
            }
        }
        fetchEvent()
    }, [params.id])

    useEffect(() => {
        if (session?.user) {
            setFormData(prev => ({
                ...prev,
                name: session.user.name || '',
                email: session.user.email || ''
            }))
        }
    }, [session])

    // Update form quantity when seats are selected
    useEffect(() => {
        if (selectedSeats.length > 0) {
            setFormData(prev => ({ ...prev, quantity: selectedSeats.length }))
        }
    }, [selectedSeats])

    const handleSeatsSelected = (seats: any[]) => {
        setSelectedSeats(seats)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitting(true)
        setError(null)

        try {
            // Split name into firstName and lastName
            const nameParts = formData.name.trim().split(' ')
            const firstName = nameParts[0] || ''
            const lastName = nameParts.slice(1).join(' ') || nameParts[0] || 'User'

            // Calculate total price based on seats if selected, otherwise standard price
            const totalPrice = selectedSeats.length > 0
                ? selectedSeats.reduce((sum, s) => sum + (s.priceInr || event?.priceInr || 0), 0)
                : (event?.priceInr || 0) * formData.quantity

            const payload = {
                firstName,
                lastName,
                email: formData.email,
                phone: formData.phone,
                quantity: formData.quantity,
                ticketType: 'GENERAL',
                seatIds: selectedSeats.map(s => s.id),
                totalPrice
            }

            const res = await fetch(`/api/events/${params.id}/registrations`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(payload)
            })

            if (res.ok) {
                setSuccess(true)
            } else {
                const data = await res.json()
                setError(data.message || 'Registration failed')
            }
        } catch (err) {
            setError('Something went wrong. Please try again.')
        } finally {
            setSubmitting(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
            </div>
        )
    }

    if (error && !event) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Event not found</h1>
                    <Link href="/dashboard/user" className="text-purple-600 hover:text-purple-700">
                        ← Back to Events
                    </Link>
                </div>
            </div>
        )
    }

    if (success) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center p-6">
                <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="w-10 h-10 text-green-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Registration Successful!</h1>
                    <p className="text-gray-600 mb-6">
                        Your ticket has been booked for <strong>{event?.name}</strong>.
                        Check your email for confirmation details.
                    </p>
                    <div className="space-y-3">
                        <Link
                            href="/dashboard/user/tickets"
                            className="block w-full bg-purple-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-purple-700"
                        >
                            View My Tickets
                        </Link>
                        <Link
                            href="/dashboard/user"
                            className="block w-full bg-gray-100 text-gray-900 py-3 px-6 rounded-xl font-semibold hover:bg-gray-200"
                        >
                            Browse More Events
                        </Link>
                    </div>
                </div>
            </div>
        )
    }

    const hasFloorPlan = !!event?.floorPlanId

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50 py-12">
            <div className={`mx-auto px-6 ${hasFloorPlan ? 'max-w-6xl' : 'max-w-2xl'}`}>
                <Link href={`/event/${params.id}`} className="text-purple-600 hover:text-purple-700 inline-flex items-center gap-2 mb-6">
                    <ArrowLeft className="w-4 h-4" />
                    Back to Event
                </Link>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left Column: Seat Selection (if available) or Event Info */}
                    {hasFloorPlan && (
                        <div className="space-y-6">
                            <div className="bg-white rounded-2xl shadow-lg p-6">
                                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                                    <Armchair className="w-5 h-5 text-purple-600" />
                                    Select Seats
                                </h2>
                                <SeatMap
                                    eventId={params.id}
                                    floorPlanId={event.floorPlanId!}
                                    onSeatsSelected={handleSeatsSelected}
                                    maxSeats={10} // Increased limit per request
                                />
                            </div>
                        </div>
                    )}

                    {/* Right Column (or Center if no seats): Booking Form */}
                    <div className={`${hasFloorPlan ? '' : 'lg:col-span-2 lg:max-w-2xl lg:mx-auto w-full'}`}>
                        <div className="bg-white rounded-2xl shadow-xl overflow-hidden sticky top-6">
                            {/* Header */}
                            <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 text-white">
                                <h1 className="text-2xl font-bold mb-2">Complete Your Booking</h1>
                                <p className="text-white/80">{event?.name}</p>
                            </div>

                            {/* Event Summary */}
                            <div className="p-6 bg-purple-50 border-b">
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between text-sm text-gray-600">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-4 h-4" />
                                            {event && new Date(event.startsAt).toLocaleDateString('en-US', {
                                                weekday: 'long', month: 'long', day: 'numeric',
                                            })}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <MapPin className="w-4 h-4" />
                                            {event?.city}
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between pt-2 border-t border-purple-100">
                                        <span className="text-gray-600">Total Amount</span>
                                        <span className="text-2xl font-bold text-purple-600">
                                            {selectedSeats.length > 0
                                                ? `₹${selectedSeats.reduce((sum, s) => sum + (s.priceInr || event?.priceInr || 0), 0)}`
                                                : (event?.priceInr ? `₹${event.priceInr * formData.quantity}` : 'FREE')
                                            }
                                        </span>
                                    </div>

                                    {selectedSeats.length > 0 && (
                                        <div className="text-xs text-gray-500">
                                            Selected: {selectedSeats.map(s => s.seatLabel).join(', ')}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Form */}
                            <form onSubmit={handleSubmit} className="p-6 space-y-6">
                                {status === 'unauthenticated' && (
                                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-4">
                                        <p className="text-sm text-yellow-800">
                                            <Link href="/auth/login" className="font-semibold text-yellow-900 hover:underline">Sign in</Link> for a faster checkout experience
                                        </p>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        <User className="w-4 h-4 inline mr-2" />
                                        Full Name
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                        placeholder="Enter your name"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        <Mail className="w-4 h-4 inline mr-2" />
                                        Email Address
                                    </label>
                                    <input
                                        type="email"
                                        required
                                        value={formData.email}
                                        onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                        placeholder="Enter your email"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        <Phone className="w-4 h-4 inline mr-2" />
                                        Phone Number
                                    </label>
                                    <input
                                        type="tel"
                                        required
                                        value={formData.phone}
                                        onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                        placeholder="Enter your phone number"
                                    />
                                </div>

                                {!hasFloorPlan && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            <Ticket className="w-4 h-4 inline mr-2" />
                                            Number of Tickets
                                        </label>
                                        <input
                                            type="number"
                                            min="1"
                                            max="100" // Increased limit significantly
                                            value={formData.quantity}
                                            onChange={e => setFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">Enter number of tickets (max 100)</p>
                                    </div>
                                )}

                                {hasFloorPlan && (
                                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                                        <p className="text-sm text-blue-800 flex items-center gap-2">
                                            <CheckCircle className="w-4 h-4" />
                                            {selectedSeats.length} seat{selectedSeats.length !== 1 ? 's' : ''} selected
                                        </p>
                                    </div>
                                )}

                                {error && (
                                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
                                        {error}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={submitting || (hasFloorPlan && selectedSeats.length === 0)}
                                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 px-6 rounded-xl font-semibold text-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {submitting ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Processing...
                                        </>
                                    ) : (
                                        <>
                                            <Ticket className="w-5 h-5" />
                                            {hasFloorPlan && selectedSeats.length === 0 ? 'Select Seats to Continue' : 'Confirm Booking'}
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
