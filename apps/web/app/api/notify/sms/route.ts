import { NextRequest, NextResponse } from 'next/server'
import { sendSms } from '@/lib/sms'

export async function POST(req: NextRequest) {
  try {
    const { to, message } = await req.json()
    if (!to || !message) {
      return NextResponse.json({ message: 'to and message are required' }, { status: 400 })
    }

    const result = await sendSms(to, message)
    if (!result.success) {
      return NextResponse.json({ message: 'SMS not sent', error: result.error }, { status: 500 })
    }

    return NextResponse.json({ message: 'SMS sent', messageId: result.messageId }, { status: 200 })
  } catch (error) {
    return NextResponse.json({ message: 'Invalid request' }, { status: 400 })
  }
}
