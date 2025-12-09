"use client"

import { useState } from 'react'
import { Ticket, Plus } from 'lucide-react'

interface SimpleTicketCreatorProps {
  eventId: string
  onSuccess?: () => void
}

export default function SimpleTicketCreator({ eventId, onSuccess }: SimpleTicketCreatorProps) {
  const [ticketClass, setTicketClass] = useState<'VIP' | 'PREMIUM' | 'GENERAL'>('VIP')
  const [quantity, setQuantity] = useState(25)
  const [price, setPrice] = useState(500)
  const [creating, setCreating] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const handleCreate = async () => {
    if (quantity < 1 || quantity > 1000) {
      setMessage({ type: 'error', text: 'Quantity must be between 1 and 1000' })
      return
    }

    if (price < 0) {
      setMessage({ type: 'error', text: 'Price must be a positive number' })
      return
    }

    try {
      setCreating(true)
      setMessage(null)

      const res = await fetch(`/api/events/${eventId}/tickets/simple-create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ticketClass, quantity, price })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create tickets')
      }

      setMessage({ 
        type: 'success', 
        text: `✅ ${data.message}` 
      })
      
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
    <div className="bg-white rounded-lg border p-6 space-y-4">
      <div className="flex items-center gap-2">
        <Ticket className="h-5 w-5 text-indigo-600" />
        <h3 className="text-lg font-semibold">Simple Ticket Creator</h3>
      </div>

      <p className="text-sm text-gray-600">
        Quickly create a specific number of tickets for any class. Perfect for simple events!
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Ticket Class */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ticket Class
          </label>
          <select
            value={ticketClass}
            onChange={(e) => setTicketClass(e.target.value as any)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
          >
            <option value="VIP">VIP</option>
            <option value="PREMIUM">Premium</option>
            <option value="GENERAL">General</option>
          </select>
        </div>

        {/* Quantity */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Quantity
          </label>
          <input
            type="number"
            min="1"
            max="1000"
            value={quantity}
            onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
            placeholder="e.g., 25"
          />
          <p className="text-xs text-gray-500 mt-1">
            Creates {quantity} tickets: {ticketClass.charAt(0)}1 to {ticketClass.charAt(0)}{quantity}
          </p>
        </div>

        {/* Price */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Price (₹)
          </label>
          <input
            type="number"
            min="0"
            step="10"
            value={price}
            onChange={(e) => setPrice(parseInt(e.target.value) || 0)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
            placeholder="e.g., 500"
          />
          <p className="text-xs text-gray-500 mt-1">
            Per ticket price in rupees
          </p>
        </div>
      </div>

      {/* Preview */}
      <div className="bg-gray-50 rounded-md p-4 border border-gray-200">
        <div className="text-sm font-medium text-gray-700 mb-2">Preview:</div>
        <div className="text-sm text-gray-600">
          This will create <span className="font-semibold text-indigo-600">{quantity} {ticketClass}</span> tickets
          at <span className="font-semibold text-green-600">₹{price}</span> each.
          <br />
          Total revenue potential: <span className="font-semibold">₹{(quantity * price).toLocaleString()}</span>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`rounded-md p-3 text-sm ${
          message.type === 'success' 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      {/* Create Button */}
      <button
        onClick={handleCreate}
        disabled={creating || quantity < 1 || price < 0}
        className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
      >
        <Plus className="h-4 w-4" />
        {creating ? 'Creating Tickets...' : `Create ${quantity} ${ticketClass} Tickets`}
      </button>

      <p className="text-xs text-gray-500 text-center">
        ⚠️ This will replace any existing {ticketClass} tickets for this event
      </p>
    </div>
  )
}
