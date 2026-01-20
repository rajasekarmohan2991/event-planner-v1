import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session || (session.user as any)?.role !== 'SUPER_ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { phone, message } = await req.json()

        if (!phone) {
            return NextResponse.json({ error: 'Phone number is required' }, { status: 400 })
        }

        // Check if Twilio is configured
        if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
            return NextResponse.json({
                success: false,
                error: 'Twilio not configured',
                message: 'Please set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN environment variables',
                config: {
                    sid: process.env.TWILIO_ACCOUNT_SID ? 'Set' : 'Missing',
                    token: process.env.TWILIO_AUTH_TOKEN ? 'Set' : 'Missing',
                    whatsappFrom: process.env.TWILIO_WHATSAPP_FROM || 'Default Sandbox'
                }
            }, { status: 400 })
        }

        // Normalize phone number
        const normalizePhone = (to: string): string => {
            const s = String(to || '').trim()
            if (!s) return s
            let digits = s.replace(/[^\d+]/g, '')
            if (digits.startsWith('00')) digits = '+' + digits.slice(2)
            if (digits.startsWith('+')) return digits
            const cc = process.env.DEFAULT_SMS_COUNTRY_CODE || '+91'
            if (digits.length === 10) return `${cc}${digits}`
            if (digits.length === 12 && digits.startsWith('91')) return `+${digits}`
            return digits.startsWith('+') ? digits : `+${digits}`
        }

        const toNormalized = normalizePhone(phone)
        const toWhatsApp = `whatsapp:${toNormalized}`
        const fromWhatsApp = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886'
        const messageText = message || '✅ Test WhatsApp from Event Planner! If you see this, your Twilio configuration is working correctly.'

        console.log('📱 WhatsApp Test - Config:', {
            to: toWhatsApp,
            from: fromWhatsApp,
            sidConfigured: !!process.env.TWILIO_ACCOUNT_SID,
            tokenConfigured: !!process.env.TWILIO_AUTH_TOKEN
        })

        // Try to send via Twilio
        try {
            const twilio = await import('twilio')
            const client = twilio.default(
                process.env.TWILIO_ACCOUNT_SID!,
                process.env.TWILIO_AUTH_TOKEN!
            )

            const twilioMessage = await client.messages.create({
                to: toWhatsApp,
                from: fromWhatsApp,
                body: messageText
            })

            console.log('✅ WhatsApp sent successfully:', twilioMessage.sid)

            return NextResponse.json({
                success: true,
                message: 'WhatsApp test message sent successfully!',
                result: {
                    sid: twilioMessage.sid,
                    status: twilioMessage.status,
                    to: toWhatsApp,
                    from: fromWhatsApp
                },
                config: {
                    sid: 'Configured ✅',
                    token: 'Configured ✅',
                    whatsappFrom: fromWhatsApp
                }
            })

        } catch (twilioError: any) {
            console.error('❌ Twilio error:', twilioError)

            return NextResponse.json({
                success: false,
                error: twilioError.message || 'Twilio API error',
                details: {
                    code: twilioError.code,
                    message: twilioError.message,
                    moreInfo: twilioError.moreInfo,
                    status: twilioError.status
                },
                config: {
                    sid: process.env.TWILIO_ACCOUNT_SID ? 'Set ✅' : 'Missing ❌',
                    token: process.env.TWILIO_AUTH_TOKEN ? 'Set ✅' : 'Missing ❌',
                    whatsappFrom: fromWhatsApp
                },
                troubleshooting: {
                    message: 'Common issues:',
                    tips: [
                        '1. Verify TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN are correct',
                        '2. If using Sandbox, recipient must join by sending "join <sandbox-keyword>" to the sandbox number',
                        '3. Check if your Twilio account is active and has credits',
                        '4. Verify the WhatsApp From number is approved in your Twilio account',
                        '5. For Sandbox: Use whatsapp:+14155238886 as FROM number'
                    ]
                }
            }, { status: 400 })
        }

    } catch (error: any) {
        console.error('❌ Test WhatsApp error:', error)
        return NextResponse.json({
            success: false,
            error: error.message || 'Internal server error',
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        }, { status: 500 })
    }
}
