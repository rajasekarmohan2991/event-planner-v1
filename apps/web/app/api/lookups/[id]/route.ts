import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
export const dynamic = 'force-dynamic'

// GET /api/lookups/[id]
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const lookup = await prisma.lookup.findUnique({
      where: { id: params.id }
    })
    
    if (!lookup) {
      return NextResponse.json({ message: 'Lookup not found' }, { status: 404 })
    }
    
    return NextResponse.json(lookup)
  } catch (error: any) {
    console.error('Error fetching lookup:', error)
    return NextResponse.json({ message: error.message || 'Failed to fetch lookup' }, { status: 500 })
  }
}

// PUT /api/lookups/[id]
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }
    
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Forbidden - Admin only' }, { status: 403 })
    }
    
    const existing = await prisma.lookup.findUnique({
      where: { id: params.id }
    })
    
    if (!existing) {
      return NextResponse.json({ message: 'Lookup not found' }, { status: 404 })
    }
    
    // Prevent editing system lookups
    if (existing.isSystem) {
      return NextResponse.json({ message: 'Cannot edit system lookups' }, { status: 403 })
    }
    
    const body = await req.json()
    const { label, colorCode, icon, sortOrder, isActive, metadata } = body
    
    const lookup = await prisma.lookup.update({
      where: { id: params.id },
      data: {
        label,
        colorCode,
        icon,
        sortOrder,
        isActive,
        metadata
      }
    })
    
    return NextResponse.json(lookup)
  } catch (error: any) {
    console.error('Error updating lookup:', error)
    return NextResponse.json({ message: error.message || 'Failed to update lookup' }, { status: 500 })
  }
}

// DELETE /api/lookups/[id]
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }
    
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Forbidden - Admin only' }, { status: 403 })
    }
    
    const existing = await prisma.lookup.findUnique({
      where: { id: params.id }
    })
    
    if (!existing) {
      return NextResponse.json({ message: 'Lookup not found' }, { status: 404 })
    }
    
    // Prevent deleting system lookups
    if (existing.isSystem) {
      return NextResponse.json({ message: 'Cannot delete system lookups' }, { status: 403 })
    }
    
    await prisma.lookup.delete({
      where: { id: params.id }
    })
    
    return NextResponse.json({ message: 'Lookup deleted successfully' })
  } catch (error: any) {
    console.error('Error deleting lookup:', error)
    return NextResponse.json({ message: error.message || 'Failed to delete lookup' }, { status: 500 })
  }
}
