import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth'
import { checkPermissionInRoute } from '@/lib/permission-middleware'
import prisma from '@/lib/prisma'

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Check if user has permission to delete invitations
    const permissionCheck = await checkPermissionInRoute('communication.send_email')
    if (permissionCheck) return permissionCheck

    const session = await getAuthSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Delete invitation
    await prisma.$executeRaw`
      DELETE FROM invitations 
      WHERE id = ${params.id}
    `

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error('Error deleting invitation:', error)
    return NextResponse.json({ error: 'Failed to delete invitation' }, { status: 500 })
  }
}
