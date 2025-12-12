import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import nodemailer from 'nodemailer'
import { sendEmail } from '@/lib/email'

export async function GET(req: NextRequest) {
  const key = req.headers.get('x-diag-key') || ''
  const reqKey = process.env.DIAGNOSTICS_KEY || ''
  if (!reqKey || key !== reqKey) {
    return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 })
  }
  const hasEnvHost = !!process.env.EMAIL_SERVER_HOST
  const hasEnvUser = !!process.env.EMAIL_SERVER_USER
  let dbItem: any = null
  try {
    dbItem = await prisma.keyValue.findUnique({
      where: { namespace_key: { namespace: 'smtp_config', key: 'default' } },
      select: { value: true },
    })
  } catch {}
  const dbCfg = (dbItem?.value as any) || null
  const dbConfigured = !!(dbCfg && dbCfg.host)

  let path: 'env' | 'db' | 'ethereal' = 'ethereal'
  let host = ''
  let port = 0
  let secure = false
  let fromCandidate = ''
  let verifyOk = false
  let verifyError: string | null = null

  try {
    if (hasEnvHost) {
      path = 'env'
      host = String(process.env.EMAIL_SERVER_HOST)
      port = parseInt(process.env.EMAIL_SERVER_PORT || '587')
      const sec = String(process.env.EMAIL_SERVER_SECURE || '').toLowerCase()
      secure = sec === 'true' || sec === '1' || sec === 'yes' || port === 465
      fromCandidate = String(process.env.EMAIL_FROM || process.env.SMTP_FROM || '')
      const transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
      })
      try {
        await transporter.verify()
        verifyOk = true
      } catch (e: any) {
        verifyError = e?.message || 'verify_failed'
      }
    } else if (dbConfigured) {
      path = 'db'
      host = String(dbCfg.host || '')
      port = Number(dbCfg.port || 587)
      secure = !!dbCfg.secure
      fromCandidate = String(process.env.EMAIL_FROM || process.env.SMTP_FROM || dbCfg.from || '')
      const transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: dbCfg.user && dbCfg.pass ? { user: String(dbCfg.user), pass: String(dbCfg.pass) } : undefined,
      })
      try {
        await transporter.verify()
        verifyOk = true
      } catch (e: any) {
        verifyError = e?.message || 'verify_failed'
      }
    }
  } catch (e: any) {
    verifyError = e?.message || 'error'
  }

  return NextResponse.json({
    ok: true,
    path,
    hasEnvHost,
    hasEnvUser,
    dbConfigured,
    host,
    port,
    secure,
    fromCandidate,
    verifyOk,
    verifyError,
  })
}

export async function POST(req: NextRequest) {
  const key = req.headers.get('x-diag-key') || ''
  const reqKey = process.env.DIAGNOSTICS_KEY || ''
  if (!reqKey || key !== reqKey) {
    return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 })
  }
  try {
    const body = await req.json().catch(() => ({}))
    const to = String(body.to || '')
    const subject = String(body.subject || 'SMTP Test - Event Planner')
    const html = String(body.html || '<p>This is a test email from Event Planner diagnostics.</p>')
    if (!to) {
      return NextResponse.json({ ok: false, error: 'missing to' }, { status: 400 })
    }
    const res = await sendEmail({ to, subject, html })
    return NextResponse.json({ ok: true, result: res })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'error' }, { status: 500 })
  }
}
