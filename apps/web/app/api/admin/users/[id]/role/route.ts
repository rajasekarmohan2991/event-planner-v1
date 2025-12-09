import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await getAuthSession()
    if (!session?.user) {
      return NextResponse.json(
        { message: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Check authorization - only SUPER_ADMIN and ADMIN can change roles
    const userRole = (session.user as any).role as string
    if (!['SUPER_ADMIN', 'ADMIN'].includes(userRole)) {
      return NextResponse.json(
        { message: 'Forbidden: Insufficient permissions' },
        { status: 403 }
      )
    }

    // Get request body
    const body = await req.json()
    const { role } = body

    // Validate role
    const validRoles = ['SUPER_ADMIN', 'ADMIN', 'EVENT_MANAGER', 'USER']
    if (!role || !validRoles.includes(role)) {
      return NextResponse.json(
        { message: 'Invalid role. Must be one of: ' + validRoles.join(', ') },
        { status: 400 }
      )
    }

    // Additional check: Only SUPER_ADMIN can assign SUPER_ADMIN role
    if (role === 'SUPER_ADMIN' && userRole !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { message: 'Only SUPER_ADMIN can assign SUPER_ADMIN role' },
        { status: 403 }
      )
    }

    // Update user role in database using raw SQL to handle BigInt
    const userId = params.id
    if (!userId || userId === 'undefined') {
      return NextResponse.json(
        { message: 'Invalid user ID' },
        { status: 400 }
      )
    }

    // Validate that userId can be converted to BigInt
    let userIdBigInt: bigint
    try {
      userIdBigInt = BigInt(userId)
    } catch (error) {
      return NextResponse.json(
        { message: 'Invalid user ID format' },
        { status: 400 }
      )
    }

    // Use raw SQL to handle BigInt user ID
    const updateResult = await prisma.$executeRaw`
      UPDATE users 
      SET role = ${role}, updated_at = NOW() 
      WHERE id = ${userIdBigInt}
    `

    if (updateResult === 0) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      )
    }

    // Get updated user data
    const updatedUser = await prisma.$queryRaw`
      SELECT id::text as id, name, email, role 
      FROM users 
      WHERE id = ${userIdBigInt}
    `

    const user = (updatedUser as any[])[0]
    if (!user) {
      return NextResponse.json(
        { message: 'User not found after update' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Role updated successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    })

  } catch (error: any) {
    console.error('Error updating user role:', error)
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { message: error.message || 'Failed to update role' },
      { status: 500 }
    )
  }
}
