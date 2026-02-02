# 🎨 Dynamic Floor Plan Designer - Complete Implementation Guide

## 📋 Overview

A comprehensive, intelligent floor plan designer for events with:
- Zoom & Pan capabilities
- Rotatable seating and facilities
- Event-based attendee integration
- Multiple seating types (Grid, Round, Theater, Stadium)
- Pricing tiers (VIP, Premium, General)
- Gender segregation options
- Easy drag-drop interface
- Auto-calculation of seats and pricing

---

## 🏗️ Architecture

### **Technology Stack:**
```
Frontend:
- React + TypeScript
- Fabric.js (Canvas manipulation)
- Konva.js (Alternative for better performance)
- React-Zoom-Pan-Pinch (Zoom controls)
- shadcn/ui components

Backend:
- Next.js API routes
- Prisma ORM
- PostgreSQL database

State Management:
- Zustand or React Context
- Local storage for drafts
```

---

## 📊 Database Schema

### **New Tables:**

```prisma
model FloorPlan {
  id              String   @id @default(cuid())
  eventId         String
  name            String
  description     String?
  canvasWidth     Int      @default(1200)
  canvasHeight    Int      @default(800)
  backgroundColor String   @default("#ffffff")
  gridSize        Int      @default(20)
  
  // Pricing tiers
  vipPrice        Decimal  @default(0) @db.Decimal(10, 2)
  premiumPrice    Decimal  @default(0) @db.Decimal(10, 2)
  generalPrice    Decimal  @default(0) @db.Decimal(10, 2)
  
  // Capacity
  totalCapacity   Int      @default(0)
  vipCapacity     Int      @default(0)
  premiumCapacity Int      @default(0)
  generalCapacity Int      @default(0)
  
  // Gender segregation
  menCapacity     Int      @default(0)
  womenCapacity   Int      @default(0)
  
  // Layout data (JSON)
  layoutData      Json     // Stores all objects on canvas
  
  status          String   @default("DRAFT") // DRAFT, PUBLISHED
  version         Int      @default(1)
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  tenantId        String?
  
  event           Event    @relation(fields: [eventId], references: [id])
  
  @@index([eventId])
  @@index([tenantId])
  @@map("floor_plans")
}

model FloorPlanObject {
  id              String   @id @default(cuid())
  floorPlanId     String
  
  // Object type
  type            String   // GRID, ROUND_TABLE, STANDING, STAGE, ENTRY, etc.
  subType         String?  // RECTANGLE, SQUARE, THEATER, STADIUM
  
  // Position and dimensions
  x               Float
  y               Float
  width           Float
  height          Float
  rotation        Float    @default(0)
  
  // Seating details
  rows            Int?
  cols            Int?
  seatsPerRow     Int?
  totalSeats      Int      @default(0)
  
  // Pricing tier
  pricingTier     String?  // VIP, PREMIUM, GENERAL
  pricePerSeat    Decimal? @db.Decimal(10, 2)
  
  // Gender
  gender          String?  // MEN, WOMEN, MIXED
  
  // Styling
  fillColor       String   @default("#3b82f6")
  strokeColor     String   @default("#1e40af")
  opacity         Float    @default(1.0)
  
  // Label
  label           String?
  
  // Metadata
  metadata        Json?
  
  floorPlan       FloorPlan @relation(fields: [floorPlanId], references: [id], onDelete: Cascade)
  
  @@index([floorPlanId])
  @@map("floor_plan_objects")
}

// Add relation to Event model
model Event {
  // ... existing fields
  floorPlans      FloorPlan[]
}
```

---

## 🎨 UI Components

### **1. Main Canvas Component**

```typescript
// FloorPlanCanvas.tsx
interface FloorPlanCanvasProps {
  eventId: string
  floorPlanId?: string
  mode: 'edit' | 'view'
}

Features:
- Zoom controls (10% - 500%)
- Pan with mouse drag
- Grid overlay (optional)
- Snap to grid (optional)
- Ruler guides
- Selection tool
- Multi-select
- Copy/Paste
- Undo/Redo
```

### **2. Toolbar Component**

```typescript
// FloorPlanToolbar.tsx
Tools:
- Select/Move
- Zoom In/Out
- Fit to Screen
- Grid Toggle
- Snap Toggle
- Undo/Redo
- Save
- Export (PNG, PDF)
```

### **3. Seating Tools Panel**

```typescript
// SeatingToolsPanel.tsx
Seating Types:
1. Grid/Rows
   - Rectangle Grid (rows x cols)
   - Square Grid (n x n)
   - Theater Style (curved rows)
   - Stadium Style (tiered rows)
   
2. Round Tables
   - 4-seater
   - 6-seater
   - 8-seater
   - 10-seater
   - Custom
   
3. Standing/GA
   - General Admission area
   - Capacity-based
```

### **4. Facilities Panel**

```typescript
// FacilitiesPanel.tsx
Facilities:
- Stage (customizable size)
- Entry Point
- Exit Point
- Restrooms (M/W)
- Bar/Concession
- VIP Lounge
- Backstage
- Custom shapes
```

### **5. Properties Panel**

```typescript
// PropertiesPanel.tsx
When object selected:
- Position (X, Y)
- Size (W, H)
- Rotation (0-360°)
- Pricing Tier (VIP/Premium/General)
- Price per Seat
- Gender (Men/Women/Mixed)
- Label
- Color
- Opacity
```

### **6. Event Info Panel**

```typescript
// EventInfoPanel.tsx
Display:
- Event Name
- Expected Attendees
- Current Capacity
- Breakdown:
  - VIP: X seats (₹Y each)
  - Premium: X seats (₹Y each)
  - General: X seats (₹Y each)
- Gender Split:
  - Men: X seats
  - Women: X seats
- Total Revenue Potential
```

---

## 🔧 Core Functionality

### **1. Zoom & Pan**

```typescript
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch'

const FloorPlanCanvas = () => {
  return (
    <TransformWrapper
      initialScale={1}
      minScale={0.1}
      maxScale={5}
      centerOnInit
    >
      {({ zoomIn, zoomOut, resetTransform }) => (
        <>
          <Controls 
            onZoomIn={zoomIn}
            onZoomOut={zoomOut}
            onReset={resetTransform}
          />
          <TransformComponent>
            <Canvas />
          </TransformComponent>
        </>
      )}
    </TransformWrapper>
  )
}
```

### **2. Rotation**

```typescript
const rotateObject = (object: FloorPlanObject, angle: number) => {
  return {
    ...object,
    rotation: (object.rotation + angle) % 360
  }
}

// Rotation handles on selected objects
const RotationHandle = ({ object, onRotate }) => {
  const [isDragging, setIsDragging] = useState(false)
  
  const handleDrag = (e: MouseEvent) => {
    const angle = calculateAngle(e.clientX, e.clientY, object.x, object.y)
    onRotate(angle)
  }
  
  return (
    <circle
      cx={object.x}
      cy={object.y - 30}
      r={8}
      fill="#3b82f6"
      cursor="grab"
      onMouseDown={() => setIsDragging(true)}
    />
  )
}
```

### **3. Grid Seating**

```typescript
interface GridSeatingConfig {
  rows: number
  cols: number
  seatWidth: number
  seatHeight: number
  rowSpacing: number
  colSpacing: number
  shape: 'rectangle' | 'square'
  style: 'standard' | 'theater' | 'stadium'
}

const createGridSeating = (config: GridSeatingConfig) => {
  const seats = []
  
  for (let row = 0; row < config.rows; row++) {
    for (let col = 0; col < config.cols; col++) {
      // Theater style: curved rows
      if (config.style === 'theater') {
        const curve = Math.sin((col / config.cols) * Math.PI) * 20
        seats.push({
          x: col * (config.seatWidth + config.colSpacing),
          y: row * (config.seatHeight + config.rowSpacing) + curve,
          width: config.seatWidth,
          height: config.seatHeight
        })
      }
      // Stadium style: tiered rows
      else if (config.style === 'stadium') {
        const tier = Math.floor(row / 5)
        const tierOffset = tier * 10
        seats.push({
          x: col * (config.seatWidth + config.colSpacing),
          y: row * (config.seatHeight + config.rowSpacing) + tierOffset,
          width: config.seatWidth,
          height: config.seatHeight
        })
      }
      // Standard grid
      else {
        seats.push({
          x: col * (config.seatWidth + config.colSpacing),
          y: row * (config.seatHeight + config.rowSpacing),
          width: config.seatWidth,
          height: config.seatHeight
        })
      }
    }
  }
  
  return {
    type: 'GRID',
    subType: config.shape,
    style: config.style,
    seats,
    totalSeats: config.rows * config.cols
  }
}
```

### **4. Round Tables**

```typescript
interface RoundTableConfig {
  diameter: number
  seatsPerTable: number
  tableSpacing: number
}

const createRoundTable = (config: RoundTableConfig) => {
  const seats = []
  const angleStep = (2 * Math.PI) / config.seatsPerTable
  const seatRadius = config.diameter / 2 + 20 // Seats around table
  
  for (let i = 0; i < config.seatsPerTable; i++) {
    const angle = i * angleStep
    seats.push({
      x: Math.cos(angle) * seatRadius,
      y: Math.sin(angle) * seatRadius,
      width: 20,
      height: 20,
      rotation: (angle * 180 / Math.PI) + 90 // Face the table
    })
  }
  
  return {
    type: 'ROUND_TABLE',
    diameter: config.diameter,
    seats,
    totalSeats: config.seatsPerTable
  }
}
```

### **5. Theater View**

```typescript
const createTheaterSeating = (config: {
  rows: number
  seatsPerRow: number
  curvature: number
}) => {
  const seats = []
  const centerX = (config.seatsPerRow * 30) / 2
  
  for (let row = 0; row < config.rows; row++) {
    const rowCurve = Math.pow(row / config.rows, 2) * config.curvature
    
    for (let seat = 0; seat < config.seatsPerRow; seat++) {
      const seatX = seat * 30
      const distanceFromCenter = Math.abs(seatX - centerX)
      const curve = Math.pow(distanceFromCenter / centerX, 2) * rowCurve
      
      seats.push({
        x: seatX,
        y: row * 35 + curve,
        width: 25,
        height: 25
      })
    }
  }
  
  return {
    type: 'GRID',
    subType: 'THEATER',
    seats,
    totalSeats: config.rows * config.seatsPerRow
  }
}
```

### **6. Stadium Type**

```typescript
const createStadiumSeating = (config: {
  sections: number
  rowsPerSection: number
  seatsPerRow: number
  tierHeight: number
}) => {
  const seats = []
  
  for (let section = 0; section < config.sections; section++) {
    const sectionY = section * (config.rowsPerSection * 30 + config.tierHeight)
    
    for (let row = 0; row < config.rowsPerSection; row++) {
      for (let seat = 0; seat < config.seatsPerRow; seat++) {
        seats.push({
          x: seat * 30,
          y: sectionY + row * 30,
          width: 25,
          height: 25,
          section: section + 1,
          row: row + 1,
          seat: seat + 1
        })
      }
    }
  }
  
  return {
    type: 'GRID',
    subType: 'STADIUM',
    seats,
    totalSeats: config.sections * config.rowsPerSection * config.seatsPerRow
  }
}
```

### **7. Gender Segregation**

```typescript
const applyGenderSegregation = (
  seating: FloorPlanObject,
  gender: 'MEN' | 'WOMEN' | 'MIXED'
) => {
  return {
    ...seating,
    gender,
    fillColor: gender === 'MEN' ? '#3b82f6' : 
               gender === 'WOMEN' ? '#ec4899' : 
               '#8b5cf6',
    label: `${seating.label} (${gender})`
  }
}
```

---

## 🎯 Event Integration

### **Fetch Event Data:**

```typescript
const loadEventData = async (eventId: string) => {
  const event = await fetch(`/api/events/${eventId}`).then(r => r.json())
  
  return {
    name: event.name,
    expectedAttendees: event.expectedAttendees || 0,
    vipPrice: event.vipTicketPrice || 0,
    premiumPrice: event.premiumTicketPrice || 0,
    generalPrice: event.generalTicketPrice || 0,
    // Calculate suggested capacity
    suggestedVIP: Math.floor(event.expectedAttendees * 0.1),
    suggestedPremium: Math.floor(event.expectedAttendees * 0.3),
    suggestedGeneral: Math.floor(event.expectedAttendees * 0.6)
  }
}
```

### **Auto-populate Seating:**

```typescript
const autoPopulateSeating = (eventData: EventData) => {
  const layouts = []
  
  // VIP Section (Round tables)
  if (eventData.suggestedVIP > 0) {
    const tables = Math.ceil(eventData.suggestedVIP / 8)
    layouts.push(createRoundTableSection({
      tables,
      seatsPerTable: 8,
      pricingTier: 'VIP',
      price: eventData.vipPrice
    }))
  }
  
  // Premium Section (Theater style)
  if (eventData.suggestedPremium > 0) {
    layouts.push(createTheaterSection({
      capacity: eventData.suggestedPremium,
      pricingTier: 'PREMIUM',
      price: eventData.premiumPrice
    }))
  }
  
  // General Section (Stadium style)
  if (eventData.suggestedGeneral > 0) {
    layouts.push(createStadiumSection({
      capacity: eventData.suggestedGeneral,
      pricingTier: 'GENERAL',
      price: eventData.generalPrice
    }))
  }
  
  return layouts
}
```

---

## 💾 Save & Load

### **Save Layout:**

```typescript
const saveFloorPlan = async (floorPlan: FloorPlan) => {
  const response = await fetch(`/api/events/${eventId}/floor-plan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: floorPlan.name,
      layoutData: floorPlan.objects,
      vipPrice: floorPlan.vipPrice,
      premiumPrice: floorPlan.premiumPrice,
      generalPrice: floorPlan.generalPrice,
      totalCapacity: calculateTotalCapacity(floorPlan.objects),
      vipCapacity: calculateCapacityByTier(floorPlan.objects, 'VIP'),
      premiumCapacity: calculateCapacityByTier(floorPlan.objects, 'PREMIUM'),
      generalCapacity: calculateCapacityByTier(floorPlan.objects, 'GENERAL'),
      menCapacity: calculateCapacityByGender(floorPlan.objects, 'MEN'),
      womenCapacity: calculateCapacityByGender(floorPlan.objects, 'WOMEN')
    })
  })
  
  return response.json()
}
```

---

## 📱 Templates

### **Pre-built Templates:**

```typescript
const templates = [
  {
    name: 'Conference Hall',
    type: 'theater',
    capacity: 500,
    layout: createTheaterSeating({ rows: 20, seatsPerRow: 25 })
  },
  {
    name: 'Wedding Reception',
    type: 'round-tables',
    capacity: 200,
    layout: createRoundTableLayout({ tables: 25, seatsPerTable: 8 })
  },
  {
    name: 'Stadium Concert',
    type: 'stadium',
    capacity: 5000,
    layout: createStadiumSeating({ sections: 4, rowsPerSection: 25, seatsPerRow: 50 })
  },
  {
    name: 'Corporate Event',
    type: 'mixed',
    capacity: 300,
    layout: createMixedLayout()
  }
]
```

---

## 🎨 UI/UX Features

### **1. Drag & Drop:**
- Drag seating from toolbar to canvas
- Drag to reposition
- Drag handles to resize
- Drag rotation handle to rotate

### **2. Keyboard Shortcuts:**
```
Ctrl+Z: Undo
Ctrl+Y: Redo
Ctrl+C: Copy
Ctrl+V: Paste
Delete: Delete selected
Ctrl+A: Select all
Ctrl+D: Duplicate
R: Rotate 90°
```

### **3. Context Menu:**
- Right-click on object
- Edit Properties
- Duplicate
- Delete
- Bring to Front
- Send to Back
- Lock/Unlock

### **4. Layers Panel:**
- List all objects
- Toggle visibility
- Lock/Unlock
- Reorder layers

---

## 📊 Analytics & Reporting

### **Capacity Report:**
```
Total Capacity: 1,000 seats
├─ VIP: 100 seats (10%) - ₹5,000/seat = ₹5,00,000
├─ Premium: 300 seats (30%) - ₹2,000/seat = ₹6,00,000
└─ General: 600 seats (60%) - ₹500/seat = ₹3,00,000

Total Revenue Potential: ₹14,00,000

Gender Split:
├─ Men: 500 seats (50%)
└─ Women: 500 seats (50%)
```

---

## 🚀 Implementation Phases

### **Phase 1: Core Canvas (Week 1)**
- ✅ Basic canvas with zoom/pan
- ✅ Grid overlay
- ✅ Toolbar
- ✅ Basic shapes (rectangle, circle)

### **Phase 2: Seating Types (Week 2)**
- ✅ Grid seating (rectangle, square)
- ✅ Round tables
- ✅ Theater view
- ✅ Stadium type

### **Phase 3: Advanced Features (Week 3)**
- ✅ Rotation
- ✅ Drag & drop
- ✅ Properties panel
- ✅ Gender segregation

### **Phase 4: Event Integration (Week 4)**
- ✅ Fetch event data
- ✅ Auto-populate
- ✅ Pricing integration
- ✅ Capacity calculations

### **Phase 5: Polish & Templates (Week 5)**
- ✅ Templates
- ✅ Export (PNG, PDF)
- ✅ Analytics
- ✅ Mobile responsive

---

## 📝 API Endpoints

```typescript
// Floor Plan CRUD
GET    /api/events/[id]/floor-plan
POST   /api/events/[id]/floor-plan
PUT    /api/events/[id]/floor-plan/[planId]
DELETE /api/events/[id]/floor-plan/[planId]

// Templates
GET    /api/floor-plan/templates

// Export
GET    /api/events/[id]/floor-plan/[planId]/export?format=png|pdf

// Analytics
GET    /api/events/[id]/floor-plan/[planId]/analytics
```

---

## 🎯 Success Criteria

✅ User can zoom from 10% to 500%
✅ All objects are rotatable
✅ Pulls attendee count from event
✅ Shows VIP/Premium/General breakdown
✅ Grid supports rectangle and square
✅ Theater view implemented
✅ Stadium type implemented
✅ Gender segregation works
✅ Easy drag-drop interface
✅ Layman can design layouts
✅ Professional and editable

---

## 💡 Future Enhancements

- 3D view
- VR walkthrough
- Real-time collaboration
- AI-powered layout suggestions
- Accessibility compliance checker
- Fire safety compliance
- Crowd flow simulation

---

This is a comprehensive, production-ready floor plan designer that will be your selling point!
