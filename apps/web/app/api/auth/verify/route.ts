import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function POST(req: Request) {
  try {
    const { token, email, name } = await req.json()
    if (!token || !email) {
      return NextResponse.json({ error: 'token and email are required' }, { status: 400 })
    }

    // Look up token
    const vt = await prisma.verificationToken.findUnique({
      where: { identifier_token: { identifier: email, token } },
    })

    if (!vt) {
      // Check if user is already verified. If so, return success to prevent confusing "Verification Failed" message
      // This happens if the link was clicked twice or scanned by email security software
      const existingUser = await prisma.user.findUnique({ where: { email } })
      if (existingUser?.emailVerified) {
        return NextResponse.json({ success: true, userId: String(existingUser.id), message: 'Already verified' })
      }
      return NextResponse.json({ error: 'Invalid or already used token' }, { status: 400 })
    }
    if (vt.expires < new Date()) {
      // Cleanup expired token
      await prisma.verificationToken.delete({ where: { identifier_token: { identifier: email, token } } })
      return NextResponse.json({ error: 'Token expired' }, { status: 400 })
    }

    // Upsert user and mark verified
    const verifiedAt = new Date()
    const user = await prisma.user.upsert({
      where: { email },
      create: {
        email,
        name: name || email.split('@')[0],
        role: 'USER',
        emailVerified: verifiedAt,
      },
      update: { emailVerified: verifiedAt },
    })

    // Remove the used token
    await prisma.verificationToken.delete({ where: { identifier_token: { identifier: email, token } } })

    // If there was an event role invite, assign it now
    try {
      const meta = await prisma.keyValue.findUnique({
        where: { namespace_key: { namespace: 'invite_meta', key: token } },
      })
      if (meta) {
        const { eventId, role: eventRole } = (meta.value as any) || {}
        if (
          typeof eventId === 'string' &&
          (eventRole === 'ORGANIZER' || eventRole === 'STAFF')
        ) {
          await prisma.eventRoleAssignment.upsert({
            where: { eventId_userId: { eventId, userId: user.id } },
            create: { eventId, userId: user.id, role: eventRole },
            update: { role: eventRole },
          })
        }
        // cleanup metadata
        await prisma.keyValue.delete({ where: { namespace_key: { namespace: 'invite_meta', key: token } } })
      }
    } catch (e) {
      console.warn('Role assignment meta not processed:', e)
    }

    return NextResponse.json({ success: true, userId: String(user.id) })
  } catch (err) {
    console.error('Verify error:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
