'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Calendar, MapPin, Users, ArrowLeft, Ticket, Clock, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react'

interface Session {
    id: string
    title: string
    description: string
    startTime: string
    endTime: string
    room?: string
    track?: string
}

interface Speaker {
    id: string
    name: string
    title: string
    photoUrl: string
}

interface FAQ {
    question: string
    answer: string
}

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
    organizerLogo?: string
    expectedAttendees: number
    sessions: Session[]
    speakers: Speaker[]
    faqs?: FAQ[]
}

export default function PublicEventPage({ params }: { params: { id: string } }) {
    const router = useRouter()
    const [event, setEvent] = useState<EventData | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [openFaqs, setOpenFaqs] = useState<number[]>([])

    const toggleFaq = (index: number) => {
        setOpenFaqs(prev =>
            prev.includes(index)
                ? prev.filter(i => i !== index)
                : [...prev, index]
        )
    }

    useEffect(() => {
        const fetchEvent = async () => {
            try {
                // Use the public API which includes sessions and speakers
                const res = await fetch(`/api/events/${params.id}/public`)
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

    const formatTime = (dateStr: string) => {
        return new Date(dateStr).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        })
    }

    return (
        <div className="min-h-screen bg-white">
            {/* Hero Banner */}
            <div className="relative h-64 md:h-80 bg-gradient-to-br from-purple-900 to-indigo-900">
                {event.bannerUrl && (
                    <img
                        src={event.bannerUrl}
                        alt={event.name}
                        className="absolute inset-0 w-full h-full object-cover opacity-60"
                    />
                )}
                <div className="absolute inset-0 bg-black/20"></div>
                <div className="relative max-w-5xl mx-auto px-6 h-full flex flex-col justify-end pb-12">
                    <Link href="/dashboard/user" className="text-white/80 hover:text-white mb-6 inline-flex items-center gap-2 text-sm font-medium">
                        <ArrowLeft className="w-4 h-4" />
                        Back to Events
                    </Link>
                    <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">{event.name}</h1>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-6 py-12">
                <div className="grid lg:grid-cols-3 gap-12">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-12">
                        {/* Event Details */}
                        <section>
                            <h2 className="text-2xl font-bold text-gray-900 mb-6">About This Event</h2>
                            <div className="prose prose-purple max-w-none text-gray-600 leading-relaxed whitespace-pre-wrap">
                                {event.description || "No description provided for this event."}
                            </div>
                        </section>

                        {/* Event Info Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="bg-gray-50 rounded-2xl p-6 transition-colors hover:bg-gray-100">
                                <div className="flex items-start gap-4">
                                    <div className="bg-purple-100 p-3 rounded-xl">
                                        <Calendar className="w-6 h-6 text-purple-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-500 mb-1">Date & Time</p>
                                        <p className="font-bold text-gray-900">
                                            {new Date(event.startsAt).toLocaleDateString('en-US', {
                                                weekday: 'short',
                                                month: 'short',
                                                day: 'numeric',
                                                year: 'numeric'
                                            })}
                                        </p>
                                        <p className="text-sm text-gray-600 mt-1">
                                            {formatTime(event.startsAt)} – {formatTime(event.endsAt)}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gray-50 rounded-2xl p-6 transition-colors hover:bg-gray-100">
                                <div className="flex items-start gap-4">
                                    <div className="bg-pink-100 p-3 rounded-xl">
                                        <MapPin className="w-6 h-6 text-pink-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-500 mb-1">Location</p>
                                        <p className="font-bold text-gray-900">
                                            {event.eventMode === 'ONLINE' ? 'Online event' : (event.venue || event.city || 'TBD')}
                                        </p>
                                        {event.eventMode !== 'ONLINE' && event.city && (
                                            <p className="text-sm text-gray-600 mt-1">{event.city}</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gray-50 rounded-2xl p-6 transition-colors hover:bg-gray-100">
                                <div className="flex items-start gap-4">
                                    <div className="bg-blue-100 p-3 rounded-xl">
                                        <Users className="w-6 h-6 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-500 mb-1">Capacity</p>
                                        <p className="font-bold text-gray-900">{event.expectedAttendees || 'Unlimited'} Attendees</p>
                                        <p className="text-sm text-gray-600 mt-1">Confirmed participants</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gray-50 rounded-2xl p-6 transition-colors hover:bg-gray-100">
                                <div className="flex items-start gap-4">
                                    <div className="bg-green-100 p-3 rounded-xl">
                                        <Ticket className="w-6 h-6 text-green-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-500 mb-1">Category</p>
                                        <p className="font-bold text-gray-900 uppercase tracking-wide">{event.category || 'General'}</p>
                                        <p className="text-sm text-gray-600 mt-1">Event type</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Agenda Section */}
                        {event.sessions && event.sessions.length > 0 && (
                            <section className="pt-8">
                                <h2 className="text-2xl font-bold text-gray-900 mb-8">Agenda</h2>
                                <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
                                    {event.sessions.map((session, index) => (
                                        <div key={session.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group select-none">
                                            {/* Dot */}
                                            <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-slate-300 group-hover:bg-purple-500 text-slate-500 group-hover:text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 transition-colors duration-200">
                                                <Clock className="w-5 h-5" />
                                            </div>
                                            {/* Card */}
                                            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-6 rounded-2xl border border-slate-200 shadow-sm transition-all hover:shadow-md hover:border-purple-200">
                                                <div className="flex items-center justify-between space-x-2 mb-2">
                                                    <div className="font-bold text-purple-600">
                                                        {formatTime(session.startTime)} – {formatTime(session.endTime)}
                                                    </div>
                                                </div>
                                                <div className="text-slate-900 font-bold text-lg mb-1">{session.title}</div>
                                                <div className="text-slate-500 text-sm line-clamp-2 md:line-clamp-none">
                                                    {session.description || "Experience an engaging session exploring key insights and industry best practices."}
                                                </div>
                                                {session.room && (
                                                    <div className="mt-3 flex items-center gap-2 text-xs font-medium text-slate-400">
                                                        <MapPin className="w-3 h-3" />
                                                        {session.room}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* FAQ Section */}
                        {event.faqs && event.faqs.length > 0 && (
                            <section className="pt-8">
                                <h2 className="text-2xl font-bold text-gray-900 mb-8">Frequently asked questions</h2>
                                <div className="space-y-4">
                                    {event.faqs.map((faq, index) => (
                                        <div
                                            key={index}
                                            className="border border-gray-200 rounded-2xl overflow-hidden bg-white hover:border-purple-200 transition-colors"
                                        >
                                            <button
                                                onClick={() => toggleFaq(index)}
                                                className="w-full flex items-center justify-between p-6 text-left focus:outline-none"
                                            >
                                                <span className="font-bold text-gray-900">{faq.question}</span>
                                                {openFaqs.includes(index) ? (
                                                    <ChevronUp className="w-5 h-5 text-purple-500" />
                                                ) : (
                                                    <ChevronDown className="w-5 h-5 text-gray-400" />
                                                )}
                                            </button>
                                            {openFaqs.includes(index) && (
                                                <div className="px-6 pb-6 text-gray-600 leading-relaxed">
                                                    {faq.answer}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}
                    </div>

                    {/* Sidebar - Registration Card */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 sticky top-8">
                            <div className="mb-8">
                                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">Ticket Price</p>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-4xl font-black text-purple-600">
                                        {event.priceInr && event.priceInr > 0 ? `₹${event.priceInr}` : 'Free'}
                                    </span>
                                    {event.priceInr > 0 && <span className="text-gray-400 font-medium">/ person</span>}
                                </div>
                            </div>

                            <div className="space-y-4 mb-8">
                                <div className="flex items-center gap-3 text-sm text-gray-600 bg-gray-50 p-3 rounded-xl border border-gray-100">
                                    <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
                                    <span className="font-medium">Instant confirmation</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-gray-600 bg-gray-50 p-3 rounded-xl border border-gray-100">
                                    <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
                                    <span className="font-medium">E-ticket sent to your email</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-gray-600 bg-gray-50 p-3 rounded-xl border border-gray-100">
                                    <Clock className="w-5 h-5 text-purple-500 shrink-0" />
                                    <span className="font-medium">
                                        {event.eventMode === 'ONLINE' ? 'Virtual access link' : 'On-site registration'}
                                    </span>
                                </div>
                            </div>

                            {new Date(event.endsAt) < new Date() ? (
                                <button
                                    disabled
                                    className="w-full bg-gray-100 text-gray-400 py-4 px-6 rounded-2xl font-bold text-lg cursor-not-allowed border border-gray-200"
                                >
                                    Event Ended
                                </button>
                            ) : (
                                <Link
                                    href={`/book/${params.id}`}
                                    className="block w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-center py-4 px-6 rounded-2xl font-bold text-lg hover:shadow-lg hover:shadow-purple-200 active:scale-[0.98] transition-all"
                                >
                                    Reserve a spot
                                </Link>
                            )}

                            <div className="mt-6 flex items-center justify-center gap-2 text-xs text-gray-400 font-medium">
                                <Ticket className="w-3 h-3" />
                                Secure checkout by Ayphen
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
