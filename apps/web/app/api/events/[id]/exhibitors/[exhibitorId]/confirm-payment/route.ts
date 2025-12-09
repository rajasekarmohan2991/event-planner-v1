import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function POST(req: NextRequest, { params }: { params: { id: string; exhibitorId: string } }) {
  const session = await getServerSession(authOptions as any)
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const paymentMethod = body.paymentMethod || 'Unknown'
    const transactionId = body.transactionId || ''

    // Update payment status to PAID
    await prisma.$executeRaw`
      UPDATE exhibitor_registrations
      SET payment_status = 'PAID',
          status = 'CONFIRMED',
          payment_method = ${paymentMethod},
          updated_at = NOW()
      WHERE id = ${BigInt(params.exhibitorId)}
    `

    return NextResponse.json({ 
      message: 'Payment confirmed. Exhibitor registration is now complete.'
    })
  } catch (e: any) {
    console.error('Payment confirmation error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
