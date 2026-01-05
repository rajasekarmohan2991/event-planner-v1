import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
export const dynamic = 'force-dynamic'

// GET - List all team notification members
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user as any).role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const members = await prisma.$queryRaw<any[]>`
      SELECT id, email, name, role, is_active, created_at, updated_at
      FROM team_notification_members
      ORDER BY created_at DESC
    `

    return NextResponse.json(members)
  } catch (error) {
    console.error('Error fetching team notification members:', error)
    return NextResponse.json({ error: 'Failed to fetch members' }, { status: 500 })
  }
}

// POST - Add new team notification member
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user as any).role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { email, name, role } = await req.json()

    if (!email || !name) {
      return NextResponse.json({ error: 'Email and name are required' }, { status: 400 })
    }

    const result = await prisma.$executeRaw`
      INSERT INTO team_notification_members (email, name, role, is_active)
      VALUES (${email}, ${name}, ${role || 'Team Member'}, true)
      ON CONFLICT (email) DO UPDATE
      SET name = ${name}, role = ${role || 'Team Member'}, is_active = true, updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `

    return NextResponse.json({ success: true, message: 'Member added successfully' })
  } catch (error) {
    console.error('Error adding team notification member:', error)
    return NextResponse.json({ error: 'Failed to add member' }, { status: 500 })
  }
}

// DELETE - Remove team notification member
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user as any).role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    await prisma.$executeRaw`
      DELETE FROM team_notification_members WHERE id = ${parseInt(id)}
    `

    return NextResponse.json({ success: true, message: 'Member removed successfully' })
  } catch (error) {
    console.error('Error removing team notification member:', error)
    return NextResponse.json({ error: 'Failed to remove member' }, { status: 500 })
  }
}
