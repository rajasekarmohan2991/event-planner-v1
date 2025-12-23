import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getEventSettings, updateEventSettings } from '@/lib/event-settings'

const KEY = 'notifications'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const settings = await getEventSettings(params.id, KEY)
  return NextResponse.json(settings)
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions as any)
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  await updateEventSettings(params.id, KEY, body)
  return NextResponse.json({ success: true, settings: body })
}
