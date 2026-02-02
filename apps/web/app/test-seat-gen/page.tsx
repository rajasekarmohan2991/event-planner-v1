"use client"

import { useState } from 'react'

export default function TestSeatGeneration() {
  const [eventId, setEventId] = useState('7')
  const [vipSeats, setVipSeats] = useState('50')
  const [premiumSeats, setPremiumSeats] = useState('150')
  const [generalSeats, setGeneralSeats] = useState('300')
  const [seatsPerTable, setSeatsPerTable] = useState('6')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const generateSeats = async () => {
    setLoading(true)
    setResult(null)
    
    try {
      const vip = parseInt(vipSeats) || 0
      const premium = parseInt(premiumSeats) || 0
      const general = parseInt(generalSeats) || 0
      const spt = parseInt(seatsPerTable) || 6

      const floorPlan: any = {
        name: `Event ${eventId} Floor Plan`,
        totalSeats: vip + premium + general,
        sections: []
      }

      // Add VIP section
      if (vip > 0) {
        const vipRows = Math.ceil(vip / spt)
        floorPlan.sections.push({
          name: 'VIP',
          type: 'VIP',
          basePrice: 500,
          rows: Array.from({ length: vipRows }).map((_, rIdx) => ({
            number: `V${rIdx + 1}`,
            seats: Math.min(spt, vip - (rIdx * spt)),
            xOffset: 50,
            yOffset: rIdx * 50
          }))
        })
      }

      // Add Premium section
      if (premium > 0) {
        const premiumRows = Math.ceil(premium / spt)
        floorPlan.sections.push({
          name: 'Premium',
          type: 'Premium',
          basePrice: 300,
          rows: Array.from({ length: premiumRows }).map((_, rIdx) => ({
            number: `P${rIdx + 1}`,
            seats: Math.min(spt, premium - (rIdx * spt)),
            xOffset: 250,
            yOffset: rIdx * 50
          }))
        })
      }

      // Add General section
      if (general > 0) {
        const generalRows = Math.ceil(general / spt)
        floorPlan.sections.push({
          name: 'General',
          type: 'General',
          basePrice: 150,
          rows: Array.from({ length: generalRows }).map((_, rIdx) => ({
            number: `G${rIdx + 1}`,
            seats: Math.min(spt, general - (rIdx * spt)),
            xOffset: 450,
            yOffset: rIdx * 50
          }))
        })
      }

      const res = await fetch(`/api/events/${eventId}/seats/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ floorPlan })
      })

      const data = await res.json()
      setResult({ success: res.ok, data })
    } catch (error: any) {
      setResult({ success: false, error: error.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold mb-6">🎫 Test Seat Generation</h1>
          <p className="text-gray-600 mb-6">
            This page helps you quickly generate seats for an event without going through the floor plan designer.
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Event ID
              </label>
              <input
                type="text"
                value={eventId}
                onChange={(e) => setEventId(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="7"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  VIP Seats (₹500 each)
                </label>
                <input
                  type="number"
                  value={vipSeats}
                  onChange={(e) => setVipSeats(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Premium Seats (₹300 each)
                </label>
                <input
                  type="number"
                  value={premiumSeats}
                  onChange={(e) => setPremiumSeats(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  General Seats (₹150 each)
                </label>
                <input
                  type="number"
                  value={generalSeats}
                  onChange={(e) => setGeneralSeats(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Seats Per Table/Row
                </label>
                <input
                  type="number"
                  value={seatsPerTable}
                  onChange={(e) => setSeatsPerTable(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Total Seats:</strong> {(parseInt(vipSeats) || 0) + (parseInt(premiumSeats) || 0) + (parseInt(generalSeats) || 0)}
              </p>
            </div>

            <button
              onClick={generateSeats}
              disabled={loading}
              className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
            >
              {loading ? 'Generating Seats...' : 'Generate Seats'}
            </button>
          </div>

          {result && (
            <div className={`mt-6 p-4 rounded-lg ${result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              <h3 className={`font-semibold mb-2 ${result.success ? 'text-green-800' : 'text-red-800'}`}>
                {result.success ? '✅ Success!' : '❌ Error'}
              </h3>
              <pre className="text-sm overflow-auto">
                {JSON.stringify(result.data || result.error, null, 2)}
              </pre>
            </div>
          )}

          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold mb-2">📝 Instructions:</h3>
            <ol className="text-sm text-gray-700 space-y-2 list-decimal list-inside">
              <li>Enter the Event ID (default is 7)</li>
              <li>Set the number of seats for each category</li>
              <li>Click "Generate Seats"</li>
              <li>Wait for confirmation</li>
              <li>Go to the registration page to see the seat selector</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}
