import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function POST(req: NextRequest, { params }: { params: { id: string; exhibitorId: string } }) {
  const session = await getServerSession(authOptions as any)
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const reason = body.reason || 'Not specified'

    await prisma.$executeRaw`
      UPDATE exhibitor_registrations
      SET status = 'REJECTED', admin_notes = ${reason}, updated_at = NOW()
      WHERE id = ${BigInt(params.exhibitorId)}
    `

    return NextResponse.json({ message: 'Rejected' })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
