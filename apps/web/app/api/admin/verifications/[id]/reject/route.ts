import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getAuthSession()
  if (!session?.user?.role || String(session.user.role) !== 'ADMIN') {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
  }

  const { id } = params
  const { notes } = await req.json().catch(() => ({ notes: '' }))

  const org = await prisma.organizerProfile.findUnique({ where: { id } })
  if (org) {
    await prisma.organizerProfile.update({ where: { id }, data: { status: 'REJECTED' } })
    return NextResponse.json({ message: 'Organizer rejected', notes: notes || '' })
  }

  const ind = await prisma.individualVerification.findUnique({ where: { id } })
  if (ind) {
    await prisma.individualVerification.update({ where: { id }, data: { status: 'REJECTED' } })
    return NextResponse.json({ message: 'Individual rejected', notes: notes || '' })
  }

  return NextResponse.json({ message: 'Verification not found' }, { status: 404 })
}
