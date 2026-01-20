'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Calendar, MapPin, Users, ArrowLeft, Ticket, Clock, CheckCircle } from 'lucide-react'

interface EventData {
    id: string
    name: string
    description: string
    startsAt: string
    endsAt: string
    venue: string
    city: string
    eventMode: string
    category: string
    priceInr: number
    bannerUrl: string
    organizerName: string
    expectedAttendees: number
}

export default function PublicEventPage({ params }: { params: { id: string } }) {
    const router = useRouter()
    const [event, setEvent] = useState<EventData | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

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

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 py-12">
                <div className="max-w-4xl mx-auto px-6">
                    <div className="animate-pulse">
                        <div className="h-64 bg-gray-200 rounded-2xl mb-6"></div>
                        <div className="h-8 bg-gray-200 rounded w-1/2 mb-4"></div>
                        <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    </div>
                </div>
            </div>
        )
    }

    if (error || !event) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Event not found</h1>
                    <p className="text-gray-600 mb-4">This event may have been removed or doesn't exist.</p>
                    <Link href="/dashboard/user" className="text-purple-600 hover:text-purple-700 font-medium">
                        ← Back to Events
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50">
            {/* Hero Banner */}
            <div className="relative h-64 md:h-80 bg-gradient-to-br from-purple-600 to-pink-600">
                {event.bannerUrl && (
                    <img
                        src={event.bannerUrl}
                        alt={event.name}
                        className="absolute inset-0 w-full h-full object-cover opacity-50"
                    />
                )}
                <div className="absolute inset-0 bg-black/30"></div>
                <div className="relative max-w-4xl mx-auto px-6 h-full flex flex-col justify-end pb-8">
                    <Link href="/dashboard/user" className="text-white/80 hover:text-white mb-4 inline-flex items-center gap-2">
                        <ArrowLeft className="w-4 h-4" />
                        Back to Events
                    </Link>
                    <h1 className="text-3xl md:text-4xl font-bold text-white">{event.name}</h1>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-6 py-8">
                <div className="grid md:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="md:col-span-2 space-y-6">
                        {/* Event Details */}
                        <div className="bg-white rounded-2xl shadow-lg p-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">About This Event</h2>
                            <p className="text-gray-600 whitespace-pre-wrap">{event.description}</p>
                        </div>

                        {/* Event Info Cards */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white rounded-xl shadow p-4">
                                <div className="flex items-center gap-3">
                                    <Calendar className="w-8 h-8 text-purple-500" />
                                    <div>
                                        <p className="text-xs text-gray-500">Date & Time</p>
                                        <p className="font-semibold text-gray-900">
                                            {new Date(event.startsAt).toLocaleDateString('en-US', {
                                                weekday: 'short',
                                                month: 'short',
                                                day: 'numeric'
                                            })}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-xl shadow p-4">
                                <div className="flex items-center gap-3">
                                    <MapPin className="w-8 h-8 text-pink-500" />
                                    <div>
                                        <p className="text-xs text-gray-500">Location</p>
                                        <p className="font-semibold text-gray-900">{event.city}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-xl shadow p-4">
                                <div className="flex items-center gap-3">
                                    <Users className="w-8 h-8 text-blue-500" />
                                    <div>
                                        <p className="text-xs text-gray-500">Expected</p>
                                        <p className="font-semibold text-gray-900">{event.expectedAttendees || '50+'} attendees</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-xl shadow p-4">
                                <div className="flex items-center gap-3">
                                    <Ticket className="w-8 h-8 text-green-500" />
                                    <div>
                                        <p className="text-xs text-gray-500">Category</p>
                                        <p className="font-semibold text-gray-900">{event.category}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar - Registration Card */}
                    <div className="md:col-span-1">
                        <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-24">
                            <div className="text-center mb-6">
                                <p className="text-sm text-gray-500">Price</p>
                                <p className="text-3xl font-bold text-purple-600">
                                    {event.priceInr && event.priceInr > 0 ? `₹${event.priceInr}` : 'FREE'}
                                </p>
                            </div>

                            <div className="space-y-3 mb-6">
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                    <span>Instant confirmation</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                    <span>E-ticket on email</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                    <span>{event.eventMode === 'IN_PERSON' ? 'In-person event' : 'Virtual event'}</span>
                                </div>
                            </div>

                            <Link
                                href={`/book/${params.id}`}
                                className="block w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white text-center py-4 px-6 rounded-xl font-semibold text-lg hover:opacity-90 transition-opacity shadow-lg"
                            >
                                Book Now
                            </Link>

                            <p className="text-center text-xs text-gray-500 mt-4">
                                Secure checkout • Powered by Ayphen
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
