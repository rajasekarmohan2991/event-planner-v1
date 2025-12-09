import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import nodemailer from 'nodemailer'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { requireEventRole } from '@/lib/rbac'

const NS_TPL = 'email_templates'
const NS_SMTP = 'smtp_config'

function renderTemplate(html: string, data: Record<string, any>) {
  return html.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k) => (data?.[k] ?? ''))
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions as any)
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  const eventId = params.id
  const allowed = await requireEventRole(eventId, ['STAFF','ORGANIZER','OWNER'])
  if (!allowed) return NextResponse.json({ message: 'Forbidden' }, { status: 403 })

  try {
    const { key, to, data } = await req.json()
    if (!key || !to) return NextResponse.json({ message: 'key and to required' }, { status: 400 })

    const tpl = await prisma.keyValue.findUnique({
      where: { namespace_key: { namespace: NS_TPL, key: `${eventId}:${key}` } },
      select: { value: true },
    })
    const smtpCfg = await prisma.keyValue.findUnique({
      where: { namespace_key: { namespace: NS_SMTP, key: 'default' } },
      select: { value: true },
    })
    const subject = (tpl?.value as any)?.subject || `${key}`
    const htmlRaw = (tpl?.value as any)?.html || `<p>{{message}}</p>`
    const html = renderTemplate(htmlRaw, data || {})

    const cfg = (smtpCfg?.value as any) || {}
    const transport = nodemailer.createTransport({
      host: cfg.host || process.env.SMTP_HOST,
      port: Number(cfg.port ?? process.env.SMTP_PORT ?? 587),
      secure: !!cfg.secure,
      auth: (cfg.user || process.env.SMTP_USER) ? { user: cfg.user || process.env.SMTP_USER, pass: cfg.pass || process.env.SMTP_PASS } : undefined,
    })

    const from = cfg.from || process.env.SMTP_FROM || 'no-reply@example.com'
    const info = await transport.sendMail({ from, to, subject, html })
    return NextResponse.json({ success: true, messageId: info.messageId })
  } catch (e: any) {
    return NextResponse.json({ message: e?.message || 'Failed to send' }, { status: 500 })
  }
}
