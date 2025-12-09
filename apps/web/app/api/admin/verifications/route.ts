import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

function parseIntSafe(v: string | null, d: number) {
  const n = v ? parseInt(v, 10) : NaN
  return Number.isFinite(n) && n > 0 ? n : d
}

export async function GET(req: NextRequest) {
  const session = await getAuthSession()
  if (!session?.user?.role || String(session.user.role) !== 'ADMIN') {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const page = parseIntSafe(searchParams.get('page'), 1)
  const limit = Math.min(parseIntSafe(searchParams.get('limit'), 20), 100)
  const statusParam = (searchParams.get('status') || 'PENDING').toUpperCase()
  const allowed = ['PENDING', 'APPROVED', 'REJECTED']
  const status = allowed.includes(statusParam) ? statusParam : 'PENDING'

  const [orgTotal, orgItems] = await Promise.all([
    prisma.organizerProfile.count({ where: { status } as any }),
    prisma.organizerProfile.findMany({
      where: { status } as any,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        companyName: true,
        croNumber: true,
        riskFlags: true,
        status: true,
        createdAt: true,
        user: { select: { id: true, name: true, email: true } },
      },
    }),
  ])

  const [indTotal, indItems] = await Promise.all([
    prisma.individualVerification.count({ where: { status } as any }),
    prisma.individualVerification.findMany({
      where: { status } as any,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        idType: true,
        docUrl: true,
        status: true,
        createdAt: true,
        user: { select: { id: true, name: true, email: true } },
      },
    }),
  ])

  return NextResponse.json({
    page,
    limit,
    status,
    organization: { total: orgTotal, items: orgItems },
    individual: { total: indTotal, items: indItems },
  })
}
