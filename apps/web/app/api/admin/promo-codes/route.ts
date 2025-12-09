import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth'
import { checkPermissionInRoute } from '@/lib/permission-middleware'

export async function GET(req: NextRequest) {
  try {
    // Check if user has permission to view promo codes
    const permissionCheck = await checkPermissionInRoute('promo_codes.view')
    if (permissionCheck) return permissionCheck

    const session = await getAuthSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch promo codes from Java API
    const javaApiUrl = process.env.JAVA_API_URL || 'http://localhost:8080'
    const response = await fetch(`${javaApiUrl}/api/promo-codes`, {
      headers: {
        'Authorization': `Bearer ${(session as any).accessToken || 'dummy-token'}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`Java API error: ${response.status}`)
    }

    const promoCodes = await response.json()
    return NextResponse.json(promoCodes)

  } catch (error: any) {
    console.error('Error fetching promo codes:', error)
    return NextResponse.json({ error: 'Failed to fetch promo codes' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    // Check if user has permission to create promo codes
    const permissionCheck = await checkPermissionInRoute('promo_codes.create')
    if (permissionCheck) return permissionCheck

    const session = await getAuthSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    
    // Validate required fields
    if (!body.code || !body.discountType || body.discountValue === undefined) {
      return NextResponse.json({ 
        error: 'Missing required fields: code, discountType, discountValue' 
      }, { status: 400 })
    }

    // Create promo code via Java API
    const javaApiUrl = process.env.JAVA_API_URL || 'http://localhost:8080'
    const response = await fetch(`${javaApiUrl}/api/promo-codes`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${(session as any).accessToken || 'dummy-token'}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ...body,
        createdBy: (session.user as any).id
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return NextResponse.json({ 
        error: errorData.message || 'Failed to create promo code' 
      }, { status: response.status })
    }

    const promoCode = await response.json()
    return NextResponse.json(promoCode, { status: 201 })

  } catch (error: any) {
    console.error('Error creating promo code:', error)
    return NextResponse.json({ error: 'Failed to create promo code' }, { status: 500 })
  }
}
