import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { requireEventRole } from '@/lib/rbac'
export const dynamic = 'force-dynamic'

export async function DELETE(_req: NextRequest, { params }: { params: { id: string; assignmentId: string } }) {
  const session = await getServerSession(authOptions as any)
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  const allowed = await requireEventRole(params.id, ['OWNER','ORGANIZER'])
  if (!allowed) return NextResponse.json({ message: 'Forbidden' }, { status: 403 })

  try {
    const a = await prisma.eventRoleAssignment.findUnique({ where: { id: params.assignmentId } })
    if (!a || a.eventId !== params.id) return NextResponse.json({ message: 'Not found' }, { status: 404 })
    await prisma.eventRoleAssignment.delete({ where: { id: params.assignmentId } })
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ message: e?.message || 'Failed to delete' }, { status: 500 })
  }
}
