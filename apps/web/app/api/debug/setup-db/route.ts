import { NextResponse } from 'next/server'
import { ensureSchema } from '@/lib/ensure-schema'

export const dynamic = 'force-dynamic'

export async function GET() {
  const success = await ensureSchema()
  if (success) {
    return NextResponse.json({ message: 'Database schema updated successfully' })
  } else {
    return NextResponse.json({ message: 'Failed to setup DB' }, { status: 500 })
  }
}
