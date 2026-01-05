import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth'
import { checkPermissionInRoute } from '@/lib/permission-middleware'
export const dynamic = 'force-dynamic'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Check if user has permission to update promo codes
    const permissionCheck = await checkPermissionInRoute('promo_codes.edit')
    if (permissionCheck) return permissionCheck

    const session = await getAuthSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    
    // Update promo code via Java API
    const javaApiUrl = process.env.JAVA_API_URL || 'http://localhost:8080'
    const response = await fetch(`${javaApiUrl}/api/promo-codes/${params.id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${(session as any).accessToken || 'dummy-token'}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ...body,
        updatedBy: (session.user as any).id
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return NextResponse.json({ 
        error: errorData.message || 'Failed to update promo code' 
      }, { status: response.status })
    }

    const promoCode = await response.json()
    return NextResponse.json(promoCode)

  } catch (error: any) {
    console.error('Error updating promo code:', error)
    return NextResponse.json({ error: 'Failed to update promo code' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Check if user has permission to delete promo codes
    const permissionCheck = await checkPermissionInRoute('promo_codes.delete')
    if (permissionCheck) return permissionCheck

    const session = await getAuthSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Delete promo code via Java API
    const javaApiUrl = process.env.JAVA_API_URL || 'http://localhost:8080'
    const response = await fetch(`${javaApiUrl}/api/promo-codes/${params.id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${(session as any).accessToken || 'dummy-token'}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return NextResponse.json({ 
        error: errorData.message || 'Failed to delete promo code' 
      }, { status: response.status })
    }

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error('Error deleting promo code:', error)
    return NextResponse.json({ error: 'Failed to delete promo code' }, { status: 500 })
  }
}
