"use client"

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Grid, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { cn } from '@/lib/utils'

interface Simple2DFloorGeneratorProps {
  eventId: string
  onSuccess?: () => void
}

type EventType = 'CONFERENCE' | 'WEDDING' | 'THEATRE' | 'CONCERT' | 'BANQUET'
type TableType = 'ROUND' | 'RECTANGLE' | 'SQUARE' | 'ROWS'

const floorPlanSchema = z.object({
  eventType: z.enum(['CONFERENCE', 'WEDDING', 'THEATRE', 'CONCERT', 'BANQUET']),
  tableType: z.enum(['ROUND', 'RECTANGLE', 'SQUARE', 'ROWS']),
  vipSeats: z.coerce.number().min(0).max(500),
  premiumSeats: z.coerce.number().min(0).max(500),
  generalSeats: z.coerce.number().min(0).max(500),
  vipPrice: z.coerce.number().min(0),
  premiumPrice: z.coerce.number().min(0),
  generalPrice: z.coerce.number().min(0),
}).refine((data) => (data.vipSeats + data.premiumSeats + data.generalSeats) > 0, {
  message: "Please allocate at least one seat",
  path: ["vipSeats"], // Show error on vipSeats or generic
}).refine((data) => (data.vipSeats + data.premiumSeats + data.generalSeats) <= 1000, {
  message: "Total seats cannot exceed 1000",
  path: ["vipSeats"],
})

type FloorPlanFormValues = z.infer<typeof floorPlanSchema>

export default function Simple2DFloorGenerator({ eventId, onSuccess }: Simple2DFloorGeneratorProps) {
  const [generating, setGenerating] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const form = useForm<FloorPlanFormValues>({
    resolver: zodResolver(floorPlanSchema),
    defaultValues: {
      eventType: 'CONFERENCE',
      tableType: 'ROWS',
      vipSeats: 0,
      premiumSeats: 0,
      generalSeats: 0,
      vipPrice: 1500,
      premiumPrice: 800,
      generalPrice: 500,
    },
  })

  // Watch values for calculations
  const values = form.watch()
  const { eventType, tableType, vipSeats, premiumSeats, generalSeats, vipPrice, premiumPrice, generalPrice } = values

  const totalSeats = (vipSeats || 0) + (premiumSeats || 0) + (generalSeats || 0)
  const totalRevenue = ((vipSeats || 0) * (vipPrice || 0)) + ((premiumSeats || 0) * (premiumPrice || 0)) + ((generalSeats || 0) * (generalPrice || 0))

  const handleGenerate = async (data: FloorPlanFormValues) => {
    try {
      setGenerating(true)
      setMessage(null)

      // Logic from original component
      const getSeatsPerRow = () => {
        if (data.tableType === 'ROUND') return 8
        if (data.tableType === 'RECTANGLE') return 10
        if (data.tableType === 'SQUARE') return 4

        if (data.eventType === 'THEATRE' || data.eventType === 'CONCERT') return 15
        if (data.eventType === 'WEDDING' || data.eventType === 'BANQUET') return 8
        return 10 // CONFERENCE default
      }

      const config = {
        seatsPerRow: getSeatsPerRow(),
        layout: data.tableType === 'ROWS' ? 'rows' : 'tables',
        tableType: data.tableType
      }

      const sections = []

      if (data.vipSeats > 0) {
        sections.push({
          name: 'VIP',
          type: 'VIP',
          basePrice: data.vipPrice,
          rows: Math.ceil(data.vipSeats / config.seatsPerRow),
          seatsPerRow: config.seatsPerRow,
          totalSeats: data.vipSeats,
          color: '#9333ea', // Purple
          layout: config.layout
        })
      }

      if (data.premiumSeats > 0) {
        sections.push({
          name: 'PREMIUM',
          type: 'PREMIUM',
          basePrice: data.premiumPrice,
          rows: Math.ceil(data.premiumSeats / config.seatsPerRow),
          seatsPerRow: config.seatsPerRow,
          totalSeats: data.premiumSeats,
          color: '#3b82f6', // Blue
          layout: config.layout
        })
      }

      if (data.generalSeats > 0) {
        sections.push({
          name: 'GENERAL',
          type: 'GENERAL',
          basePrice: data.generalPrice,
          rows: Math.ceil(data.generalSeats / config.seatsPerRow),
          seatsPerRow: config.seatsPerRow,
          totalSeats: data.generalSeats,
          color: '#10b981', // Green
          layout: config.layout
        })
      }

      const floorPlan = {
        name: '2D Floor Plan',
        totalSeats: (data.vipSeats + data.premiumSeats + data.generalSeats),
        sections: sections.map((section, sectionIdx) => ({
          name: section.name,
          type: section.type,
          basePrice: section.basePrice,
          rows: Array.from({ length: section.rows }, (_, rowIdx) => {
            const rowNumber = rowIdx + 1
            const seatsInThisRow = Math.min(
              section.seatsPerRow,
              section.totalSeats - (rowIdx * section.seatsPerRow)
            )

            return {
              number: `${section.type.charAt(0)}${rowNumber}`,
              label: `Row ${rowNumber}`,
              count: seatsInThisRow,
              xOffset: 50,
              yOffset: 50 + (sectionIdx * 300) + (rowIdx * 50)
            }
          })
        }))
      }

      const res = await fetch(`/api/events/${eventId}/seats/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ floorPlan })
      })

      const resData = await res.json()

      if (!res.ok) {
        throw new Error(resData.error || 'Failed to generate floor plan')
      }

      setMessage({
        type: 'success',
        text: `✅ ${resData.message || `Generated ${floorPlan.totalSeats} seats successfully!`}`
      })

      if (onSuccess) {
        setTimeout(onSuccess, 1500)
      }
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.message || 'Failed to generate floor plan'
      })
    } finally {
      setGenerating(false)
    }
  }

  // Helper calculation for display
  const getLayoutDescription = (type: EventType, table: TableType) => {
    if (table === 'ROUND') return '8 seats per round table';
    if (table === 'RECTANGLE') return '10 seats per rectangle table';
    if (table === 'SQUARE') return '4 seats per square table';
    if (type === 'THEATRE' || type === 'CONCERT') return '15 seats per row';
    return '10 seats per row';
  }

  const getSeatsCountDesc = (seats: number, type: EventType, table: TableType) => {
    if (seats <= 0) return 'No seats';
    if (table === 'ROUND') return `${Math.ceil(seats / 8)} round tables × 8 seats`;
    if (table === 'RECTANGLE') return `${Math.ceil(seats / 10)} rectangle tables × 10 seats`;
    if (table === 'SQUARE') return `${Math.ceil(seats / 4)} square tables × 4 seats`;
    if (type === 'THEATRE' || type === 'CONCERT') return `${Math.ceil(seats / 15)} rows × 15 seats`;
    return `${Math.ceil(seats / 10)} rows × 10 seats`;
  }

  return (
    <div className="bg-white rounded-lg border p-6 space-y-6 shadow-sm">
      <div className="flex items-center gap-2">
        <Grid className="h-5 w-5 text-indigo-600" />
        <h3 className="text-lg font-semibold">2D Floor Plan Generator</h3>
      </div>

      <p className="text-sm text-gray-600">
        Allocate seats dynamically for each ticket class. The system will automatically arrange them based on event type.
      </p>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleGenerate)} className="space-y-6">
          {/* Event Type Selection */}
          <FormField
            control={form.control}
            name="eventType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Event Type</FormLabel>
                <div className="grid grid-cols-5 gap-2">
                  {[
                    { val: 'CONFERENCE', icon: '🎤', label: 'Conference' },
                    { val: 'THEATRE', icon: '🎭', label: 'Theatre' },
                    { val: 'WEDDING', icon: '💒', label: 'Wedding' },
                    { val: 'CONCERT', icon: '🎸', label: 'Concert' },
                    { val: 'BANQUET', icon: '🍽️', label: 'Banquet' },
                  ].map((opt) => (
                    <button
                      key={opt.val}
                      type="button"
                      onClick={() => field.onChange(opt.val)}
                      className={cn(
                        "p-3 rounded-lg border-2 transition-all flex flex-col items-center justify-center text-center",
                        field.value === opt.val
                          ? "border-indigo-600 bg-indigo-50 text-indigo-900"
                          : "border-gray-200 hover:border-gray-300"
                      )}
                    >
                      <div className="text-xl mb-1">{opt.icon}</div>
                      <div className="font-medium text-xs">{opt.label}</div>
                    </button>
                  ))}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Table Type Selection */}
          <FormField
            control={form.control}
            name="tableType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Seating Arrangement</FormLabel>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { val: 'ROWS', icon: '📐', label: 'Rows', sub: 'Theater style', color: 'green' },
                    { val: 'ROUND', icon: '⭕', label: 'Round', sub: '8 per table', color: 'green' },
                    { val: 'RECTANGLE', icon: '▭', label: 'Rectangle', sub: '10 per table', color: 'green' },
                    { val: 'SQUARE', icon: '◻️', label: 'Square', sub: '4 per table', color: 'green' },
                  ].map((opt) => (
                    <button
                      key={opt.val}
                      type="button"
                      onClick={() => field.onChange(opt.val)}
                      className={cn(
                        "p-3 rounded-lg border-2 transition-all flex flex-col items-center justify-center text-center",
                        field.value === opt.val
                          ? `border-${opt.color}-600 bg-${opt.color}-50 text-${opt.color}-900`
                          : "border-gray-200 hover:border-gray-300"
                      )}
                    >
                      <div className="text-xl mb-1">{opt.icon}</div>
                      <div className="font-medium text-xs">{opt.label}</div>
                      <div className="text-[10px] text-gray-600 mt-0.5">{opt.sub}</div>
                    </button>
                  ))}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* VIP Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
            <FormField
              control={form.control}
              name="vipSeats"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-purple-900">👑 VIP Seats</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} max={500} {...field} className="border-purple-300 focus-visible:ring-purple-500" placeholder="e.g., 25" />
                  </FormControl>
                  <FormDescription className="text-purple-700 text-xs">
                    {getSeatsCountDesc(field.value || 0, eventType as EventType, tableType as TableType)}
                  </FormDescription>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="vipPrice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-purple-900">Price per VIP Seat (₹)</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} step={100} {...field} className="border-purple-300 focus-visible:ring-purple-500" />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>

          {/* Premium Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <FormField
              control={form.control}
              name="premiumSeats"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-blue-900">⭐ Premium Seats</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} max={500} {...field} className="border-blue-300 focus-visible:ring-blue-500" placeholder="e.g., 100" />
                  </FormControl>
                  <FormDescription className="text-blue-700 text-xs">
                    {getSeatsCountDesc(field.value || 0, eventType as EventType, tableType as TableType)}
                  </FormDescription>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="premiumPrice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-blue-900">Price per Premium Seat (₹)</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} step={100} {...field} className="border-blue-300 focus-visible:ring-blue-500" />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>

          {/* General Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-green-50 rounded-lg border border-green-200">
            <FormField
              control={form.control}
              name="generalSeats"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-green-900">🎫 General Seats</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} max={500} {...field} className="border-green-300 focus-visible:ring-green-500" placeholder="e.g., 200" />
                  </FormControl>
                  <FormDescription className="text-green-700 text-xs">
                    {getSeatsCountDesc(field.value || 0, eventType as EventType, tableType as TableType)}
                  </FormDescription>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="generalPrice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-green-900">Price per General Seat (₹)</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} step={100} {...field} className="border-green-300 focus-visible:ring-green-500" />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>

          {/* Summary */}
          <div className="bg-slate-50 rounded-md p-4 border border-slate-200">
            <div className="text-sm font-medium text-slate-700 mb-2">Floor Plan Summary:</div>
            <div className="grid grid-cols-2 gap-2 text-sm text-slate-600">
              <div>Total Seats: <span className="font-semibold text-slate-900">{totalSeats}</span></div>
              <div>Total Revenue Potential: <span className="font-semibold text-green-600">₹{totalRevenue.toLocaleString()}</span></div>
              <div>VIP: <span className="font-semibold text-purple-600">{vipSeats} seats</span></div>
              <div>Premium: <span className="font-semibold text-blue-600">{premiumSeats} seats</span></div>
              <div>General: <span className="font-semibold text-green-600">{generalSeats} seats</span></div>
              <div>Layout: <span className="font-semibold">{getLayoutDescription(eventType as EventType, tableType as TableType)}</span></div>
            </div>
          </div>

          {/* Message */}
          {message && (
            <Alert variant={message.type === 'error' ? 'destructive' : 'default'} className={message.type === 'success' ? "border-green-200 bg-green-50 text-green-800" : ""}>
              <AlertDescription>{message.text}</AlertDescription>
            </Alert>
          )}

          {/* Generate Button */}
          <Button
            type="submit"
            disabled={generating}
            className="w-full h-12 text-base font-medium bg-indigo-600 hover:bg-indigo-700"
          >
            {generating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Floor Plan...
              </>
            ) : (
              <>
                <Grid className="mr-2 h-5 w-5" />
                Generate 2D Floor Plan ({totalSeats} seats)
              </>
            )}
          </Button>

          <p className="text-xs text-slate-500 text-center">
            ⚠️ This will replace any existing floor plan for this event
          </p>
        </form>
      </Form>
    </div>
  )
}
