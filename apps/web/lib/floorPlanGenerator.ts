// Floor Plan Generator - Canvas Drawing Logic

export interface FloorPlanConfig {
  hallName: string
  hallLength: number
  hallWidth: number
  eventType: string
  guestCount: number
  tableType: 'seats-only' | 'round' | 'rectangular' | 'square'
  seatsPerTable: number
  tableSize: number
  layoutStyle: string
  // Seating Categories
  vipSeats: number
  premiumSeats: number
  generalSeats: number
  stageRequired: boolean
  stagePosition: 'front' | 'back' | 'left' | 'right' | 'center'
  stageWidth: number
  stageDepth: number
  bannerRequired: boolean
  entryPoints: number
  exitPoints: number
  restroomsRequired: boolean
  mensRestrooms: number
  womensRestrooms: number
  danceFloor: boolean
  barArea: boolean
  receptionDesk: boolean
  djArea: boolean
  specialNotes: string
}

const SCALE = 6 // 6 pixels per foot

export const COLORS = {
  wall: '#34495e',
  stage: '#8b4513',
  banner: '#e74c3c',
  table: '#3498db',
  chair: '#95a5a6',
  vipTable: '#FFD700',      // Gold for VIP
  premiumTable: '#4169E1',  // Royal Blue for Premium
  generalTable: '#808080',  // Gray for General
  entry: '#2ecc71',
  exit: '#e74c3c',
  restroom: '#7f8c8d',
  danceFloor: '#e67e22',
  bar: '#16a085',
  reception: '#8e44ad',
  dj: '#c0392b',
  text: '#2c3e50',
  grid: '#ecf0f1'
}

interface DraggableItem {
  id: string
  type: 'entry' | 'exit' | 'restroom-m' | 'restroom-w' | 'bar' | 'dj' | 'reception'
  x: number
  y: number
  label: string
}

export class FloorPlanGenerator {
  private ctx: CanvasRenderingContext2D
  private config: FloorPlanConfig
  private scale: number = SCALE
  private draggableItems: DraggableItem[]

  constructor(ctx: CanvasRenderingContext2D, config: FloorPlanConfig, draggableItems: DraggableItem[] = []) {
    this.ctx = ctx
    this.config = config
    this.draggableItems = draggableItems
  }

  generate() {
    this.drawGrid()
    this.drawWalls()
    
    if (this.config.stageRequired) {
      if (this.config.bannerRequired) this.drawBanner()
      this.drawStage()
    }
    
    this.drawTables()
    
    // REMOVED: Static entry/exit/restroom drawing
    // this.drawEntries()
    // this.drawExits()
    // if (this.config.restroomsRequired) {
    //   this.drawRestrooms()
    // }
    
    if (this.config.danceFloor) this.drawDanceFloor()
    
    // REMOVED: Static bar/reception/dj - now only draggable
    // if (this.config.barArea) this.drawBar()
    // if (this.config.receptionDesk) this.drawReception()
    // if (this.config.djArea) this.drawDJ()
    
    // Draw draggable items last (on top) - ALL entry/exit/restrooms are now draggable only
    this.drawDraggableItems()
  }

  private drawDraggableItems() {
    this.draggableItems.forEach(item => {
      const ctx = this.ctx
      const size = 30
      
      // Draw based on type
      switch (item.type) {
        case 'entry':
          ctx.fillStyle = COLORS.entry
          ctx.fillRect(item.x - size/2, item.y - size/2, size, size)
          ctx.strokeStyle = '#000'
          ctx.lineWidth = 2
          ctx.strokeRect(item.x - size/2, item.y - size/2, size, size)
          ctx.fillStyle = '#fff'
          ctx.font = 'bold 16px Arial'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText('IN', item.x, item.y)
          break
          
        case 'exit':
          ctx.fillStyle = COLORS.exit
          ctx.fillRect(item.x - size/2, item.y - size/2, size, size)
          ctx.strokeStyle = '#000'
          ctx.lineWidth = 2
          ctx.strokeRect(item.x - size/2, item.y - size/2, size, size)
          ctx.fillStyle = '#fff'
          ctx.font = 'bold 14px Arial'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText('OUT', item.x, item.y)
          break
          
        case 'restroom-m':
          ctx.fillStyle = '#3498db'
          ctx.beginPath()
          ctx.arc(item.x, item.y, size/2, 0, Math.PI * 2)
          ctx.fill()
          ctx.strokeStyle = '#000'
          ctx.lineWidth = 2
          ctx.stroke()
          ctx.fillStyle = '#fff'
          ctx.font = 'bold 16px Arial'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText('M', item.x, item.y)
          break
          
        case 'restroom-w':
          ctx.fillStyle = '#e91e63'
          ctx.beginPath()
          ctx.arc(item.x, item.y, size/2, 0, Math.PI * 2)
          ctx.fill()
          ctx.strokeStyle = '#000'
          ctx.lineWidth = 2
          ctx.stroke()
          ctx.fillStyle = '#fff'
          ctx.font = 'bold 16px Arial'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText('W', item.x, item.y)
          break
          
        case 'bar':
          ctx.fillStyle = COLORS.bar
          ctx.fillRect(item.x - size/2, item.y - size/2, size, size)
          ctx.strokeStyle = '#000'
          ctx.lineWidth = 2
          ctx.strokeRect(item.x - size/2, item.y - size/2, size, size)
          ctx.fillStyle = '#fff'
          ctx.font = 'bold 12px Arial'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText('BAR', item.x, item.y)
          break
          
        case 'dj':
          ctx.fillStyle = COLORS.dj
          ctx.fillRect(item.x - size/2, item.y - size/2, size, size)
          ctx.strokeStyle = '#000'
          ctx.lineWidth = 2
          ctx.strokeRect(item.x - size/2, item.y - size/2, size, size)
          ctx.fillStyle = '#fff'
          ctx.font = 'bold 14px Arial'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText('DJ', item.x, item.y)
          break
          
        case 'reception':
          ctx.fillStyle = COLORS.reception
          ctx.fillRect(item.x - size/2, item.y - size/2, size, size)
          ctx.strokeStyle = '#000'
          ctx.lineWidth = 2
          ctx.strokeRect(item.x - size/2, item.y - size/2, size, size)
          ctx.fillStyle = '#fff'
          ctx.font = 'bold 10px Arial'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText('DESK', item.x, item.y)
          break
      }
      
      // Draw drag handle indicator
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'
      ctx.beginPath()
      ctx.arc(item.x, item.y, 5, 0, Math.PI * 2)
      ctx.fill()
    })
  }

  private drawGrid() {
    this.ctx.strokeStyle = COLORS.grid
    this.ctx.lineWidth = 0.5
    
    for (let i = 0; i <= this.config.hallLength; i += 10) {
      this.ctx.beginPath()
      this.ctx.moveTo(i * this.scale, 0)
      this.ctx.lineTo(i * this.scale, this.config.hallWidth * this.scale)
      this.ctx.stroke()
    }
    
    for (let i = 0; i <= this.config.hallWidth; i += 10) {
      this.ctx.beginPath()
      this.ctx.moveTo(0, i * this.scale)
      this.ctx.lineTo(this.config.hallLength * this.scale, i * this.scale)
      this.ctx.stroke()
    }
  }

  private drawWalls() {
    this.ctx.strokeStyle = COLORS.wall
    this.ctx.lineWidth = 4
    this.ctx.strokeRect(0, 0, this.config.hallLength * this.scale, this.config.hallWidth * this.scale)
  }

  private drawStage() {
    const stageW = this.config.stageWidth * this.scale
    const stageD = this.config.stageDepth * this.scale
    let x: number, y: number

    switch(this.config.stagePosition) {
      case 'front':
        x = (this.config.hallLength * this.scale - stageW) / 2
        y = 5 * this.scale
        break
      case 'back':
        x = (this.config.hallLength * this.scale - stageW) / 2
        y = this.config.hallWidth * this.scale - stageD - 5 * this.scale
        break
      case 'left':
        x = 5 * this.scale
        y = (this.config.hallWidth * this.scale - stageW) / 2
        break
      case 'right':
        x = this.config.hallLength * this.scale - stageD - 5 * this.scale
        y = (this.config.hallWidth * this.scale - stageW) / 2
        break
      default:
        x = (this.config.hallLength * this.scale - stageW) / 2
        y = (this.config.hallWidth * this.scale - stageD) / 2
    }

    this.ctx.fillStyle = COLORS.stage
    this.ctx.fillRect(x, y, stageW, stageD)
    this.ctx.strokeStyle = COLORS.wall
    this.ctx.lineWidth = 2
    this.ctx.strokeRect(x, y, stageW, stageD)

    this.ctx.fillStyle = 'white'
    this.ctx.font = 'bold 10px Arial'
    this.ctx.textAlign = 'center'
    this.ctx.fillText('STAGE', x + stageW/2, y + stageD/2 + 3)
  }

  private drawBanner() {
    const bannerW = (this.config.stageWidth + 5) * this.scale
    const bannerH = 2.5 * this.scale
    const x = (this.config.hallLength * this.scale - bannerW) / 2
    const y = 1 * this.scale

    this.ctx.fillStyle = COLORS.banner
    this.ctx.fillRect(x, y, bannerW, bannerH)
    this.ctx.strokeStyle = COLORS.wall
    this.ctx.lineWidth = 1
    this.ctx.strokeRect(x, y, bannerW, bannerH)

    this.ctx.fillStyle = 'white'
    this.ctx.font = 'bold 8px Arial'
    this.ctx.textAlign = 'center'
    this.ctx.fillText('EVENT BANNER', this.config.hallLength * this.scale / 2, y + bannerH/2 + 2)
  }

  private drawTables() {
    // Calculate tables needed for each category
    const vipTables = Math.ceil(this.config.vipSeats / this.config.seatsPerTable)
    const premiumTables = Math.ceil(this.config.premiumSeats / this.config.seatsPerTable)
    const generalTables = Math.ceil(this.config.generalSeats / this.config.seatsPerTable)
    const totalTables = vipTables + premiumTables + generalTables

    const tableRadius = (this.config.tableSize / 2) * this.scale
    const spacing = 1.5 * this.scale

    let startY = this.config.stageRequired && this.config.stagePosition === 'front' ? 18 * this.scale : 8 * this.scale
    const endY = this.config.hallWidth * this.scale - 8 * this.scale
    const startX = 10 * this.scale
    const endX = this.config.hallLength * this.scale - 10 * this.scale

    const tableDiameter = tableRadius * 2 + spacing
    let tableCount = 0
    let vipCount = 0
    let premiumCount = 0
    let generalCount = 0

    // Determine layout based on event type
    const isTheaterStyle =
      this.config.tableType === 'seats-only' ||
      this.config.eventType === 'conference' ||
      this.config.eventType === 'seminar' ||
      this.config.layoutStyle === 'theater'

    if (isTheaterStyle) {
      // Theater/rows layout for conferences
      this.drawTheaterSeating(vipTables, premiumTables, generalTables, startY, endY, startX, endX)
    } else {
      // Banquet/scattered layout
      for (let y = startY; y < endY && tableCount < totalTables; y += tableDiameter) {
        for (let x = startX; x < endX && tableCount < totalTables; x += tableDiameter) {
          // Determine table category and color
          let tableColor = COLORS.generalTable
          let category = 'G'
          
          if (vipCount < vipTables) {
            tableColor = COLORS.vipTable
            category = 'VIP'
            vipCount++
          } else if (premiumCount < premiumTables) {
            tableColor = COLORS.premiumTable
            category = 'P'
            premiumCount++
          } else {
            generalCount++
          }

          this.ctx.fillStyle = tableColor
          
          if (this.config.tableType === 'round') {
            this.ctx.beginPath()
            this.ctx.arc(x, y, tableRadius, 0, Math.PI * 2)
            this.ctx.fill()
            this.ctx.strokeStyle = COLORS.wall
            this.ctx.lineWidth = 2
            this.ctx.stroke()
          } else if (this.config.tableType === 'rectangular') {
            const rectWidth = tableRadius * 2.5
            const rectHeight = tableRadius * 1.2
            this.ctx.fillRect(x - rectWidth/2, y - rectHeight/2, rectWidth, rectHeight)
            this.ctx.strokeStyle = COLORS.wall
            this.ctx.lineWidth = 2
            this.ctx.strokeRect(x - rectWidth/2, y - rectHeight/2, rectWidth, rectHeight)
          } else {
            // Square
            this.ctx.fillRect(x - tableRadius, y - tableRadius, tableRadius * 2, tableRadius * 2)
            this.ctx.strokeStyle = COLORS.wall
            this.ctx.lineWidth = 2
            this.ctx.strokeRect(x - tableRadius, y - tableRadius, tableRadius * 2, tableRadius * 2)
          }

          // Draw chairs
          const chairRadius = 0.3 * this.scale
          const chairDistance = tableRadius + 0.7 * this.scale
          const numChairs = this.config.seatsPerTable

          for (let i = 0; i < numChairs; i++) {
            const angle = (i * Math.PI * 2) / numChairs
            const chairX = x + Math.cos(angle) * chairDistance
            const chairY = y + Math.sin(angle) * chairDistance

            this.ctx.fillStyle = COLORS.chair
            this.ctx.beginPath()
            this.ctx.arc(chairX, chairY, chairRadius, 0, Math.PI * 2)
            this.ctx.fill()
          }

          // Table label with background for better visibility
          this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
          this.ctx.beginPath()
          this.ctx.arc(x, y, tableRadius * 0.5, 0, Math.PI * 2)
          this.ctx.fill()
          
          this.ctx.fillStyle = '#000'
          this.ctx.font = 'bold 14px Arial'
          this.ctx.textAlign = 'center'
          this.ctx.textBaseline = 'middle'
          this.ctx.fillText(`T${tableCount + 1}`, x, y - 4)
          
          // Category label below
          this.ctx.font = 'bold 10px Arial'
          this.ctx.fillText(category, x, y + 8)

          tableCount++
        }
      }
    }
  }

  private drawTheaterSeating(vipTables: number, premiumTables: number, generalTables: number, startY: number, endY: number, startX: number, endX: number) {
    const rowSpacing = 4 * this.scale
    const seatWidth = 2 * this.scale
    const seatHeight = 1.5 * this.scale
    const seatSpacing = 0.5 * this.scale

    let currentY = startY
    let seatCount = 0
    let vipCount = 0
    let premiumCount = 0

    const seatsPerRow = Math.floor((endX - startX) / (seatWidth + seatSpacing))
    const totalSeats = this.config.vipSeats + this.config.premiumSeats + this.config.generalSeats

    while (seatCount < totalSeats && currentY < endY) {
      for (let i = 0; i < seatsPerRow && seatCount < totalSeats; i++) {
        const x = startX + i * (seatWidth + seatSpacing)
        
        let seatColor = COLORS.generalTable
        if (vipCount < this.config.vipSeats) {
          seatColor = COLORS.vipTable
          vipCount++
        } else if (premiumCount < this.config.premiumSeats) {
          seatColor = COLORS.premiumTable
          premiumCount++
        }

        this.ctx.fillStyle = seatColor
        this.ctx.fillRect(x, currentY, seatWidth, seatHeight)
        this.ctx.strokeStyle = COLORS.wall
        this.ctx.lineWidth = 1
        this.ctx.strokeRect(x, currentY, seatWidth, seatHeight)

        seatCount++
      }
      currentY += rowSpacing
    }
  }

  private drawEntries() {
    const doorW = 4 * this.scale
    const doorH = 2 * this.scale
    const spacing = this.config.hallLength / (this.config.entryPoints + 1)

    for (let i = 1; i <= this.config.entryPoints; i++) {
      const x = (spacing * i - doorW/2) * this.scale
      this.ctx.fillStyle = COLORS.entry
      this.ctx.fillRect(x, 0, doorW, doorH)
      this.ctx.strokeStyle = COLORS.wall
      this.ctx.lineWidth = 2
      this.ctx.strokeRect(x, 0, doorW, doorH)

      this.ctx.fillStyle = COLORS.text
      this.ctx.font = 'bold 7px Arial'
      this.ctx.textAlign = 'center'
      this.ctx.fillText('ENTRY', x + doorW/2, doorH + 8)
    }
  }

  private drawExits() {
    const doorW = 4 * this.scale
    const doorH = 2 * this.scale
    const spacing = this.config.hallLength / (this.config.exitPoints + 1)

    for (let i = 1; i <= this.config.exitPoints; i++) {
      const x = (spacing * i - doorW/2) * this.scale
      const y = this.config.hallWidth * this.scale - doorH

      this.ctx.fillStyle = COLORS.exit
      this.ctx.fillRect(x, y, doorW, doorH)
      this.ctx.strokeStyle = COLORS.wall
      this.ctx.lineWidth = 2
      this.ctx.strokeRect(x, y, doorW, doorH)

      this.ctx.fillStyle = COLORS.text
      this.ctx.font = 'bold 7px Arial'
      this.ctx.textAlign = 'center'
      this.ctx.fillText('EXIT', x + doorW/2, y - 2)
    }
  }

  private drawRestrooms() {
    const restroomW = 3 * this.scale
    const restroomH = 3 * this.scale
    const spacing = 5 * this.scale

    // Men's restrooms (left side)
    for (let i = 0; i < this.config.mensRestrooms; i++) {
      const x = 2 * this.scale
      const y = this.config.hallWidth * this.scale - (i + 1) * (restroomH + spacing)

      this.ctx.fillStyle = COLORS.restroom
      this.ctx.fillRect(x, y, restroomW, restroomH)
      this.ctx.strokeStyle = COLORS.wall
      this.ctx.lineWidth = 1
      this.ctx.strokeRect(x, y, restroomW, restroomH)

      this.ctx.fillStyle = 'white'
      this.ctx.font = 'bold 6px Arial'
      this.ctx.textAlign = 'center'
      this.ctx.fillText('M', x + restroomW/2, y + restroomH/2 + 2)
    }

    // Women's restrooms (right side)
    for (let i = 0; i < this.config.womensRestrooms; i++) {
      const x = this.config.hallLength * this.scale - restroomW - 2 * this.scale
      const y = this.config.hallWidth * this.scale - (i + 1) * (restroomH + spacing)

      this.ctx.fillStyle = COLORS.restroom
      this.ctx.fillRect(x, y, restroomW, restroomH)
      this.ctx.strokeStyle = COLORS.wall
      this.ctx.lineWidth = 1
      this.ctx.strokeRect(x, y, restroomW, restroomH)

      this.ctx.fillStyle = 'white'
      this.ctx.font = 'bold 6px Arial'
      this.ctx.textAlign = 'center'
      this.ctx.fillText('W', x + restroomW/2, y + restroomH/2 + 2)
    }
  }

  private drawDanceFloor() {
    const size = 15 * this.scale
    const x = this.config.hallLength * this.scale / 2 - size / 2
    const y = this.config.hallWidth * this.scale - size - 10 * this.scale

    this.ctx.fillStyle = COLORS.danceFloor
    this.ctx.fillRect(x, y, size, size)
    this.ctx.strokeStyle = COLORS.wall
    this.ctx.lineWidth = 2
    this.ctx.strokeRect(x, y, size, size)

    this.ctx.fillStyle = 'white'
    this.ctx.font = 'bold 8px Arial'
    this.ctx.textAlign = 'center'
    this.ctx.fillText('DANCE', x + size/2, y + size/2)
    this.ctx.fillText('FLOOR', x + size/2, y + size/2 + 10)
  }

  private drawBar() {
    const w = 10 * this.scale
    const h = 4 * this.scale
    const x = this.config.hallLength * this.scale - w - 5 * this.scale
    const y = 5 * this.scale

    this.ctx.fillStyle = COLORS.bar
    this.ctx.fillRect(x, y, w, h)
    this.ctx.strokeStyle = COLORS.wall
    this.ctx.lineWidth = 2
    this.ctx.strokeRect(x, y, w, h)

    this.ctx.fillStyle = 'white'
    this.ctx.font = 'bold 7px Arial'
    this.ctx.textAlign = 'center'
    this.ctx.fillText('BAR', x + w/2, y + h/2 + 2)
  }

  private drawReception() {
    const w = 8 * this.scale
    const h = 3 * this.scale
    const x = 5 * this.scale
    const y = 5 * this.scale

    this.ctx.fillStyle = COLORS.reception
    this.ctx.fillRect(x, y, w, h)
    this.ctx.strokeStyle = COLORS.wall
    this.ctx.lineWidth = 2
    this.ctx.strokeRect(x, y, w, h)

    this.ctx.fillStyle = 'white'
    this.ctx.font = 'bold 6px Arial'
    this.ctx.textAlign = 'center'
    this.ctx.fillText('RECEPTION', x + w/2, y + h/2 + 2)
  }

  private drawDJ() {
    const size = 4 * this.scale
    const x = 5 * this.scale
    const y = this.config.hallWidth * this.scale - size - 5 * this.scale

    this.ctx.fillStyle = COLORS.dj
    this.ctx.fillRect(x, y, size, size)
    this.ctx.strokeStyle = COLORS.wall
    this.ctx.lineWidth = 2
    this.ctx.strokeRect(x, y, size, size)

    this.ctx.fillStyle = 'white'
    this.ctx.font = 'bold 6px Arial'
    this.ctx.textAlign = 'center'
    this.ctx.fillText('DJ', x + size/2, y + size/2 + 2)
  }

  getTablesCount(): number {
    return Math.ceil(this.config.guestCount / this.config.seatsPerTable)
  }

  getTotalCapacity(): number {
    return this.getTablesCount() * this.config.seatsPerTable
  }
}
