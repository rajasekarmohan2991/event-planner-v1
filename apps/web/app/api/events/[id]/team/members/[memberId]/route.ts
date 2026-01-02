import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

// Helper to safely get params
async function getParams(context: any) {
  if (context.params instanceof Promise) {
    return await context.params
  }
  return context.params
}

export async function PUT(req: NextRequest, context: any) {
  const session = await getServerSession(authOptions as any)
  if (!session) return NextResponse.json({ message: 'Not authenticated' }, { status: 401 })

  try {
    const params = await getParams(context)
    const body = await req.json()
    const { role } = body
    const memberId = params.memberId
    const eventId = params.id

    console.log(`📝 [Team Member UPDATE] Updating member/invitation ${memberId} in event ${eventId} with role ${role}`)

    // Try updating in EventRoleAssignment first
    let result = await prisma.$queryRawUnsafe(`
      UPDATE "EventRoleAssignment"
      SET role = $1, "updatedAt" = NOW()
      WHERE id = $2
      RETURNING id
    `, role, memberId) as any[]

    if (result.length > 0) {
      console.log(`✅ [Team Member UPDATE] Updated in EventRoleAssignment`)
      return NextResponse.json({ success: true, message: 'Member updated successfully' })
    }

    // If not found in assignments, try updating in invitations
    result = await prisma.$queryRawUnsafe(`
      UPDATE event_team_invitations
      SET role = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING id
    `, role, memberId) as any[]

    if (result.length > 0) {
      console.log(`✅ [Team Member UPDATE] Updated in event_team_invitations`)
      return NextResponse.json({ success: true, message: 'Invitation updated successfully' })
    }

    console.log(`⚠️ [Team Member UPDATE] Member/invitation ${memberId} not found in either table`)
    return NextResponse.json({ message: 'Member not found' }, { status: 404 })

  } catch (e: any) {
    console.error('❌ [Team Member UPDATE] Failed:', e)
    return NextResponse.json({
      message: 'Update failed',
      error: e.message,
      hint: 'Check server logs'
    }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, context: any) {
  const session = await getServerSession(authOptions as any)
  if (!session) return NextResponse.json({ message: 'Not authenticated' }, { status: 401 })

  try {
    const params = await getParams(context)
    const memberId = params.memberId

    console.log(`🗑️ [Team Member DELETE] Removing member/invitation ${memberId}`)

    // Try deleting from EventRoleAssignment first
    let result = await prisma.$queryRawUnsafe(`
      DELETE FROM "EventRoleAssignment"
      WHERE id = $1
      RETURNING id
    `, memberId) as any[]

    if (result.length > 0) {
      console.log(`✅ [Team Member DELETE] Deleted from EventRoleAssignment`)
      return new NextResponse(null, { status: 204 })
    }

    // If not found in assignments, try deleting from invitations
    result = await prisma.$queryRawUnsafe(`
      DELETE FROM event_team_invitations
      WHERE id = $1
      RETURNING id
    `, memberId) as any[]

    if (result.length > 0) {
      console.log(`✅ [Team Member DELETE] Deleted from event_team_invitations`)
      return new NextResponse(null, { status: 204 })
    }

    console.log(`⚠️ [Team Member DELETE] Member/invitation ${memberId} not found in either table`)
    return NextResponse.json({ message: 'Member not found' }, { status: 404 })

  } catch (e: any) {
    console.error('❌ [Team Member DELETE] Failed:', e)
    return NextResponse.json({
      message: 'Delete failed',
      error: e.message,
      code: e.code,
      hint: 'Check server logs'
    }, { status: 500 })
  }
}
