'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch'
import {
    ZoomIn, ZoomOut, Maximize2, RotateCw, Save,
    Plus, Trash2, Move, Edit
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { ChairIcon, TableSeatIcon } from '@/components/seats/SeatIcons'
import AIFloorPlanGenerator from '@/components/floor-plan/AIFloorPlanGenerator'
import { Sparkles } from 'lucide-react'

interface FloorPlanObject {
    id: string
    type: string
    subType?: string
    x: number
    y: number
    width: number
    height: number
    rotation: number
    rows?: number
    cols?: number
    totalSeats: number
    pricingTier?: string
    gender?: string
    fillColor: string
    strokeColor: string
    label?: string
    isSelected?: boolean
    isTemporary?: boolean
    gaps?: string[] // "row-col" of deleted seats
    rowStart?: string // 'A', '1'
}

interface FloorPlan {
    id?: string
    name: string
    canvasWidth: number
    canvasHeight: number
    backgroundColor: string
    gridSize: number
    vipPrice: number
    premiumPrice: number
    generalPrice: number
    objects: FloorPlanObject[]
}

export default function FloorPlanDesignerPage() {
    const params = useParams()
    const eventId = params?.id as string

    // State
    const [floorPlan, setFloorPlan] = useState<FloorPlan>({
        name: 'New Floor Plan',
        canvasWidth: 1200,
        canvasHeight: 800,
        backgroundColor: '#f8fafc',
        gridSize: 20,
        vipPrice: 5000,
        premiumPrice: 2000,
        generalPrice: 500,
        objects: []
    })

    const [selectedTool, setSelectedTool] = useState<string>('select')
    const [selectedObject, setSelectedObject] = useState<FloorPlanObject | null>(null)
    const [showGrid, setShowGrid] = useState(true)
    const [snapToGrid, setSnapToGrid] = useState(true)
    const [zoom, setZoom] = useState(1)
    const [isDragging, setIsDragging] = useState(false)
    const [dragStart, setDragStart] = useState({ mouseX: 0, mouseY: 0, objX: 0, objY: 0 })
    const [showAddDialog, setShowAddDialog] = useState(false)
    const [showAIDialog, setShowAIDialog] = useState(false)
    const [loading, setLoading] = useState(false)
    const [registrations, setRegistrations] = useState<any[]>([])
    const [seats, setSeats] = useState<Map<string, any[]>>(new Map()) // objectId -> seats[]
    const [isEditingSeats, setIsEditingSeats] = useState(false)

    // New object form
    const [newObject, setNewObject] = useState({
        type: 'GRID',
        subType: 'RECTANGLE',
        rows: 10,
        cols: 10,
        pricingTier: 'GENERAL',
        gender: 'MIXED',
        label: ''
    })

    // Load floor plan, registrations, and event details
    useEffect(() => {
        if (eventId) {
            loadFloorPlan()
            loadRegistrations()
            loadEventAndTickets()
        }
    }, [eventId])

    // Regenerate seats when objects change (position, size, etc.)
    useEffect(() => {
        floorPlan.objects.forEach(obj => {
            generateSeatsForObject(obj)
        })
    }, [floorPlan.objects])

    const loadEventAndTickets = async () => {
        try {
            // Fetch Tickets to prepopulate prices
            const ticketsRes = await fetch(`/api/events/${eventId}/tickets`)
            if (ticketsRes.ok) {
                const data = await ticketsRes.json()
                const tickets = data.tickets || []

                // Find matching tickets
                const vipTicket = tickets.find((t: any) => t.name.toLowerCase().includes('vip') || t.priceInr > 2000)
                const premiumTicket = tickets.find((t: any) => t.name.toLowerCase().includes('premium') || (t.priceInr > 1000 && t.priceInr <= 2000))
                const generalTicket = tickets.find((t: any) => t.name.toLowerCase().includes('general') || t.priceInr <= 1000)

                setFloorPlan(prev => ({
                    ...prev,
                    vipPrice: vipTicket ? Number(vipTicket.priceInr) : prev.vipPrice,
                    premiumPrice: premiumTicket ? Number(premiumTicket.priceInr) : prev.premiumPrice,
                    generalPrice: generalTicket ? Number(generalTicket.priceInr) : prev.generalPrice
                }))
            }
        } catch (error) {
            console.error('Failed to load event tickets:', error)
        }
    }

    const loadRegistrations = async () => {
        try {
            const response = await fetch(`/api/events/${eventId}/registrations`)
            if (response.ok) {
                const data = await response.json()
                setRegistrations(data.objects || data.registrations || [])
            }
        } catch (error) {
            console.error('Failed to load registrations:', error)
        }
    }

    const loadFloorPlan = async () => {
        try {
            setLoading(true)
            console.log('[Floor Plan Editor] Loading floor plan...')

            const [response, countsRes] = await Promise.all([
                fetch(`/api/events/${eventId}/floor-plans-direct`),
                fetch(`/api/events/${eventId}/settings/seat-counts`)
            ])

            let planToUse = null
            if (response.ok) {
                const data = await response.json()
                if (data.floorPlans && data.floorPlans.length > 0) {
                    planToUse = data.floorPlans[0]
                }
            }

            if (planToUse) {
                console.log('[Floor Plan Editor] Loading plan:', planToUse.name, planToUse.id)

                // Ensure objects have necessary properties and calculate totalSeats
                const objects = (planToUse.objects || []).map((obj: FloorPlanObject) => {
                    // Calculate totalSeats if not present
                    let totalSeats = obj.totalSeats || 0
                    if (!totalSeats && obj.rows && obj.cols) {
                        const gaps = obj.gaps || []
                        totalSeats = (obj.rows * obj.cols) - gaps.length
                    }
                    return {
                        ...obj,
                        totalSeats
                    }
                })

                setFloorPlan({
                    ...planToUse,
                    vipPrice: Number(planToUse.vipPrice) || 0,
                    premiumPrice: Number(planToUse.premiumPrice) || 0,
                    generalPrice: Number(planToUse.generalPrice) || 0,
                    objects: objects
                })

                // Generate visual seats for loaded objects
                setTimeout(() => {
                    objects.forEach((obj: FloorPlanObject) => generateSeatsForObject(obj))
                }, 100)

            } else if (countsRes.ok) {
                // Auto-generate based on saved counts
                const counts = await countsRes.json()
                const { vipSeats, premiumSeats, generalSeats } = counts

                if ((vipSeats > 0 || premiumSeats > 0 || generalSeats > 0)) {
                    // Create a proper layoutData structure for seat generation
                    const sections: any[] = []

                    if (vipSeats > 0) {
                        const cols = 10
                        const rows = Math.ceil(vipSeats / cols)
                        sections.push({
                            name: 'VIP Section',
                            basePrice: 5000,
                            tier: 'VIP',
                            rows: Array.from({ length: rows }).map((_, rIdx) => ({
                                number: String.fromCharCode(65 + rIdx), // A, B, C...
                                seats: cols,
                                xOffset: 100,
                                yOffset: 100 + (rIdx * 50)
                            }))
                        })
                    }

                    if (premiumSeats > 0) {
                        const cols = 10
                        const rows = Math.ceil(premiumSeats / cols)
                        const yStart = vipSeats > 0 ? 100 + (Math.ceil(vipSeats / cols) * 50) + 100 : 100
                        sections.push({
                            name: 'Premium Section',
                            basePrice: 2000,
                            tier: 'PREMIUM',
                            rows: Array.from({ length: rows }).map((_, rIdx) => ({
                                number: String.fromCharCode(65 + rIdx + (vipSeats > 0 ? Math.ceil(vipSeats / 10) : 0)),
                                seats: cols,
                                xOffset: 100,
                                yOffset: yStart + (rIdx * 50)
                            }))
                        })
                    }

                    if (generalSeats > 0) {
                        const cols = 10
                        const rows = Math.ceil(generalSeats / cols)
                        const prevRows = (vipSeats > 0 ? Math.ceil(vipSeats / 10) : 0) + (premiumSeats > 0 ? Math.ceil(premiumSeats / 10) : 0)
                        const yStart = 100 + (prevRows * 50) + (prevRows > 0 ? 100 : 0)
                        sections.push({
                            name: 'General Section',
                            basePrice: 500,
                            tier: 'STANDARD',
                            rows: Array.from({ length: rows }).map((_, rIdx) => ({
                                number: String.fromCharCode(65 + rIdx + prevRows),
                                seats: cols,
                                xOffset: 100,
                                yOffset: yStart + (rIdx * 50)
                            }))
                        })
                    }

                    if (sections.length > 0) {
                        const totalSeats = (vipSeats || 0) + (premiumSeats || 0) + (generalSeats || 0)

                        // Save this layout to the database
                        const saveRes = await fetch(`/api/events/${eventId}/floor-plan`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                name: 'Auto-Generated Layout',
                                layoutData: {
                                    name: 'Auto-Generated Layout',
                                    totalSeats: totalSeats,
                                    sections: sections
                                },
                                vipPrice: 5000,
                                premiumPrice: 2000,
                                generalPrice: 500
                            })
                        })

                        if (saveRes.ok) {
                            // Trigger seat generation
                            await fetch(`/api/events/${eventId}/seats/generate`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({})
                            })

                            // Reload the page to show the generated plan
                            window.location.reload()
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Failed to load floor plan:', error)
        } finally {
            setLoading(false)
        }
    }

    // Save floor plan
    const saveFloorPlan = async () => {
        try {
            setLoading(true)

            const payload = {
                id: floorPlan.id,
                name: floorPlan.name,
                canvasWidth: floorPlan.canvasWidth,
                canvasHeight: floorPlan.canvasHeight,
                backgroundColor: floorPlan.backgroundColor,
                gridSize: floorPlan.gridSize,
                vipPrice: floorPlan.vipPrice,
                premiumPrice: floorPlan.premiumPrice,
                generalPrice: floorPlan.generalPrice,
                totalCapacity: floorPlan.objects.reduce((sum, obj) => sum + (Number(obj.totalSeats) || 0), 0),
                vipCapacity: floorPlan.objects.filter(o => o.pricingTier === 'VIP').reduce((sum, obj) => sum + (Number(obj.totalSeats) || 0), 0),
                premiumCapacity: floorPlan.objects.filter(o => o.pricingTier === 'PREMIUM').reduce((sum, obj) => sum + (Number(obj.totalSeats) || 0), 0),
                generalCapacity: floorPlan.objects.filter(o => o.pricingTier === 'GENERAL').reduce((sum, obj) => sum + (Number(obj.totalSeats) || 0), 0),
                layoutData: { objects: floorPlan.objects },
                status: 'DRAFT'
            }

            const response = await fetch(`/api/events/${eventId}/floor-plan`, {
                method: floorPlan.id ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })

            if (response.ok) {
                const data = await response.json()
                
                // Trigger seat generation after saving floor plan
                try {
                    const genRes = await fetch(`/api/events/${eventId}/seats/generate`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            floorPlan: { objects: floorPlan.objects },
                            pricingRules: [
                                { seatType: 'VIP', basePrice: floorPlan.vipPrice },
                                { seatType: 'PREMIUM', basePrice: floorPlan.premiumPrice },
                                { seatType: 'GENERAL', basePrice: floorPlan.generalPrice }
                            ]
                        })
                    })
                    
                    if (genRes.ok) {
                        const genData = await genRes.json()
                        alert(`✅ Floor plan saved and ${genData.totalSeatsGenerated || 0} seats generated!`)
                    } else {
                        alert('Floor plan saved! Note: Seat generation may have failed - check event settings.')
                    }
                } catch (genError) {
                    console.error('Seat generation error:', genError)
                    alert('Floor plan saved! Note: Seat generation encountered an error.')
                }
                
                if (data.floorPlan) {
                    setFloorPlan(prev => ({ ...prev, id: data.floorPlan.id }))
                }
            } else {
                const errorData = await response.json().catch(() => ({}))
                console.error('Save failed:', errorData)
                alert(`Failed to save floor plan: ${errorData.message || errorData.error || 'Unknown error'}`)
            }
        } catch (error: any) {
            console.error('Failed to save:', error)
            alert(`Failed to save floor plan: ${error.message}`)
        } finally {
            setLoading(false)
        }
    }

    // Add object to canvas
    const addObject = () => {
        // Handle STAGE, EXIT, ENTRY types (no seats)
        if (newObject.type === 'STAGE' || newObject.type === 'EXIT' || newObject.type === 'ENTRY') {
            const gateColors = {
                STAGE: { fill: '#f1f5f9', stroke: '#94a3b8' },
                EXIT: { fill: '#fee2e2', stroke: '#dc2626' },
                ENTRY: { fill: '#d1fae5', stroke: '#059669' }
            }
            const gateConfig = gateColors[newObject.type as keyof typeof gateColors]
            
            const obj: FloorPlanObject = {
                id: `${newObject.type.toLowerCase()}-${Date.now()}`,
                type: newObject.type, // Use actual type (STAGE, EXIT, or ENTRY)
                x: 100,
                y: newObject.type === 'STAGE' ? 50 : 400,
                width: newObject.type === 'STAGE' ? 400 : 80,
                height: newObject.type === 'STAGE' ? 100 : 40,
                rotation: 0,
                totalSeats: 0,
                fillColor: gateConfig.fill,
                strokeColor: gateConfig.stroke,
                label: newObject.label || newObject.type,
                isTemporary: true
            }
            setFloorPlan(prev => ({
                ...prev,
                objects: [...prev.objects, obj]
            }))
            setShowAddDialog(false)
            return
        }

        const totalSeats = newObject.type === 'GRID'
            ? (newObject.rows || 0) * (newObject.cols || 0)
            : newObject.type === 'ROUND_TABLE' ? 8 : 0

        const colors = {
            VIP: { fill: '#fbbf24', stroke: '#f59e0b' },
            PREMIUM: { fill: '#3b82f6', stroke: '#2563eb' },
            GENERAL: { fill: '#6b7280', stroke: '#4b5563' }
        }

        const color = colors[newObject.pricingTier as keyof typeof colors] || colors.GENERAL

        const obj: FloorPlanObject = {
            id: `temp-${Date.now()}`,
            type: newObject.type,
            subType: newObject.subType,
            x: 100,
            y: 100,
            width: newObject.type === 'GRID' ? (newObject.cols || 10) * 30 : 120,
            height: newObject.type === 'GRID' ? (newObject.rows || 10) * 30 : 120,
            rotation: 0,
            rows: newObject.rows,
            cols: newObject.cols,
            totalSeats,
            pricingTier: newObject.pricingTier,
            gender: newObject.gender,
            fillColor: color.fill,
            strokeColor: color.stroke,
            label: newObject.label || `${newObject.pricingTier} BLOCK`,
            isTemporary: true,
            gaps: []
        }

        setFloorPlan(prev => ({
            ...prev,
            objects: [...prev.objects, obj]
        }))

        // Generate seats for this object
        generateSeatsForObject(obj)

        setShowAddDialog(false)
        setSelectedObject(obj)
    }

    // Handle AI-generated floor plan
    const handleAIGenerated = (aiFloorPlan: any) => {
        console.log('AI Generated Floor Plan:', aiFloorPlan)

        // Update floor plan with AI-generated objects
        setFloorPlan(prev => ({
            ...prev,
            name: aiFloorPlan.name || prev.name,
            objects: aiFloorPlan.objects || []
        }))

        // Generate seats for all objects
        aiFloorPlan.objects?.forEach((obj: FloorPlanObject) => {
            generateSeatsForObject(obj)
        })

        setShowAIDialog(false)

        // Show success message
        alert(`✨ AI generated ${aiFloorPlan.objects?.length || 0} objects! Review and save when ready.`)
    }

    // Generate individual seats for an object
    const generateSeatsForObject = (obj: FloorPlanObject) => {
        // Skip for STAGE, EXIT, ENTRY (no seats)
        if (obj.type === 'STAGE' || obj.type === 'EXIT' || obj.type === 'ENTRY') {
            setSeats(prev => {
                const newSeats = new Map(prev)
                newSeats.set(obj.id, [])
                return newSeats
            })
            return
        }

        const generatedSeats: any[] = []
        const seatSize = 24
        const seatSpacing = 8
        const gaps = new Set(obj.gaps || [])

        if (obj.type === 'GRID') {
            // Generate grid seats
            const rows = obj.rows || 10
            const cols = obj.cols || 10
            const labelsStr = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

            for (let row = 0; row < rows; row++) {
                // Determine Row Label
                // 0->A, 1->B ... 26->AA? For simplicity just A..Z then A1..Z1
                let rowLabel = labelsStr[row % 26]
                if (row >= 26) rowLabel += Math.floor(row / 26)

                for (let col = 0; col < cols; col++) {
                    // Check Gap
                    if (gaps.has(`${row}-${col}`)) continue

                    const seatNumber = col + 1
                    const seatLabel = `${rowLabel}${seatNumber}`

                    generatedSeats.push({
                        id: `${obj.id}-${row}-${col}`,
                        label: seatLabel,
                        displayNumber: seatLabel, // Show full label like A1, A2, B1, B2
                        x: obj.x + (col * (seatSize + seatSpacing)), // No offset needed
                        y: obj.y + (row * (seatSize + seatSpacing)),
                        rotation: 0,
                        status: 'AVAILABLE',
                        type: 'CHAIR',
                        rowIndex: row,
                        colIndex: col
                    })
                }
            }
        } else if (obj.type === 'ROUND_TABLE') {
            // Generate seats around table based on totalSeats
            const numSeats = obj.totalSeats || 8
            // Adjust table radius slightly if needed (though visual is fixed by width)
            const tableRadius = obj.width / 2
            const seatRadius = 15

            for (let i = 0; i < numSeats; i++) {
                const angle = (i * 360) / numSeats
                const radian = (angle * Math.PI) / 180
                const seatX = obj.x + tableRadius + (tableRadius + seatRadius) * Math.cos(radian)
                const seatY = obj.y + tableRadius + (tableRadius + seatRadius) * Math.sin(radian)

                generatedSeats.push({
                    id: `${obj.id}-${i}`,
                    label: `${i + 1}`,
                    x: seatX,
                    y: seatY,
                    rotation: angle,
                    status: 'AVAILABLE',
                    type: 'TABLE_SEAT'
                })
            }
        }

        // Store seats for this object
        setSeats(prev => {
            const newSeats = new Map(prev)
            newSeats.set(obj.id, generatedSeats)
            return newSeats
        })
    }

    // Handle canvas click
    const handleCanvasClick = (e: React.MouseEvent<SVGSVGElement>) => {
        if (selectedTool === 'select') {
            setSelectedObject(null)
        }
    }

    // Handle object click
    const handleObjectClick = (obj: FloorPlanObject, e: React.MouseEvent) => {
        e.stopPropagation()
        setSelectedObject(obj)
    }

    // Handle object drag
    const handleObjectMouseDown = (obj: FloorPlanObject, e: React.MouseEvent) => {
        e.stopPropagation()
        setIsDragging(true)
        setSelectedObject(obj)
        // Store initial positions
        setDragStart({
            mouseX: e.clientX,
            mouseY: e.clientY,
            objX: obj.x,
            objY: obj.y
        })
    }

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isDragging && selectedObject) {
            // Calculate delta in screen pixels
            const deltaX = e.clientX - dragStart.mouseX
            const deltaY = e.clientY - dragStart.mouseY

            // Convert pixels to SVG units (divide by zoom)
            let newX = dragStart.objX + (deltaX / zoom)
            let newY = dragStart.objY + (deltaY / zoom)

            // Snap to grid
            if (snapToGrid) {
                newX = Math.round(newX / floorPlan.gridSize) * floorPlan.gridSize
                newY = Math.round(newY / floorPlan.gridSize) * floorPlan.gridSize
            }

            setFloorPlan(prev => ({
                ...prev,
                objects: prev.objects.map(o =>
                    o.id === selectedObject.id ? { ...o, x: newX, y: newY } : o
                )
            }))

            setSelectedObject(prev => prev ? { ...prev, x: newX, y: newY } : null)
        }
    }

    const handleMouseUp = () => {
        setIsDragging(false)
    }

    // Rotate selected object
    const rotateObject = () => {
        if (selectedObject) {
            const newRotation = (selectedObject.rotation + 90) % 360
            setFloorPlan(prev => ({
                ...prev,
                objects: prev.objects.map(o =>
                    o.id === selectedObject.id ? { ...o, rotation: newRotation } : o
                )
            }))
            setSelectedObject(prev => prev ? { ...prev, rotation: newRotation } : null)
        }
    }

    // Delete selected object
    const deleteObject = () => {
        if (selectedObject) {
            setFloorPlan(prev => ({
                ...prev,
                objects: prev.objects.filter(o => o.id !== selectedObject.id)
            }))
            setSelectedObject(null)
        }
    }

    // Handle seat toggle (Gap editing)
    const handleSeatToggle = (obj: FloorPlanObject, row: number, col: number, e: React.MouseEvent) => {
        if (!isEditingSeats) return;
        e.stopPropagation();

        const gapKey = `${row}-${col}`
        const currentGaps = new Set(obj.gaps || [])

        if (currentGaps.has(gapKey)) {
            currentGaps.delete(gapKey)
        } else {
            currentGaps.add(gapKey)
        }

        const updatedGaps = Array.from(currentGaps)
        const updatedObj = { ...obj, gaps: updatedGaps }

        setFloorPlan(prev => ({
            ...prev,
            objects: prev.objects.map(o => o.id === obj.id ? updatedObj : o)
        }))

        setSelectedObject(updatedObj)
        generateSeatsForObject(updatedObj)
    }

    // Calculate analytics
    const calculateAnalytics = () => {
        const total = floorPlan.objects.reduce((sum, obj) => sum + (Number(obj.totalSeats) || 0), 0)
        const vip = floorPlan.objects.filter(o => o.pricingTier === 'VIP').reduce((sum, obj) => sum + (Number(obj.totalSeats) || 0), 0)
        const premium = floorPlan.objects.filter(o => o.pricingTier === 'PREMIUM').reduce((sum, obj) => sum + (Number(obj.totalSeats) || 0), 0)
        const general = floorPlan.objects.filter(o => o.pricingTier === 'GENERAL').reduce((sum, obj) => sum + (Number(obj.totalSeats) || 0), 0)

        // Count filled seats from registrations
        const totalFilled = registrations.length
        const vipFilled = registrations.filter(r => {
            const type = r.type || r.dataJson?.ticketType || ''
            return type.toUpperCase().includes('VIP')
        }).length
        const premiumFilled = registrations.filter(r => {
            const type = r.type || r.dataJson?.ticketType || ''
            return type.toUpperCase().includes('PREMIUM')
        }).length
        const generalFilled = registrations.filter(r => {
            const type = r.type || r.dataJson?.ticketType || ''
            return type.toUpperCase().includes('GENERAL') || (!type.toUpperCase().includes('VIP') && !type.toUpperCase().includes('PREMIUM'))
        }).length

        const revenue = {
            vip: vip * (Number(floorPlan.vipPrice) || 0),
            premium: premium * (Number(floorPlan.premiumPrice) || 0),
            general: general * (Number(floorPlan.generalPrice) || 0),
            total: (vip * (Number(floorPlan.vipPrice) || 0)) + (premium * (Number(floorPlan.premiumPrice) || 0)) + (general * (Number(floorPlan.generalPrice) || 0))
        }

        return {
            total, vip, premium, general, revenue,
            totalFilled, vipFilled, premiumFilled, generalFilled
        }
    }

    const stats = calculateAnalytics()

    if (loading && floorPlan.objects.length === 0) {
        return <div className="p-6">Loading...</div>
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold">Floor Plan Designer</h1>
                </div>
                <div className="flex gap-2">
                    <Button
                        onClick={() => setShowAIDialog(true)}
                        variant="outline"
                        className="border-purple-300 text-purple-700 hover:bg-purple-50"
                    >
                        <Sparkles className="h-4 w-4 mr-2" />
                        AI Generate
                    </Button>
                    <Button onClick={saveFloorPlan} disabled={loading}>
                        <Save className="h-4 w-4 mr-2" />
                        {loading ? 'Saving...' : 'Save Layout'}
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Total Capacity</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalFilled}/{stats.total}</div>
                        <p className="text-xs text-muted-foreground">{stats.totalFilled} filled</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">VIP Seats</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-yellow-600">{stats.vipFilled}/{stats.vip}</div>
                        <p className="text-xs text-muted-foreground">{stats.vipFilled} filled</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Premium Seats</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">{stats.premiumFilled}/{stats.premium}</div>
                        <p className="text-xs text-muted-foreground">{stats.premiumFilled} filled</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">₹{(stats.revenue.total / 100000).toFixed(1)}L</div>
                        <p className="text-xs text-muted-foreground">Potential</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-12 gap-6">
                {/* Left Sidebar - Tools */}
                <div className="col-span-2 space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm">Tools</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <Button
                                variant={selectedTool === 'select' ? 'default' : 'outline'}
                                className="w-full justify-start"
                                onClick={() => setSelectedTool('select')}
                            >
                                <Move className="h-4 w-4 mr-2" />
                                Select
                            </Button>
                            <Button
                                variant="outline"
                                className="w-full justify-start"
                                onClick={() => setShowAddDialog(true)}
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Add Object
                            </Button>
                            {selectedObject && (
                                <>
                                    <Button
                                        variant="outline"
                                        className="w-full justify-start"
                                        onClick={rotateObject}
                                    >
                                        <RotateCw className="h-4 w-4 mr-2" />
                                        Rotate 90°
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        className="w-full justify-start"
                                        onClick={deleteObject}
                                    >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Delete
                                    </Button>
                                </>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm">View</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-sm">Grid</span>
                                <input
                                    type="checkbox"
                                    checked={showGrid}
                                    onChange={(e) => setShowGrid(e.target.checked)}
                                    className="rounded"
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm">Snap</span>
                                <input
                                    type="checkbox"
                                    checked={snapToGrid}
                                    onChange={(e) => setSnapToGrid(e.target.checked)}
                                    className="rounded"
                                />
                            </div>
                            <div className="text-sm text-muted-foreground">
                                Zoom: {Math.round(zoom * 100)}%
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Center - Canvas */}
                <div className="col-span-7">
                    <Card className="h-[600px]">
                        <CardContent className="p-0 h-full">
                            <TransformWrapper
                                initialScale={1}
                                minScale={0.1}
                                maxScale={5}
                                onZoom={(ref) => setZoom(ref.state.scale)}
                                disabled={isDragging}
                            >
                                {({ zoomIn, zoomOut, resetTransform }) => (
                                    <>
                                        {/* Zoom Controls */}
                                        <div className="absolute top-4 right-4 z-10 flex gap-2">
                                            <Button size="sm" variant="secondary" onClick={() => zoomIn()}>
                                                <ZoomIn className="h-4 w-4" />
                                            </Button>
                                            <Button size="sm" variant="secondary" onClick={() => zoomOut()}>
                                                <ZoomOut className="h-4 w-4" />
                                            </Button>
                                            <Button size="sm" variant="secondary" onClick={() => resetTransform()}>
                                                <Maximize2 className="h-4 w-4" />
                                            </Button>
                                        </div>

                                        <TransformComponent wrapperClass="!w-full !h-full">
                                            <svg
                                                width={floorPlan.canvasWidth}
                                                height={floorPlan.canvasHeight}
                                                className="border"
                                                style={{ backgroundColor: floorPlan.backgroundColor }}
                                                onClick={handleCanvasClick}
                                                onMouseMove={handleMouseMove}
                                                onMouseUp={handleMouseUp}
                                                onMouseLeave={handleMouseUp}
                                            >
                                                {/* Grid */}
                                                {showGrid && (
                                                    <defs>
                                                        <pattern
                                                            id="grid"
                                                            width={floorPlan.gridSize}
                                                            height={floorPlan.gridSize}
                                                            patternUnits="userSpaceOnUse"
                                                        >
                                                            <path
                                                                d={`M ${floorPlan.gridSize} 0 L 0 0 0 ${floorPlan.gridSize}`}
                                                                fill="none"
                                                                stroke="#e2e8f0"
                                                                strokeWidth="0.5"
                                                            />
                                                        </pattern>
                                                    </defs>
                                                )}
                                                {showGrid && (
                                                    <rect width="100%" height="100%" fill="url(#grid)" />
                                                )}

                                                {/* Objects with Individual Seats */}
                                                {floorPlan.objects.map((obj) => {
                                                    const objectSeats = seats.get(obj.id) || []
                                                    const isSelected = selectedObject?.id === obj.id

                                                    if (obj.type === 'STAGE' || obj.type === 'EXIT' || obj.type === 'ENTRY') {
                                                        const colors = {
                                                            STAGE: { fill: obj.fillColor || '#94a3b8', stroke: obj.strokeColor || '#64748b', text: 'MAIN STAGE' },
                                                            EXIT: { fill: '#fee2e2', stroke: '#dc2626', text: 'EXIT' },
                                                            ENTRY: { fill: '#d1fae5', stroke: '#059669', text: 'ENTRY' }
                                                        }
                                                        const config = colors[obj.type as keyof typeof colors]
                                                        
                                                        return (
                                                            <g key={obj.id}
                                                                transform={`translate(${obj.x}, ${obj.y})`}
                                                                onClick={(e) => handleObjectClick(obj, e)}
                                                                onMouseDown={(e) => handleObjectMouseDown(obj, e)}
                                                                style={{ cursor: 'move' }}
                                                            >
                                                                {obj.type === 'STAGE' ? (
                                                                    <path
                                                                        d={`M0,0 L${obj.width},0 L${obj.width * 0.9},${obj.height} L${obj.width * 0.1},${obj.height} Z`}
                                                                        fill={config.fill}
                                                                        stroke={isSelected ? '#3b82f6' : config.stroke}
                                                                        strokeWidth={isSelected ? 3 : 1}
                                                                        opacity={0.5}
                                                                    />
                                                                ) : (
                                                                    <rect
                                                                        width={obj.width}
                                                                        height={obj.height}
                                                                        fill={config.fill}
                                                                        stroke={isSelected ? '#3b82f6' : config.stroke}
                                                                        strokeWidth={isSelected ? 3 : 2}
                                                                        rx={8}
                                                                    />
                                                                )}
                                                                {/* Resize handles */}
                                                                {isSelected && (
                                                                    <>
                                                                        <circle cx={obj.width} cy={obj.height} r="6" fill="#3b82f6" stroke="white" strokeWidth="2" style={{ cursor: 'nwse-resize' }} />
                                                                        <circle cx={obj.width} cy={0} r="6" fill="#3b82f6" stroke="white" strokeWidth="2" style={{ cursor: 'nesw-resize' }} />
                                                                        <circle cx={0} cy={obj.height} r="6" fill="#3b82f6" stroke="white" strokeWidth="2" style={{ cursor: 'nesw-resize' }} />
                                                                    </>
                                                                )}
                                                                <text
                                                                    x={obj.width / 2}
                                                                    y={obj.height / 2}
                                                                    textAnchor="middle"
                                                                    dominantBaseline="middle"
                                                                    fill="#1f2937"
                                                                    fontWeight="bold"
                                                                    fontSize="16"
                                                                    pointerEvents="none"
                                                                >
                                                                    {obj.label || config.text}
                                                                </text>
                                                            </g>
                                                        )
                                                    }

                                                    return (
                                                        <g key={obj.id}>
                                                            {/* Background shape for object */}
                                                            <g
                                                                transform={`translate(${obj.x}, ${obj.y})`}
                                                                onClick={(e) => handleObjectClick(obj, e)}
                                                                onMouseDown={(e) => handleObjectMouseDown(obj, e)}
                                                                style={{ cursor: 'move' }}
                                                            >
                                                                {obj.type === 'ROUND_TABLE' ? (
                                                                    <circle
                                                                        cx={obj.width / 2}
                                                                        cy={obj.height / 2}
                                                                        r={obj.width / 2}
                                                                        fill={obj.fillColor}
                                                                        stroke={isSelected ? '#000' : obj.strokeColor}
                                                                        strokeWidth={isSelected ? 2 : 1}
                                                                        opacity={0.3}
                                                                    />
                                                                ) : (
                                                                    <rect
                                                                        width={obj.width}
                                                                        height={obj.height}
                                                                        fill={obj.fillColor}
                                                                        stroke={isSelected ? '#000' : obj.strokeColor}
                                                                        strokeWidth={isSelected ? 2 : 1}
                                                                        rx={4}
                                                                        opacity={0.2}
                                                                    />
                                                                )}

                                                                {/* Row Labels removed - seat labels now show A1, A2, B1, B2 format directly */}

                                                                <text
                                                                    x={obj.width / 2}
                                                                    y={obj.type === 'ROUND_TABLE' ? obj.height / 2 : 10}
                                                                    textAnchor="middle"
                                                                    dominantBaseline="middle"
                                                                    fill="#666"
                                                                    fontSize="10"
                                                                    fontWeight="bold"
                                                                    pointerEvents="none"
                                                                >
                                                                    {obj.label}
                                                                </text>
                                                            </g>

                                                            {/* Ghost Seats (Gaps) - Only in Edit Mode */}
                                                            {isEditingSeats && isSelected && obj.gaps?.map(gap => {
                                                                const [r, c] = gap.split('-').map(Number)
                                                                const seatSize = 20
                                                                const seatSpacing = 5
                                                                const sx = obj.x + (c * (seatSize + seatSpacing)) + 30
                                                                const sy = obj.y + (r * (seatSize + seatSpacing))
                                                                return (
                                                                    <rect key={gap}
                                                                        x={sx} y={sy} width={seatSize} height={seatSize}
                                                                        fill="white" stroke="#cbd5e1" strokeDasharray="2 2"
                                                                        onClick={(e) => handleSeatToggle(obj, r, c, e)}
                                                                        style={{ cursor: 'pointer' }}
                                                                    />
                                                                )
                                                            })}

                                                            {/* Individual Seats */}
                                                            {objectSeats.map((seat: any) => (
                                                                <g key={seat.id}
                                                                    onClick={(e) => isEditingSeats && isSelected ? handleSeatToggle(obj, seat.rowIndex, seat.colIndex, e) : null}
                                                                    style={{ cursor: isEditingSeats && isSelected ? 'pointer' : 'default' }}
                                                                >
                                                                    {seat.type === 'TABLE_SEAT' ? (
                                                                        <TableSeatIcon
                                                                            x={seat.x} y={seat.y}
                                                                            rotation={seat.rotation}
                                                                            status={seat.status}
                                                                            label={seat.label} size={15}
                                                                        />
                                                                    ) : (
                                                                        <ChairIcon
                                                                            x={seat.x} y={seat.y}
                                                                            rotation={seat.rotation}
                                                                            status={seat.status}
                                                                            label={seat.displayNumber} size={20}
                                                                        />
                                                                    )}
                                                                </g>
                                                            ))}
                                                        </g>
                                                    )
                                                })}
                                            </svg>
                                        </TransformComponent>
                                    </>
                                )}
                            </TransformWrapper>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Sidebar - Properties */}
                <div className="col-span-3 space-y-4">
                    {selectedObject ? (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm">Properties</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div>
                                    <Label className="text-xs">Label</Label>
                                    <Input
                                        value={selectedObject.label || ''}
                                        onChange={(e) => {
                                            const newLabel = e.target.value
                                            setFloorPlan(prev => ({
                                                ...prev,
                                                objects: prev.objects.map(o =>
                                                    o.id === selectedObject.id ? { ...o, label: newLabel } : o
                                                )
                                            }))
                                            setSelectedObject(prev => prev ? { ...prev, label: newLabel } : null)
                                        }}
                                        className="h-8 text-sm"
                                    />
                                </div>
                                {selectedObject.type === 'GRID' && (
                                    <div className="pb-2">
                                        <Button
                                            variant={isEditingSeats ? "default" : "secondary"}
                                            size="sm"
                                            className="w-full"
                                            onClick={() => setIsEditingSeats(!isEditingSeats)}
                                        >
                                            <Edit className="h-4 w-4 mr-2" />
                                            {isEditingSeats ? "Done Editing Layout" : "Edit Seat Layout"}
                                        </Button>
                                    </div>
                                )}
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <Label className="text-xs">X</Label>
                                        <Input
                                            type="number"
                                            value={Math.round(selectedObject.x)}
                                            onChange={(e) => {
                                                const newX = Number(e.target.value)
                                                setFloorPlan(prev => ({
                                                    ...prev,
                                                    objects: prev.objects.map(o =>
                                                        o.id === selectedObject.id ? { ...o, x: newX } : o
                                                    )
                                                }))
                                                setSelectedObject(prev => prev ? { ...prev, x: newX } : null)
                                            }}
                                            className="h-8 text-sm"
                                        />
                                    </div>
                                    <div>
                                        <Label className="text-xs">Y</Label>
                                        <Input
                                            type="number"
                                            value={Math.round(selectedObject.y)}
                                            onChange={(e) => {
                                                const newY = Number(e.target.value)
                                                setFloorPlan(prev => ({
                                                    ...prev,
                                                    objects: prev.objects.map(o =>
                                                        o.id === selectedObject.id ? { ...o, y: newY } : o
                                                    )
                                                }))
                                                setSelectedObject(prev => prev ? { ...prev, y: newY } : null)
                                            }}
                                            className="h-8 text-sm"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <Label className="text-xs">Rotation</Label>
                                    <Input
                                        type="number"
                                        value={selectedObject.rotation}
                                        onChange={(e) => {
                                            const newRotation = Number(e.target.value) % 360
                                            setFloorPlan(prev => ({
                                                ...prev,
                                                objects: prev.objects.map(o =>
                                                    o.id === selectedObject.id ? { ...o, rotation: newRotation } : o
                                                )
                                            }))
                                            setSelectedObject(prev => prev ? { ...prev, rotation: newRotation } : null)
                                        }}
                                        className="h-8 text-sm"
                                    />
                                </div>
                                <div>
                                    <Label className="text-xs">Total Seats</Label>
                                    <div className="text-2xl font-bold">{selectedObject.totalSeats}</div>
                                </div>
                                <div>
                                    <Label className="text-xs">Pricing Tier</Label>
                                    <Badge variant={
                                        selectedObject.pricingTier === 'VIP' ? 'default' :
                                            selectedObject.pricingTier === 'PREMIUM' ? 'secondary' :
                                                'outline'
                                    }>
                                        {selectedObject.pricingTier}
                                    </Badge>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm">No Selection</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">
                                    Click on an object to view and edit its properties
                                </p>
                            </CardContent>
                        </Card>
                    )}

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm">Layers</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-1 max-h-[300px] overflow-y-auto">
                            {floorPlan.objects.map((obj) => (
                                <div
                                    key={obj.id}
                                    className={`p-2 rounded cursor-pointer text-sm ${selectedObject?.id === obj.id ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50'
                                        }`}
                                    onClick={() => setSelectedObject(obj)}
                                >
                                    <div className="font-medium">{obj.label}</div>
                                    <div className="text-xs text-muted-foreground">
                                        {obj.type} • {obj.totalSeats} seats
                                    </div>
                                </div>
                            ))}
                            {floorPlan.objects.length === 0 && (
                                <p className="text-sm text-muted-foreground">No objects yet</p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Add Object Dialog */}
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                <DialogContent aria-describedby={undefined}>
                    <DialogHeader>
                        <DialogTitle>Add Object</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div>
                            <Label>Type</Label>
                            <Select value={newObject.type} onValueChange={(value) => setNewObject(prev => ({ ...prev, type: value }))}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="GRID">Grid Seating</SelectItem>
                                    <SelectItem value="ROUND_TABLE">Round Table</SelectItem>
                                    <SelectItem value="STAGE">Stage</SelectItem>
                                    <SelectItem value="STANDING">Standing Area</SelectItem>
                                    <SelectItem value="EXIT">Exit Gate</SelectItem>
                                    <SelectItem value="ENTRY">Entry Gate</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {newObject.type === 'GRID' && (
                            <>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label>Rows</Label>
                                        <Input
                                            type="number"
                                            value={newObject.rows}
                                            onChange={(e) => setNewObject(prev => ({ ...prev, rows: Number(e.target.value) }))}
                                        />
                                    </div>
                                    <div>
                                        <Label>Columns</Label>
                                        <Input
                                            type="number"
                                            value={newObject.cols}
                                            onChange={(e) => setNewObject(prev => ({ ...prev, cols: Number(e.target.value) }))}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <Label>Style</Label>
                                    <Select value={newObject.subType} onValueChange={(value) => setNewObject(prev => ({ ...prev, subType: value }))}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="RECTANGLE">Rectangle</SelectItem>
                                            <SelectItem value="SQUARE">Square</SelectItem>
                                            <SelectItem value="THEATER">Theater (Curved)</SelectItem>
                                            <SelectItem value="STADIUM">Stadium (Tiered)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </>
                        )}

                        <div>
                            <Label>Pricing Tier</Label>
                            <Select value={newObject.pricingTier} onValueChange={(value) => setNewObject(prev => ({ ...prev, pricingTier: value }))}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="VIP">VIP (₹{floorPlan.vipPrice})</SelectItem>
                                    <SelectItem value="PREMIUM">Premium (₹{floorPlan.premiumPrice})</SelectItem>
                                    <SelectItem value="GENERAL">General (₹{floorPlan.generalPrice})</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label>Gender</Label>
                            <Select value={newObject.gender} onValueChange={(value) => setNewObject(prev => ({ ...prev, gender: value }))}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="MIXED">Mixed</SelectItem>
                                    <SelectItem value="MEN">Men Only</SelectItem>
                                    <SelectItem value="WOMEN">Women Only</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label>Label</Label>
                            <Input
                                value={newObject.label}
                                onChange={(e) => setNewObject(prev => ({ ...prev, label: e.target.value }))}
                                placeholder="e.g., Section A"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
                        <Button onClick={addObject}>Add to Canvas</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* AI Floor Plan Generator Dialog */}
            <Dialog open={showAIDialog} onOpenChange={setShowAIDialog}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" aria-describedby={undefined}>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-purple-600" />
                            AI Floor Plan Generator
                        </DialogTitle>
                    </DialogHeader>
                    <AIFloorPlanGenerator
                        eventId={eventId}
                        onFloorPlanGenerated={handleAIGenerated}
                    />
                </DialogContent>
            </Dialog>
        </div>
    )
}
