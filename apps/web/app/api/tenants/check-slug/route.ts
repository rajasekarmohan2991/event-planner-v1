import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const slug = searchParams.get('slug')

    if (!slug) {
      return NextResponse.json({ error: 'Slug required' }, { status: 400 })
    }

    // Check if slug exists
    const existing = await prisma.tenant.findFirst({
      where: {
        OR: [
          { slug },
          { subdomain: slug }
        ]
      }
    })

    return NextResponse.json({ available: !existing })
  } catch (error) {
    console.error('Check slug error:', error)
    return NextResponse.json(
      { error: 'Failed to check slug' },
      { status: 500 }
    )
  }
}
