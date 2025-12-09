"use client"

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Ticket, Calendar, MapPin, Clock, QrCode, Download, ExternalLink } from 'lucide-react'
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
            font-family: Arial, sans-serif;
            padding: 40px;
            max-width: 600px;
            margin: 0 auto;
          }
          .ticket {
            border: 2px solid #4F46E5;
            border-radius: 12px;
            padding: 30px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
          }
          .ticket-header {
            text-align: center;
            margin-bottom: 30px;
          }
          .ticket-title {
            font-size: 28px;
            font-weight: bold;
            margin-bottom: 10px;
          }
          .ticket-details {
            background: white;
            color: #333;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
          }
          .detail-row {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            border-bottom: 1px solid #eee;
          }
          .detail-label {
            font-weight: bold;
            color: #666;
          }
          .qr-code {
            text-align: center;
            background: white;
            padding: 20px;
            border-radius: 8px;
          }
          .qr-code img {
            max-width: 200px;
          }
          @media print {
            body { padding: 0; }
          }
        </style>
      </head>
      <body>
        <div class="ticket">
          <div class="ticket-header">
            <div class="ticket-title">🎟️ Event Ticket</div>
            <div>${ticket.eventName}</div>
          </div>
          
          <div class="ticket-details">
            <div class="detail-row">
              <span class="detail-label">Event:</span>
              <span>${ticket.eventName}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Date:</span>
              <span>${new Date(ticket.eventDate).toLocaleDateString()}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Time:</span>
              <span>${ticket.eventTime}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Venue:</span>
              <span>${ticket.venue}, ${ticket.city}</span>
            </div>
            ${ticket.seatNumber ? `
            <div class="detail-row">
              <span class="detail-label">Seat:</span>
              <span>${ticket.seatNumber}</span>
            </div>
            ` : ''}
            <div class="detail-row">
              <span class="detail-label">Class:</span>
              <span>${ticket.ticketClass}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Price:</span>
              <span>₹${ticket.price}</span>
            </div>
          </div>
          
          <div class="qr-code">
            <img src="${ticket.qrCode}" alt="QR Code" />
            <div style="margin-top: 10px; color: #666; font-size: 12px;">
              Scan this code at the venue
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your tickets...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Error Loading Tickets</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadTickets}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <Ticket className="h-8 w-8 text-indigo-600" />
            My Tickets
          </h1>
          <p className="text-gray-600 mt-2">View and manage all your event tickets</p>
        </div>

        {/* Tickets Grid */}
        {tickets.length === 0 ? (
          <div className="bg-white rounded-xl border p-12 text-center">
            <div className="text-6xl mb-4">🎟️</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No Tickets Yet</h3>
            <p className="text-gray-600 mb-6">
              You haven't registered for any events yet. Browse events and register to get your tickets!
            </p>
            <button
              onClick={() => router.push('/events/browse')}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 inline-flex items-center gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              Browse Events
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tickets.map((ticket) => (
              <div
                key={ticket.id}
                className="bg-white rounded-xl border overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => setSelectedTicket(ticket)}
              >
                {/* Ticket Header */}
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 text-white">
                  <div className="flex items-center justify-between mb-2">
                    <Ticket className="h-5 w-5" />
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      ticket.status === 'CONFIRMED' ? 'bg-green-500' :
                      ticket.status === 'PENDING' ? 'bg-yellow-500' :
                      'bg-gray-500'
                    }`}>
                      {ticket.status}
                    </span>
                  </div>
                  <h3 className="font-bold text-lg line-clamp-2">{ticket.eventName}</h3>
                </div>

                {/* Ticket Body */}
                <div className="p-4 space-y-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date(ticket.eventDate).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="h-4 w-4" />
                    <span>{ticket.eventTime}</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="h-4 w-4" />
                    <span className="line-clamp-1">{ticket.venue}, {ticket.city}</span>
                  </div>

                  {ticket.seatNumber && (
                    <div className="flex items-center justify-between pt-2 border-t">
                      <span className="text-sm text-gray-600">Seat:</span>
                      <span className="font-semibold">{ticket.seatNumber}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="text-sm text-gray-600">Class:</span>
                    <span className="font-semibold">{ticket.ticketClass}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Price:</span>
                    <span className="font-bold text-indigo-600">₹{ticket.price}</span>
                  </div>
                </div>

                {/* Ticket Footer */}
                <div className="px-4 pb-4">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      downloadTicket(ticket)
                    }}
                    className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center justify-center gap-2 text-sm"
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
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedTicket(null)}
          >
            <div
              className="bg-white rounded-xl max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold">Ticket Details</h3>
                <button
                  onClick={() => setSelectedTicket(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div className="text-center">
                  <img
                    src={selectedTicket.qrCode}
                    alt="QR Code"
                    className="mx-auto w-48 h-48"
                  />
                  <p className="text-sm text-gray-600 mt-2">
                    Show this QR code at the venue
                  </p>
                </div>

                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Event:</span>
                    <span className="font-semibold">{selectedTicket.eventName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Date:</span>
                    <span className="font-semibold">
                      {new Date(selectedTicket.eventDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Time:</span>
                    <span className="font-semibold">{selectedTicket.eventTime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Venue:</span>
                    <span className="font-semibold">{selectedTicket.venue}</span>
                  </div>
                  {selectedTicket.seatNumber && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Seat:</span>
                      <span className="font-semibold">{selectedTicket.seatNumber}</span>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => downloadTicket(selectedTicket)}
                  className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center justify-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download Ticket
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
