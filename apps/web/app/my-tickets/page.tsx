"use client"

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Ticket, Calendar, MapPin, Clock, QrCode, Download, ExternalLink, Sparkles } from 'lucide-react'
import QRCode from 'qrcode'

type TicketData = {
  id: string
  eventId: string
  eventName: string
  eventDate: string
  eventTime: string
  venue: string
  city: string
  seatNumber?: string
  ticketClass: string
  price: number
  qrCode: string
  status: string
  registrationDate: string
}

export default function MyTicketsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [tickets, setTickets] = useState<TicketData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedTicket, setSelectedTicket] = useState<TicketData | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
    } else if (status === 'authenticated') {
      loadTickets()
    }
  }, [status, router])

  const loadTickets = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/registrations/my', { credentials: 'include' })
      
      if (!res.ok) {
        throw new Error('Failed to load tickets')
      }

      const data = await res.json()
      
      // Transform registrations into ticket format
      const ticketData = await Promise.all(
        (data.registrations || []).map(async (reg: any) => {
          // Generate QR code for ticket
          const qrData = JSON.stringify({
            registrationId: reg.id,
            eventId: reg.eventId,
            userId: session?.user?.id,
            email: session?.user?.email
          })
          
          const qrCodeUrl = await QRCode.toDataURL(qrData)
          
          return {
            id: reg.id,
            eventId: reg.eventId,
            eventName: reg.eventName || 'Event',
            eventDate: reg.eventDate || reg.createdAt,
            eventTime: reg.eventTime || '00:00',
            venue: reg.venue || 'TBA',
            city: reg.city || 'TBA',
            seatNumber: reg.seatNumber,
            ticketClass: reg.ticketClass || 'General',
            price: reg.price || 0,
            qrCode: qrCodeUrl,
            status: reg.status || 'CONFIRMED',
            registrationDate: reg.createdAt
          }
        })
      )
      
      setTickets(ticketData)
    } catch (err: any) {
      setError(err.message || 'Failed to load tickets')
    } finally {
      setLoading(false)
    }
  }

  const downloadTicket = (ticket: TicketData) => {
    // Create a printable ticket
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Ticket - ${ticket.eventName}</title>
        <style>
          body {
            font-family: 'Inter', system-ui, -apple-system, sans-serif;
            padding: 40px;
            max-width: 600px;
            margin: 0 auto;
            background-color: #f8fafc;
          }
          .ticket {
            border: none;
            border-radius: 24px;
            padding: 0;
            background: white;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
            overflow: hidden;
          }
          .ticket-header {
            background: linear-gradient(135deg, #e11d48 0%, #be123c 100%);
            color: white;
            padding: 40px;
            text-align: center;
          }
          .ticket-title {
            font-size: 32px;
            font-weight: 800;
            margin-bottom: 10px;
            letter-spacing: -0.025em;
          }
          .ticket-details {
            padding: 40px;
            color: #334155;
          }
          .detail-row {
            display: flex;
            justify-content: space-between;
            padding: 16px 0;
            border-bottom: 1px solid #f1f5f9;
          }
          .detail-row:last-child {
            border-bottom: none;
          }
          .detail-label {
            font-weight: 600;
            color: #64748b;
            text-transform: uppercase;
            font-size: 12px;
            letter-spacing: 0.05em;
          }
          .detail-value {
            font-weight: 600;
            text-align: right;
          }
          .qr-code {
            text-align: center;
            padding: 40px;
            background: #f8fafc;
            border-top: 1px solid #e2e8f0;
          }
          .qr-code img {
            max-width: 180px;
            border-radius: 12px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          }
          @media print {
            body { padding: 0; background: white; }
            .ticket { box-shadow: none; border: 1px solid #eee; }
          }
        </style>
      </head>
      <body>
        <div class="ticket">
          <div class="ticket-header">
            <div class="ticket-title">Event Ticket</div>
            <div style="opacity: 0.9">${ticket.eventName}</div>
          </div>
          
          <div class="ticket-details">
            <div class="detail-row">
              <span class="detail-label">Event</span>
              <span class="detail-value">${ticket.eventName}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Date</span>
              <span class="detail-value">${new Date(ticket.eventDate).toLocaleDateString()}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Time</span>
              <span class="detail-value">${ticket.eventTime}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Venue</span>
              <span class="detail-value">${ticket.venue}, ${ticket.city}</span>
            </div>
            ${ticket.seatNumber ? `
            <div class="detail-row">
              <span class="detail-label">Seat</span>
              <span class="detail-value">${ticket.seatNumber}</span>
            </div>
            ` : ''}
            <div class="detail-row">
              <span class="detail-label">Class</span>
              <span class="detail-value">${ticket.ticketClass}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Price</span>
              <span class="detail-value" style="color: #e11d48">₹${ticket.price}</span>
            </div>
          </div>
          
          <div class="qr-code">
            <img src="${ticket.qrCode}" alt="QR Code" />
            <div style="margin-top: 16px; color: #64748b; font-size: 13px; font-weight: 500;">
              Scan at venue entrance
            </div>
          </div>
        </div>
        <script>
          window.onload = function() {
            window.print();
          }
        </script>
      </body>
      </html>
    `)
    printWindow.document.close()
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-rose-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-rose-500 border-t-transparent mx-auto mb-6 shadow-lg shadow-rose-200"></div>
          <p className="text-slate-500 font-medium text-lg">Retrieving your tickets...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-rose-50/30 flex items-center justify-center">
        <div className="text-center bg-white p-12 rounded-[2.5rem] shadow-xl shadow-rose-100/50 max-w-md mx-4">
          <div className="text-rose-500 text-6xl mb-6">⚠️</div>
          <h2 className="text-2xl font-black text-slate-900 mb-2">Error Loading Tickets</h2>
          <p className="text-slate-500 mb-8 font-medium">{error}</p>
          <button
            onClick={loadTickets}
            className="px-8 py-3 bg-rose-600 text-white rounded-xl hover:bg-rose-700 font-bold shadow-lg shadow-rose-200 transition-all hover:-translate-y-0.5"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] py-12">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black text-slate-900 flex items-center gap-4 tracking-tight">
              <div className="p-3 bg-rose-100 rounded-2xl">
                <Ticket className="h-8 w-8 text-rose-600" />
              </div>
              My Tickets
            </h1>
            <p className="text-slate-500 mt-3 font-medium text-lg ml-1">View and manage all your event passes</p>
          </div>
          {tickets.length > 0 && (
             <div className="bg-white px-6 py-3 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-rose-500" />
                <span className="font-bold text-slate-700">{tickets.length} Active Tickets</span>
             </div>
          )}
        </div>

        {/* Tickets Grid */}
        {tickets.length === 0 ? (
          <div className="bg-white rounded-[3rem] border border-slate-100 p-16 text-center shadow-xl shadow-slate-200/50">
            <div className="text-7xl mb-6 opacity-80">🎟️</div>
            <h3 className="text-2xl font-bold text-slate-900 mb-3">No Tickets Yet</h3>
            <p className="text-slate-500 mb-10 max-w-md mx-auto text-lg">
              You haven't registered for any events yet. Browse our events and secure your spot today!
            </p>
            <button
              onClick={() => router.push('/dashboard/user')}
              className="px-8 py-4 bg-slate-900 text-white rounded-2xl hover:bg-slate-800 inline-flex items-center gap-3 font-bold text-lg transition-all hover:shadow-xl hover:-translate-y-1"
            >
              <ExternalLink className="h-5 w-5" />
              Browse Events
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {tickets.map((ticket) => (
              <div
                key={ticket.id}
                className="group bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden hover:shadow-2xl hover:shadow-rose-100/50 transition-all duration-500 cursor-pointer hover:-translate-y-2"
                onClick={() => setSelectedTicket(ticket)}
              >
                {/* Ticket Header */}
                <div className="bg-gradient-to-br from-rose-500 to-pink-600 p-6 text-white relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-4">
                      <div className="bg-white/20 backdrop-blur-md p-2 rounded-xl">
                        <Ticket className="h-5 w-5 text-white" />
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                        ticket.status === 'CONFIRMED' ? 'bg-emerald-400/20 text-white ring-1 ring-emerald-400/50' :
                        ticket.status === 'PENDING' ? 'bg-amber-400/20 text-white ring-1 ring-amber-400/50' :
                        'bg-slate-400/20 text-white ring-1 ring-slate-400/50'
                      }`}>
                        {ticket.status}
                      </span>
                    </div>
                    <h3 className="font-bold text-xl leading-tight line-clamp-2">{ticket.eventName}</h3>
                  </div>
                </div>

                {/* Ticket Body */}
                <div className="p-6 space-y-5">
                  <div className="flex items-center gap-4 text-slate-600 group-hover:text-rose-600 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center flex-shrink-0 group-hover:bg-rose-50">
                      <Calendar className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Date</p>
                      <p className="font-semibold">{new Date(ticket.eventDate).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-slate-600 group-hover:text-rose-600 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center flex-shrink-0 group-hover:bg-rose-50">
                      <Clock className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Time</p>
                      <p className="font-semibold">{ticket.eventTime}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-slate-600 group-hover:text-rose-600 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center flex-shrink-0 group-hover:bg-rose-50">
                      <MapPin className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Location</p>
                      <p className="font-semibold truncate">{ticket.venue}, {ticket.city}</p>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-5 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Class</p>
                      <p className="font-bold text-slate-900">{ticket.ticketClass}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Price</p>
                      <p className="font-black text-rose-600 text-lg">₹{ticket.price}</p>
                    </div>
                  </div>
                </div>

                {/* Ticket Footer */}
                <div className="px-6 pb-6">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      downloadTicket(ticket)
                    }}
                    className="w-full py-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 flex items-center justify-center gap-2 font-bold transition-all hover:shadow-lg active:scale-95"
                  >
                    <Download className="h-4 w-4" />
                    Download Ticket
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Ticket Detail Modal */}
        {selectedTicket && (
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedTicket(null)}
          >
            <div
              className="bg-white rounded-[2.5rem] max-w-md w-full p-8 shadow-2xl animate-in fade-in zoom-in duration-300"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-black text-slate-900">Ticket Details</h3>
                <button
                  onClick={() => setSelectedTicket(null)}
                  className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-8">
                <div className="text-center bg-slate-50 p-8 rounded-3xl border border-slate-100">
                  <div className="bg-white p-4 rounded-2xl shadow-sm inline-block mb-4">
                    <img
                      src={selectedTicket.qrCode}
                      alt="QR Code"
                      className="w-48 h-48 rounded-lg"
                    />
                  </div>
                  <p className="text-sm font-bold text-slate-500 uppercase tracking-wide">
                    Scan at entrance
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center py-3 border-b border-slate-50">
                    <span className="text-slate-500 font-medium">Event</span>
                    <span className="font-bold text-slate-900 text-right">{selectedTicket.eventName}</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-slate-50">
                    <span className="text-slate-500 font-medium">Date & Time</span>
                    <span className="font-bold text-slate-900 text-right">
                      {new Date(selectedTicket.eventDate).toLocaleDateString()} • {selectedTicket.eventTime}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-slate-50">
                    <span className="text-slate-500 font-medium">Venue</span>
                    <span className="font-bold text-slate-900 text-right">{selectedTicket.venue}</span>
                  </div>
                  {selectedTicket.seatNumber && (
                    <div className="flex justify-between items-center py-3 border-b border-slate-50">
                      <span className="text-slate-500 font-medium">Seat</span>
                      <span className="font-bold text-rose-600 text-right">{selectedTicket.seatNumber}</span>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => downloadTicket(selectedTicket)}
                  className="w-full py-4 bg-gradient-to-r from-rose-600 to-pink-600 text-white rounded-2xl hover:shadow-xl hover:shadow-rose-200 hover:-translate-y-1 transition-all flex items-center justify-center gap-3 font-bold text-lg"
                >
                  <Download className="h-5 w-5" />
                  Print Ticket
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
