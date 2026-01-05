import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyEmailToken } from '@/lib/email-verification'
export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const { token, email, name } = await req.json()

    if (!token || !email) {
      return NextResponse.json({ error: 'token and email are required' }, { status: 400 })
    }

    const result = await verifyEmailToken(token, email, name)

    if (!result.success) {
      // Check if message implies success (already verified case)
      if (result.message === 'Already verified') {
        return NextResponse.json({ success: true, userId: result.userId, message: result.message })
      }
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ success: true, userId: result.userId })
  } catch (err) {
    console.error('Verify error:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
