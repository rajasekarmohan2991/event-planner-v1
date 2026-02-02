import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { randomBytes } from 'crypto'
import { sendVerificationEmail } from '@/lib/email'
import { withRateLimit } from '@/lib/rateLimit'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const handler = async (req: NextRequest) => {
      const { email } = await req.json()

      if (!email) {
        return NextResponse.json(
          { message: 'Email is required' },
          { status: 400 }
        )
      }

      // Check if user exists
      const user = await prisma.user.findUnique({
        where: { email },
      })

      if (!user) {
        // Don't reveal if email exists
        return NextResponse.json(
          { message: 'If an account exists with this email, you will receive a verification link.' },
          { status: 200 }
        )
      }

      // Check if already verified
      if (user.emailVerified) {
        return NextResponse.json(
          { message: 'Email is already verified' },
          { status: 400 }
        )
      }

      // Generate new verification token
      const token = randomBytes(32).toString('hex')
      const expires = new Date()
      expires.setHours(expires.getHours() + 24) // 24 hour expiration

      // Delete any existing verification tokens for this email
      await prisma.verificationToken.deleteMany({
        where: { identifier: email }
      })

      // Create new verification token
      await prisma.verificationToken.create({
        data: {
          identifier: email,
          token,
          expires,
        },
      })

      // Send verification email (include email & name for verify page params)
      const encEmail = encodeURIComponent(email)
      const encName = encodeURIComponent(user.name || 'User')
      const baseUrl = (process.env.NEXTAUTH_URL || 'http://localhost:3001').replace(/\/$/, '')
      const verificationUrl = `${baseUrl}/auth/verify-email?token=${token}&email=${encEmail}&name=${encName}`
      await sendVerificationEmail({ to: email, name: user.name || 'User', verificationUrl })

      return NextResponse.json(
        { message: 'Verification email sent successfully' },
        { status: 200 }
      )
    }

    // Apply rate limiting (3 requests per 15 minutes per IP)
    const rateLimitedResponse = await withRateLimit(
      req,
      handler,
      {
        windowMs: 15 * 60 * 1000, // 15 minutes
        maxRequests: 3,
        burstTokens: 2,
      }
    )

    if (rateLimitedResponse) return rateLimitedResponse
    
    return await handler(req)
    
  } catch (error) {
    console.error('Resend verification error:', error)
    return NextResponse.json(
      { message: 'An error occurred while processing your request' },
      { status: 500 }
    )
  }
}
