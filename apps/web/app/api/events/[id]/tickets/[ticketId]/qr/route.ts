import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { requireEventRole } from '@/lib/rbac'
import crypto from 'crypto'
export const dynamic = 'force-dynamic'

function b64url(input: Buffer | string) {
  return Buffer.from(input).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

export async function GET(_req: NextRequest, { params }: { params: { id: string; ticketId: string } }) {
  const eventId = params.id
  const ticketId = params.ticketId
  const session = await getServerSession(authOptions as any)
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  const allowed = await requireEventRole(eventId, ['STAFF','ORGANIZER','OWNER'])
  if (!allowed) return NextResponse.json({ message: 'Forbidden' }, { status: 403 })

  const now = Math.floor(Date.now() / 1000)
  const exp = now + 60 * 60 // 1 hour validity
  const nonce = crypto.randomBytes(8).toString('hex')
  const payload = { v: 1, typ: 'CHECKIN', eventId, ticketId, iat: now, exp, n: nonce }

  const secret = process.env.CHECKIN_SECRET || process.env.NEXTAUTH_SECRET || 'dev-secret'
  const payloadStr = JSON.stringify(payload)
  const sig = crypto.createHmac('sha256', secret).update(payloadStr).digest()
  const token = `${b64url(payloadStr)}.${b64url(sig)}`

  return NextResponse.json({ token, payload })
}
