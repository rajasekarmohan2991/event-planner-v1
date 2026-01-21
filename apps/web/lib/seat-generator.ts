
import prisma from '@/lib/prisma'

export async function generateSeats(eventId: number, plan: any, tenantId: string | null) {
    console.log('[SeatGenerator] Starting generation for event', eventId)

    // Delete existing seats
    await prisma.$executeRaw`
    DELETE FROM seat_inventory WHERE event_id = ${eventId}::bigint
  `

    let totalSeatsGenerated = 0
    const seats: any[] = []

    // Helper for insertion
    const insertSeat = async (sectionName: string, rowLabel: string, seatNum: number, seatType: string, basePrice: number, xCoord: number, yCoord: number) => {
        // Avoid excessively long or weird values
        const safeSection = sectionName.substring(0, 50)
        const safeRow = String(rowLabel).substring(0, 10)
        const safeType = String(seatType).substring(0, 50)

        await prisma.$executeRaw`
      INSERT INTO seat_inventory (
        event_id, section, row_number, seat_number, seat_type, 
        base_price, x_coordinate, y_coordinate, is_available, tenant_id, created_at, updated_at
      ) VALUES (
        ${eventId}::bigint, ${safeSection}, ${safeRow}, ${String(seatNum)}, ${safeType},
        ${basePrice}, ${xCoord}, ${yCoord}, true, ${tenantId}, NOW(), NOW()
      )
    `
        totalSeatsGenerated++
        seats.push({ section: safeSection, row: safeRow, seat: seatNum, price: basePrice })
    }

    // Logic from generate/route.ts
    const hasV3Type = typeof plan.type === 'string' && plan.type.endsWith('_V3')

    if (hasV3Type) {
        const type = String(plan.type)
        if (type === 'THEATER_V3') {
            const rows = Math.max(1, Number(plan.rows || 0))
            const cols = Math.max(1, Number(plan.cols || 0))
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
    } else {
        // Standard Sections V1/V2
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

    console.log('[SeatGenerator] Generated', totalSeatsGenerated, 'seats')
    return { count: totalSeatsGenerated, seats }
}
