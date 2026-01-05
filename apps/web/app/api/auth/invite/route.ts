import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import crypto from 'crypto'
import { sendVerificationEmail } from '@/lib/email'
export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const { email, name, eventId, role } = await req.json()
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const token = crypto.randomBytes(32).toString('hex')
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24h

    await prisma.verificationToken.deleteMany({ where: { identifier: email } })
    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token,
        expires,
      },
    })

    if (eventId && typeof eventId === 'string' && role && (role === 'ORGANIZER' || role === 'STAFF')) {
      await prisma.keyValue.upsert({
        where: { namespace_key: { namespace: 'invite_meta', key: token } },
        create: {
          namespace: 'invite_meta',
          key: token,
          value: { eventId, role, email },
        },
        update: { value: { eventId, role, email } },
      })
    }

    const verificationUrl = `${process.env.NEXTAUTH_URL}/auth/verify-email?token=${encodeURIComponent(
      token
    )}&email=${encodeURIComponent(email)}${name ? `&name=${encodeURIComponent(name)}` : ''}`

    let emailSent = false
    try {
      await sendVerificationEmail({ to: email, name: name || email.split('@')[0], verificationUrl })
      emailSent = true
    } catch (e) {
      console.error('Invite email send failed:', e)
    }

    return NextResponse.json({ success: true, emailSent, verificationUrl })
  } catch (err) {
    console.error('Invite error:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
