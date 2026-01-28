'use client'

import { useEffect, useState } from 'react'
import { Check, X, Clock, IndianRupee } from 'lucide-react'

type Seat = {
  id: string
  section: string
  rowNumber: string
  seatNumber: string
  seatType: string
  basePrice: number
  available: boolean
  reservationStatus?: string
  expiresAt?: string
  xCoordinate?: number
  yCoordinate?: number
}

type SeatSelectorProps = {
  eventId: string
  onSeatsSelected: (seats: Seat[], totalPrice: number) => void
  maxSeats?: number
}

export default function SeatSelector({ eventId, onSeatsSelected, maxSeats = 10 }: SeatSelectorProps) {
  const [seats, setSeats] = useState<Seat[]>([])
  const [groupedSeats, setGroupedSeats] = useState<Record<string, Record<string, Seat[]>>>({})
  const [selectedSeats, setSelectedSeats] = useState<Seat[]>([])
  const [loading, setLoading] = useState(true)
  const [reservationTimer, setReservationTimer] = useState<number | null>(null)
  const [selectedSection, setSelectedSection] = useState<string>('')

  useEffect(() => {
    loadSeats()
    const interval = setInterval(loadSeats, 10000) // Refresh every 10 seconds
    return () => clearInterval(interval)
  }, [eventId])

  useEffect(() => {
    const totalPrice = selectedSeats.reduce((sum, seat) => sum + seat.basePrice, 0)
    onSeatsSelected(selectedSeats, totalPrice)
  }, [selectedSeats])

  const loadSeats = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/events/${eventId}/seats/availability`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      })
      
      if (res.ok) {
        const data = await res.json()
        setSeats(data.seats || [])
        setGroupedSeats(data.groupedSeats || {})
        
        // Auto-select first section if none selected
        if (!selectedSection && Object.keys(data.groupedSeats || {}).length > 0) {
          setSelectedSection(Object.keys(data.groupedSeats)[0])
        }
      }
    } catch (error) {
      console.error('Error loading seats:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSeatClick = (seat: Seat) => {
    if (!seat.available) return

    const isSelected = selectedSeats.find(s => s.id === seat.id)
    
    if (isSelected) {
      // Deselect
      setSelectedSeats(selectedSeats.filter(s => s.id !== seat.id))
    } else {
      // Select (if not at max)
      if (selectedSeats.length < maxSeats) {
        setSelectedSeats([...selectedSeats, seat])
      } else {
        alert(`You can select maximum ${maxSeats} seats`)
      }
    }
  }

  const getSeatColor = (seat: Seat) => {
    const isSelected = selectedSeats.find(s => s.id === seat.id)
    
    if (isSelected) return 'bg-green-500 text-white border-green-600'
    if (!seat.available) return 'bg-gray-300 text-gray-500 cursor-not-allowed'
    if (seat.seatType === 'VIP') return 'bg-purple-100 text-purple-700 border-purple-300 hover:bg-purple-200'
    return 'bg-blue-100 text-blue-700 border-blue-300 hover:bg-blue-200'
  }

  const totalPrice = selectedSeats.reduce((sum, seat) => sum + seat.basePrice, 0)
  const sections = Object.keys(groupedSeats)

  if (loading && seats.length === 0) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading seat map...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Section Selector */}
      {sections.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {sections.map(section => (
            <button
              key={section}
              onClick={() => setSelectedSection(section)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedSection === section
                  ? 'bg-rose-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {section}
            </button>
          ))}
        </div>
      )}

      {/* Seat Map */}
      <div className="bg-white border rounded-lg p-6">
        {/* Screen/Stage */}
        <div className="mb-8">
          <div className="bg-gradient-to-b from-gray-800 to-gray-600 text-white text-center py-3 rounded-lg shadow-lg">
            <span className="text-sm font-semibold">STAGE / SCREEN</span>
          </div>
        </div>

        {/* Seats Grid */}
        <div className="space-y-4">
          {selectedSection && groupedSeats[selectedSection] && 
            Object.entries(groupedSeats[selectedSection]).map(([row, rowSeats]) => (
              <div key={row} className="flex items-center gap-2">
                {/* Row Label */}
                <div className="w-8 text-center font-bold text-gray-700">
                  {row}
                </div>

                {/* Seats in Row */}
                <div className="flex gap-2 flex-wrap">
                  {rowSeats.map((seat) => (
                    <button
                      key={seat.id}
                      onClick={() => handleSeatClick(seat)}
                      disabled={!seat.available}
                      className={`
                        w-12 h-12 rounded-lg border-2 font-semibold text-sm
                        transition-all duration-200 transform hover:scale-105
                        ${getSeatColor(seat)}
                        ${!seat.available ? 'opacity-50' : ''}
                      `}
                      title={`${seat.section} - Row ${seat.rowNumber}, Seat ${seat.seatNumber} - ₹${seat.basePrice}`}
                    >
                      {seat.seatNumber}
                    </button>
                  ))}
                </div>
              </div>
            ))
          }
        </div>

        {/* Legend */}
        <div className="mt-8 pt-6 border-t">
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-100 border-2 border-blue-300 rounded-lg"></div>
              <span>Available</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-green-500 border-2 border-green-600 rounded-lg"></div>
              <span>Selected</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gray-300 border-2 border-gray-400 rounded-lg"></div>
              <span>Unavailable</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-purple-100 border-2 border-purple-300 rounded-lg"></div>
              <span>VIP</span>
            </div>
          </div>
        </div>
      </div>

      {/* Selected Seats Summary */}
      {selectedSeats.length > 0 && (
        <div className="bg-rose-50 border border-rose-200 rounded-lg p-4">
          <h3 className="font-semibold text-rose-900 mb-3">
            Selected Seats ({selectedSeats.length}/{maxSeats})
          </h3>
          
          <div className="space-y-2 mb-4">
            {selectedSeats.map(seat => (
              <div key={seat.id} className="flex items-center justify-between text-sm">
                <span className="font-medium">
                  {seat.section} - Row {seat.rowNumber}, Seat {seat.seatNumber}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-rose-700 font-semibold">₹{seat.basePrice}</span>
                  <button
                    onClick={() => handleSeatClick(seat)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-rose-200">
            <div className="flex items-center justify-between text-lg font-bold text-rose-900">
              <span>Total Amount:</span>
              <div className="flex items-center gap-1">
                <IndianRupee className="w-5 h-5" />
                <span>{totalPrice.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* No Seats Selected */}
      {selectedSeats.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>Click on available seats to select them</p>
          <p className="text-sm mt-1">You can select up to {maxSeats} seats</p>
        </div>
      )}
    </div>
  )
}
