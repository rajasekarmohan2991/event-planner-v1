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

    console.log(`📝 [Team Member UPDATE] Updating member ${memberId} in event ${eventId} with role ${role}`)

    // Update role in EventRoleAssignment
    // We use raw query because the model might not be in the generated client
    // Note: updatedAt is quoted because it's a generated column or case sensitive
    await prisma.$queryRawUnsafe(`
      UPDATE "EventRoleAssignment"
      SET role = $1, "updatedAt" = NOW()
      WHERE id = $2
      RETURNING id
    `, role, memberId)

    return NextResponse.json({ success: true, message: 'Member updated successfully' })
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

    console.log(`🗑️ [Team Member DELETE] Removing member assignment ${memberId}`)

    // Use queryRawUnsafe instead of executeRawUnsafe to mimic GET behavior
    const result = await prisma.$queryRawUnsafe(`
      DELETE FROM "EventRoleAssignment"
      WHERE id = $1
      RETURNING id
    `, memberId) as any[]

    console.log(`✅ [Team Member DELETE] Deleted count: ${result.length}`)

    return new NextResponse(null, { status: 204 })
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
