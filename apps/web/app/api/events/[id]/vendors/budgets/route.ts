import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { Prisma } from '@prisma/client'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const NS = 'vendor_budgets'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const key = `event:${params.id}`
    const kv = await prisma.keyValue.findFirst({
      where: { namespace: NS, key },
      select: { value: true }
    })
    const budgets = (kv?.value as any) || {}
    return NextResponse.json({ budgets })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to load budgets' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json().catch(() => ({}))
    const budgets = (body?.budgets || {}) as Record<string, number>
    const key = `event:${params.id}`
    const payload: Prisma.JsonObject = budgets as unknown as Prisma.JsonObject

    await prisma.keyValue.upsert({
      where: { namespace_key: { namespace: NS, key } },
      create: { namespace: NS, key, value: payload as unknown as Prisma.InputJsonValue },
      update: { value: payload as unknown as Prisma.InputJsonValue }
    })

    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to save budgets' }, { status: 500 })
  }
}
