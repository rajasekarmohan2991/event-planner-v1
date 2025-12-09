"use client"

import { useState, useRef, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Download, Printer, Save } from 'lucide-react'
import { FloorPlanGenerator, FloorPlanConfig, COLORS } from '@/lib/floorPlanGenerator'
import FloorPlanForm from './FloorPlanForm'

interface DraggableItem {
  id: string
  type: 'entry' | 'exit' | 'restroom-m' | 'restroom-w' | 'bar' | 'dj' | 'reception'
  x: number
  y: number
  label: string
}

export default function FloorPlanDesigner() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const eventId = String(params?.id || '')
  const canvasRef = useRef<HTMLCanvasElement>(null)
  
  const [showCanvas, setShowCanvas] = useState(false)
  const [saving, setSaving] = useState(false)
  const [autoUpdate, setAutoUpdate] = useState(false)
  const [draggableItems, setDraggableItems] = useState<DraggableItem[]>([])
  const [draggedItem, setDraggedItem] = useState<DraggableItem | null>(null)
  const [currentEventId, setCurrentEventId] = useState<string>('')
  const [formData, setFormData] = useState<FloorPlanConfig>({
    hallName: '',
    hallLength: 100,
    hallWidth: 50,
    eventType: 'conference',
    guestCount: 500,
    tableType: 'round',
    seatsPerTable: 6,
    tableSize: 4,
    layoutStyle: 'banquet',
    vipSeats: 50,
    premiumSeats: 150,
    generalSeats: 300,
    stageRequired: true,
    stagePosition: 'front',
    stageWidth: 30,
    stageDepth: 8,
    bannerRequired: true,
    entryPoints: 2,
    exitPoints: 2,
    restroomsRequired: true,
    mensRestrooms: 2,
    womensRestrooms: 2,
    danceFloor: false,
    barArea: false,
    receptionDesk: false,
    djArea: false,
    specialNotes: ''
  })

  // Reset canvas when event ID changes
  useEffect(() => {
    if (eventId && eventId !== currentEventId) {
      // Clear canvas and reset state for new event
      setShowCanvas(false)
      setAutoUpdate(false)
      setDraggableItems([])
      setDraggedItem(null)
      setCurrentEventId(eventId)
      
      // Clear canvas if it exists
      const canvas = canvasRef.current
      if (canvas) {
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height)
        }
      }
    }
  }, [eventId, currentEventId])

  // Fetch event data and populate capacity
  useEffect(() => {
    const fetchEventData = async () => {
      try {
        const res = await fetch(`/api/events/${eventId}`)
        if (res.ok) {
          const event = await res.json()
          // Check for various capacity field names that might come from the backend
          const capacity = event.capacity || event.maxAttendees || event.totalCapacity || 500
          
          if (capacity) {
            // First set capacity and a temporary distribution
            const tmpVip = Math.floor(capacity * 0.1)
            const tmpPremium = Math.floor(capacity * 0.3)
            const tmpGeneral = capacity - tmpVip - tmpPremium
            setFormData(prev => ({
              ...prev,
              guestCount: capacity,
              vipSeats: tmpVip,
              premiumSeats: tmpPremium,
              generalSeats: tmpGeneral
            }))

            // Then try to load saved seat counts and ticket prices to override
            try {
              const [seatCountsRes, ticketRes] = await Promise.all([
                fetch(`/api/events/${eventId}/settings/seat-counts`, { credentials: 'include' }),
                fetch(`/api/events/${eventId}/settings/tickets`, { credentials: 'include' })
              ])

              if (seatCountsRes.ok) {
                const seatCounts = await seatCountsRes.json()
                const v = Number(seatCounts.vipSeats || 0)
                const p = Number(seatCounts.premiumSeats || 0)
                const g = Number(seatCounts.generalSeats || 0)
                if (v + p + g > 0) {
                  setFormData(prev => ({
                    ...prev,
                    vipSeats: v,
                    premiumSeats: p,
                    generalSeats: g
                  }))
                }
              }
              // Ticket prices are fetched for completeness; not used directly in the form yet
              if (ticketRes.ok) {
                await ticketRes.json().catch(() => null)
              }
            } catch (e) {
              console.warn('Failed to fetch saved seat counts or ticket settings', e)
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch event data:', error)
      }
    }
    
    if (eventId) {
      fetchEventData()
    }
  }, [eventId])

  // Auto-regenerate when event type or layout style changes
  useEffect(() => {
    if (autoUpdate && showCanvas) {
      generateFloorPlan()
    }
  }, [formData.eventType, formData.layoutStyle, formData.tableType, autoUpdate, showCanvas])

  const generateFloorPlan = () => {
    const canvas = canvasRef.current
    if (!canvas) {
      console.error('Canvas ref not found')
      return
    }

    // Validate required fields
    if (!formData.hallLength || formData.hallLength < 20) {
      alert('Please enter a valid hall length (minimum 20 ft)')
      return
    }
    if (!formData.hallWidth || formData.hallWidth < 20) {
      alert('Please enter a valid hall width (minimum 20 ft)')
      return
    }
    if (!formData.guestCount || formData.guestCount < 10) {
      alert('Please enter a valid guest count (minimum 10)')
      return
    }

    const ctx = canvas.getContext('2d')
    if (!ctx) {
      console.error('Canvas context not available')
      return
    }

    canvas.width = formData.hallLength * 6
    canvas.height = formData.hallWidth * 6
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    try {
      const generator = new FloorPlanGenerator(ctx, formData, draggableItems)
      generator.generate()
      setShowCanvas(true)
      setAutoUpdate(true) // Enable auto-update after first generation
      console.log('Floor plan generated successfully')
    } catch (error) {
      console.error('Error generating floor plan:', error)
      alert('Failed to generate floor plan. Please check the console for details.')
    }
  }

  // Drag and drop handlers
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    
    // Check if clicking on existing item
    const clickedItem = draggableItems.find(item => {
      const distance = Math.sqrt(Math.pow(item.x - x, 2) + Math.pow(item.y - y, 2))
      return distance < 20
    })
    
    if (clickedItem) {
      setDraggedItem(clickedItem)
    }
  }

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!draggedItem) return
    
    const canvas = canvasRef.current
    if (!canvas) return
    
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    
    setDraggableItems(items =>
      items.map(item =>
        item.id === draggedItem.id ? { ...item, x, y } : item
      )
    )
  }

  const handleCanvasMouseUp = () => {
    if (draggedItem) {
      setDraggedItem(null)
      generateFloorPlan() // Regenerate with new positions
    }
  }

  const addDraggableItem = (type: DraggableItem['type']) => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const newItem: DraggableItem = {
      id: `${type}-${Date.now()}`,
      type,
      x: canvas.width / 2,
      y: canvas.height / 2,
      label: type.replace('-', ' ').toUpperCase()
    }
    
    setDraggableItems([...draggableItems, newItem])
    setTimeout(() => generateFloorPlan(), 100)
  }

  const removeDraggableItem = (id: string) => {
    setDraggableItems(items => items.filter(item => item.id !== id))
    setTimeout(() => generateFloorPlan(), 100)
  }

  const downloadPlan = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const link = document.createElement('a')
    link.download = `${formData.hallName || 'floor-plan'}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  const printPlan = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const win = window.open()
    if (win) {
      win.document.write(`<html><head><title>${formData.hallName} Floor Plan</title></head><body style="margin:0;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#f3f4f6;"><img src="${canvas.toDataURL()}" style="max-width:90%;height:auto;" /></body></html>`)
      win.document.close()
      win.print()
    }
  }

  const saveFloorPlan = async () => {
    const canvas = canvasRef.current
    if (!canvas) return
    setSaving(true)
    try {
      const imageData = canvas.toDataURL('image/png')
      
      // Step 1: Save floor plan config and image
      const res = await fetch(`/api/events/${eventId}/design/floor-plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: formData, imageData })
      })
      
      if (!res.ok) {
        alert('Failed to save floor plan')
        return
      }
      
      // Step 2: Generate seat inventory from floor plan
      const floorPlan = {
        name: formData.hallName || 'Event Floor Plan',
        totalSeats: formData.vipSeats + formData.premiumSeats + formData.generalSeats,
        sections: []
      }
      
      // Add VIP section if seats exist
      if (formData.vipSeats > 0) {
        const vipRows = Math.ceil(formData.vipSeats / formData.seatsPerTable)
        floorPlan.sections.push({
          name: 'VIP',
          type: 'VIP',
          basePrice: 500, // Default VIP price
          rows: Array.from({ length: vipRows }).map((_, rIdx) => ({
            number: `V${rIdx + 1}`,
            seats: Math.min(formData.seatsPerTable, formData.vipSeats - (rIdx * formData.seatsPerTable)),
            xOffset: 50,
            yOffset: rIdx * 50
          }))
        })
      }
      
      // Add Premium section if seats exist
      if (formData.premiumSeats > 0) {
        const premiumRows = Math.ceil(formData.premiumSeats / formData.seatsPerTable)
        floorPlan.sections.push({
          name: 'Premium',
          type: 'Premium',
          basePrice: 300, // Default Premium price
          rows: Array.from({ length: premiumRows }).map((_, rIdx) => ({
            number: `P${rIdx + 1}`,
            seats: Math.min(formData.seatsPerTable, formData.premiumSeats - (rIdx * formData.seatsPerTable)),
            xOffset: 250,
            yOffset: rIdx * 50
          }))
        })
      }
      
      // Add General section if seats exist
      if (formData.generalSeats > 0) {
        const generalRows = Math.ceil(formData.generalSeats / formData.seatsPerTable)
        floorPlan.sections.push({
          name: 'General',
          type: 'General',
          basePrice: 150, // Default General price
          rows: Array.from({ length: generalRows }).map((_, rIdx) => ({
            number: `G${rIdx + 1}`,
            seats: Math.min(formData.seatsPerTable, formData.generalSeats - (rIdx * formData.seatsPerTable)),
            xOffset: 450,
            yOffset: rIdx * 50
          }))
        })
      }
      
      // Generate seats in database
      const seatsRes = await fetch(`/api/events/${eventId}/seats/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ floorPlan })
      })
      
      if (seatsRes.ok) {
        const seatsData = await seatsRes.json()
        alert(`Floor plan saved successfully!\n${seatsData.totalSeatsGenerated} seats generated and ready for registration.`)
      } else {
        const error = await seatsRes.json().catch(() => ({ error: 'Unknown error' }))
        alert(`Floor plan saved, but seat generation failed: ${error.error || 'Unknown error'}`)
      }
    } catch (e: any) {
      alert(`Failed to save floor plan: ${e.message || 'Unknown error'}`)
    } finally {
      setSaving(false)
    }
  }

  const tablesNeeded = Math.ceil(formData.guestCount / formData.seatsPerTable)

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-slate-800 to-slate-700 text-white p-6">
            <button onClick={() => router.back()} className="flex items-center gap-2 text-white/80 hover:text-white mb-4">
              <ArrowLeft className="w-4 h-4" />Back to Design
            </button>
            <div className="flex items-center gap-3">
              <div className="text-4xl">🏢</div>
              <div>
                <h1 className="text-2xl font-bold">Dynamic Floor Plan Generator</h1>
                <p className="text-white/80 text-sm">Create custom 2D floor plans for events, conferences, and venues</p>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-[400px_1fr] gap-0 min-h-[calc(100vh-200px)]">
            <div className="bg-gray-50 border-r p-6 overflow-y-auto h-full">
              <FloorPlanForm formData={formData} setFormData={setFormData} onGenerate={generateFloorPlan} />
            </div>

            <div className="p-6 flex flex-col bg-white h-full">
              <div className="bg-gray-100 border-2 border-gray-200 rounded-lg p-6 flex-1 overflow-auto flex items-center justify-center min-h-[500px] relative">
                {!showCanvas && (
                  <div className="text-center text-gray-400">
                    <div className="text-6xl mb-4">👈</div>
                    <h2 className="text-2xl font-semibold mb-2">Fill in the form</h2>
                    <p className="text-sm">Complete the form on the left and click "Generate Floor Plan"</p>
                  </div>
                )}
                <canvas 
                  ref={canvasRef} 
                  className={`bg-white shadow-lg max-w-full h-auto cursor-move ${!showCanvas ? 'hidden' : ''}`}
                  onMouseDown={handleCanvasMouseDown}
                  onMouseMove={handleCanvasMouseMove}
                  onMouseUp={handleCanvasMouseUp}
                  onMouseLeave={handleCanvasMouseUp}
                />
              </div>

              {showCanvas && (
                <>
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg mt-4 grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-indigo-600">{formData.hallLength}' × {formData.hallWidth}'</div>
                      <div className="text-xs text-gray-600">HALL DIMENSIONS</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-indigo-600">{formData.guestCount}</div>
                      <div className="text-xs text-gray-600">TOTAL GUESTS</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-indigo-600">{tablesNeeded}</div>
                      <div className="text-xs text-gray-600">TOTAL TABLES</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-indigo-600">{formData.seatsPerTable}</div>
                      <div className="text-xs text-gray-600">GUESTS PER TABLE</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-indigo-600 capitalize">{formData.eventType}</div>
                      <div className="text-xs text-gray-600">EVENT TYPE</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 md:grid-cols-6 gap-3 bg-white p-4 rounded-lg mt-4 border">
                    <div className="flex items-center gap-2 text-xs">
                      <div className="w-5 h-5 rounded border-2 border-gray-800" style={{backgroundColor: COLORS.stage}}></div>
                      <span>Stage</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <div className="w-5 h-5 rounded border-2 border-gray-800" style={{backgroundColor: COLORS.table}}></div>
                      <span>Tables</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <div className="w-5 h-5 rounded border-2 border-gray-800" style={{backgroundColor: COLORS.entry}}></div>
                      <span>Entry</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <div className="w-5 h-5 rounded border-2 border-gray-800" style={{backgroundColor: COLORS.exit}}></div>
                      <span>Exit</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <div className="w-5 h-5 rounded border-2 border-gray-800" style={{backgroundColor: COLORS.restroom}}></div>
                      <span>Restrooms</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <div className="w-5 h-5 rounded border-2 border-gray-800" style={{backgroundColor: COLORS.banner}}></div>
                      <span>Banner</span>
                    </div>
                  </div>

                  {/* Draggable Items Panel */}
                  <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4 mt-4">
                    <h3 className="font-bold text-sm mb-3 text-yellow-900">🎯 Drag & Drop Features</h3>
                    <p className="text-xs text-yellow-700 mb-3">Click to add, then drag items on the floor plan</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      <button onClick={() => addDraggableItem('entry')} className="px-3 py-2 bg-green-100 hover:bg-green-200 border border-green-300 rounded text-xs font-medium">
                        + Entry Point
                      </button>
                      <button onClick={() => addDraggableItem('exit')} className="px-3 py-2 bg-red-100 hover:bg-red-200 border border-red-300 rounded text-xs font-medium">
                        + Exit Point
                      </button>
                      <button onClick={() => addDraggableItem('restroom-m')} className="px-3 py-2 bg-blue-100 hover:bg-blue-200 border border-blue-300 rounded text-xs font-medium">
                        + Men's Restroom
                      </button>
                      <button onClick={() => addDraggableItem('restroom-w')} className="px-3 py-2 bg-pink-100 hover:bg-pink-200 border border-pink-300 rounded text-xs font-medium">
                        + Women's Restroom
                      </button>
                      <button onClick={() => addDraggableItem('bar')} className="px-3 py-2 bg-teal-100 hover:bg-teal-200 border border-teal-300 rounded text-xs font-medium">
                        + Bar Area
                      </button>
                      <button onClick={() => addDraggableItem('dj')} className="px-3 py-2 bg-purple-100 hover:bg-purple-200 border border-purple-300 rounded text-xs font-medium">
                        + DJ Area
                      </button>
                      <button onClick={() => addDraggableItem('reception')} className="px-3 py-2 bg-indigo-100 hover:bg-indigo-200 border border-indigo-300 rounded text-xs font-medium">
                        + Reception
                      </button>
                    </div>
                    {draggableItems.length > 0 && (
                      <div className="mt-3 space-y-1">
                        <p className="text-xs font-semibold text-yellow-900">Added Items:</p>
                        {draggableItems.map(item => (
                          <div key={item.id} className="flex items-center justify-between bg-white px-2 py-1 rounded text-xs">
                            <span>{item.label}</span>
                            <button onClick={() => removeDraggableItem(item.id)} className="text-red-600 hover:text-red-800 font-bold">×</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3 mt-4 flex-wrap">
                    <button onClick={downloadPlan} className="flex-1 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 flex items-center justify-center gap-2 font-semibold">
                      <Download className="w-4 h-4" />Download
                    </button>
                    <button onClick={printPlan} className="px-4 py-2 border-2 border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2 font-semibold">
                      <Printer className="w-4 h-4" />Print
                    </button>
                    <button onClick={saveFloorPlan} disabled={saving} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 font-semibold disabled:opacity-50">
                      <Save className="w-4 h-4" />{saving ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
