import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions, checkUserRole } from '@/lib/auth'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || !checkUserRole(session, ['ADMIN', 'ORGANIZER', 'STAFF'])) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const eventId = params.id
  const body = await req.json().catch(() => ({}))
  const { registrationId, email } = body

  try {
    let registration = null
    if (registrationId) {
      registration = await prisma.registration.findFirst({
        where: { id: registrationId, eventId }
      })
    } else if (email) {
      registration = await prisma.registration.findFirst({
        where: { email, eventId }
      })
    }

    if (!registration) {
      return NextResponse.json({ message: 'Registration not found' }, { status: 404 })
    }

    // Update to checked in
    const updated = await prisma.registration.update({
      where: { id: registration.id },
      data: { status: 'APPROVED', updatedAt: new Date() }
    })

    return NextResponse.json({ 
      success: true, 
      registration: updated,
      message: 'Check-in successful'
    })
  } catch (error) {
    console.error('Check-in error:', error)
    return NextResponse.json({ message: 'Check-in failed' }, { status: 500 })
  }
}
