import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET /api/rsvp/respond - Handle RSVP response from email link
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const token = searchParams.get('token')
    const response = searchParams.get('response')

    if (!token || !response) {
      return NextResponse.redirect(new URL('/rsvp/error?message=Invalid+RSVP+link', req.url))
    }

    // Validate response value
    const validResponses = ['ATTENDING', 'MAYBE', 'NOT_ATTENDING']
    if (!validResponses.includes(response)) {
      return NextResponse.redirect(new URL('/rsvp/error?message=Invalid+response', req.url))
    }

    // Find RSVP record by token
    const rsvpRecord = await prisma.$queryRaw`
      SELECT id, event_id, email, response
      FROM rsvp_responses
      WHERE response_token = ${token}
    ` as any[]

    if (rsvpRecord.length === 0) {
      return NextResponse.redirect(new URL('/rsvp/error?message=RSVP+not+found', req.url))
    }

    const rsvp = rsvpRecord[0]

    // Update RSVP response
    await prisma.$executeRaw`
      UPDATE rsvp_responses
      SET 
        response = ${response},
        responded_at = NOW(),
        updated_at = NOW()
      WHERE response_token = ${token}
    `

    // Get event details for confirmation page
    const eventResult = await prisma.$queryRaw`
      SELECT id, name, start_date, location
      FROM events
      WHERE id = ${rsvp.event_id}
    ` as any[]

    const event = eventResult[0]

    // Redirect to success page with event info
    const successUrl = new URL('/rsvp/success', req.url)
    successUrl.searchParams.set('response', response)
    successUrl.searchParams.set('eventName', event.name)
    successUrl.searchParams.set('eventDate', new Date(event.start_date).toLocaleDateString())
    successUrl.searchParams.set('email', rsvp.email)

    return NextResponse.redirect(successUrl)
  } catch (error: any) {
    console.error('RSVP response error:', error)
    return NextResponse.redirect(new URL('/rsvp/error?message=Failed+to+process+RSVP', req.url))
  }
}

// POST /api/rsvp/respond - Handle RSVP response from API
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { token, response, notes } = body

    if (!token || !response) {
      return NextResponse.json(
        { error: 'Missing token or response' },
        { status: 400 }
      )
    }

    // Validate response value
    const validResponses = ['ATTENDING', 'MAYBE', 'NOT_ATTENDING']
    if (!validResponses.includes(response)) {
      return NextResponse.json(
        { error: 'Invalid response value' },
        { status: 400 }
      )
    }

    // Find and update RSVP record
    const rsvpRecord = await prisma.$queryRaw`
      SELECT id, event_id, email
      FROM rsvp_responses
      WHERE response_token = ${token}
    ` as any[]

    if (rsvpRecord.length === 0) {
      return NextResponse.json(
        { error: 'RSVP not found' },
        { status: 404 }
      )
    }

    // Update RSVP response
    await prisma.$executeRaw`
      UPDATE rsvp_responses
      SET 
        response = ${response},
        responded_at = NOW(),
        notes = ${notes || null},
        updated_at = NOW()
      WHERE response_token = ${token}
    `

    return NextResponse.json({
      success: true,
      message: 'RSVP response recorded successfully'
    })
  } catch (error: any) {
    console.error('RSVP response error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to process RSVP' },
      { status: 500 }
    )
  }
}
