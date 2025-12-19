import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// GET - Get floor plan templates
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions as any)
        if (!session) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
        }

        console.log('📐 Fetching floor plan templates')

        const templates = [
            {
                id: 'conference-hall',
                name: 'Conference Hall',
                description: 'Theater-style seating for conferences and presentations',
                type: 'THEATER',
                capacity: 500,
                thumbnail: '/templates/conference-hall.png',
                objects: createConferenceHallLayout()
            },
            {
                id: 'wedding-reception',
                name: 'Wedding Reception',
                description: 'Round tables for elegant wedding receptions',
                type: 'ROUND_TABLES',
                capacity: 200,
                thumbnail: '/templates/wedding-reception.png',
                objects: createWeddingReceptionLayout()
            },
            {
                id: 'stadium-concert',
                name: 'Stadium Concert',
                description: 'Large-scale stadium seating for concerts',
                type: 'STADIUM',
                capacity: 5000,
                thumbnail: '/templates/stadium-concert.png',
                objects: createStadiumConcertLayout()
            },
            {
                id: 'corporate-event',
                name: 'Corporate Event',
                description: 'Mixed seating for corporate events',
                type: 'MIXED',
                capacity: 300,
                thumbnail: '/templates/corporate-event.png',
                objects: createCorporateEventLayout()
            },
            {
                id: 'classroom-training',
                name: 'Classroom Training',
                description: 'Grid seating for training sessions',
                type: 'GRID',
                capacity: 100,
                thumbnail: '/templates/classroom-training.png',
                objects: createClassroomTrainingLayout()
            },
            {
                id: 'banquet-hall',
                name: 'Banquet Hall',
                description: 'Formal dining with round tables',
                type: 'ROUND_TABLES',
                capacity: 400,
                thumbnail: '/templates/banquet-hall.png',
                objects: createBanquetHallLayout()
            }
        ]

        console.log(`✅ Found ${templates.length} templates`)

        return NextResponse.json({ templates })
    } catch (error: any) {
        console.error('❌ Error fetching templates:', error)
        return NextResponse.json({
            message: 'Failed to load templates',
            error: error.message
        }, { status: 500 })
    }
}

// Template layouts

function createConferenceHallLayout() {
    const objects = []

    // Stage
    objects.push({
        type: 'STAGE',
        x: 400,
        y: 50,
        width: 400,
        height: 100,
        rotation: 0,
        fillColor: '#1e293b',
        label: 'Main Stage'
    })

    // Theater seating (curved rows)
    const rows = 20
    const seatsPerRow = 25
    for (let row = 0; row < rows; row++) {
        objects.push({
            type: 'GRID',
            subType: 'THEATER',
            x: 100,
            y: 200 + (row * 35),
            width: 1000,
            height: 30,
            rows: 1,
            cols: seatsPerRow,
            totalSeats: seatsPerRow,
            pricingTier: row < 5 ? 'VIP' : row < 12 ? 'PREMIUM' : 'GENERAL',
            fillColor: row < 5 ? '#fbbf24' : row < 12 ? '#3b82f6' : '#6b7280',
            label: `Row ${String.fromCharCode(65 + row)}`
        })
    }

    return objects
}

function createWeddingReceptionLayout() {
    const objects = []

    // Stage/Dance floor
    objects.push({
        type: 'STAGE',
        x: 500,
        y: 100,
        width: 200,
        height: 200,
        rotation: 0,
        fillColor: '#f3f4f6',
        label: 'Dance Floor'
    })

    // Round tables (8-seater)
    const tablePositions = [
        [150, 150], [350, 150], [650, 150], [850, 150], [1050, 150],
        [150, 350], [350, 350], [850, 350], [1050, 350],
        [150, 550], [350, 550], [650, 550], [850, 550], [1050, 550],
        [150, 750], [350, 750], [650, 750], [850, 750], [1050, 750]
    ]

    tablePositions.forEach(([x, y], index) => {
        objects.push({
            type: 'ROUND_TABLE',
            x,
            y,
            width: 120,
            height: 120,
            totalSeats: 8,
            pricingTier: index < 5 ? 'VIP' : 'PREMIUM',
            fillColor: index < 5 ? '#fbbf24' : '#3b82f6',
            label: `Table ${index + 1}`
        })
    })

    return objects
}

function createStadiumConcertLayout() {
    const objects = []

    // Stage
    objects.push({
        type: 'STAGE',
        x: 400,
        y: 50,
        width: 400,
        height: 150,
        rotation: 0,
        fillColor: '#1e293b',
        label: 'Main Stage'
    })

    // Stadium sections (4 tiers)
    const sections = 4
    const rowsPerSection = 25
    const seatsPerRow = 50

    for (let section = 0; section < sections; section++) {
        const sectionY = 250 + (section * (rowsPerSection * 30 + 50))

        for (let row = 0; row < rowsPerSection; row++) {
            objects.push({
                type: 'GRID',
                subType: 'STADIUM',
                x: 100,
                y: sectionY + (row * 30),
                width: 1000,
                height: 25,
                rows: 1,
                cols: seatsPerRow,
                totalSeats: seatsPerRow,
                pricingTier: section === 0 ? 'VIP' : section === 1 ? 'PREMIUM' : 'GENERAL',
                fillColor: section === 0 ? '#fbbf24' : section === 1 ? '#3b82f6' : '#6b7280',
                label: `Section ${section + 1} - Row ${row + 1}`
            })
        }
    }

    return objects
}

function createCorporateEventLayout() {
    const objects = []

    // Stage
    objects.push({
        type: 'STAGE',
        x: 450,
        y: 50,
        width: 300,
        height: 80,
        rotation: 0,
        fillColor: '#1e293b',
        label: 'Presentation Stage'
    })

    // VIP round tables (front)
    for (let i = 0; i < 5; i++) {
        objects.push({
            type: 'ROUND_TABLE',
            x: 150 + (i * 200),
            y: 200,
            width: 120,
            height: 120,
            totalSeats: 8,
            pricingTier: 'VIP',
            fillColor: '#fbbf24',
            label: `VIP Table ${i + 1}`
        })
    }

    // Premium theater seating (middle)
    for (let row = 0; row < 8; row++) {
        objects.push({
            type: 'GRID',
            subType: 'RECTANGLE',
            x: 200,
            y: 400 + (row * 35),
            width: 800,
            height: 30,
            rows: 1,
            cols: 20,
            totalSeats: 20,
            pricingTier: 'PREMIUM',
            fillColor: '#3b82f6',
            label: `Row ${String.fromCharCode(65 + row)}`
        })
    }

    // General standing area (back)
    objects.push({
        type: 'STANDING',
        x: 200,
        y: 700,
        width: 800,
        height: 100,
        totalSeats: 100,
        pricingTier: 'GENERAL',
        fillColor: '#6b7280',
        label: 'General Admission'
    })

    return objects
}

function createClassroomTrainingLayout() {
    const objects = []

    // Whiteboard/Screen
    objects.push({
        type: 'STAGE',
        x: 400,
        y: 50,
        width: 400,
        height: 60,
        rotation: 0,
        fillColor: '#f3f4f6',
        label: 'Whiteboard'
    })

    // Grid seating (rows x cols)
    const rows = 10
    const cols = 10

    for (let row = 0; row < rows; row++) {
        objects.push({
            type: 'GRID',
            subType: 'RECTANGLE',
            x: 200,
            y: 150 + (row * 60),
            width: 800,
            height: 50,
            rows: 1,
            cols: cols,
            totalSeats: cols,
            pricingTier: 'GENERAL',
            fillColor: '#3b82f6',
            label: `Row ${row + 1}`
        })
    }

    return objects
}

function createBanquetHallLayout() {
    const objects = []

    // Head table
    objects.push({
        type: 'GRID',
        subType: 'RECTANGLE',
        x: 400,
        y: 100,
        width: 400,
        height: 80,
        rows: 1,
        cols: 10,
        totalSeats: 10,
        pricingTier: 'VIP',
        fillColor: '#fbbf24',
        label: 'Head Table'
    })

    // Round tables (10-seater)
    const rows = 5
    const cols = 8

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            objects.push({
                type: 'ROUND_TABLE',
                x: 100 + (col * 150),
                y: 250 + (row * 150),
                width: 120,
                height: 120,
                totalSeats: 10,
                pricingTier: row < 2 ? 'PREMIUM' : 'GENERAL',
                fillColor: row < 2 ? '#3b82f6' : '#6b7280',
                label: `Table ${row * cols + col + 1}`
            })
        }
    }

    return objects
}
