import { NextRequest, NextResponse } from 'next/server'
import { sendWhatsApp } from '@/lib/messaging'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    // Check configuration
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
         return NextResponse.json({
            success: false,
            error: 'Twilio configuration missing. Please set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN environment variables.'
        }, { status: 500 })
    }

    const { searchParams } = new URL(req.url)
    const to = searchParams.get('to')

    if (!to) {
        return NextResponse.json({
            success: false,
            error: 'Missing "to" query parameter. Usage: /api/test-whatsapp?to=+1234567890. Note: The "to" number must have joined your Twilio Sandbox.'
        }, { status: 400 })
    }

    const result = await sendWhatsApp(
      to,
      '✅ Test WhatsApp from Event Planner! If you see this, your Twilio Sandbox configuration is correct.'
    )

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Test WhatsApp sent successfully!',
        messageId: result.id,
        provider: 'Twilio Sandbox'
      })
    } else {
      return NextResponse.json({
        success: false,
        error: result.error || 'WhatsApp sending failed',
        hint: 'Ensure the recipient number has joined the sandbox by sending the join code to the sandbox number.'
      }, { status: 500 })
    }
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}
