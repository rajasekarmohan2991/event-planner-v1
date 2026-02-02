import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { checkPromo } from '@/lib/promo'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest, { params }: { params: { code: string } }) {
  const session = await getServerSession(authOptions)
  const { searchParams } = new URL(req.url)
  const subtotal = Number(searchParams.get('subtotal') || '0')

  const result = await checkPromo({
    code: params.code.toUpperCase(),
    userId: session?.user?.id ? BigInt(session.user.id as unknown as string) : undefined,
    subtotal: isNaN(subtotal) ? 0 : subtotal,
  })

  return NextResponse.json(result)
}
