import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET /api/events/[id]/invites/verify?code=xxx - Verify invite code
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const url = new URL(req.url)
    const code = url.searchParams.get('code')

    if (!code) {
      return NextResponse.json({ valid: false, error: 'Invite code is required' }, { status: 400 })
    }

    const eventId = BigInt(params.id)

    const invite = await prisma.$queryRaw<any[]>`
      SELECT 
        id::text,
        email,
        invite_code as "inviteCode",
        expires_at as "expiresAt",
        used_at as "usedAt",
        status
      FROM event_invites
      WHERE event_id = ${eventId} AND invite_code = ${code}
      LIMIT 1
    `

    if (!invite || invite.length === 0) {
      return NextResponse.json({ valid: false, error: 'Invalid invite code' }, { status: 404 })
    }

    const inviteData = invite[0]

    // Check if already used
    if (inviteData.usedAt) {
      return NextResponse.json({ valid: false, error: 'Invite code has already been used' }, { status: 400 })
    }

    // Check if revoked
    if (inviteData.status === 'REVOKED') {
      return NextResponse.json({ valid: false, error: 'Invite code has been revoked' }, { status: 400 })
    }

    // Check if expired
    if (inviteData.expiresAt && new Date(inviteData.expiresAt) < new Date()) {
      return NextResponse.json({ valid: false, error: 'Invite code has expired' }, { status: 400 })
    }

    return NextResponse.json({
      valid: true,
      email: inviteData.email,
      inviteCode: inviteData.inviteCode
    })
  } catch (error: any) {
    console.error('Error verifying invite:', error)
    return NextResponse.json({ valid: false, error: 'Failed to verify invite' }, { status: 500 })
  }
}
