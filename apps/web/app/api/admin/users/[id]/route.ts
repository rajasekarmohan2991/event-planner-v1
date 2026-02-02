import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication and authorization
    const session = await getAuthSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    
    const userRole = (session.user as any).role
    if (userRole !== 'SUPER_ADMIN') {
      return NextResponse.json({ 
        error: 'Access denied', 
        message: 'Only Super Admin can delete users'
      }, { status: 403 })
    }

    const userId = params.id

    // Check if user exists
    const existingUser = await prisma.$queryRaw`
      SELECT id, email FROM users WHERE id = ${BigInt(userId)}::bigint LIMIT 1
    `
    
    if ((existingUser as any[]).length === 0) {
      return NextResponse.json({ 
        error: 'User not found',
        message: 'No user found with this ID'
      }, { status: 404 })
    }

    // Prevent deleting yourself
    const currentUserId = (session.user as any).id
    if (String(userId) === String(currentUserId)) {
      return NextResponse.json({ 
        error: 'Cannot delete yourself',
        message: 'You cannot delete your own account'
      }, { status: 400 })
    }

    // Delete user
    await prisma.$executeRaw`
      DELETE FROM users WHERE id = ${BigInt(userId)}::bigint
    `

    return NextResponse.json({ 
      message: 'User deleted successfully'
    }, { status: 200 })
  } catch (error: any) {
    console.error('Error deleting user:', error)
    return NextResponse.json({ 
      error: 'Failed to delete user', 
      message: error.message
    }, { status: 500 })
  }
}
