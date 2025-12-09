"use client"

import { useState } from 'react'
import { Grid, Plus, Trash2 } from 'lucide-react'

interface Simple2DFloorGeneratorProps {
  eventId: string
  onSuccess?: () => void
}

type EventType = 'CONFERENCE' | 'WEDDING' | 'THEATRE' | 'CONCERT' | 'BANQUET'
type TableType = 'ROUND' | 'RECTANGLE' | 'SQUARE' | 'ROWS'

export default function Simple2DFloorGenerator({ eventId, onSuccess }: Simple2DFloorGeneratorProps) {
  const [eventType, setEventType] = useState<EventType>('CONFERENCE')
  const [tableType, setTableType] = useState<TableType>('ROWS')
  const [vipSeats, setVipSeats] = useState(0)
  const [premiumSeats, setPremiumSeats] = useState(0)
  const [generalSeats, setGeneralSeats] = useState(0)
  const [vipPrice, setVipPrice] = useState(1500)
  const [premiumPrice, setPremiumPrice] = useState(800)
  const [generalPrice, setGeneralPrice] = useState(500)
  const [generating, setGenerating] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const handleGenerate = async () => {
    try {
      setGenerating(true)
      setMessage(null)

      const totalSeats = vipSeats + premiumSeats + generalSeats

      if (totalSeats === 0) {
        setMessage({ type: 'error', text: 'Please allocate at least one seat' })
        return
      }

      if (totalSeats > 1000) {
        setMessage({ type: 'error', text: 'Total seats cannot exceed 1000' })
        return
      }

      // Generate floor plan with sections based on event type
      const sections = []
      
      // Dynamic configuration based on event type and table type
      const getSeatsPerRow = () => {
        if (tableType === 'ROUND') return 8
        if (tableType === 'RECTANGLE') return 10
        if (tableType === 'SQUARE') return 4
        
        // For ROWS layout, use event-specific defaults
        if (eventType === 'THEATRE' || eventType === 'CONCERT') return 15
        if (eventType === 'WEDDING' || eventType === 'BANQUET') return 8
        return 10 // CONFERENCE default
      }
      
      const config = {
        seatsPerRow: getSeatsPerRow(),
        layout: tableType === 'ROWS' ? 'rows' : 'tables',
        tableType
      }
      
      if (vipSeats > 0) {
        sections.push({
          name: 'VIP',
          type: 'VIP',
          basePrice: vipPrice,
          rows: Math.ceil(vipSeats / config.seatsPerRow),
          seatsPerRow: config.seatsPerRow,
          totalSeats: vipSeats,
          color: '#9333ea', // Purple
          layout: config.layout
        })
      }

      if (premiumSeats > 0) {
        sections.push({
          name: 'PREMIUM',
          type: 'PREMIUM',
          basePrice: premiumPrice,
          rows: Math.ceil(premiumSeats / config.seatsPerRow),
          seatsPerRow: config.seatsPerRow,
          totalSeats: premiumSeats,
          color: '#3b82f6', // Blue
          layout: config.layout
        })
      }

      if (generalSeats > 0) {
        sections.push({
          name: 'GENERAL',
          type: 'GENERAL',
          basePrice: generalPrice,
          rows: Math.ceil(generalSeats / config.seatsPerRow),
          seatsPerRow: config.seatsPerRow,
          totalSeats: generalSeats,
          color: '#10b981', // Green
          layout: config.layout
        })
      }

      const floorPlan = {
        name: '2D Floor Plan',
        totalSeats,
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

      // Send to API
      const res = await fetch(`/api/events/${eventId}/seats/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ floorPlan })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate floor plan')
      }

      setMessage({ 
        type: 'success', 
        text: `✅ ${data.message || `Generated ${totalSeats} seats successfully!`}` 
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

  const totalSeats = vipSeats + premiumSeats + generalSeats
  const totalRevenue = (vipSeats * vipPrice) + (premiumSeats * premiumPrice) + (generalSeats * generalPrice)

  return (
    <div className="bg-white rounded-lg border p-6 space-y-6">
      <div className="flex items-center gap-2">
        <Grid className="h-5 w-5 text-indigo-600" />
        <h3 className="text-lg font-semibold">2D Floor Plan Generator</h3>
      </div>

      <p className="text-sm text-gray-600">
        Allocate seats dynamically for each ticket class. The system will automatically arrange them based on event type.
      </p>

      {/* Event Type Selection */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-gray-700">Event Type</h4>
        <div className="grid grid-cols-5 gap-2">
          <button
            onClick={() => setEventType('CONFERENCE')}
            className={`p-3 rounded-lg border-2 transition-all ${
              eventType === 'CONFERENCE'
                ? 'border-indigo-600 bg-indigo-50 text-indigo-900'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="text-xl mb-1">🎤</div>
            <div className="font-medium text-xs">Conference</div>
          </button>
          <button
            onClick={() => setEventType('THEATRE')}
            className={`p-3 rounded-lg border-2 transition-all ${
              eventType === 'THEATRE'
                ? 'border-indigo-600 bg-indigo-50 text-indigo-900'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="text-xl mb-1">🎭</div>
            <div className="font-medium text-xs">Theatre</div>
          </button>
          <button
            onClick={() => setEventType('WEDDING')}
            className={`p-3 rounded-lg border-2 transition-all ${
              eventType === 'WEDDING'
                ? 'border-indigo-600 bg-indigo-50 text-indigo-900'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="text-xl mb-1">💒</div>
            <div className="font-medium text-xs">Wedding</div>
          </button>
          <button
            onClick={() => setEventType('CONCERT')}
            className={`p-3 rounded-lg border-2 transition-all ${
              eventType === 'CONCERT'
                ? 'border-indigo-600 bg-indigo-50 text-indigo-900'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="text-xl mb-1">🎸</div>
            <div className="font-medium text-xs">Concert</div>
          </button>
          <button
            onClick={() => setEventType('BANQUET')}
            className={`p-3 rounded-lg border-2 transition-all ${
              eventType === 'BANQUET'
                ? 'border-indigo-600 bg-indigo-50 text-indigo-900'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="text-xl mb-1">🍽️</div>
            <div className="font-medium text-xs">Banquet</div>
          </button>
        </div>
      </div>

      {/* Table Type Selection */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-gray-700">Seating Arrangement</h4>
        <div className="grid grid-cols-4 gap-2">
          <button
            onClick={() => setTableType('ROWS')}
            className={`p-3 rounded-lg border-2 transition-all ${
              tableType === 'ROWS'
                ? 'border-green-600 bg-green-50 text-green-900'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="text-xl mb-1">📐</div>
            <div className="font-medium text-xs">Rows</div>
            <div className="text-[10px] text-gray-600 mt-0.5">Theater style</div>
          </button>
          <button
            onClick={() => setTableType('ROUND')}
            className={`p-3 rounded-lg border-2 transition-all ${
              tableType === 'ROUND'
                ? 'border-green-600 bg-green-50 text-green-900'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="text-xl mb-1">⭕</div>
            <div className="font-medium text-xs">Round</div>
            <div className="text-[10px] text-gray-600 mt-0.5">8 per table</div>
          </button>
          <button
            onClick={() => setTableType('RECTANGLE')}
            className={`p-3 rounded-lg border-2 transition-all ${
              tableType === 'RECTANGLE'
                ? 'border-green-600 bg-green-50 text-green-900'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="text-xl mb-1">▭</div>
            <div className="font-medium text-xs">Rectangle</div>
            <div className="text-[10px] text-gray-600 mt-0.5">10 per table</div>
          </button>
          <button
            onClick={() => setTableType('SQUARE')}
            className={`p-3 rounded-lg border-2 transition-all ${
              tableType === 'SQUARE'
                ? 'border-green-600 bg-green-50 text-green-900'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="text-xl mb-1">◻️</div>
            <div className="font-medium text-xs">Square</div>
            <div className="text-[10px] text-gray-600 mt-0.5">4 per table</div>
          </button>
        </div>
      </div>

      {/* Seat Allocation */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-gray-700">Seat Allocation by Ticket Class</h4>
        
        {/* VIP Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
          <div>
            <label className="block text-sm font-medium text-purple-900 mb-2">
              👑 VIP Seats
            </label>
            <input
              type="number"
              min="0"
              max="500"
              value={vipSeats}
              onChange={(e) => setVipSeats(parseInt(e.target.value) || 0)}
              className="w-full rounded-md border border-purple-300 px-3 py-2 text-sm focus:border-purple-500 focus:ring-purple-500"
              placeholder="e.g., 25"
            />
            <p className="text-xs text-purple-700 mt-1">
              {vipSeats > 0 ? (
                tableType === 'ROUND' ? `${Math.ceil(vipSeats / 8)} round tables × 8 seats` :
                tableType === 'RECTANGLE' ? `${Math.ceil(vipSeats / 10)} rectangle tables × 10 seats` :
                tableType === 'SQUARE' ? `${Math.ceil(vipSeats / 4)} square tables × 4 seats` :
                (eventType === 'THEATRE' || eventType === 'CONCERT') ? `${Math.ceil(vipSeats / 15)} rows × 15 seats` :
                `${Math.ceil(vipSeats / 10)} rows × 10 seats`
              ) : 'No VIP seats'}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-purple-900 mb-2">
              Price per VIP Seat (₹)
            </label>
            <input
              type="number"
              min="0"
              step="100"
              value={vipPrice}
              onChange={(e) => setVipPrice(parseInt(e.target.value) || 0)}
              className="w-full rounded-md border border-purple-300 px-3 py-2 text-sm focus:border-purple-500 focus:ring-purple-500"
            />
          </div>
        </div>

        {/* Premium Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div>
            <label className="block text-sm font-medium text-blue-900 mb-2">
              ⭐ Premium Seats
            </label>
            <input
              type="number"
              min="0"
              max="500"
              value={premiumSeats}
              onChange={(e) => setPremiumSeats(parseInt(e.target.value) || 0)}
              className="w-full rounded-md border border-blue-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="e.g., 100"
            />
            <p className="text-xs text-blue-700 mt-1">
              {premiumSeats > 0 ? (
                tableType === 'ROUND' ? `${Math.ceil(premiumSeats / 8)} round tables × 8 seats` :
                tableType === 'RECTANGLE' ? `${Math.ceil(premiumSeats / 10)} rectangle tables × 10 seats` :
                tableType === 'SQUARE' ? `${Math.ceil(premiumSeats / 4)} square tables × 4 seats` :
                (eventType === 'THEATRE' || eventType === 'CONCERT') ? `${Math.ceil(premiumSeats / 15)} rows × 15 seats` :
                `${Math.ceil(premiumSeats / 10)} rows × 10 seats`
              ) : 'No Premium seats'}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-blue-900 mb-2">
              Price per Premium Seat (₹)
            </label>
            <input
              type="number"
              min="0"
              step="100"
              value={premiumPrice}
              onChange={(e) => setPremiumPrice(parseInt(e.target.value) || 0)}
              className="w-full rounded-md border border-blue-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* General Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-green-50 rounded-lg border border-green-200">
          <div>
            <label className="block text-sm font-medium text-green-900 mb-2">
              🎫 General Seats
            </label>
            <input
              type="number"
              min="0"
              max="500"
              value={generalSeats}
              onChange={(e) => setGeneralSeats(parseInt(e.target.value) || 0)}
              className="w-full rounded-md border border-green-300 px-3 py-2 text-sm focus:border-green-500 focus:ring-green-500"
              placeholder="e.g., 200"
            />
            <p className="text-xs text-green-700 mt-1">
              {generalSeats > 0 ? (
                tableType === 'ROUND' ? `${Math.ceil(generalSeats / 8)} round tables × 8 seats` :
                tableType === 'RECTANGLE' ? `${Math.ceil(generalSeats / 10)} rectangle tables × 10 seats` :
                tableType === 'SQUARE' ? `${Math.ceil(generalSeats / 4)} square tables × 4 seats` :
                (eventType === 'THEATRE' || eventType === 'CONCERT') ? `${Math.ceil(generalSeats / 15)} rows × 15 seats` :
                `${Math.ceil(generalSeats / 10)} rows × 10 seats`
              ) : 'No General seats'}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-green-900 mb-2">
              Price per General Seat (₹)
            </label>
            <input
              type="number"
              min="0"
              step="100"
              value={generalPrice}
              onChange={(e) => setGeneralPrice(parseInt(e.target.value) || 0)}
              className="w-full rounded-md border border-green-300 px-3 py-2 text-sm focus:border-green-500 focus:ring-green-500"
            />
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-gray-50 rounded-md p-4 border border-gray-200">
        <div className="text-sm font-medium text-gray-700 mb-2">Floor Plan Summary:</div>
        <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
          <div>Total Seats: <span className="font-semibold text-gray-900">{totalSeats}</span></div>
          <div>Total Revenue Potential: <span className="font-semibold text-green-600">₹{totalRevenue.toLocaleString()}</span></div>
          <div>VIP: <span className="font-semibold text-purple-600">{vipSeats} seats</span></div>
          <div>Premium: <span className="font-semibold text-blue-600">{premiumSeats} seats</span></div>
          <div>General: <span className="font-semibold text-green-600">{generalSeats} seats</span></div>
          <div>Layout: <span className="font-semibold">{
            tableType === 'ROUND' ? '8 seats per round table' :
            tableType === 'RECTANGLE' ? '10 seats per rectangle table' :
            tableType === 'SQUARE' ? '4 seats per square table' :
            (eventType === 'THEATRE' || eventType === 'CONCERT') ? '15 seats per row' :
            '10 seats per row'
          }</span></div>
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

      {/* Generate Button */}
      <button
        onClick={handleGenerate}
        disabled={generating || totalSeats === 0}
        className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white px-4 py-3 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
      >
        <Grid className="h-4 w-4" />
        {generating ? 'Generating Floor Plan...' : `Generate 2D Floor Plan (${totalSeats} seats)`}
      </button>

      <p className="text-xs text-gray-500 text-center">
        ⚠️ This will replace any existing floor plan for this event
      </p>
    </div>
  )
}
