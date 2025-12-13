'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { toast } from '@/components/ui/use-toast'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Armchair, Users, MapPin, Clock, IndianRupee } from 'lucide-react'

interface Seat {
  id: string
  eventId: number
  section: string
  rowNumber: string
  seatNumber: string
  seatType: string
  basePrice: number
  xCoordinate: number
  yCoordinate: number
  isAvailable: boolean
  available: boolean
  reservationStatus?: string
  reservedBy?: string
  expiresAt?: string
}

interface SeatSelectorProps {
  eventId: string
  onSeatSelect: (seats: Seat[], totalPrice: number) => void
  maxSeats?: number
}

export function SeatSelector({ eventId, onSeatSelect, maxSeats = 4 }: SeatSelectorProps) {
  const [seats, setSeats] = useState<Seat[]>([])
  const [groupedSeats, setGroupedSeats] = useState<Record<string, Record<string, Seat[]>>>({})
  const [selectedSeats, setSelectedSeats] = useState<Seat[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedSection, setSelectedSection] = useState<string>('')
  const [viewMode, setViewMode] = useState<'sectors' | 'table'>('sectors')
  const [ticketClassFilter, setTicketClassFilter] = useState<'' | 'VIP' | 'PREMIUM' | 'STANDARD'>('')
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true)
  const triedGenerateRef = useRef<boolean>(false)

  useEffect(() => {
    fetchSeats()
  }, [eventId, ticketClassFilter])

  useEffect(() => {
    if (!autoRefresh) return
    const id = setInterval(() => {
      fetchSeats(true)
    }, 10000)
    return () => clearInterval(id)
  }, [eventId, ticketClassFilter, autoRefresh])

  useEffect(() => {
    const totalPrice = selectedSeats.reduce((sum, seat) => sum + Number(seat.basePrice || 0), 0)
    onSeatSelect(selectedSeats, totalPrice)
  }, [selectedSeats, onSeatSelect])

  const fetchSeats = async (silent = false) => {
    try {
      if (!silent) setLoading(true)
      setError(null)
      
      const qs = new URLSearchParams()
      if (ticketClassFilter) qs.set('ticketClass', ticketClassFilter)
      const response = await fetch(`/api/events/${eventId}/seats/availability${qs.toString() ? `?${qs.toString()}` : ''}`)
      if (!response.ok) {
        throw new Error(`Failed to fetch seats: ${response.status}`)
      }
      
      const data = await response.json()
      const newSeats: Seat[] = data.seats || []
      setSeats(newSeats)
      setGroupedSeats(data.groupedSeats || {})
      
      // Auto-select first section if available
      const sections = Object.keys(data.groupedSeats || {})
      if (sections.length > 0 && !selectedSection) {
        setSelectedSection(sections[0])
      }

      // If no seats but floor plan exists, trigger generation once
      if (!triedGenerateRef.current && newSeats.length === 0 && data.floorPlan && (data.floorPlan.layoutData || data.floorPlan.sections)) {
        triedGenerateRef.current = true
        await fetch(`/api/events/${eventId}/seats/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({})
        }).catch(()=>{})
        await fetchSeats(true)
      }

      // Reconcile selected seats if they became unavailable
      if (selectedSeats.length > 0) {
        const newAvailableById = new Map(newSeats.map(s => [s.id, s]))
        const stillValid: Seat[] = []
        const removed: Seat[] = []
        for (const s of selectedSeats) {
          const ns = newAvailableById.get(s.id)
          if (ns && ns.available && !ns.reservationStatus) {
            stillValid.push(ns)
          } else {
            removed.push(s)
          }
        }
        if (removed.length > 0) {
          setSelectedSeats(stillValid)
          toast({ title: 'Seats updated', description: `${removed.length} seat(s) became unavailable and were removed from your selection.` })
        }
      }
    } catch (err: any) {
      console.error('Error fetching seats:', err)
      setError(err.message || 'Failed to load seats')
      toast({
        title: "Error",
        description: "Failed to load seat availability. Please try again.",
        variant: "destructive"
      })
    } finally {
      if (!silent) setLoading(false)
    }
  }

  const handleSeatClick = (seat: Seat) => {
    if (!seat.available || seat.reservationStatus) {
      toast({
        title: "Seat Unavailable",
        description: "This seat is already reserved or unavailable.",
        variant: "destructive"
      })
      return
    }

    const isSelected = selectedSeats.find(s => s.id === seat.id)
    
    if (isSelected) {
      // Deselect seat
      setSelectedSeats(prev => prev.filter(s => s.id !== seat.id))
    } else {
      // Select seat
      if (selectedSeats.length >= maxSeats) {
        toast({
          title: "Maximum Seats Selected",
          description: `You can select up to ${maxSeats} seats only.`,
          variant: "destructive"
        })
        return
      }
      setSelectedSeats(prev => [...prev, seat])
    }
  }

  const getSeatColor = (seat: Seat) => {
    const isSelected = selectedSeats.find(s => s.id === seat.id)
    
    if (isSelected) return 'bg-white text-green-600 border-green-600 ring-2 ring-green-400'
    if (!seat.available || seat.reservationStatus) return 'bg-gray-200 text-gray-400 border-gray-300 cursor-not-allowed'
    switch (seat.seatType) {
      case 'VIP':
        return 'bg-yellow-50 text-yellow-700 border-yellow-500 hover:border-yellow-600'
      case 'PREMIUM':
        return 'bg-blue-50 text-blue-700 border-blue-500 hover:border-blue-600'
      default:
        return 'bg-white text-gray-800 border-gray-300 hover:border-green-400'
    }
  }

  const getSeatTypeLabel = (seatType: string) => {
    switch (seatType) {
      case 'VIP': return 'VIP'
      case 'PREMIUM': return 'Premium'
      case 'STANDARD': return 'Standard'
      default: return seatType
    }
  }

  const clearSelection = () => {
    setSelectedSeats([])
  }

  // Helpers to render a sector similar to the reference screenshot
  const computeColumnNumbers = (rowsObj: Record<string, Seat[]>) => {
    const colSet = new Set<string>()
    Object.values(rowsObj).forEach(row => row.forEach(s => colSet.add(s.seatNumber)))
    return Array.from(colSet).sort((a,b) => parseInt(a) - parseInt(b))
  }

  const sections = useMemo(() => Object.keys(groupedSeats), [groupedSeats])
  const totalPrice = selectedSeats.reduce((sum, seat) => sum + Number(seat.basePrice || 0), 0)
  const availableSeats = seats.filter(s => s.available && !s.reservationStatus).length

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="w-8 h-8 animate-spin mr-3" />
          <span>Loading seat map...</span>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="text-red-500 mb-4">
            <MapPin className="w-12 h-12 mx-auto mb-2" />
            <p className="font-semibold">Unable to load seat map</p>
            <p className="text-sm text-gray-600">{error}</p>
          </div>
          <Button onClick={fetchSeats} variant="outline">
            Try Again
          </Button>
        </CardContent>
      </Card>
    )
  }

  const currentSectionSeats = selectedSection ? groupedSeats[selectedSection] : {}
  const rows = Object.keys(currentSectionSeats).sort()

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Armchair className="w-5 h-5" />
            Select Your Seats
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-500" />
              <span>{availableSeats} available</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-orange-500" />
              <span>{selectedSeats.length}/{maxSeats} selected</span>
            </div>
            <div className="flex items-center gap-2">
              <IndianRupee className="w-4 h-4 text-green-500" />
              <span>₹{totalPrice}</span>
            </div>
            <div>
              {selectedSeats.length > 0 && (
                <Button onClick={clearSelection} variant="outline" size="sm">
                  Clear Selection
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* View toggle, Ticket Class filter and Section filter */}
      {(sections.length > 1) && (
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            {sections.map(section => (
              <Button
                key={section}
                onClick={() => setSelectedSection(section)}
                variant={selectedSection === section ? "default" : "outline"}
                size="sm"
              >
                {section}
              </Button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center gap-1">
              <Button size="sm" variant={viewMode==='sectors'?'default':'outline'} onClick={()=>setViewMode('sectors')}>Sectors</Button>
              <Button size="sm" variant={viewMode==='table'?'default':'outline'} onClick={()=>setViewMode('table')}>Table</Button>
            </div>
            <div className="flex items-center gap-1">
              <Button size="sm" variant={ticketClassFilter===''?'default':'outline'} onClick={()=>setTicketClassFilter('')}>All</Button>
              <Button size="sm" variant={ticketClassFilter==='VIP'?'default':'outline'} onClick={()=>setTicketClassFilter('VIP')}>VIP</Button>
              <Button size="sm" variant={ticketClassFilter==='PREMIUM'?'default':'outline'} onClick={()=>setTicketClassFilter('PREMIUM')}>Premium</Button>
              <Button size="sm" variant={ticketClassFilter==='STANDARD'?'default':'outline'} onClick={()=>setTicketClassFilter('STANDARD')}>Standard</Button>
            </div>
            <div className="flex items-center gap-1">
              <Button size="sm" variant={autoRefresh?'default':'outline'} onClick={()=>setAutoRefresh(v=>!v)}>{autoRefresh?'Live':'Paused'}</Button>
              <Button size="sm" variant="outline" onClick={()=>fetchSeats()}>Refresh</Button>
            </div>
          </div>
        </div>
      )}

      {/* Seat Map */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {viewMode === 'sectors' ? 'Seat Map' : 'Seat List'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {viewMode === 'table' ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-600 border-b">
                    <th className="py-2 pr-4">Section</th>
                    <th className="py-2 pr-4">Row</th>
                    <th className="py-2 pr-4">Seat</th>
                    <th className="py-2 pr-4">Type</th>
                    <th className="py-2 pr-4">Price</th>
                    <th className="py-2 pr-4">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {seats.map(seat => (
                    <tr key={seat.id} className="border-b last:border-0">
                      <td className="py-2 pr-4">{seat.section}</td>
                      <td className="py-2 pr-4">{seat.rowNumber}</td>
                      <td className="py-2 pr-4">{seat.seatNumber}</td>
                      <td className="py-2 pr-4">{seat.seatType}</td>
                      <td className="py-2 pr-4">₹{Number(seat.basePrice)}</td>
                      <td className="py-2 pr-4">
                        <Button
                          size="sm"
                          variant={selectedSeats.find(s=>s.id===seat.id)?'default':'outline'}
                          disabled={!seat.available || !!seat.reservationStatus}
                          onClick={()=>handleSeatClick(seat)}
                        >
                          {selectedSeats.find(s=>s.id===seat.id)?'Selected':'Select'}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            // Sectors view: show each section with header and grid like the reference screenshot
            <div className="space-y-10">
              {(selectedSection ? [selectedSection] : sections).map(sectionKey => {
                const rowsObj = groupedSeats[sectionKey] || {}
                const rowKeys = Object.keys(rowsObj).sort()
                const colNums = computeColumnNumbers(rowsObj)
                const minPrice = Math.min(
                  ...Object.values(rowsObj).flat().map(s=>Number(s.basePrice)||0).filter(n=>!isNaN(n) && n>0),
                )
                return (
                  <div key={sectionKey}>
                    {/* Section heading with price */}
                    <div className="flex items-center justify-center text-xs text-gray-600 mb-2">
                      <div className="border-t flex-1" />
                      <div className="px-3 whitespace-nowrap font-semibold">{minPrice>0?`₹${minPrice} `:''}{sectionKey.toUpperCase()}</div>
                      <div className="border-t flex-1" />
                    </div>
                    {/* Column numbers header */}
                    {colNums.length>0 && (
                      <div className="ml-12 mb-1 flex gap-1 text-[10px] text-gray-400">
                        {colNums.map(c => (
                          <div key={c} className="w-8 h-6 flex items-center justify-center">{String(c).padStart(2,'0')}</div>
                        ))}
                      </div>
                    )}
                    {/* Rows */}
                    <div className="space-y-1">
                      {rowKeys.map(row => (
                        <div key={row} className="flex items-center gap-2">
                          {/* Row label on the left */}
                          <div className="w-8 text-center font-semibold text-gray-600">{row}</div>
                          {/* Seats */}
                          <div className="flex flex-wrap gap-1">
                            {rowsObj[row]?.map(seat => (
                              <button
                                key={seat.id}
                                onClick={() => handleSeatClick(seat)}
                                className={`w-8 h-8 text-[11px] font-semibold rounded border transition-all ${getSeatColor(seat)} ${!seat.available || seat.reservationStatus ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                                title={`${seat.seatType} - Row ${seat.rowNumber}, Seat ${seat.seatNumber} - ₹${seat.basePrice}`}
                                disabled={!seat.available || !!seat.reservationStatus}
                              >
                                {String(seat.seatNumber).padStart(2,'0')}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
              {/* Stage at bottom */}
              <div className="text-center mt-6">
                <div className="inline-block bg-gradient-to-b from-blue-100 to-blue-200 text-blue-700 px-10 py-2 rounded-lg shadow">
                  All eyes this way please
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Legend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Legend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-blue-400 border-2 border-blue-500 rounded"></div>
              <span className="text-sm">Available</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-green-500 border-2 border-green-600 rounded"></div>
              <span className="text-sm">Selected</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-red-500 border-2 border-red-600 rounded"></div>
              <span className="text-sm">Unavailable</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-yellow-400 border-2 border-yellow-500 rounded"></div>
              <span className="text-sm">VIP</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Selected Seats Summary */}
      {selectedSeats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Selected Seats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {selectedSeats.map(seat => (
                <div key={seat.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      {getSeatTypeLabel(seat.seatType)}
                    </Badge>
                    <span className="font-medium">
                      {seat.section} - Row {seat.rowNumber}, Seat {seat.seatNumber}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">₹{seat.basePrice}</span>
                    <Button
                      onClick={() => handleSeatClick(seat)}
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-700"
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
              <div className="border-t pt-2 mt-2">
                <div className="flex justify-between items-center font-semibold">
                  <span>Total ({selectedSeats.length} seats):</span>
                  <span className="text-lg">₹{totalPrice}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
