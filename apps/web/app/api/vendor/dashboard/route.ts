import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = (session.user as any).role
    if (userRole !== 'VENDOR') {
      return NextResponse.json({ error: 'Access denied - Vendor role required' }, { status: 403 })
    }

    const userId = (session.user as any).id
    const vendorId = (session.user as any).vendorId

    if (!vendorId) {
      return NextResponse.json({ error: 'No vendor profile linked to this account' }, { status: 404 })
    }

    // Fetch vendor company details
    const company = await prisma.$queryRaw<any[]>`
      SELECT 
        id, company_name, email, phone, city, country,
        verification_status as status, avg_rating, total_reviews
      FROM service_providers
      WHERE id = ${vendorId}
      LIMIT 1
    `

    if (!company || company.length === 0) {
      return NextResponse.json({ error: 'Vendor profile not found' }, { status: 404 })
    }

    // Fetch services
    const services = await prisma.$queryRaw<any[]>`
      SELECT id, name, description, base_price, price_unit, is_active
      FROM provider_services
      WHERE provider_id = ${vendorId}
      ORDER BY created_at DESC
    `

    // Fetch recent bookings
    const bookings = await prisma.$queryRaw<any[]>`
      SELECT 
        vb.id, vb.amount, vb.status, vb.created_at as booking_date,
        e.title as event_name,
        ps.name as service_name
      FROM vendor_bookings vb
      LEFT JOIN events e ON vb.event_id = e.id
      LEFT JOIN provider_services ps ON vb.service_id = ps.id
      WHERE vb.provider_id = ${vendorId}
      ORDER BY vb.created_at DESC
      LIMIT 10
    `

    // Calculate payment summary
    const paymentSummary = await prisma.$queryRaw<any[]>`
      SELECT 
        COALESCE(SUM(CASE WHEN status = 'COMPLETED' THEN amount ELSE 0 END), 0) as paid,
        COALESCE(SUM(CASE WHEN status = 'PENDING' THEN amount ELSE 0 END), 0) as pending,
        COALESCE(SUM(amount), 0) as total_earned
      FROM vendor_bookings
      WHERE provider_id = ${vendorId}
    `

    // Calculate stats
    const stats = await prisma.$queryRaw<any[]>`
      SELECT 
        COUNT(*) as total_bookings,
        COUNT(CASE WHEN status = 'PENDING' THEN 1 END) as pending_bookings,
        COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) as completed_bookings
      FROM vendor_bookings
      WHERE provider_id = ${vendorId}
    `

    const activeServices = services.filter((s: any) => s.is_active).length

    return NextResponse.json({
      company: company[0],
      services: services || [],
      bookings: bookings || [],
      payments: {
        total_earned: Number(paymentSummary[0]?.total_earned) || 0,
        pending: Number(paymentSummary[0]?.pending) || 0,
        paid: Number(paymentSummary[0]?.paid) || 0
      },
      stats: {
        total_bookings: Number(stats[0]?.total_bookings) || 0,
        active_services: activeServices,
        pending_bookings: Number(stats[0]?.pending_bookings) || 0,
        completed_bookings: Number(stats[0]?.completed_bookings) || 0
      }
    })
  } catch (error: any) {
    console.error('Error fetching vendor dashboard:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
