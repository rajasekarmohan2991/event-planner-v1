import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { redeemPromo } from '@/lib/promo'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest, { params }: { params: { code: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { subtotal = 0, orderId } = await req.json()
    const result = await redeemPromo({
      code: params.code.toUpperCase(),
      userId: BigInt(session.user.id as unknown as string),
      subtotal: Number(subtotal) || 0,
      orderId,
    })

    if (!result.valid) return NextResponse.json(result, { status: 400 })
    return NextResponse.json(result)
  } catch (e: any) {
    return NextResponse.json({ error: 'Failed to redeem', details: e?.message }, { status: 500 })
  }
}
