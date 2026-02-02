import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { Prisma } from '@prisma/client'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions as any) as any
    if (!session?.user?.currentTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const tenantId = session.user.currentTenantId

    const base = process.env.INTERNAL_API_BASE_URL || 'http://localhost:8081'
    const url = `${base}/api/events?page=0&size=1000`
    const eventsRes = await fetch(url, { headers: { 'x-tenant-id': tenantId } })
    const eventsData = eventsRes.ok ? await eventsRes.json() : []
    const events: Array<{ id: string; name: string }> = (eventsData.content || eventsData || []).map((e: any)=>({ id: String(e.id), name: e.name }))

    if (events.length === 0) {
      return NextResponse.json({ vendors: [], stats: { total: 0, booked: 0, totalCost: 0 }, perEventStats: {}, perEventBudget: {} })
    }

    const eventIds = events.map(e => e.id)
    const keys = eventIds.map(id => `event:${id}`)

    const vendorRows = await prisma.keyValue.findMany({
      where: { namespace: 'vendors', key: { in: keys } },
      select: { key: true, value: true }
    })

    const budgetsRows = await prisma.keyValue.findMany({
      where: { namespace: 'vendor_budgets', key: { in: keys } },
      select: { key: true, value: true }
    })

    const perEventStats: Record<string, { total: number; booked: number; totalCost: number }> = {}
    const perEventSpent: Record<string, number> = {}
    const allVendors: any[] = []

    for (const row of vendorRows) {
      const eventId = row.key.replace('event:', '')
      const list = (row.value as any)?.vendors || []
      perEventStats[eventId] = { total: 0, booked: 0, totalCost: 0 }
      let spent = 0
      for (const v of list) {
        const vv = { ...v, eventId }
        allVendors.push(vv)
        perEventStats[eventId].total += 1
        const cost = Number(vv.costInr || 0)
        perEventStats[eventId].totalCost += cost
        spent += cost
        if (vv.status === 'booked') perEventStats[eventId].booked += 1
      }
      perEventSpent[eventId] = spent
    }

    const stats = Object.values(perEventStats).reduce((acc, s) => ({
      total: acc.total + s.total,
      booked: acc.booked + s.booked,
      totalCost: acc.totalCost + s.totalCost,
    }), { total: 0, booked: 0, totalCost: 0 })

    const budgetsMap: Record<string, number> = {}
    for (const b of budgetsRows) {
      const eventId = b.key.replace('event:', '')
      const obj = (b.value as any) || {}
      const sum = Object.values(obj).reduce((a: number, n: any) => a + Number(n || 0), 0)
      budgetsMap[eventId] = sum
    }

    const perEventBudget: Record<string, { budgetTotal: number; spentTotal: number; remaining: number }> = {}
    for (const id of eventIds) {
      const budgetTotal = budgetsMap[id] || 0
      const spentTotal = perEventSpent[id] || 0
      perEventBudget[id] = { budgetTotal, spentTotal, remaining: budgetTotal - spentTotal }
    }

    return NextResponse.json({ vendors: allVendors, stats, perEventStats, perEventBudget })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to load summary' }, { status: 500 })
  }
}
