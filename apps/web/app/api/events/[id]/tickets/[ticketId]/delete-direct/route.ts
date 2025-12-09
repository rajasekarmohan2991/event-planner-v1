import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function DELETE(req: NextRequest, { params }: { params: { id: string, ticketId: string } }) {
  try {
    const session = await getServerSession(authOptions as any)
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const eventId = parseInt(params.id)
    const ticketId = params.ticketId
    
    console.log(`🗑️ Deleting ticket class ${ticketId} for event ${eventId}`)

    // Check if ticket class exists and get details
    const ticketClass = await prisma.$queryRaw`
      SELECT id, name FROM ticket_classes 
      WHERE id = ${ticketId} AND event_id = ${eventId}
      LIMIT 1
    ` as any[]

    if (ticketClass.length === 0) {
      return NextResponse.json({ message: 'Ticket class not found' }, { status: 404 })
    }

    // Check if there are any registrations using this ticket class
    const registrationCount = await prisma.$queryRaw`
      SELECT COUNT(*)::int as count 
      FROM registrations 
      WHERE event_id = ${eventId} 
        AND (data_json->>'ticketClassId') = ${ticketId}
    ` as any[]

    const hasRegistrations = (registrationCount[0]?.count || 0) > 0

    if (hasRegistrations) {
      return NextResponse.json({ 
        message: 'Cannot delete ticket class with existing registrations',
        registrationCount: registrationCount[0]?.count || 0
      }, { status: 400 })
    }

    // Delete the ticket class
    await prisma.$executeRaw`
      DELETE FROM ticket_classes 
      WHERE id = ${ticketId} AND event_id = ${eventId}
    `

    console.log(`✅ Ticket class ${ticketId} deleted successfully`)

    return NextResponse.json({
      success: true,
      message: 'Ticket class deleted successfully',
      deletedTicket: {
        id: ticketId,
        name: ticketClass[0]?.name || 'Unknown'
      }
    })

  } catch (error: any) {
    console.error('❌ Ticket class deletion error:', error)
    
    // Handle foreign key constraint errors
    if (error.code === 'P2003') {
      return NextResponse.json({ 
        message: 'Cannot delete ticket class: it is referenced by other records',
        error: 'FOREIGN_KEY_CONSTRAINT'
      }, { status: 400 })
    }
    
    return NextResponse.json({ 
      message: error?.message || 'Failed to delete ticket class',
      error: error.code || 'UNKNOWN_ERROR'
    }, { status: 500 })
  }
}
