import { NextRequest, NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const { to, subject = 'Test Email - Event Planner', message = 'This is a test email.' } = await req.json()
    if (!to || typeof to !== 'string') {
      return NextResponse.json({ error: 'Missing `to`' }, { status: 400 })
    }

    const result = await sendEmail({
      to,
      subject,
      html: `<p>${message}</p>`,
      text: message,
    })

    if ((result as any).success === false) {
      return NextResponse.json({ success: false, error: 'SMTP send failed', detail: String((result as any).error) }, { status: 500 })
    }

    return NextResponse.json({ success: true, messageId: (result as any).messageId })
  } catch (e: any) {
    return NextResponse.json({ error: 'Internal Server Error', detail: String(e?.message || e) }, { status: 500 })
  }
}
