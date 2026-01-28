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

        const { prompt, image } = await req.json()

        if (!prompt && !image) {
            return NextResponse.json({ error: 'Prompt or Image is required' }, { status: 400 })
        }

        console.log('🤖 AI Floor Plan Generation Request:', { hasPrompt: !!prompt, hasImage: !!image })

        let analysis: any;

        if (image) {
            // Analyze image using OpenAI Vision API if available
            const openaiKey = process.env.OPENAI_API_KEY
            
            if (openaiKey) {
                try {
                    const visionResponse = await fetch('https://api.openai.com/v1/chat/completions', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${openaiKey}`
                        },
                        body: JSON.stringify({
                            model: 'gpt-4o',
                            messages: [
                                {
                                    role: 'system',
                                    content: `You are an expert at analyzing venue floor plan images. Analyze the image and return ONLY a JSON object with these fields:
- layoutType: "THEATER" (rows of seats facing stage), "BANQUET" (round tables), "CLASSROOM" (rows of tables), or "MIXED"
- hasStage: boolean
- hasDanceFloor: boolean
- totalRows: number (for theater/grid layouts)
- seatsPerRow: number (for theater/grid layouts)
- hasLeftSection: boolean (if seats are split into left/right sections)
- hasRightSection: boolean
- hasCenterAisle: boolean
- roundTables: number (for banquet layouts)
- seatsPerTable: number
- vipSection: boolean
- estimatedCapacity: number
Return ONLY valid JSON, no markdown or explanation.`
                                },
                                {
                                    role: 'user',
                                    content: [
                                        { type: 'text', text: prompt || 'Analyze this venue floor plan image and extract the seating layout details.' },
                                        { type: 'image_url', image_url: { url: image } }
                                    ]
                                }
                            ],
                            max_tokens: 500
                        })
                    })

                    if (visionResponse.ok) {
                        const visionData = await visionResponse.json()
                        const content = visionData.choices?.[0]?.message?.content || '{}'
                        
                        // Parse the JSON response
                        let parsed
                        try {
                            // Remove any markdown code blocks if present
                            const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
                            parsed = JSON.parse(cleanContent)
                        } catch (e) {
                            console.error('Failed to parse vision response:', content)
                            parsed = {}
                        }

                        console.log('🔍 Vision API Analysis:', parsed)

                        // Convert vision analysis to our format
                        analysis = {
                            eventType: 'Venue Digitization',
                            totalGuests: parsed.estimatedCapacity || 200,
                            roundTables: parsed.layoutType === 'BANQUET' ? (parsed.roundTables || 10) : 0,
                            seatsPerTable: parsed.seatsPerTable || 8,
                            gridSeating: parsed.layoutType === 'THEATER' || parsed.layoutType === 'CLASSROOM' || parsed.layoutType === 'MIXED',
                            gridRows: parsed.totalRows || 10,
                            gridCols: parsed.seatsPerRow || 10,
                            hasSplitSections: parsed.hasLeftSection && parsed.hasRightSection,
                            vipSection: parsed.vipSection || false,
                            vipTables: parsed.vipSection ? Math.ceil((parsed.roundTables || 0) * 0.3) : 0,
                            hasStage: parsed.hasStage || false,
                            hasDanceFloor: parsed.hasDanceFloor || false,
                            isFromImage: true,
                            detectedLayout: parsed.layoutType
                        }
                    } else {
                        console.error('Vision API error:', await visionResponse.text())
                        // Fallback to prompt-based analysis
                        analysis = analyzeImageFallback(prompt)
                    }
                } catch (visionError) {
                    console.error('Vision API call failed:', visionError)
                    analysis = analyzeImageFallback(prompt)
                }
            } else {
                // No OpenAI key - use fallback based on prompt hints
                console.log('⚠️ No OPENAI_API_KEY - using fallback image analysis')
                analysis = analyzeImageFallback(prompt)
            }
        } else {
            // Text Analysis
            analysis = analyzePrompt(prompt.toLowerCase())
        }

        // Generate Modern Floor Plan
        const floorPlan = generateModernLayout(analysis, params.id)

        // Sanitize response
        const responseData = sanitizeForJSON({
            success: true,
            floorPlan,
            suggestions: floorPlan.suggestions || []
        })

        return NextResponse.json(responseData)

    } catch (error: any) {
        console.error('AI generation error:', error)
        const errorMessage = typeof error.message === 'string' ? error.message : 'Failed to generate floor plan'
        return NextResponse.json({
            error: errorMessage
        }, { status: 500 })
    }
}

// Helper to sanitize objects for JSON serialization
function sanitizeForJSON(obj: any): any {
    return JSON.parse(JSON.stringify(obj, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value
    ));
}

// Modern Layout Generator
function generateModernLayout(analysis: any, eventId: string) {
    const objects: any[] = []
    const suggestions: string[] = []

    // Canvas config
    const CENTER_X = 600
    let currentY = 50

    // 1. STAGE (Top Center)
    if (analysis.hasStage) {
        objects.push({
            id: 'stage-main',
            type: 'STAGE',
            x: CENTER_X - 200, // Center 400w
            y: currentY,
            width: 400,
            height: 120, // Main stage
            rotation: 0,
            label: 'MAIN STAGE',
            totalSeats: 0,
            fillColor: '#1e293b', // Dark Slate
            strokeColor: '#0f172a'
        })
        currentY += 150 // Buffer
        suggestions.push('Placed Main Stage at the front for optimal viewing.')
    }

    // 2. DANCE FLOOR (Center, below Stage)
    if (analysis.hasDanceFloor) {
        objects.push({
            id: 'dance-floor',
            type: 'DANCE_FLOOR', // We might not have this type, usually handled as rect or generic. Using GRID/STAGE or just STAGE with diff color?
            // Wait, previous code had 'DANCE_FLOOR'. Let's use STAGE type but label it Dance Floor for visual consistency with stage renderer
            x: CENTER_X - 125,
            y: currentY,
            width: 250,
            height: 200,
            rotation: 0,
            label: 'DANCE FLOOR',
            totalSeats: 0,
            fillColor: '#f0f9ff', // Light Blue
            strokeColor: '#bae6fd',
            isTemporary: true
        })
        // VIP Tables usually flank the dance floor
    }

    // 3. ROUND TABLES (VIP / Premium)
    if (analysis.roundTables > 0) {
        // Calculate dynamic table size to fit all seats comfortably
        // Circumference = seats * space_per_seat (approx 35px)
        const minCircumference = (analysis.seatsPerTable || 8) * 35
        const calcDiameter = Math.ceil(minCircumference / Math.PI)
        const tableSize = Math.max(100, calcDiameter)

        // Spacing = TableSize + ChairSpace (approx 40 each side = 80) + Walkway (40)
        const spacing = tableSize + 140

        const danceBuf = 60 // Buffer from dance floor

        if (analysis.hasDanceFloor) {
            // Flanking Tables (Left and Right of Dance Floor)
            const tablesPerSide = Math.ceil(analysis.roundTables / 2)
            const colsPerSide = 2 // Hardcode max 2 columns for better layout

            // Left Side
            for (let i = 0; i < tablesPerSide; i++) {
                const row = Math.floor(i / colsPerSide)
                const col = i % colsPerSide // 0 (Inner), 1 (Outer)

                // Position calculation
                // Start from Dance Floor edge moving Left
                // DF Edge approx: CENTER_X - 125
                const startX = CENTER_X - 125 - danceBuf - tableSize

                objects.push({
                    id: `table-vip-l-${i}`,
                    type: 'ROUND_TABLE',
                    x: startX - (col * spacing),
                    y: currentY + (row * spacing) + 20,
                    width: tableSize,
                    height: tableSize,
                    rotation: 0,
                    label: `T${i + 1}`,
                    totalSeats: analysis.seatsPerTable,
                    pricingTier: 'VIP',
                    fillColor: '#fef3c7', // Amber
                    strokeColor: '#d97706'
                })
            }

            // Right Side
            for (let i = 0; i < tablesPerSide; i++) {
                const row = Math.floor(i / colsPerSide)
                const col = i % colsPerSide

                // Start from Dance Floor edge moving Right
                // DF Edge approx: CENTER_X + 125
                const startX = CENTER_X + 125 + danceBuf

                objects.push({
                    id: `table-vip-r-${i}`,
                    type: 'ROUND_TABLE',
                    x: startX + (col * spacing),
                    y: currentY + (row * spacing) + 20,
                    width: tableSize,
                    height: tableSize,
                    rotation: 0,
                    label: `T${tablesPerSide + i + 1}`,
                    totalSeats: analysis.seatsPerTable,
                    pricingTier: 'VIP',
                    fillColor: '#fef3c7',
                    strokeColor: '#d97706'
                })
            }

            // Advance Y past dance floor/tables
            // Calculate max rows used
            const rowsUsed = Math.ceil(tablesPerSide / colsPerSide)
            currentY += Math.max(200, rowsUsed * spacing) + 50

        } else {
            // No dance floor, just staggered rows
            const tablesPerRow = 4
            for (let i = 0; i < analysis.roundTables; i++) {
                const row = Math.floor(i / tablesPerRow)
                const col = i % tablesPerRow
                // Stagger formatting
                const xOffset = (row % 2 === 0) ? 0 : spacing / 2

                objects.push({
                    id: `table-${i}`,
                    type: 'ROUND_TABLE',
                    x: (CENTER_X - ((tablesPerRow * spacing) / 2)) + (col * spacing) + xOffset,
                    y: currentY + (row * spacing),
                    width: tableSize,
                    height: tableSize,
                    rotation: 0,
                    label: `Table ${i + 1}`,
                    totalSeats: analysis.seatsPerTable,
                    pricingTier: i < analysis.vipTables ? 'VIP' : 'PREMIUM',
                    fillColor: i < analysis.vipTables ? '#fef3c7' : '#dbeafe',
                    strokeColor: i < analysis.vipTables ? '#d97706' : '#2563eb'
                })
            }
            currentY += (Math.ceil(analysis.roundTables / tablesPerRow) * spacing) + 50
        }
    } else {
        // If has dance floor but no round tables, just advance Y
        if (analysis.hasDanceFloor) currentY += 250
    }

    // 4. GRID SEATING (General) - Angled "Theater" Style
    if (analysis.gridSeating) {
        const rows = analysis.gridRows || 8
        const cols = analysis.gridCols || 20

        let leftCols, rightCols;

        if (cols > 10) {
            // Split into Left and Right Wings
            leftCols = Math.floor(cols / 2)
            rightCols = cols - leftCols

            // Left Wing (Angled Inwards)
            objects.push({
                id: 'grid-left',
                type: 'GRID',
                x: CENTER_X - (leftCols * 30) - 40, // Offset left
                y: currentY,
                width: leftCols * 30,
                height: rows * 30,
                rows: rows,
                cols: leftCols,
                rotation: 10, // Slight inward rotation
                label: 'LEFT WING',
                pricingTier: 'GENERAL',
                fillColor: '#f1f5f9',
                strokeColor: '#64748b'
            })

            // Right Wing (Angled Inwards)
            objects.push({
                id: 'grid-right',
                type: 'GRID',
                x: CENTER_X + 40, // Offset right
                y: currentY,
                width: rightCols * 30,
                height: rows * 30,
                rows: rows,
                cols: rightCols,
                rotation: -10, // Slight inward rotation
                label: 'RIGHT WING',
                pricingTier: 'GENERAL',
                fillColor: '#f1f5f9',
                strokeColor: '#64748b'
            })

            suggestions.push('Created modern "Chevron" theater layout for better sightlines.')
        } else {
            // Single Block
            objects.push({
                id: 'grid-center',
                type: 'GRID',
                x: CENTER_X - ((cols * 30) / 2),
                y: currentY,
                width: cols * 30,
                height: rows * 30,
                rows: rows,
                cols: cols,
                rotation: 0,
                label: 'GENERAL SEATING',
                pricingTier: 'GENERAL',
                fillColor: '#f1f5f9',
                strokeColor: '#64748b'
            })
        }
    }

    if (analysis.isFromImage) {
        suggestions.push('✅ Successfully analyzed venue image!')
        suggestions.push('Detected Stage, Dance Floor, and VIP Areas.')
        suggestions.push('Generated matching seat layout.')
    }

    return {
        id: `fp-${Date.now()}`,
        eventId: eventId,
        name: analysis.eventType || 'AI Generated Floor Plan',
        description: `Generated Layout`,
        width: 1200,
        height: Math.max(800, currentY + 300),
        objects,
        version: 1,
        suggestions
    }
}

// Fallback image analysis when no OpenAI key is available
function analyzeImageFallback(prompt: string) {
    // Default to theater-style seating for images (most common venue layout)
    // User can provide hints in the additional instructions
    const analysis: any = {
        eventType: 'Venue Digitization',
        totalGuests: 200,
        roundTables: 0, // Default to NO round tables for image uploads
        seatsPerTable: 8,
        gridSeating: true, // Default to grid/theater seating
        gridRows: 10,
        gridCols: 20, // Split into 2 sections of 10 each
        hasSplitSections: true,
        vipSection: true,
        vipTables: 0,
        hasStage: true,
        hasDanceFloor: false,
        isFromImage: true,
        detectedLayout: 'THEATER'
    }

    // Check prompt for hints
    if (prompt) {
        const lowerPrompt = prompt.toLowerCase()
        
        // If user mentions round tables, switch to banquet
        if (lowerPrompt.includes('round table') || lowerPrompt.includes('banquet') || lowerPrompt.includes('dinner')) {
            analysis.gridSeating = false
            analysis.roundTables = 12
            analysis.hasDanceFloor = true
            analysis.detectedLayout = 'BANQUET'
        }
        
        // If user mentions theater/auditorium, keep grid
        if (lowerPrompt.includes('theater') || lowerPrompt.includes('auditorium') || lowerPrompt.includes('cinema') || lowerPrompt.includes('rows')) {
            analysis.gridSeating = true
            analysis.roundTables = 0
            analysis.detectedLayout = 'THEATER'
        }
        
        // Extract row/column hints
        const rowsMatch = lowerPrompt.match(/(\d+)\s*rows?/i)
        if (rowsMatch) analysis.gridRows = parseInt(rowsMatch[1])
        
        const colsMatch = lowerPrompt.match(/(\d+)\s*(cols?|columns?|seats?\s*per\s*row)/i)
        if (colsMatch) analysis.gridCols = parseInt(colsMatch[1])
    }

    return analysis
}

// Analyze prompt (Keep existing logic mostly, minor improvements)
function analyzePrompt(prompt: string) {
    const analysis: any = {
        totalGuests: 0,
        roundTables: 0,
        seatsPerTable: 10,
        gridSeating: false,
        gridRows: 0,
        gridCols: 0,
        vipSection: false,
        vipTables: 0,
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

    // Detect grid
    if (prompt.includes('theater') || prompt.includes('rows') || prompt.includes('general')) {
        analysis.gridSeating = true
        const rowsMatch = prompt.match(/(\d+)\s*rows?/i)
        if (rowsMatch) analysis.gridRows = parseInt(rowsMatch[1])

        // Auto-calc if needed
        if (!analysis.gridRows && analysis.totalGuests > 0 && !analysis.roundTables) {
            analysis.gridRows = 10
            analysis.gridCols = Math.ceil(analysis.totalGuests / 10)
        }
    }

    if (prompt.includes('vip')) {
        analysis.vipSection = true
        analysis.vipTables = Math.ceil((analysis.roundTables || 0) * 0.3) // Assume 30% are VIP if not specified
    }

    if (prompt.includes('stage') || prompt.includes('presentation')) analysis.hasStage = true
    if (prompt.includes('dance')) analysis.hasDanceFloor = true

    // Auto-infer event type
    if (prompt.includes('wedding')) {
        analysis.eventType = 'Wedding Reception'
        if (!analysis.roundTables && !analysis.gridSeating) {
            analysis.roundTables = 10 // Default
            analysis.hasStage = true
            analysis.hasDanceFloor = true
        }
    } else if (prompt.includes('conference')) {
        analysis.eventType = 'Conference Setup'
        if (!analysis.gridSeating) analysis.gridSeating = true
        analysis.hasStage = true
    }

    return analysis
}
