import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
export const dynamic = 'force-dynamic'

const NS_PUB = 'event_site_published'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const item = await prisma.keyValue.findUnique({
    where: { namespace_key: { namespace: NS_PUB, key: params.id } },
    select: { value: true },
  })
  return NextResponse.json(item?.value || null)
}
