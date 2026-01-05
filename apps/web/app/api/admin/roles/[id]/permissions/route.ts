import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth'
import { checkPermissionInRoute } from '@/lib/permission-middleware'
export const dynamic = 'force-dynamic'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Check if user has permission to manage roles
    const permissionCheck = await checkPermissionInRoute('roles.assign_permissions')
    if (permissionCheck) return permissionCheck

    const session = await getAuthSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { permissions } = await req.json()
    
    if (!Array.isArray(permissions)) {
      return NextResponse.json({ error: 'Permissions must be an array' }, { status: 400 })
    }

    // Update role permissions via Java API
    const javaApiUrl = process.env.JAVA_API_URL || 'http://localhost:8080'
    const response = await fetch(`${javaApiUrl}/api/roles/${params.id}/permissions`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${(session as any).accessToken || 'dummy-token'}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ permissions })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return NextResponse.json({ 
        error: errorData.message || 'Failed to update role permissions' 
      }, { status: response.status })
    }

    const updatedRole = await response.json()
    return NextResponse.json(updatedRole)

  } catch (error: any) {
    console.error('Error updating role permissions:', error)
    return NextResponse.json({ error: 'Failed to update role permissions' }, { status: 500 })
  }
}
