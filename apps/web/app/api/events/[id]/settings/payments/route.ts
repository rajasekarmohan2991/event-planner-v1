import { NextRequest, NextResponse } from 'next/server'
import { checkPermissionInRoute } from '@/lib/permission-middleware'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const permissionCheck = await checkPermissionInRoute('events.view', 'View Payment Settings')
    if (permissionCheck) return permissionCheck

    return NextResponse.json({
      eventId: params.id,
      acceptPayments: true,
      currency: 'USD',
      paymentMethods: ['card', 'upi']
    })
  } catch (error: any) {
    console.error('Error fetching payment settings:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch settings' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const permissionCheck = await checkPermissionInRoute('events.edit', 'Update Payment Settings')
    if (permissionCheck) return permissionCheck

    const body = await req.json().catch(() => ({}))
    return NextResponse.json({ success: true, settings: body })
  } catch (error: any) {
    console.error('Error updating payment settings:', error)
    return NextResponse.json({ error: error.message || 'Failed to update settings' }, { status: 500 })
  }
}
