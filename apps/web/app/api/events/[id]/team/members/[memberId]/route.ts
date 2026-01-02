import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function PUT(req: NextRequest, { params }: { params: { id: string; memberId: string } }) {
  const session = await getServerSession(authOptions as any)
  if (!session) return NextResponse.json({ message: 'Not authenticated' }, { status: 401 })

  try {
    const body = await req.json()
    const { role } = body

    // Explicitly parse IDs
    const memberId = params.memberId // This is a String/UUID from the GET list
    const eventId = params.id      // This is usually a String from URL

    console.log(`📝 [Team Member UPDATE] Updating member ${memberId} in event ${eventId} with role ${role}`)

    // Update role in EventRoleAssignment
    // We use raw query because the model might not be in the generated client
    await prisma.$executeRawUnsafe(`
      UPDATE "EventRoleAssignment"
      SET role = $1, "updatedAt" = NOW()
      WHERE id = $2
    `, role, memberId)

    return NextResponse.json({ success: true, message: 'Member updated successfully' })
  } catch (e: any) {
    console.error('❌ [Team Member UPDATE] Failed:', e)
    return NextResponse.json({ message: e?.message || 'Update failed' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string; memberId: string } }) {
  const session = await getServerSession(authOptions as any)
  if (!session) return NextResponse.json({ message: 'Not authenticated' }, { status: 401 })

  try {
    const memberId = params.memberId
    console.log(`🗑️ [Team Member DELETE] Removing member assignment ${memberId}`)

    // Delete from EventRoleAssignment
    const result = await prisma.$executeRawUnsafe(`
      DELETE FROM "EventRoleAssignment"
      WHERE id = $1
    `, memberId)

    // Note: We don't delete the User, just the assignment.

    return new NextResponse(null, { status: 204 })
  } catch (e: any) {
    console.error('❌ [Team Member DELETE] Failed:', e)
    return NextResponse.json({ message: e?.message || 'Delete failed' }, { status: 500 })
  }
}
