import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getAuthSession()
  if (!session?.user?.role || String(session.user.role) !== 'ADMIN') {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
  }

  const { id } = params

  const org = await prisma.organizerProfile.findUnique({ where: { id } })
  if (org) {
    await prisma.organizerProfile.update({ where: { id }, data: { status: 'APPROVED' } })
    return NextResponse.json({ message: 'Organizer approved' })
  }

  const ind = await prisma.individualVerification.findUnique({ where: { id } })
  if (ind) {
    await prisma.individualVerification.update({ where: { id }, data: { status: 'APPROVED' } })
    return NextResponse.json({ message: 'Individual approved' })
  }

  return NextResponse.json({ message: 'Verification not found' }, { status: 404 })
}
