"use client"

import { useSession } from "next-auth/react"
import { useEffect, useState } from 'react'
import ManageTabs from '@/components/events/ManageTabs'
import SimpleTicketCreator from '@/components/events/SimpleTicketCreator'
import Simple2DFloorGenerator from '@/components/events/Simple2DFloorGenerator'

type TicketClass = 'VIP' | 'PREMIUM' | 'GENERAL'

type FloorPlan = {
  id: number
  eventId: number
  ticketClass: TicketClass
  floorPlanImage: string | null
  layoutConfig: any
  createdAt: string
  updatedAt: string
}

export default function FloorPlannerV2Page({ params }: { params: { id: string } }) {
  const { status } = useSession()
  const [activeTab, setActiveTab] = useState<TicketClass>('VIP')
  const [floorPlans, setFloorPlans] = useState<Record<TicketClass, FloorPlan | null>>({
    VIP: null,
    PREMIUM: null,
    GENERAL: null
  })
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  
  // Form state for current tab
  const [rows, setRows] = useState(5)
  const [cols, setCols] = useState(10)
  const [seatPrefix, setSeatPrefix] = useState('')
  const [basePrice, setBasePrice] = useState(0)

  useEffect(() => {
    if (status !== 'loading') loadFloorPlans()
  }, [status, params.id])

  useEffect(() => {
    // Update form when tab changes
    const plan = floorPlans[activeTab]
    if (plan?.layoutConfig) {
      setRows(plan.layoutConfig.rows || 5)
      setCols(plan.layoutConfig.cols || 10)
      setSeatPrefix(plan.layoutConfig.seatPrefix || '')
      setBasePrice(plan.layoutConfig.basePrice || 0)
    } else {
      // Default values for each ticket class
      if (activeTab === 'VIP') {
        setRows(3)
        setCols(8)
        setSeatPrefix('V')
        setBasePrice(500)
      } else if (activeTab === 'PREMIUM') {
        setRows(5)
        setCols(10)
        setSeatPrefix('P')
        setBasePrice(300)
      } else {
        setRows(8)
        setCols(12)
        setSeatPrefix('G')
        setBasePrice(150)
      }
    }
  }, [activeTab, floorPlans])

  const loadFloorPlans = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/events/${params.id}/floor-plans`, { credentials: 'include' })
      if (!res.ok) throw new Error('Failed to load floor plans')
      
      const plans: FloorPlan[] = await res.json()
      
      const organized: Record<TicketClass, FloorPlan | null> = {
        VIP: plans.find(p => p.ticketClass === 'VIP') || null,
        PREMIUM: plans.find(p => p.ticketClass === 'PREMIUM') || null,
        GENERAL: plans.find(p => p.ticketClass === 'GENERAL') || null
      }
      
      setFloorPlans(organized)
    } catch (e: any) {
      setMessage({ type: 'error', text: e.message || 'Failed to load floor plans' })
    } finally {
      setLoading(false)
    }
  }

  const saveFloorPlan = async () => {
    try {
      setSaving(true)
      
      const layoutConfig = {
        rows,
        cols,
        seatPrefix,
        basePrice
      }

      const res = await fetch(`/api/events/${params.id}/floor-plans`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ticketClass: activeTab,
          layoutConfig
        })
      })

      if (!res.ok) throw new Error('Failed to save floor plan')
      
      setMessage({ type: 'success', text: `${activeTab} floor plan saved successfully!` })
      await loadFloorPlans()
      
      // Generate seats
      await generateSeats()
    } catch (e: any) {
      setMessage({ type: 'error', text: e.message || 'Failed to save floor plan' })
    } finally {
      setSaving(false)
    }
  }

  const generateSeats = async () => {
    try {
      const res = await fetch(`/api/events/${params.id}/seats/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ticketClass: activeTab,
          rows,
          cols,
          seatPrefix,
          basePrice
        })
      })

      if (!res.ok) throw new Error('Failed to generate seats')
      
      setMessage({ type: 'success', text: `${rows * cols} ${activeTab} seats generated!` })
    } catch (e: any) {
      setMessage({ type: 'error', text: e.message || 'Failed to generate seats' })
    }
  }

  const deleteFloorPlan = async () => {
    if (!confirm(`Delete ${activeTab} floor plan and all seats?`)) return

    try {
      setSaving(true)
      const res = await fetch(`/api/events/${params.id}/floor-plans?ticketClass=${activeTab}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (!res.ok) throw new Error('Failed to delete floor plan')
      
      setMessage({ type: 'success', text: `${activeTab} floor plan deleted!` })
      await loadFloorPlans()
    } catch (e: any) {
      setMessage({ type: 'error', text: e.message || 'Failed to delete floor plan' })
    } finally {
      setSaving(false)
    }
  }

  if (status === 'loading' || loading) {
    return <div className="p-6">Loading...</div>
  }

  const tabClasses = (tab: TicketClass) => {
    const isActive = activeTab === tab
    const hasData = floorPlans[tab] !== null
    
    let bgColor = 'bg-gray-100'
    if (tab === 'VIP') bgColor = isActive ? 'bg-purple-600 text-white' : hasData ? 'bg-purple-100' : 'bg-gray-100'
    if (tab === 'PREMIUM') bgColor = isActive ? 'bg-blue-600 text-white' : hasData ? 'bg-blue-100' : 'bg-gray-100'
    if (tab === 'GENERAL') bgColor = isActive ? 'bg-green-600 text-white' : hasData ? 'bg-green-100' : 'bg-gray-100'
    
    return `px-6 py-3 rounded-t-lg font-semibold cursor-pointer transition-all ${bgColor} ${isActive ? 'shadow-lg' : 'hover:shadow-md'}`
  }

  return (
    <div className="space-y-4">
      <ManageTabs eventId={params.id} />
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Floor Planner</h1>
          <p className="text-sm text-muted-foreground">Create separate seating plans for each ticket class</p>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-md ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          {message.text}
        </div>
      )}

      {/* Simple Ticket Creator */}
      <SimpleTicketCreator 
        eventId={params.id} 
        onSuccess={() => {
          setMessage({ type: 'success', text: 'Tickets created successfully! Refreshing...' })
          loadFloorPlans()
        }}
      />

      {/* 2D Floor Generator */}
      <Simple2DFloorGenerator 
        eventId={params.id}
        onSuccess={() => {
          setMessage({ type: 'success', text: '2D Floor plan generated successfully! Refreshing...' })
          loadFloorPlans()
        }}
      />

      <div className="border-t pt-6">
        <h2 className="text-lg font-semibold mb-4">Advanced Floor Planner (Grid-Based)</h2>
        <p className="text-sm text-gray-600 mb-4">
          Use the grid-based planner below for complex seating arrangements with rows and columns.
        </p>
      </div>

      {/* Ticket Class Tabs */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setActiveTab('VIP')}
          className={tabClasses('VIP')}
        >
          👑 VIP {floorPlans.VIP && '✓'}
        </button>
        <button
          onClick={() => setActiveTab('PREMIUM')}
          className={tabClasses('PREMIUM')}
        >
          ⭐ PREMIUM {floorPlans.PREMIUM && '✓'}
        </button>
        <button
          onClick={() => setActiveTab('GENERAL')}
          className={tabClasses('GENERAL')}
        >
          🎫 GENERAL {floorPlans.GENERAL && '✓'}
        </button>
      </div>

      {/* Floor Plan Configuration */}
      <div className="bg-white rounded-lg border p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{activeTab} Seating Configuration</h2>
          {floorPlans[activeTab] && (
            <button
              onClick={deleteFloorPlan}
              disabled={saving}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
            >
              🗑️ Delete {activeTab} Plan
            </button>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-2">Number of Rows</label>
            <input
              type="number"
              value={rows}
              onChange={(e) => setRows(parseInt(e.target.value) || 0)}
              min="1"
              max="50"
              className="w-full rounded-md border px-4 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Seats per Row</label>
            <input
              type="number"
              value={cols}
              onChange={(e) => setCols(parseInt(e.target.value) || 0)}
              min="1"
              max="50"
              className="w-full rounded-md border px-4 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Seat Prefix</label>
            <input
              type="text"
              value={seatPrefix}
              onChange={(e) => setSeatPrefix(e.target.value)}
              placeholder="e.g., V, P, G"
              maxLength={2}
              className="w-full rounded-md border px-4 py-2"
            />
            <p className="text-xs text-gray-500 mt-1">Seats will be named: {seatPrefix}1-1, {seatPrefix}1-2, etc.</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Base Price (₹)</label>
            <input
              type="number"
              value={basePrice}
              onChange={(e) => setBasePrice(parseFloat(e.target.value) || 0)}
              min="0"
              step="50"
              className="w-full rounded-md border px-4 py-2"
            />
          </div>
        </div>

        {/* Preview */}
        <div className="border-t pt-6">
          <h3 className="text-sm font-semibold mb-3">Preview</h3>
          <div className="bg-gray-50 p-4 rounded-md">
            <div className="text-sm space-y-2">
              <div className="flex justify-between">
                <span className="font-medium">Total Seats:</span>
                <span className="font-bold">{rows * cols}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Ticket Class:</span>
                <span className="font-bold">{activeTab}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Price per Seat:</span>
                <span className="font-bold">₹{basePrice}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Total Revenue (if full):</span>
                <span className="font-bold text-green-600">₹{(rows * cols * basePrice).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex gap-3">
          <button
            onClick={saveFloorPlan}
            disabled={saving || rows === 0 || cols === 0}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 font-semibold"
          >
            {saving ? '⏳ Saving...' : `💾 Save ${activeTab} Floor Plan & Generate Seats`}
          </button>
        </div>

        {/* Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <h4 className="text-sm font-semibold text-blue-900 mb-2">ℹ️ How it works:</h4>
          <ul className="text-xs text-blue-800 space-y-1 list-disc list-inside">
            <li>Create separate floor plans for VIP, Premium, and General seating</li>
            <li>Each ticket class has its own layout, pricing, and seat configuration</li>
            <li>Seats are automatically generated when you save the floor plan</li>
            <li>Seat selector will show only seats matching the selected ticket class</li>
            <li>You can update or delete floor plans at any time</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
