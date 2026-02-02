import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(_req: NextRequest, { params }: { params: { id: string, vendorId: string } }) {
  try {
    const key = `event:${params.id}:vendor:${params.vendorId}`
    const kv = await prisma.keyValue.findFirst({
      where: { namespace: 'vendor_logs', key },
      select: { value: true }
    })
    const logs = Array.isArray(kv?.value) ? kv!.value : []
    return NextResponse.json({ logs })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to fetch vendor logs' }, { status: 500 })
  }
}
