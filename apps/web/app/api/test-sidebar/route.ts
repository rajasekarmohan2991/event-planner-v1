import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
  const session = await getServerSession(authOptions as any)
  
  return NextResponse.json({
    timestamp: new Date().toISOString(),
    session: session?.user ? {
      email: (session.user as any).email,
      role: (session.user as any).role,
      tenantRole: (session.user as any).tenantRole
    } : null,
    message: 'If you see this with updated timestamp, the server is responding with fresh data'
  })
}
