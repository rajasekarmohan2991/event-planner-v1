'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Ticket, Calendar, MapPin, Clock, Download, QrCode, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { RouteProtection } from '@/components/RoleBasedNavigation'

interface TicketData {
    id: string
    eventId: string
    eventName: string
    eventDate: string
    venue: string
    city: string
    ticketType: string
    status: string
    qrCode?: string
    createdAt: string
}

export default function MyTicketsPage() {
    const { data: session, status } = useSession()
    const [tickets, setTickets] = useState<TicketData[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (status === 'authenticated') {
            fetchTickets()
        }
    }, [status])

    const fetchTickets = async () => {
        try {
            const res = await fetch('/api/registrations/my', { credentials: 'include' })
            if (res.ok) {
                const data = await res.json()
                setTickets(data.registrations || [])
            }
        } catch (error) {
            console.error('Error fetching tickets:', error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <RouteProtection requiredRoles={['USER', 'ADMIN', 'SUPER_ADMIN']}>
                <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50 py-12">
                    <div className="max-w-4xl mx-auto px-6">
                        <div className="animate-pulse space-y-6">
                            <div className="h-10 bg-slate-200 rounded w-1/3"></div>
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-40 bg-slate-200 rounded-2xl"></div>
                            ))}
                        </div>
                    </div>
                </div>
            </RouteProtection>
        )
    }

    return (
        <RouteProtection requiredRoles={['USER', 'ADMIN', 'SUPER_ADMIN']}>
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50 py-12">
                <div className="max-w-4xl mx-auto px-6">

                    {/* Header */}
                    <div className="mb-8">
                        <Link href="/dashboard/user" className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 mb-4">
                            <ArrowLeft className="w-4 h-4" />
                            Back to Dashboard
                        </Link>
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl">
                                <Ticket className="w-8 h-8 text-white" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">My Tickets</h1>
                                <p className="text-gray-600">View and manage your event tickets</p>
                            </div>
                        </div>
                    </div>

                    {/* Tickets List */}
                    {tickets.length === 0 ? (
                        <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                            <Ticket className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                            <h2 className="text-xl font-semibold text-gray-900 mb-2">No Tickets Yet</h2>
                            <p className="text-gray-600 mb-6">You haven't registered for any events yet.</p>
                            <Link
                                href="/dashboard/user"
                                className="inline-flex items-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-purple-700 transition-colors"
                            >
                                Browse Events
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {tickets.map(ticket => (
                                <div key={ticket.id} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                                    <div className="flex flex-col md:flex-row">
                                        {/* Ticket Info */}
                                        <div className="flex-1 p-6">
                                            <div className="flex items-start justify-between mb-4">
                                                <div>
                                                    <h3 className="text-xl font-bold text-gray-900 mb-1">{ticket.eventName}</h3>
                                                    <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${ticket.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                                                            ticket.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                                                                'bg-gray-100 text-gray-700'
                                                        }`}>
                                                        {ticket.status}
                                                    </span>
                                                </div>
                                                <span className="text-xs text-gray-500">{ticket.ticketType}</span>
                                            </div>

                                            <div className="space-y-2 text-gray-600">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="w-4 h-4 text-purple-500" />
                                                    <span>{new Date(ticket.eventDate).toLocaleDateString('en-US', {
                                                        weekday: 'long',
                                                        month: 'long',
                                                        day: 'numeric',
                                                        year: 'numeric'
                                                    })}</span>
                                                </div>
                                                {ticket.venue && (
                                                    <div className="flex items-center gap-2">
                                                        <MapPin className="w-4 h-4 text-pink-500" />
                                                        <span>{ticket.venue}</span>
                                                    </div>
                                                )}
                                                {ticket.city && (
                                                    <div className="flex items-center gap-2">
                                                        <MapPin className="w-4 h-4 text-blue-500" />
                                                        <span>{ticket.city}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* QR Code Side */}
                                        <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 flex flex-col items-center justify-center border-t md:border-t-0 md:border-l border-gray-200">
                                            <div className="w-24 h-24 bg-white rounded-xl shadow-inner flex items-center justify-center mb-3">
                                                <QrCode className="w-16 h-16 text-purple-600" />
                                            </div>
                                            <button className="text-purple-600 hover:text-purple-700 flex items-center gap-1 text-sm font-medium">
                                                <Download className="w-4 h-4" />
                                                Download
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                </div>
            </div>
        </RouteProtection>
    )
}
