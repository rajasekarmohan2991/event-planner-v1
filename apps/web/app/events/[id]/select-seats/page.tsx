'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { SeatMap } from '@/components/seats/SeatMap'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, ArrowRight } from 'lucide-react'

export default function SeatSelectionPage() {
    const params = useParams()
    const router = useRouter()
    const eventId = params?.id as string

    const [selectedSeats, setSelectedSeats] = useState<any[]>([])
    const [floorPlanId, setFloorPlanId] = useState<string>('') // You'll need to fetch this
    const [loading, setLoading] = useState(false)

    const handleContinue = async () => {
        if (selectedSeats.length === 0) {
            alert('Please select at least one seat')
            return
        }

        setLoading(true)

        try {
            // Reserve the seats
            const response = await fetch(`/api/events/${eventId}/seats/reserve`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    seatIds: selectedSeats.map(s => s.id)
                })
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || 'Failed to reserve seats')
            }

            const data = await response.json()

            // Store reservation info and continue to checkout
            sessionStorage.setItem('seatReservation', JSON.stringify({
                reservationId: data.reservationId,
                seatIds: selectedSeats.map(s => s.id),
                expiresAt: data.expiresAt
            }))

            // Redirect to registration form or checkout
            router.push(`/events/${eventId}/register?step=details`)

        } catch (error: any) {
            alert(error.message || 'Failed to reserve seats')
        } finally {
            setLoading(false)
        }
    }

    const totalPrice = selectedSeats.reduce((sum, seat) => sum + seat.priceInr, 0)

    return (
        <div className="container mx-auto py-8 px-4 max-w-7xl">
            {/* Header */}
            <div className="mb-6">
                <Button
                    variant="ghost"
                    onClick={() => router.back()}
                    className="mb-4"
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                </Button>

                <h1 className="text-3xl font-bold">Select Your Seats</h1>
                <p className="text-muted-foreground mt-2">
                    Choose your preferred seats from the interactive seat map below
                </p>
            </div>

            {/* Seat Map */}
            {floorPlanId ? (
                <SeatMap
                    eventId={eventId}
                    floorPlanId={floorPlanId}
                    onSeatsSelected={setSelectedSeats}
                    maxSeats={10}
                />
            ) : (
                <Card>
                    <CardContent className="p-12 text-center">
                        <p className="text-muted-foreground">
                            Loading seat map...
                        </p>
                        <p className="text-sm text-muted-foreground mt-2">
                            If this takes too long, the event may not have a floor plan configured.
                        </p>
                    </CardContent>
                </Card>
            )}

            {/* Action Bar */}
            {selectedSeats.length > 0 && (
                <Card className="mt-6 sticky bottom-4 shadow-lg">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    {selectedSeats.length} seat(s) selected
                                </p>
                                <p className="text-2xl font-bold text-green-600">
                                    ₹{totalPrice.toLocaleString()}
                                </p>
                            </div>

                            <Button
                                size="lg"
                                onClick={handleContinue}
                                disabled={loading}
                            >
                                {loading ? 'Reserving...' : 'Continue to Registration'}
                                <ArrowRight className="h-4 w-4 ml-2" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
