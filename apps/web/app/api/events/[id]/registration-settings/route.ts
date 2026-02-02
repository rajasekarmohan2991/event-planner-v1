import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { requireEventRole } from '@/lib/rbac'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions as any)
  if (!session) return NextResponse.json({ message: 'Not authenticated' }, { status: 401 })
  
  const allowed = await requireEventRole(params.id, ['STAFF', 'ORGANIZER', 'OWNER'])
  if (!allowed) return NextResponse.json({ message: 'Forbidden' }, { status: 403 })

  try {
    let settings = await prisma.registrationSettings.findUnique({
      where: { eventId: params.id }
    })

    // If no settings exist, create default ones
    if (!settings) {
      settings = await prisma.registrationSettings.create({
        data: {
          eventId: params.id,
          timeLimitMinutes: 15,
          noTimeLimit: false,
          allowTransfer: false,
          allowAppleWallet: true,
          showTicketAvailability: false,
          restrictDuplicates: 'event',
          registrationApproval: false,
          cancellationApproval: false,
          allowCheckinUnpaidOffline: false
        }
      })
    }

    return NextResponse.json(settings)
  } catch (e: any) {
    console.error('Registration settings GET error:', e)
    return NextResponse.json({ message: e?.message || 'Failed to load settings' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions as any)
  if (!session) return NextResponse.json({ message: 'Not authenticated' }, { status: 401 })
  
  const allowed = await requireEventRole(params.id, ['ORGANIZER', 'OWNER'])
  if (!allowed) return NextResponse.json({ message: 'Forbidden' }, { status: 403 })

  try {
    const body = await req.json()
    
    // Remove fields that shouldn't be updated
    const { id, eventId, createdAt, updatedAt, ...updateData } = body

    const settings = await prisma.registrationSettings.upsert({
      where: { eventId: params.id },
      create: {
        eventId: params.id,
        ...updateData
      },
      update: updateData
    })

    return NextResponse.json(settings)
  } catch (e: any) {
    console.error('Registration settings PUT error:', e)
    return NextResponse.json({ message: e?.message || 'Failed to save settings' }, { status: 500 })
  }
}
