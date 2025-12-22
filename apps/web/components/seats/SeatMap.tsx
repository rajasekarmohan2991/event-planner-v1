'use client'

import { useEffect, useState } from 'react'
import { ChairIcon, TableSeatIcon } from './SeatIcons'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

interface Seat {
    id: string
    floorPlanId: string
    eventId: string
    section: string
    rowNumber: number
    seatNumber: number
    seatLabel: string
    seatType: 'CHAIR' | 'TABLE_SEAT'
    pricingTier: 'VIP' | 'PREMIUM' | 'GENERAL'
    priceInr: number
    xPosition: number
    yPosition: number
    rotation: number
    status: 'AVAILABLE' | 'RESERVED' | 'BOOKED' | 'BLOCKED'
    reservedBy?: string
    bookedBy?: string
}

interface SeatMapProps {
    eventId: string
    floorPlanId: string
    onSeatsSelected: (seats: Seat[]) => void
    maxSeats?: number
    allowedTiers?: ('VIP' | 'PREMIUM' | 'GENERAL')[]
}

export function SeatMap({
    eventId,
    floorPlanId,
    onSeatsSelected,
    maxSeats = 10,
    allowedTiers = ['VIP', 'PREMIUM', 'GENERAL']
}: SeatMapProps) {
    const [seats, setSeats] = useState<Seat[]>([])
    const [selectedSeats, setSelectedSeats] = useState<Set<string>>(new Set())
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Fetch seats
    useEffect(() => {
        loadSeats()
    }, [eventId, floorPlanId])

    const loadSeats = async () => {
        try {
            setLoading(true)
            setError(null)

            const response = await fetch(`/api/events/${eventId}/floor-plan/${floorPlanId}/seats`)
            if (!response.ok) {
                throw new Error('Failed to load seats')
            }

            const data = await response.json()
            setSeats(data.seats || [])
        } catch (err: any) {
            console.error('Error loading seats:', err)
            setError(err.message || 'Failed to load seat map')
        } finally {
            setLoading(false)
        }
    }

    // Handle seat click
    const handleSeatClick = (seat: Seat) => {
        // Check if seat is available
        if (seat.status !== 'AVAILABLE') {
            return
        }

        // Check if tier is allowed
        if (!allowedTiers.includes(seat.pricingTier)) {
            return
        }

        const newSelected = new Set(selectedSeats)

        if (newSelected.has(seat.id)) {
            // Deselect
            newSelected.delete(seat.id)
        } else {
            // Select (if under max)
            if (newSelected.size >= maxSeats) {
                alert(`You can only select up to ${maxSeats} seats`)
                return
            }
            newSelected.add(seat.id)
        }

        setSelectedSeats(newSelected)

        // Notify parent
        const selected = seats.filter(s => newSelected.has(s.id))
        onSeatsSelected(selected)
    }

    // Calculate bounds for SVG viewBox
    const calculateBounds = () => {
        if (seats.length === 0) return { minX: 0, minY: 0, maxX: 1200, maxY: 800 }

        const xs = seats.map(s => s.xPosition)
        const ys = seats.map(s => s.yPosition)

        return {
            minX: Math.min(...xs) - 50,
            minY: Math.min(...ys) - 50,
            maxX: Math.max(...xs) + 100,
            maxY: Math.max(...ys) + 100
        }
    }

    const bounds = calculateBounds()
    const viewBox = `${bounds.minX} ${bounds.minY} ${bounds.maxX - bounds.minX} ${bounds.maxY - bounds.minY}`

    // Group seats by section
    const seatsBySection = seats.reduce((acc, seat) => {
        if (!acc[seat.section]) acc[seat.section] = []
        acc[seat.section].push(seat)
        return acc
    }, {} as Record<string, Seat[]>)

    // Calculate stats
    const totalSeats = seats.length
    const availableSeats = seats.filter(s => s.status === 'AVAILABLE').length
    const selectedCount = selectedSeats.size
    const totalPrice = seats
        .filter(s => selectedSeats.has(s.id))
        .reduce((sum, s) => sum + s.priceInr, 0)

    if (loading) {
        return (
            <Card>
                <CardContent className="flex items-center justify-center p-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </CardContent>
            </Card>
        )
    }

    if (error) {
        return (
            <Card>
                <CardContent className="p-6">
                    <p className="text-sm text-destructive">{error}</p>
                    <Button onClick={loadSeats} className="mt-4" size="sm">
                        Retry
                    </Button>
                </CardContent>
            </Card>
        )
    }

    if (seats.length === 0) {
        return (
            <Card>
                <CardContent className="p-6">
                    <p className="text-sm text-muted-foreground">
                        No seats available for this event. Please contact the organizer.
                    </p>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="space-y-4">
            {/* Stats Bar */}
            <Card>
                <CardContent className="p-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                            <p className="text-xs text-muted-foreground">Total Seats</p>
                            <p className="text-lg font-bold">{totalSeats}</p>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">Available</p>
                            <p className="text-lg font-bold text-green-600">{availableSeats}</p>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">Selected</p>
                            <p className="text-lg font-bold text-blue-600">{selectedCount}/{maxSeats}</p>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">Total Price</p>
                            <p className="text-lg font-bold text-green-600">₹{totalPrice.toLocaleString()}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Legend */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex flex-wrap gap-4 text-sm">
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-green-500 rounded"></div>
                            <span>Available</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-blue-500 rounded"></div>
                            <span>Selected</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-orange-500 rounded"></div>
                            <span>Reserved</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-red-500 rounded"></div>
                            <span>Booked</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Seat Map */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Select Your Seats</CardTitle>
                    <p className="text-sm text-muted-foreground">
                        Click on available seats to select them. You can select up to {maxSeats} seats.
                    </p>
                </CardHeader>
                <CardContent>
                    <div className="border rounded-lg overflow-auto bg-slate-50" style={{ maxHeight: '600px' }}>
                        <svg
                            viewBox={viewBox}
                            className="w-full h-auto min-h-[400px]"
                            style={{ backgroundColor: '#f8fafc' }}
                        >
                            {/* Render all seats */}
                            {seats.map((seat) => {
                                const isSelected = selectedSeats.has(seat.id)
                                const displayStatus = isSelected ? 'RESERVED' : seat.status
                                const isClickable = seat.status === 'AVAILABLE' && allowedTiers.includes(seat.pricingTier)

                                return seat.seatType === 'TABLE_SEAT' ? (
                                    <TableSeatIcon
                                        key={seat.id}
                                        x={seat.xPosition}
                                        y={seat.yPosition}
                                        rotation={seat.rotation}
                                        status={displayStatus}
                                        label={seat.seatLabel}
                                        size={15}
                                        onClick={isClickable ? () => handleSeatClick(seat) : undefined}
                                    />
                                ) : (
                                    <ChairIcon
                                        key={seat.id}
                                        x={seat.xPosition}
                                        y={seat.yPosition}
                                        rotation={seat.rotation}
                                        status={displayStatus}
                                        label={seat.seatLabel}
                                        size={20}
                                        onClick={isClickable ? () => handleSeatClick(seat) : undefined}
                                    />
                                )
                            })}

                            {/* Section labels */}
                            {Object.entries(seatsBySection).map(([section, sectionSeats]) => {
                                const avgX = sectionSeats.reduce((sum, s) => sum + s.xPosition, 0) / sectionSeats.length
                                const minY = Math.min(...sectionSeats.map(s => s.yPosition))

                                return (
                                    <text
                                        key={section}
                                        x={avgX}
                                        y={minY - 20}
                                        textAnchor="middle"
                                        fill="#666"
                                        fontSize="14"
                                        fontWeight="bold"
                                    >
                                        Section {section}
                                    </text>
                                )
                            })}
                        </svg>
                    </div>
                </CardContent>
            </Card>

            {/* Selected Seats Summary */}
            {selectedCount > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Selected Seats ({selectedCount})</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-2">
                            {seats
                                .filter(s => selectedSeats.has(s.id))
                                .map(seat => (
                                    <Badge key={seat.id} variant="secondary" className="text-sm">
                                        {seat.seatLabel} - ₹{seat.priceInr}
                                        <button
                                            onClick={() => handleSeatClick(seat)}
                                            className="ml-2 hover:text-destructive"
                                        >
                                            ×
                                        </button>
                                    </Badge>
                                ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
