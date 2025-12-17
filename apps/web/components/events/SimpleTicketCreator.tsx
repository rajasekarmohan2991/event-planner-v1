"use client"

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Ticket, Plus, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { toast } from 'sonner' // Assuming sonner is available, or use a local alert state if prefered, but sonner is standard in shadcn apps usually. 
// If sonner is not installed, I'll fallback to the local message state pattern but styled with shadcn Alert if possible. 
// Actually, looking at the previous code, it used a local message state. I'll stick to that for safety but use shadcn styling.
import { Alert, AlertDescription } from '@/components/ui/alert'

interface SimpleTicketCreatorProps {
  eventId: string
  onSuccess?: () => void
}

const ticketSchema = z.object({
  ticketClass: z.enum(['VIP', 'PREMIUM', 'GENERAL']),
  quantity: z.coerce.number().min(1, 'Quantity must be at least 1').max(1000, 'Quantity cannot exceed 1000'),
  price: z.coerce.number().min(0, 'Price must be non-negative'),
})

type TicketFormValues = z.infer<typeof ticketSchema>

export default function SimpleTicketCreator({ eventId, onSuccess }: SimpleTicketCreatorProps) {
  const [creating, setCreating] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const form = useForm<TicketFormValues>({
    resolver: zodResolver(ticketSchema),
    defaultValues: {
      ticketClass: 'VIP',
      quantity: 25,
      price: 500,
    },
  })

  // Calculate preview values
  const { quantity, price, ticketClass } = form.watch()
  const totalRevenue = (quantity || 0) * (price || 0)

  const onSubmit = async (values: TicketFormValues) => {
    try {
      setCreating(true)
      setMessage(null)

      const res = await fetch(`/api/events/${eventId}/tickets/simple-create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(values)
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create tickets')
      }

      setMessage({
        type: 'success',
        text: `✅ ${data.message}`
      })

      form.reset() // Optional: reset form or keep it

      if (onSuccess) {
        setTimeout(onSuccess, 1500)
      }
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.message || 'Failed to create tickets'
      })
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="bg-white rounded-lg border p-6 space-y-4 shadow-sm">
      <div className="flex items-center gap-2">
        <Ticket className="h-5 w-5 text-indigo-600" />
        <h3 className="text-lg font-semibold">Simple Ticket Creator</h3>
      </div>

      <p className="text-sm text-gray-600">
        Quickly create a specific number of tickets for any class. Perfect for simple events!
      </p>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Ticket Class */}
            <FormField
              control={form.control}
              name="ticketClass"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ticket Class</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select class" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="VIP">VIP</SelectItem>
                      <SelectItem value="PREMIUM">Premium</SelectItem>
                      <SelectItem value="GENERAL">General</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Quantity */}
            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantity</FormLabel>
                  <FormControl>
                    <Input type="number" min={1} max={1000} {...field} />
                  </FormControl>
                  <FormDescription>
                    {form.watch('ticketClass') ? `Creates tickets ${form.watch('ticketClass').charAt(0)}1-${form.watch('ticketClass').charAt(0)}${field.value || 0}` : ''}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Price */}
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Price (₹)</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} step={10} {...field} />
                  </FormControl>
                  <FormDescription>Per ticket price</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Preview */}
          <div className="bg-slate-50 rounded-md p-4 border border-slate-200">
            <div className="text-sm font-medium text-slate-700 mb-2">Preview:</div>
            <div className="text-sm text-slate-600">
              This will create <span className="font-semibold text-indigo-600">{quantity || 0} {ticketClass}</span> tickets
              at <span className="font-semibold text-green-600">₹{price || 0}</span> each.
              <br />
              Total revenue potential: <span className="font-semibold">₹{totalRevenue.toLocaleString()}</span>
            </div>
          </div>

          {/* Message */}
          {message && (
            <Alert variant={message.type === 'error' ? 'destructive' : 'default'} className={message.type === 'success' ? "border-green-200 bg-green-50 text-green-800" : ""}>
              <AlertDescription>{message.text}</AlertDescription>
            </Alert>
          )}

          {/* Create Button */}
          <Button
            type="submit"
            disabled={creating}
            className="w-full bg-indigo-600 hover:bg-indigo-700"
          >
            {creating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Tickets...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Create {quantity || 0} {ticketClass} Tickets
              </>
            )}
          </Button>

          <p className="text-xs text-slate-500 text-center">
            ⚠️ This will replace any existing {ticketClass} tickets for this event
          </p>
        </form>
      </Form>
    </div>
  )
}
