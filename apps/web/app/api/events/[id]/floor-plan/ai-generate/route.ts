import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// AI Floor Plan Generator
export async function POST(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { prompt } = await req.json()

        if (!prompt || typeof prompt !== 'string') {
            return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
        }

        console.log('🤖 AI Floor Plan Generation Request:', prompt)

        // Parse the prompt using AI-like logic
        const floorPlan = await generateFloorPlanFromPrompt(prompt, params.id)

        return NextResponse.json({
            success: true,
            floorPlan,
            suggestions: floorPlan.suggestions || []
        })

    } catch (error: any) {
        console.error('AI generation error:', error)
        return NextResponse.json({
            error: error.message || 'Failed to generate floor plan'
        }, { status: 500 })
    }
}

// AI-powered floor plan generation logic
async function generateFloorPlanFromPrompt(prompt: string, eventId: string) {
    const promptLower = prompt.toLowerCase()

    // Extract key information from prompt
    const analysis = analyzePrompt(promptLower)

    // Generate floor plan objects based on analysis
    const objects: any[] = []
    const suggestions: string[] = []

    let currentX = 100
    let currentY = 100
    const spacing = 150

    // Generate round tables
    if (analysis.roundTables > 0) {
        const tablesPerRow = Math.ceil(Math.sqrt(analysis.roundTables))

        for (let i = 0; i < analysis.roundTables; i++) {
            const row = Math.floor(i / tablesPerRow)
            const col = i % tablesPerRow

            const tier = i < analysis.vipTables ? 'VIP'
                : i < (analysis.vipTables + analysis.premiumTables) ? 'PREMIUM'
                    : 'GENERAL'

            objects.push({
                id: `table-${i + 1}`,
                type: 'ROUND_TABLE',
                x: currentX + (col * spacing),
                y: currentY + (row * spacing),
                width: 120,
                height: 120,
                rotation: 0,
                label: `Table ${i + 1}`,
                totalSeats: analysis.seatsPerTable,
                pricingTier: tier,
                priceInr: tier === 'VIP' ? 5000 : tier === 'PREMIUM' ? 3000 : 1500
            })
        }

        currentY += (Math.ceil(analysis.roundTables / tablesPerRow) * spacing) + 100
    }

    // Generate grid seating (theater/classroom style)
    if (analysis.gridSeating) {
        const rows = analysis.gridRows || 10
        const cols = analysis.gridCols || 10

        objects.push({
            id: 'grid-seating-1',
            type: 'GRID',
            x: currentX,
            y: currentY,
            width: cols * 25,
            height: rows * 25,
            rotation: 0,
            label: analysis.gridLabel || 'Main Seating',
            rows,
            cols,
            pricingTier: 'GENERAL',
            priceInr: 1000
        })

        currentY += (rows * 25) + 100
    }

    // Generate VIP section if mentioned
    if (analysis.vipSection && !analysis.roundTables) {
        objects.push({
            id: 'vip-section',
            type: 'GRID',
            x: currentX,
            y: 100,
            width: 250,
            height: 100,
            rotation: 0,
            label: 'VIP Section',
            rows: 5,
            cols: 10,
            pricingTier: 'VIP',
            priceInr: 5000
        })
    }

    // Generate stage if mentioned
    if (analysis.hasStage) {
        objects.push({
            id: 'stage',
            type: 'STAGE',
            x: 500,
            y: 50,
            width: 300,
            height: 100,
            rotation: 0,
            label: 'Stage',
            totalSeats: 0,
            pricingTier: 'GENERAL',
            priceInr: 0
        })

        suggestions.push('Stage positioned at the front for optimal visibility')
    }

    // Generate dance floor if mentioned
    if (analysis.hasDanceFloor) {
        objects.push({
            id: 'dance-floor',
            type: 'DANCE_FLOOR',
            x: 500,
            y: 400,
            width: 200,
            height: 200,
            rotation: 0,
            label: 'Dance Floor',
            totalSeats: 0,
            pricingTier: 'GENERAL',
            priceInr: 0
        })

        suggestions.push('Dance floor placed centrally for easy access')
    }

    // Add suggestions based on analysis
    if (analysis.totalGuests > 0) {
        const totalSeats = objects.reduce((sum, obj) => sum + (obj.totalSeats || 0), 0)
        if (totalSeats < analysis.totalGuests) {
            suggestions.push(`Current layout has ${totalSeats} seats. Consider adding ${analysis.totalGuests - totalSeats} more seats to accommodate all guests.`)
        } else if (totalSeats > analysis.totalGuests * 1.2) {
            suggestions.push(`Layout has ${totalSeats} seats for ${analysis.totalGuests} guests. Consider reducing tables for a more intimate setting.`)
        } else {
            suggestions.push(`Perfect! Layout accommodates ${totalSeats} seats for ${analysis.totalGuests} guests.`)
        }
    }

    if (analysis.roundTables > 0) {
        suggestions.push(`Created ${analysis.roundTables} round tables with ${analysis.seatsPerTable} seats each`)
    }

    if (analysis.gridSeating) {
        suggestions.push(`Added ${analysis.gridLabel || 'theater-style'} seating arrangement`)
    }

    return {
        id: `fp-${Date.now()}`,
        eventId: BigInt(eventId),
        name: analysis.eventType || 'AI Generated Floor Plan',
        description: `Generated from: "${prompt.substring(0, 100)}..."`,
        width: 1200,
        height: 800,
        objects,
        version: 1,
        suggestions
    }
}

// Analyze prompt to extract floor plan requirements
function analyzePrompt(prompt: string) {
    const analysis: any = {
        totalGuests: 0,
        roundTables: 0,
        seatsPerTable: 10,
        gridSeating: false,
        gridRows: 0,
        gridCols: 0,
        gridLabel: '',
        vipSection: false,
        vipTables: 0,
        premiumTables: 0,
        hasStage: false,
        hasDanceFloor: false,
        eventType: ''
    }

    // Extract total guests
    const guestsMatch = prompt.match(/(\d+)\s*(guests?|people|attendees?)/i)
    if (guestsMatch) {
        analysis.totalGuests = parseInt(guestsMatch[1])
    }

    // Extract round tables
    const roundTablesMatch = prompt.match(/(\d+)\s*round\s*tables?/i)
    if (roundTablesMatch) {
        analysis.roundTables = parseInt(roundTablesMatch[1])
    }

    // Extract seats per table
    const seatsPerTableMatch = prompt.match(/tables?\s*of\s*(\d+)\s*seats?/i) ||
        prompt.match(/(\d+)\s*seats?\s*each/i)
    if (seatsPerTableMatch) {
        analysis.seatsPerTable = parseInt(seatsPerTableMatch[1])
    }

    // Detect grid/theater/classroom seating
    if (prompt.includes('theater') || prompt.includes('classroom') || prompt.includes('rows')) {
        analysis.gridSeating = true
        analysis.gridLabel = prompt.includes('theater') ? 'Theater Style' :
            prompt.includes('classroom') ? 'Classroom Style' :
                'Grid Seating'

        // Extract rows and columns
        const rowsMatch = prompt.match(/(\d+)\s*rows?/i)
        const colsMatch = prompt.match(/(\d+)\s*seats?\s*per\s*row/i) ||
            prompt.match(/rows?\s*of\s*(\d+)/i)

        if (rowsMatch) analysis.gridRows = parseInt(rowsMatch[1])
        if (colsMatch) analysis.gridCols = parseInt(colsMatch[1])

        // If not specified, calculate from total guests
        if (!analysis.gridRows && analysis.totalGuests > 0) {
            analysis.gridRows = Math.ceil(Math.sqrt(analysis.totalGuests))
            analysis.gridCols = Math.ceil(analysis.totalGuests / analysis.gridRows)
        }
    }

    // Detect VIP section
    if (prompt.includes('vip')) {
        analysis.vipSection = true
        const vipMatch = prompt.match(/(\d+)\s*vip/i)
        if (vipMatch) {
            const vipCount = parseInt(vipMatch[1])
            if (analysis.roundTables > 0) {
                analysis.vipTables = Math.ceil(vipCount / analysis.seatsPerTable)
            }
        }
    }

    // Detect premium section
    if (prompt.includes('premium')) {
        const premiumMatch = prompt.match(/(\d+)\s*premium/i)
        if (premiumMatch) {
            const premiumCount = parseInt(premiumMatch[1])
            if (analysis.roundTables > 0) {
                analysis.premiumTables = Math.ceil(premiumCount / analysis.seatsPerTable)
            }
        }
    }

    // Detect stage
    analysis.hasStage = prompt.includes('stage') || prompt.includes('presentation')

    // Detect dance floor
    analysis.hasDanceFloor = prompt.includes('dance') || prompt.includes('dancing')

    // Detect event type
    if (prompt.includes('wedding')) analysis.eventType = 'Wedding Reception'
    else if (prompt.includes('conference')) analysis.eventType = 'Conference'
    else if (prompt.includes('gala')) analysis.eventType = 'Gala Dinner'
    else if (prompt.includes('corporate')) analysis.eventType = 'Corporate Event'
    else analysis.eventType = 'Event Floor Plan'

    return analysis
}
