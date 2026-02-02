'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Ticket, Calendar, MapPin, Clock, Download, QrCode, ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { RouteProtection } from '@/components/RoleBasedNavigation'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

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
    const [downloadingId, setDownloadingId] = useState<string | null>(null)

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

    const handleDownload = async (ticket: TicketData) => {
        setDownloadingId(ticket.id)
        try {
            const element = document.getElementById(`ticket-card-${ticket.id}`)
            if (!element) {
                alert('Could not find ticket element to download')
                return
            }

            // Using html2canvas to capture the ticket div
            const canvas = await html2canvas(element, {
                scale: 2, // Higher quality
                useCORS: true, // Allow cross-origin images
                logging: false,
                backgroundColor: '#ffffff'
            })

            const imgData = canvas.toDataURL('image/png')

            // Create PDF (Landscape mostly fits tickets better, or portrait if tall)
            // Determine orientation based on aspect ratio
            const orientation = canvas.width > canvas.height ? 'landscape' : 'portrait'
            const pdf = new jsPDF(orientation, 'mm', 'a4')

            const pdfWidth = pdf.internal.pageSize.getWidth()
            const pdfHeight = pdf.internal.pageSize.getHeight()

            const imgProps = pdf.getImageProperties(imgData)
            const ratio = imgProps.width / imgProps.height

            let w = pdfWidth
            let h = w / ratio

            // If height exceeds page, scale down
            if (h > pdfHeight) {
                h = pdfHeight
                w = h * ratio
            }

            // Center image
            const x = (pdfWidth - w) / 2
            const y = (pdfHeight - h) / 2

            pdf.addImage(imgData, 'PNG', x, y, w, h)
            pdf.save(`Ticket-${ticket.eventName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`)

        } catch (error) {
            console.error('Download error:', error)
            alert('Failed to generate PDF. Please try again or use browser print.')
        } finally {
            setDownloadingId(null)
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
                        <Link href="/dashboard/user" className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 mb-4 transition-colors">
                            <ArrowLeft className="w-4 h-4" />
                            Back to Dashboard
                        </Link>
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl shadow-lg shadow-purple-200">
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
                        <div className="bg-white rounded-2xl shadow-lg p-12 text-center border border-gray-100">
                            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Ticket className="w-10 h-10 text-gray-400" />
                            </div>
                            <h2 className="text-xl font-semibold text-gray-900 mb-2">No Tickets Yet</h2>
                            <p className="text-gray-600 mb-8 max-w-sm mx-auto">You haven't registered for any events yet. Check out the dashboard to find amazing events!</p>
                            <Link
                                href="/dashboard/user"
                                className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-3 rounded-xl font-bold hover:shadow-lg hover:scale-105 transition-all"
                            >
                                Browse Events
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {tickets.map(ticket => (
                                <div
                                    key={ticket.id}
                                    id={`ticket-card-${ticket.id}`} // Target ID for html2canvas
                                    className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all border border-gray-100 group"
                                >
                                    <div className="flex flex-col md:flex-row">
                                        {/* Ticket Info */}
                                        <div className="flex-1 p-6 md:p-8">
                                            <div className="flex items-start justify-between mb-6">
                                                <div>
                                                    <h3 className="text-2xl font-bold text-gray-900 mb-2 group-hover:text-purple-700 transition-colors">{ticket.eventName}</h3>
                                                    <span className={`inline-flex px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full ${ticket.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                                                        ticket.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                                                            'bg-gray-100 text-gray-700'
                                                        }`}>
                                                        {ticket.status}
                                                    </span>
                                                </div>
                                                <span className="text-sm font-medium text-gray-500 bg-gray-50 px-3 py-1 rounded-lg border border-gray-100">
                                                    {ticket.ticketType}
                                                </span>
                                            </div>

                                            <div className="space-y-3 text-gray-600">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
                                                        <Calendar className="w-5 h-5" />
                                                    </div>
                                                    <span className="font-medium">{new Date(ticket.eventDate).toLocaleDateString('en-US', {
                                                        weekday: 'long',
                                                        month: 'long',
                                                        day: 'numeric',
                                                        year: 'numeric'
                                                    })}</span>
                                                </div>
                                                {(ticket.venue || ticket.city) && (
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 bg-pink-50 rounded-lg text-pink-600">
                                                            <MapPin className="w-5 h-5" />
                                                        </div>
                                                        <span className="font-medium">
                                                            {[ticket.venue, ticket.city].filter(Boolean).join(', ')}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="mt-6 pt-6 border-t border-dashed border-gray-200 flex justify-between items-center text-xs text-gray-400">
                                                <span>Ref: {ticket.id.slice(-8).toUpperCase()}</span>
                                                <span>Booked on {ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString() : 'N/A'}</span>
                                            </div>
                                        </div>

                                        {/* QR Code Side (Right) */}
                                        <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-6 flex flex-col items-center justify-center border-t md:border-t-0 md:border-l border-gray-200 min-w-[200px] relative">
                                            {/* Left notch decoration */}
                                            <div className="hidden md:block absolute left-[-12px] top-1/2 -translate-y-1/2 w-6 h-6 bg-white rounded-full border-r border-gray-100 z-10"></div>

                                            <div className="w-32 h-32 bg-white rounded-xl shadow-sm border border-gray-200 flex items-center justify-center mb-4 p-2">
                                                {/* Using standard icon for now, ideally dynamic QR ref */}
                                                <QrCode className="w-24 h-24 text-slate-800" />
                                            </div>

                                            <button
                                                onClick={() => handleDownload(ticket)}
                                                disabled={downloadingId === ticket.id}
                                                className="w-full text-purple-600 hover:text-white hover:bg-purple-600 border border-purple-200 hover:border-purple-600 bg-white px-4 py-2 rounded-xl flex items-center justify-center gap-2 text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-wait"
                                                data-html2canvas-ignore // Don't include button in PDF
                                            >
                                                {downloadingId === ticket.id ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <Download className="w-4 h-4" />
                                                )}
                                                {downloadingId === ticket.id ? 'Generating...' : 'Download Ticket'}
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
