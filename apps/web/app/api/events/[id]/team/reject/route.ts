import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { searchParams } = new URL(req.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.redirect(new URL('/error?message=Invalid invitation link', req.url))
    }

    // Find and update invitation status to REJECTED
    const result = await prisma.$executeRaw`
      UPDATE event_team_invitations 
      SET status = 'REJECTED', updated_at = NOW()
      WHERE token = ${token} AND event_id = ${params.id} AND status = 'PENDING'
    `

    if (result === 0) {
      return NextResponse.redirect(new URL('/error?message=Invitation not found or already processed', req.url))
    }

    // Redirect to rejection confirmation page
    return NextResponse.redirect(new URL('/invitation-rejected?message=You have declined the invitation', req.url))

  } catch (error: any) {
    console.error('Reject error:', error)
    return NextResponse.redirect(new URL('/error?message=Something went wrong', req.url))
  }
}
