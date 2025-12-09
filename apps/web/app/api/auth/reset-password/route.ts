import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { hash } from 'bcryptjs'
import { withRateLimit } from '@/lib/rateLimit'

export async function POST(req: NextRequest) {
  try {
    const handler = async (req: NextRequest) => {
      const { token, password } = await req.json()

      // Validate input
      if (!token || !password) {
        return NextResponse.json(
          { message: 'Token and password are required' },
          { status: 400 }
        )
      }

      if (password.length < 8) {
        return NextResponse.json(
          { message: 'Password must be at least 8 characters long' },
          { status: 400 }
        )
      }

      // Find the token
      const resetToken = await prisma.passwordResetToken.findUnique({
        where: { token },
      })

      // Check if token exists and is not expired
      if (!resetToken || new Date() > resetToken.expires) {
        return NextResponse.json(
          { message: 'Invalid or expired token' },
          { status: 400 }
        )
      }

      // Find the user
      const user = await prisma.user.findUnique({
        where: { email: resetToken.email },
      })

      if (!user) {
        return NextResponse.json(
          { message: 'User not found' },
          { status: 404 }
        )
      }

      // Update the password
      const hashedPassword = await hash(password, 12)
      
      // Ensure email is a string before using it in the query
      if (!user.email) {
        throw new Error('User email is required')
      }
      
      await prisma.$transaction([
        prisma.user.update({
          where: { id: user.id },
          data: { password: hashedPassword },
        }),
        prisma.passwordResetToken.deleteMany({
          where: { email: user.email },
        }),
      ])

      return NextResponse.json(
        { message: 'Password reset successfully' },
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
    console.error('Reset password error:', error)
    return NextResponse.json(
      { message: 'An error occurred while processing your request' },
      { status: 500 }
    )
  }
}
