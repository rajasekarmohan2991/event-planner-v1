
import { NextRequest, NextResponse } from 'next/server'
import { sendWhatsApp } from '@/lib/messaging'
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

        const result = await sendWhatsApp(phone, message || 'This is a test message from your Event Planner Diagnostics.')

        return NextResponse.json({
            success: result.success,
            result,
            config: {
                sid: process.env.TWILIO_ACCOUNT_SID ? 'Set' : 'Missing',
                token: process.env.TWILIO_AUTH_TOKEN ? 'Set' : 'Missing',
                from: process.env.TWILIO_WHATSAPP_FROM || 'Default Sandbox'
            }
        })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
