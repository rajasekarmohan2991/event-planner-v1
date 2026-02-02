import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { randomBytes } from 'crypto'
import { sendPasswordResetEmail } from '@/lib/email'
import { withRateLimit } from '@/lib/rateLimit'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const handler = async (req: NextRequest) => {
      const { email } = await req.json()

      // Validate input
      if (!email) {
        return NextResponse.json(
          { message: 'Email is required' },
          { status: 400 }
        )
      }

      // Always return success to prevent email enumeration
      // But only process if the email exists
      const user = await prisma.user.findUnique({
        where: { email },
      })

      if (user) {
        // Generate reset token
        const resetToken = randomBytes(32).toString('hex')
        const expires = new Date()
        expires.setHours(expires.getHours() + 1) // 1 hour expiration

        // Delete any existing password reset tokens for this email
        await prisma.passwordResetToken.deleteMany({
          where: { email }
        })

        // Create new password reset token
        await prisma.passwordResetToken.create({
          data: {
            email,
            token: resetToken,
            expires,
          },
        })

        // Send password reset email
        await sendPasswordResetEmail(email, resetToken)
      }

      // Always return success to prevent email enumeration
      return NextResponse.json(
        { message: 'If an account exists with this email, you will receive a password reset link.' },
        { status: 200 }
      )
    }

    // Apply rate limiting (5 requests per 15 minutes per IP)
    const rateLimitedResponse = await withRateLimit(
      req,
      handler,
      {
        windowMs: 15 * 60 * 1000, // 15 minutes
        maxRequests: 5, // Limit each IP to 5 requests per windowMs
        burstTokens: 3, // Allow burst of 3 requests
      }
    )

    if (rateLimitedResponse) return rateLimitedResponse
    
    return await handler(req)
    
  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json(
      { message: 'An error occurred while processing your request' },
      { status: 500 }
    )
  }
}
