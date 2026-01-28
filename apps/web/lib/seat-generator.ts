
import prisma from '@/lib/prisma'

export async function generateSeats(eventId: number, plan: any, tenantId: string | null) {
    console.log('[SeatGenerator] Starting optimized generation for event', eventId)

    // Delete existing seats using Prisma Client
    await prisma.seatInventory.deleteMany({
        where: { eventId: BigInt(eventId) }
    })

    let totalSeatsGenerated = 0
    const seats: any[] = []

    // Batch buffer
    let seatBatch: any[] = []
    const BATCH_SIZE = 2000
    const MAX_TOTAL_SEATS = 10000 // Safety cap

    // Flush function
    const flushBatch = async () => {
        if (seatBatch.length === 0) return
        console.log(`[SeatGenerator] Flushing batch of ${seatBatch.length} seats...`)
        await prisma.seatInventory.createMany({
            data: seatBatch
        })
        seatBatch = []
    }

    // Helper for insertion (pushes to batch)
    const insertSeat = async (sectionName: string, rowLabel: string, seatNum: number, seatType: string, basePrice: number, xCoord: number, yCoord: number) => {
        if (totalSeatsGenerated >= MAX_TOTAL_SEATS) return

        // Avoid excessively long or weird values
        const safeSection = (sectionName || 'General').substring(0, 50)
        const safeRow = String(rowLabel || '1').substring(0, 10)
        const safeType = (seatType || 'Standard').substring(0, 50)

        // Add to batch - seatNumber now includes row label (e.g., A1, A2, B1, B2)
        const fullSeatLabel = `${safeRow}${seatNum}`
        seatBatch.push({
            eventId: BigInt(eventId),
            section: safeSection,
            rowNumber: safeRow,
            seatNumber: fullSeatLabel,
            seatType: safeType,
            basePrice,
            xCoordinate: xCoord,
            yCoordinate: yCoord,
            isAvailable: true,
            tenantId: tenantId,
            status: 'AVAILABLE' // explicit default
        })

        // Add to return array (for API response if needed)
        seats.push({ section: safeSection, row: safeRow, seat: seatNum, price: basePrice })
        totalSeatsGenerated++

        // Flush if full
        if (seatBatch.length >= BATCH_SIZE) {
            await flushBatch()
        }
    }

    try {
        // Logic from generate/route.ts (Preserved)
        const hasV3Type = typeof plan.type === 'string' && plan.type.endsWith('_V3')

        if (hasV3Type) {
            // ... V3 Logic (Theater, Stadium, Banquet)
            const type = String(plan.type)
            if (type === 'THEATER_V3') {
                const rows = Math.min(100, Math.max(1, Number(plan.rows || 0))) // Cap rows
                const cols = Math.min(100, Math.max(1, Number(plan.cols || 0))) // Cap cols
                const aisleEvery = Math.max(0, Number(plan.aisleEvery || 0))
                const defaultBasePrice = Number(plan.basePrice || 100)
                const sectionName = String(plan.section || 'Theater')
                const defaultSeatType = String(plan.seatType || 'STANDARD')
                const rowBands: any[] = Array.isArray(plan.rowBands) ? plan.rowBands : []

                const resolveRowBand = (rowIndex: number) => {
                    for (const band of rowBands) {
                        const start = Number(band.startRowIndex ?? 0)
                        const end = Number(band.endRowIndex ?? -1)
                        if (end >= 0) {
                            if (rowIndex >= start && rowIndex <= end) return band
                        } else {
                            if (rowIndex >= start) return band
                        }
                    }
                    return null
                }

                for (let r = 0; r < rows; r++) {
                    const rowLabel = String.fromCharCode(65 + (r % 26)) + (r >= 26 ? Math.floor(r / 26) : '')
                    const band = resolveRowBand(r)
                    const rowBasePrice = band?.basePrice != null ? Number(band.basePrice) : defaultBasePrice
                    const rowSeatType = band?.seatType ? String(band.seatType) : defaultSeatType
                    for (let c = 1; c <= cols; c++) {
                        if (aisleEvery > 0 && c % aisleEvery === 0) continue
                        const x = c * 40
                        const y = r * 40
                        await insertSeat(sectionName, rowLabel, c, rowSeatType, rowBasePrice, x, y)
                    }
                }
            } else if (type === 'STADIUM_V3') {
                // ... Stadium Logic
                const rings: any[] = Array.isArray(plan.rings) ? plan.rings : []
                const centerX = Number(plan.centerX || 500)
                const centerY = Number(plan.centerY || 300)
                for (let ri = 0; ri < rings.length; ri++) {
                    const ring = rings[ri] || {}
                    const radius = Number(ring.radius || 100 + ri * 30)
                    const sectors = Math.max(1, Number(ring.sectors || 6))
                    const seatsPerSector = Math.max(1, Number(ring.seatsPerSector || 30))
                    const basePrice = Number(ring.basePrice || 200)
                    const sectionName = String(ring.name || `Ring ${ri + 1}`)
                    const seatType = String(ring.seatType || 'STANDARD')
                    const totalSeats = sectors * seatsPerSector
                    for (let s = 0; s < totalSeats; s++) {
                        const angle = (2 * Math.PI * s) / totalSeats
                        const x = centerX + radius * Math.cos(angle)
                        const y = centerY + radius * Math.sin(angle)
                        const rowLabel = `R${ri + 1}`
                        await insertSeat(sectionName, rowLabel, s + 1, seatType, basePrice, x, y)
                    }
                }
            } else if (type === 'BANQUET_V3') {
                // ... Banquet Logic
                const tables: any[] = Array.isArray(plan.tables) ? plan.tables : []
                for (let ti = 0; ti < tables.length; ti++) {
                    const t = tables[ti]
                    const x0 = Number(t.x || 100 + (ti % 10) * 80)
                    const y0 = Number(t.y || 100 + Math.floor(ti / 10) * 80)
                    const seatsN = Math.max(1, Number(t.seats || plan.seatsPerTable || 6))
                    const basePrice = Number(t.basePrice || plan.basePrice || 150)
                    const sectionName = String(t.section || plan.section || 'Banquet')
                    const seatType = String(t.seatType || 'STANDARD')
                    const radius = Number(t.radius || 30)
                    const rowLabel = `T${ti + 1}`
                    for (let sn = 0; sn < seatsN; sn++) {
                        const ang = (2 * Math.PI * sn) / seatsN
                        const x = x0 + radius * Math.cos(ang)
                        const y = y0 + radius * Math.sin(ang)
                        await insertSeat(sectionName, rowLabel, sn + 1, seatType, basePrice, x, y)
                    }
                }
            }
        } else if (plan.objects && Array.isArray(plan.objects)) {
            // NEW: Canvas Designer Format (objects array)
            console.log('[SeatGenerator] Generating from Canvas Objects')
            for (const obj of plan.objects) {
                // Common props
                const price = Number(obj.price || obj.basePrice || 0)
                const seatType = obj.pricingTier || obj.seatType || 'STANDARD'
                const label = obj.label || obj.name || 'T'

                // Handle Round/Rect/Dining Tables
                if (['ROUND_TABLE', 'RECT_TABLE', 'DINING_TABLE'].includes(obj.type)) {
                    // Robust seat count check
                    const seatCount = Number(obj.totalSeats || obj.seatCount || obj.capacity || 0)
                    if (seatCount <= 0) continue

                    const cx = obj.x + (obj.width / 2)
                    const cy = obj.y + (obj.height / 2)
                    // Radius calculation based on shape
                    const radius = (Math.max(obj.width, obj.height) / 2) + 15

                    const sectionName = obj.section || obj.label || 'Tables'

                    for (let i = 0; i < seatCount; i++) {
                        const angle = (i * (2 * Math.PI)) / seatCount
                        const x = cx + radius * Math.cos(angle)
                        const y = cy + radius * Math.sin(angle)
                        await insertSeat(sectionName, label, i + 1, seatType, price, x, y)
                    }
                }
                // Handle Individual Seats (e.g. dragging single chairs)
                else if (obj.type === 'SEAT' || obj.type === 'CHAIR') {
                    const sectionName = obj.section || 'General'
                    await insertSeat(sectionName, label, 1, seatType, price, obj.x, obj.y)
                }
            }
        } else {
            // Standard Sections V1/V2 (Legacy)
            if (plan.sections) {
                for (const section of plan.sections) {
                    const sectionName = section.name || 'General'
                    const rows = section.rows || []
                    const basePrice = section.basePrice || 100
                    for (const row of rows) {
                        const rowNumber = row.number || row.label
                        const seatsInRow = Array.isArray(row.seats) ? row.seats.length : (Number(row.seats) || Number(row.count) || 10)
                        const seatType = row.tier || section.tier || section.type || 'Standard'
                        for (let seatNum = 1; seatNum <= seatsInRow; seatNum++) {
                            const xCoord = (row.xOffset || 0) + (seatNum * 50)
                            const yCoord = row.yOffset || 0
                            await insertSeat(sectionName, String(rowNumber), seatNum, seatType, basePrice, xCoord, yCoord)
                        }
                    }
                }
            }
        }

        // Final flush
        await flushBatch()

        console.log('[SeatGenerator] Generated', totalSeatsGenerated, 'seats (Optimized)')
        return { count: totalSeatsGenerated, seats }
    } catch (e) {
        console.error('[SeatGenerator] Critical Error:', e)
        return { count: 0, seats: [] }
    }
}
