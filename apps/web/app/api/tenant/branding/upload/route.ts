import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions as any)
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = ((session as any)?.user?.currentTenantId as string) || 'default-tenant'
    const formData = await req.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ message: 'No file provided' }, { status: 400 })
    }

    // Convert file to base64 for storage
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64 = buffer.toString('base64')
    const dataUrl = `data:${file.type};base64,${base64}`

    // Update tenant logo
    await prisma.$queryRaw`
      UPDATE tenants
      SET logo = ${dataUrl}, "updatedAt" = NOW()
      WHERE id = ${tenantId}
    `

    return NextResponse.json({ success: true, logoUrl: dataUrl })
  } catch (error: any) {
    console.error('Error uploading logo:', error)
    return NextResponse.json({ message: error.message }, { status: 500 })
  }
}
