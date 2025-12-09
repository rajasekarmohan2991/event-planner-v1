import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession()
    if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    
    const role = String(((session as any).user?.role) || '')
    if (!['SUPER_ADMIN', 'ADMIN', 'EVENT_MANAGER'].includes(role)) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
    }

    const { action, registrationIds, eventId, data } = await req.json()

    let result: any = {}

    switch (action) {
      case 'approve':
        result = await prisma.$executeRaw`
          UPDATE registrations 
          SET data_json = jsonb_set(data_json, '{status}', '"approved"'),
              updated_at = NOW()
          WHERE id = ANY(${registrationIds}) AND event_id = ${eventId}
        `
        break

      case 'reject':
        result = await prisma.$executeRaw`
          UPDATE registrations 
          SET data_json = jsonb_set(data_json, '{status}', '"rejected"'),
              updated_at = NOW()
          WHERE id = ANY(${registrationIds}) AND event_id = ${eventId}
        `
        break

      case 'delete':
        result = await prisma.$executeRaw`
          DELETE FROM registrations 
          WHERE id = ANY(${registrationIds}) AND event_id = ${eventId}
        `
        break

      case 'export':
        const registrations = await prisma.$queryRaw`
          SELECT 
            id,
            event_id as "eventId",
            type,
            data_json as "dataJson",
            created_at as "createdAt"
          FROM registrations 
          WHERE ${registrationIds.length > 0 ? 
            prisma.$queryRaw`id = ANY(${registrationIds})` : 
            prisma.$queryRaw`event_id = ${eventId}`
          }
          ORDER BY created_at DESC
        `
        
        // Convert to CSV format
        const csvData = (registrations as any[]).map(reg => ({
          'Registration ID': reg.id,
          'Event ID': reg.eventId,
          'Type': reg.type,
          'Name': reg.dataJson?.name || '',
          'Email': reg.dataJson?.email || '',
          'Phone': reg.dataJson?.phone || '',
          'Status': reg.dataJson?.status || 'pending',
          'Payment Status': reg.dataJson?.payment?.status || 'pending',
          'Amount': reg.dataJson?.priceInr || 0,
          'Promo Code': reg.dataJson?.promoCode || '',
          'Created At': new Date(reg.createdAt).toLocaleString()
        }))

        return NextResponse.json({
          success: true,
          data: csvData,
          count: csvData.length
        })

      case 'send_email':
        // Bulk email sending
        const emailRegistrations = await prisma.$queryRaw`
          SELECT data_json->>'email' as email, data_json->>'name' as name
          FROM registrations 
          WHERE id = ANY(${registrationIds}) AND event_id = ${eventId}
          AND data_json->>'email' IS NOT NULL
        `

        const emailPromises = (emailRegistrations as any[]).map(async (reg) => {
          try {
            await fetch(`${process.env.NEXTAUTH_URL}/api/email/send`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                to: reg.email,
                subject: data.subject || 'Event Update',
                html: data.message || 'Thank you for registering!',
                text: data.message || 'Thank you for registering!'
              })
            })
            return { email: reg.email, status: 'sent' }
          } catch (error) {
            return { email: reg.email, status: 'failed', error: error }
          }
        })

        const emailResults = await Promise.all(emailPromises)
        result = {
          sent: emailResults.filter(r => r.status === 'sent').length,
          failed: emailResults.filter(r => r.status === 'failed').length,
          details: emailResults
        }
        break

      case 'update_status':
        result = await prisma.$executeRaw`
          UPDATE registrations 
          SET data_json = jsonb_set(data_json, '{status}', ${JSON.stringify(data.status)}),
              updated_at = NOW()
          WHERE id = ANY(${registrationIds}) AND event_id = ${eventId}
        `
        break

      case 'assign_tickets':
        // Generate QR codes for selected registrations
        const ticketUpdates = registrationIds.map(async (regId: number) => {
          const qrData = {
            registrationId: regId,
            eventId: eventId,
            timestamp: new Date().toISOString(),
            ticketType: data.ticketType || 'general'
          }
          const qrCode = Buffer.from(JSON.stringify(qrData)).toString('base64')
          
          return prisma.$executeRaw`
            UPDATE registrations 
            SET data_json = jsonb_set(
              jsonb_set(data_json, '{qrCode}', ${JSON.stringify(qrCode)}),
              '{ticketAssigned}', 'true'
            ),
            updated_at = NOW()
            WHERE id = ${regId} AND event_id = ${eventId}
          `
        })

        await Promise.all(ticketUpdates)
        result = { assigned: registrationIds.length }
        break

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      action,
      affected: typeof result === 'number' ? result : registrationIds.length,
      data: result
    })

  } catch (error: any) {
    console.error('Bulk operation error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
