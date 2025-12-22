'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch'
import {
    ZoomIn, ZoomOut, Maximize2, RotateCw, Save,
    Plus, Trash2, Move
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { ChairIcon, TableSeatIcon } from '@/components/seats/SeatIcons'

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
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
    const [showAddDialog, setShowAddDialog] = useState(false)
    const [loading, setLoading] = useState(false)
    const [registrations, setRegistrations] = useState<any[]>([])
    const [seats, setSeats] = useState<Map<string, any[]>>(new Map()) // objectId -> seats[]

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

    // Load floor plan and registrations
    useEffect(() => {
        if (eventId) {
            loadFloorPlan()
            loadRegistrations()
        }
    }, [eventId])

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
            const response = await fetch(`/api/events/${eventId}/floor-plan`)
            const data = await response.json()

            if (data.floorPlans && data.floorPlans.length > 0) {
                const plan = data.floorPlans[0]
                setFloorPlan({
                    ...plan,
                    objects: plan.objects || []
                })
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

            const response = await fetch(`/api/events/${eventId}/floor-plan`, {
                method: floorPlan.id ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...floorPlan,
                    layoutData: { objects: floorPlan.objects }
                })
            })

            if (response.ok) {
                const data = await response.json()
                alert('Floor plan saved successfully!')
                if (data.floorPlan) {
                    setFloorPlan(prev => ({ ...prev, id: data.floorPlan.id }))
                }
            } else {
                alert('Failed to save floor plan')
            }
        } catch (error) {
            console.error('Failed to save:', error)
            alert('Failed to save floor plan')
        } finally {
            setLoading(false)
        }
    }

    // Add object to canvas
    const addObject = () => {
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
            label: newObject.label || `${newObject.type} ${floorPlan.objects.length + 1}`,
            isTemporary: true
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

    // Generate individual seats for an object
    const generateSeatsForObject = (obj: FloorPlanObject) => {
        const generatedSeats: any[] = []
        const seatSize = 20
        const seatSpacing = 5

        if (obj.type === 'GRID') {
            // Generate grid seats
            const rows = obj.rows || 10
            const cols = obj.cols || 10

            for (let row = 0; row < rows; row++) {
                for (let col = 0; col < cols; col++) {
                    const seatLabel = `${obj.label?.charAt(0) || 'A'}${row + 1}-${col + 1}`
                    generatedSeats.push({
                        id: `${obj.id}-${row}-${col}`,
                        label: seatLabel,
                        x: obj.x + (col * (seatSize + seatSpacing)),
                        y: obj.y + (row * (seatSize + seatSpacing)),
                        rotation: 0,
                        status: 'AVAILABLE',
                        type: 'CHAIR'
                    })
                }
            }
        } else if (obj.type === 'ROUND_TABLE') {
            // Generate 8 seats around table
            const tableRadius = obj.width / 2
            const seatRadius = 15
            const numSeats = 8

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
        setDragStart({ x: e.clientX - obj.x, y: e.clientY - obj.y })
    }

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isDragging && selectedObject) {
            let newX = e.clientX - dragStart.x
            let newY = e.clientY - dragStart.y

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

    // Calculate analytics
    const calculateAnalytics = () => {
        const total = floorPlan.objects.reduce((sum, obj) => sum + obj.totalSeats, 0)
        const vip = floorPlan.objects.filter(o => o.pricingTier === 'VIP').reduce((sum, obj) => sum + obj.totalSeats, 0)
        const premium = floorPlan.objects.filter(o => o.pricingTier === 'PREMIUM').reduce((sum, obj) => sum + obj.totalSeats, 0)
        const general = floorPlan.objects.filter(o => o.pricingTier === 'GENERAL').reduce((sum, obj) => sum + obj.totalSeats, 0)

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
            vip: vip * floorPlan.vipPrice,
            premium: premium * floorPlan.premiumPrice,
            general: general * floorPlan.generalPrice,
            total: (vip * floorPlan.vipPrice) + (premium * floorPlan.premiumPrice) + (general * floorPlan.generalPrice)
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
                    <p className="text-sm text-muted-foreground">Event ID: {eventId}</p>
                </div>
                <Button onClick={saveFloorPlan} disabled={loading}>
                    <Save className="h-4 w-4 mr-2" />
                    {loading ? 'Saving...' : 'Save Layout'}
                </Button>
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

                                                    return (
                                                        <g key={obj.id}>
                                                            {/* Background shape for object (lighter, for context) */}
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
                                                                        stroke={selectedObject?.id === obj.id ? '#000' : obj.strokeColor}
                                                                        strokeWidth={selectedObject?.id === obj.id ? 3 : 1}
                                                                        opacity={0.3}
                                                                    />
                                                                ) : (
                                                                    <rect
                                                                        width={obj.width}
                                                                        height={obj.height}
                                                                        fill={obj.fillColor}
                                                                        stroke={selectedObject?.id === obj.id ? '#000' : obj.strokeColor}
                                                                        strokeWidth={selectedObject?.id === obj.id ? 3 : 1}
                                                                        rx={4}
                                                                        opacity={0.2}
                                                                    />
                                                                )}

                                                                {/* Section Label */}
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

                                                            {/* Individual Seats */}
                                                            {objectSeats.map((seat: any) => (
                                                                seat.type === 'TABLE_SEAT' ? (
                                                                    <TableSeatIcon
                                                                        key={seat.id}
                                                                        x={seat.x}
                                                                        y={seat.y}
                                                                        rotation={seat.rotation}
                                                                        status={seat.status}
                                                                        label={seat.label}
                                                                        size={15}
                                                                    />
                                                                ) : (
                                                                    <ChairIcon
                                                                        key={seat.id}
                                                                        x={seat.x}
                                                                        y={seat.y}
                                                                        rotation={seat.rotation}
                                                                        status={seat.status}
                                                                        label={seat.label}
                                                                        size={20}
                                                                    />
                                                                )
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
                <DialogContent>
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
        </div>
    )
}
