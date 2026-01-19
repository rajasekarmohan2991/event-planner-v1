
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { requireEventRole } from '@/lib/rbac'
import prisma from '@/lib/prisma'
export const dynamic = 'force-dynamic'

export async function POST(
    req: NextRequest,
    { params }: { params: { id: string, registrationId: string } }
) {
    try {
        const session = await getServerSession(authOptions as any)
        if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

        // Check permission - STAFF or higher
        const allowed = await requireEventRole(params.id, ['STAFF', 'ORGANIZER', 'OWNER'])
        if (!allowed) return NextResponse.json({ message: 'Forbidden' }, { status: 403 })

        const { checkedIn } = await req.json()
        if (typeof checkedIn !== 'boolean') {
            return NextResponse.json({ message: 'checkedIn boolean required' }, { status: 400 })
        }

        const eventId = parseInt(params.id)
        const registrationId = params.registrationId

        // 1. Get current data
        const rows = await prisma.$queryRaw<any[]>`
      SELECT data_json, check_in_status FROM registrations 
      WHERE id = ${registrationId} AND event_id = ${eventId} 
      LIMIT 1
    `

        if (rows.length === 0) {
            return NextResponse.json({ message: 'Registration not found' }, { status: 404 })
        }

        const currentData = rows[0].data_json || {}
        const dataObj = typeof currentData === 'string' ? JSON.parse(currentData) : currentData

        // 2. Prepare updates
        const now = new Date().toISOString()
        const newData = {
            ...dataObj,
            checkedIn: checkedIn,
            checkedInAt: checkedIn ? (dataObj.checkedInAt || now) : null,
            checkedInBy: checkedIn ? ((session as any)?.user?.id || 'admin') : null
        }

        // Overwrite time if checking in now
        if (checkedIn) {
            newData.checkedInAt = now;
        }

        // 3. Update DB
        const newStatus = checkedIn ? 'CHECKED_IN' : 'PENDING'

        await prisma.$executeRaw`
      UPDATE registrations
      SET 
        data_json = ${JSON.stringify(newData)},
        check_in_status = ${newStatus},
        check_in_time = ${checkedIn ? new Date() : null},
        updated_at = NOW()
      WHERE id = ${registrationId} AND event_id = ${eventId}
    `

        // Log it
        console.log(`✅ Toggled check-in for reg ${params.registrationId}: ${checkedIn}`)

        return NextResponse.json({
            ok: true,
            checkedIn,
            status: newStatus,
            checkedInAt: newData.checkedInAt
        })

    } catch (error: any) {
        console.error('Toggle check-in error:', error)
        return NextResponse.json({ message: error?.message || 'Update failed' }, { status: 500 })
    }
}
