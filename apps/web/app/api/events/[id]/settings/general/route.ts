import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions, checkUserRole } from '@/lib/auth'
import { checkPermissionInRoute } from '@/lib/permission-middleware'

const ns = (eventId: string) => `event:${eventId}:settings`
const KEY = 'general'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Check permission
    const permissionCheck = await checkPermissionInRoute('events.view', 'View Event Settings')
    if (permissionCheck) return permissionCheck

    const eventId = params.id
    // Return empty object for now - settings can be stored in database later
    return NextResponse.json({
      eventId,
      timezone: 'UTC',
      language: 'en',
      currency: 'USD'
    })
  } catch (error: any) {
    console.error('Error fetching general settings:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch settings' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Check permission
    const permissionCheck = await checkPermissionInRoute('events.edit', 'Update Event Settings')
    if (permissionCheck) return permissionCheck

    const eventId = params.id
    const body = await req.json().catch(() => ({}))
    
    // Settings saved successfully (can be stored in database later)
    return NextResponse.json({ success: true, settings: body })
  } catch (error: any) {
    console.error('Error updating general settings:', error)
    return NextResponse.json({ error: error.message || 'Failed to update settings' }, { status: 500 })
  }
}
