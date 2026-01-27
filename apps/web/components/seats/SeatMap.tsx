'use client'

import { useEffect, useState, useRef } from 'react'
import { ChairIcon, TableSeatIcon } from './SeatIcons'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Loader2, ZoomIn, ZoomOut, Maximize, RotateCcw } from 'lucide-react'
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch'

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
    const mapRef = useRef<HTMLDivElement>(null)

    // Fetch seats
    useEffect(() => {
        loadSeats()
    }, [eventId, floorPlanId])

    const loadSeats = async () => {
        try {
            setLoading(true)
            setError(null)
            const response = await fetch(`/api/events/${eventId}/floor-plan/${floorPlanId}/seats`)
            if (!response.ok) throw new Error('Failed to load seats')
            const data = await response.json()
            setSeats(data.seats || [])
        } catch (err: any) {
            console.error('Error loading seats:', err)
            setError(err.message || 'Failed to load seat map')
        } finally {
            setLoading(false)
        }
    }

    const [activeSeat, setActiveSeat] = useState<Seat | null>(null)
    const [promoCode, setPromoCode] = useState('')
    const [appliedPromo, setAppliedPromo] = useState<string | null>(null)

    // Handle seat click
    const handleSeatClick = (seat: Seat) => {
        if (seat.status !== 'AVAILABLE') return

        const newSelected = new Set(selectedSeats)
        if (newSelected.has(seat.id)) {
            newSelected.delete(seat.id)
            if (activeSeat?.id === seat.id) setActiveSeat(null)
        } else {
            if (newSelected.size >= maxSeats) {
                alert(`You can only select up to ${maxSeats} seats`)
                return
            }
            newSelected.add(seat.id)
            setActiveSeat(seat) // Show details for newly selected seat
        }
        setSelectedSeats(newSelected)
        const selected = seats.filter(s => newSelected.has(s.id))
        onSeatsSelected(selected)
    }

    // Calculate bounds for SVG viewBox
    const calculateBounds = () => {
        if (seats.length === 0) return { minX: 0, minY: 0, maxX: 1200, maxY: 800 }
        const xs = seats.map(s => s.xPosition)
        const ys = seats.map(s => s.yPosition)
        return {
            minX: Math.min(...xs) - 100,
            minY: Math.min(...ys) - 100,
            maxX: Math.max(...xs) + 150,
            maxY: Math.max(...ys) + 150
        }
    }

    const bounds = calculateBounds()
    const padding = 50
    const viewBox = `${bounds.minX} ${bounds.minY} ${bounds.maxX - bounds.minX} ${bounds.maxY - bounds.minY}`

    // Group seats by section
    const seatsBySection = seats.reduce((acc, seat) => {
        if (!acc[seat.section]) acc[seat.section] = []
        acc[seat.section].push(seat)
        return acc
    }, {} as Record<string, Seat[]>)

    // Stats
    const totalSeats = seats.length
    const availableSeats = seats.filter(s => s.status === 'AVAILABLE').length
    const selectedCount = selectedSeats.size
    const totalPrice = seats
        .filter(s => selectedSeats.has(s.id))
        .reduce((sum, s) => sum + s.priceInr, 0)

    // Loading checks
    if (loading) {
        return (
            <Card className="w-full h-96 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
            </Card>
        )
    }

    if (error) {
        return (
            <Card className="w-full p-6 text-center text-red-500">
                <p>{error}</p>
                <Button onClick={loadSeats} variant="outline" className="mt-4">Retry</Button>
            </Card>
        )
    }

    if (seats.length === 0 && !loading && !error) {
        return <Card className="p-6 text-center text-gray-500"><p>No layout available.</p></Card>
    }

    // Calculate View Simulation (mock angle based on position relative to center top)
    const getViewSimulation = (seat: Seat) => {
        const stageX = (bounds.minX + bounds.maxX) / 2
        const stageY = bounds.minY // Assuming stage is at top
        const dx = stageX - seat.xPosition
        const dy = stageY - seat.yPosition
        const angle = (Math.atan2(dy, dx) * 180) / Math.PI
        const distance = Math.sqrt(dx * dx + dy * dy)

        let viewRating = "Excellent"
        if (distance > 500) viewRating = "Good"
        if (distance > 800) viewRating = "Fair"

        return { angle, distance, viewRating }
    }

    // Pricing Simulation
    const getPricing = (seat: Seat) => {
        const base = seat.priceInr
        const bookingFee = Math.round(base * 0.05) // 5%
        const tax = Math.round((base + bookingFee) * 0.18) // 18% GST
        const discount = appliedPromo === 'WELCOME10' ? Math.round(base * 0.10) : 0
        const total = base + bookingFee + tax - discount
        return { base, bookingFee, tax, discount, total }
    }

    // Render Active Seat Details
    const renderSeatDetails = () => {
        if (!activeSeat) return null
        const view = getViewSimulation(activeSeat)
        const price = getPricing(activeSeat)

        return (
            <div className="absolute top-4 left-4 z-20 w-80 bg-white/95 backdrop-blur shadow-2xl rounded-xl border border-purple-100 overflow-hidden text-sm animate-in fade-in slide-in-from-left-4">
                {/* Header */}
                <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-4 text-white relative">
                    <button
                        onClick={() => setActiveSeat(null)}
                        className="absolute top-2 right-2 hover:bg-white/20 rounded-full p-1"
                    >
                        ✕
                    </button>
                    <h3 className="font-bold text-lg">{activeSeat.seatLabel}</h3>
                    <p className="text-white/80 text-xs">Section {activeSeat.section} • Row {activeSeat.rowNumber}</p>
                    <div className="mt-2 flex items-center gap-2">
                        <Badge variant="secondary" className="bg-white/20 text-white hover:bg-white/30 border-0">
                            {activeSeat.pricingTier}
                        </Badge>
                        <span className="text-xs font-mono bg-black/20 px-2 py-0.5 rounded">
                            {view.viewRating} View
                        </span>
                    </div>
                </div>

                {/* View Simulation */}
                <div className="h-32 bg-slate-100 relative overflow-hidden border-b">
                    <div className="absolute inset-x-0 top-0 h-1 bg-purple-500 shadow-lg" /> {/* Stage Line */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-1 h-32 bg-gradient-to-b from-purple-200/50 to-transparent" style={{ transform: `rotate(${view.angle + 90}deg)`, transformOrigin: 'top center' }} />
                    </div>
                    <div className="absolute top-2 left-1/2 -translate-x-1/2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Stage</div>

                    {/* Seat Position Indicator */}
                    <div
                        className="absolute w-3 h-3 bg-purple-600 rounded-full border-2 border-white shadow-sm"
                        style={{
                            bottom: '20%',
                            left: '50%',
                            transform: `translateX(${(activeSeat.xPosition - (bounds.minX + bounds.maxX) / 2) / 10}px)`
                        }}
                    />
                    <div className="absolute bottom-2 w-full text-center text-[10px] text-gray-500">
                        Approximate view from seat
                    </div>
                </div>

                {/* Pricing Breakdown */}
                <div className="p-4 space-y-3">
                    <div className="space-y-1">
                        <div className="flex justify-between text-gray-600">
                            <span>Ticket Price</span>
                            <span>₹{price.base}</span>
                        </div>
                        <div className="flex justify-between text-gray-500 text-xs">
                            <span>Booking Fee (5%)</span>
                            <span>+₹{price.bookingFee}</span>
                        </div>
                        <div className="flex justify-between text-gray-500 text-xs">
                            <span>GST (18%)</span>
                            <span>+₹{price.tax}</span>
                        </div>
                        {price.discount > 0 && (
                            <div className="flex justify-between text-green-600 text-xs font-semibold">
                                <span>Discount ({appliedPromo})</span>
                                <span>-₹{price.discount}</span>
                            </div>
                        )}
                        <div className="border-t pt-2 mt-2 flex justify-between font-bold text-gray-900 text-base">
                            <span>Total</span>
                            <span>₹{price.total}</span>
                        </div>
                    </div>

                    {/* Promo Code Input */}
                    <div className="pt-2">
                        <label className="text-xs font-semibold text-gray-500 mb-1 block">Have a Promo Code?</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={promoCode}
                                onChange={(e) => setPromoCode(e.target.value)}
                                placeholder="Enter code"
                                className="flex-1 px-2 py-1.5 border rounded text-xs uppercase"
                            />
                            <Button
                                size="sm"
                                variant="outline"
                                className="h-auto py-1 text-xs"
                                onClick={() => {
                                    if (promoCode.toUpperCase() === 'WELCOME10') {
                                        setAppliedPromo('WELCOME10')
                                    } else {
                                        alert('Invalid code (Try WELCOME10)')
                                        setAppliedPromo(null)
                                    }
                                }}
                            >
                                Apply
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-4 select-none relative">
            {/* Legend & Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-3 rounded-lg border shadow-sm flex flex-col items-center">
                    <span className="text-xs text-gray-500 uppercase font-semibold">Selected</span>
                    <span className="text-xl font-bold text-purple-600">{selectedCount}/{maxSeats}</span>
                </div>
                <div className="bg-white p-3 rounded-lg border shadow-sm flex flex-col items-center">
                    <span className="text-xs text-gray-500 uppercase font-semibold">Total Price</span>
                    <span className="text-xl font-bold text-gray-900">₹{totalPrice.toLocaleString()}</span>
                </div>
                <div className="md:col-span-2 bg-white p-3 rounded-lg border shadow-sm flex items-center justify-around text-xs">
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-green-500" /> Available</div>
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-purple-600" /> Selected</div>
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-gray-300" /> Booked</div>
                </div>
            </div>

            {/* Map Container */}
            <Card className="overflow-hidden border-2 border-gray-100 shadow-md bg-slate-50 relative group min-h-[500px]">
                {/* Active Seat Details Panel */}
                {renderSeatDetails()}

                <TransformWrapper
                    initialScale={1}
                    minScale={0.5}
                    maxScale={4}
                    centerOnInit={true}
                    limitToBounds={false}
                    wheel={{ step: 0.1 }}
                >
                    {({ zoomIn, zoomOut, resetTransform }) => (
                        <>
                            {/* Controls */}
                            <div className="absolute top-4 right-4 z-10 flex flex-col gap-2 bg-white/90 backdrop-blur shadow-lg rounded-lg p-1">
                                <Button size="icon" variant="ghost" className="h-8 w-8 hover:bg-purple-50 hover:text-purple-600" onClick={() => zoomIn()}>
                                    <ZoomIn className="h-4 w-4" />
                                </Button>
                                <Button size="icon" variant="ghost" className="h-8 w-8 hover:bg-purple-50 hover:text-purple-600" onClick={() => zoomOut()}>
                                    <ZoomOut className="h-4 w-4" />
                                </Button>
                                <Button size="icon" variant="ghost" className="h-8 w-8 hover:bg-purple-50 hover:text-purple-600" onClick={() => resetTransform()}>
                                    <RotateCcw className="h-4 w-4" />
                                </Button>
                            </div>

                            <TransformComponent wrapperClass="w-full h-[500px] cursor-grab active:cursor-grabbing" contentClass="w-full h-full">
                                <svg
                                    viewBox={viewBox}
                                    className="w-full h-full"
                                    style={{ touchAction: 'none' }} // Prevent scrolling on touch
                                >
                                    {/* Grid background (optional) */}
                                    <defs>
                                        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                                            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#e2e8f0" strokeWidth="0.5" />
                                        </pattern>
                                    </defs>
                                    <rect x={bounds.minX} y={bounds.minY} width={bounds.maxX - bounds.minX} height={bounds.maxY - bounds.minY} fill="url(#grid)" />

                                    {/* Section labels */}
                                    {Object.entries(seatsBySection).map(([section, sectionSeats]) => {
                                        const avgX = sectionSeats.reduce((sum, s) => sum + s.xPosition, 0) / sectionSeats.length
                                        const minY = Math.min(...sectionSeats.map(s => s.yPosition))
                                        return (
                                            <text
                                                key={section}
                                                x={avgX}
                                                y={minY - 40}
                                                textAnchor="middle"
                                                fill="#94a3b8"
                                                fontSize="24"
                                                fontWeight="bold"
                                                style={{ pointerEvents: 'none' }}
                                            >
                                                {section}
                                            </text>
                                        )
                                    })}

                                    {/* Seats */}
                                    {seats.map((seat) => {
                                        const isSelected = selectedSeats.has(seat.id)
                                        const displayStatus = isSelected ? 'SELECTED' : (seat.status as any)
                                        const isClickable = seat.status === 'AVAILABLE'

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
                                </svg>
                            </TransformComponent>
                        </>
                    )}
                </TransformWrapper>
            </Card>
        </div>
    )
}
