import { NextRequest, NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const { to, subject, html, text } = await req.json()

    if (!to || !subject) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    await sendEmail({
      to,
      subject,
      html: html || text,
      text: text || ''
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Email send error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
