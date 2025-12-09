import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUserWithPermissions } from '@/lib/permission-checker'

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUserWithPermissions()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    return NextResponse.json({
      role: user.role,
      permissions: user.permissions || [],
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    })
  } catch (error: any) {
    console.error('Error fetching user permissions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch permissions', message: error.message },
      { status: 500 }
    )
  }
}
