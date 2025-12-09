import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getTenantId } from '@/lib/tenant-context'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Use params.id directly as string since schema uses String for eventId in Exhibitor model
    // If we need to log it as BigInt for consistency, we can try/catch it or just log string
    const eventId = params.id 
    const tenantId = getTenantId()
    const body = await req.json()
    
    // Calculate booth cost (example pricing)
    const boothPrices: Record<string, number> = {
      '3x3': 5000,
      '6x6': 15000,
      '9x9': 30000,
      '12x12': 50000
    }
    
    const boothCost = (boothPrices[body.booth_size] || 5000) * (body.number_of_booths || 1)
    const additionalFees = 
      (body.power_supply ? 1000 : 0) +
      (body.lighting ? 1500 : 0) +
      (body.internet_connection ? 2000 : 0) +
      (body.storage_space ? 1000 : 0)
    
    const totalAmount = boothCost + additionalFees
    
    // Create Exhibitor and Booth using Prisma models
    const exhibitor = await prisma.exhibitor.create({
      data: {
        eventId: params.id,
        name: body.company_name || 'Unknown Company',
        company: body.company_name, // Also map to company field
        contactName: body.contact_name || 'Unknown Contact',
        contactEmail: body.contact_email || 'noemail@example.com',
        contactPhone: body.contact_phone || '0000000000',
        website: body.website_url || '',
        companyDescription: body.company_description || '',
        productsServices: body.products_services || '',
        businessAddress: [body.address, body.city, body.state_province, body.postal_code, body.country].filter(Boolean).join(', '),
        boothType: body.booth_type || 'STANDARD',
        boothOption: body.booth_size || '3x3',
        notes: `Power: ${body.power_supply}, Lighting: ${body.lighting}, Internet: ${body.internet_connection}, Storage: ${body.storage_space}. Brand: ${body.brand_name}`,
        tenantId: tenantId,
        booths: {
          create: {
            eventId: params.id,
            boothNumber: 'PENDING',
            sizeSqm: body.booth_size === '3x3' ? 9 : body.booth_size === '6x6' ? 36 : 9,
            priceInr: totalAmount,
            status: 'RESERVED',
            type: 'STANDARD',
            tenantId: tenantId
          }
        }
      },
      include: {
        booths: true
      }
    })

    // Log registration (skip querying events table to avoid errors if it doesn't exist)
    console.log(`Exhibitor registered for event ID: ${eventId}`)
    console.log(`Company: ${body.company_name}, Contact: ${body.contact_email}`)
    
    return NextResponse.json({ 
      message: 'Registration submitted successfully.',
      totalAmount,
      status: 'PENDING_APPROVAL',
      exhibitor
    }, { status: 201 })
  } catch (error: any) {
    console.error('Exhibitor registration error:', error)
    return NextResponse.json({ error: error.message || 'Registration failed' }, { status: 500 })
  }
}
