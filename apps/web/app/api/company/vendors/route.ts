
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { getTenantId } from '@/lib/tenant-context'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions as any) as any
        if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

        // Tenant isolation
        const tenantId = getTenantId()

        // Fetch all exhibitors for this tenant
        // Since Exhibitor requires eventId, we join with Event to get event name
        const vendors = await prisma.exhibitor.findMany({
            where: {
                tenantId: tenantId ? tenantId : undefined,
            },
            include: {
                booths: true,
            },
            orderBy: { createdAt: 'desc' }
        })

        // Also fetch events list for the "Add Vendor" dropdown
        const events = await prisma.event.findMany({
            where: { tenantId: tenantId || undefined },
            select: { id: true, name: true }
        })

        return NextResponse.json({ vendors, events })
    } catch (error: any) {
        console.error('Error fetching vendors:', error)
        return NextResponse.json({ message: 'Failed to fetch vendors', error: error.message }, { status: 500 })
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions as any) as any
        if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

        const tenantId = getTenantId()
        const body = await req.json()

        const {
            name, eventId, contactName, contactEmail, contactPhone,
            companyDescription, website, boothOption
        } = body

        if (!name || !eventId) {
            return NextResponse.json({ message: 'Name and Event ID are required' }, { status: 400 })
        }

        // Convert eventId string to BigInt if needed, but schema says String for eventId on generic lookups?
        // Wait, let's check schema. Event.id is BigInt, but Exhibitor.eventId is String per my previous `view_file`?
        // Let's re-verify schema.
        // Schema says:
        // model Exhibitor { eventId String ... }
        // model Event { id BigInt ... }
        // This is a mismatch in the schema I saw earlier! 
        // "eventId String" in Exhibitor but "id BigInt" in Event?
        // Actually, looking at the schema file I viewed earlier (Step 644/648):
        // model Event { id BigInt ... }
        // model Exhibitor { eventId String ... }
        // This suggests there is NO foreign key constraint at DB level or it's loose.
        // Or `eventId` in Exhibitor refers to something else? 
        // No, likely a schema inconsistency. I must cast Event ID to String when saving to Exhibitor.

        const newVendor = await prisma.exhibitor.create({
            data: {
                name,
                eventId: String(eventId),
                contactName,
                contactEmail,
                contactPhone,
                website,
                companyDescription,
                boothOption,
                tenantId: tenantId || undefined,
            }
        })

        return NextResponse.json(newVendor, { status: 201 })
    } catch (error: any) {
        console.error('Error creating vendor:', error)
        return NextResponse.json({ message: 'Failed to create vendor', error: error.message }, { status: 500 })
    }
}
