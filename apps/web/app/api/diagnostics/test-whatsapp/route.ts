import { NextRequest, NextResponse } from 'next/server'
import { sendWhatsApp } from '@/lib/messaging'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { phone } = body

        if (!phone) {
            return NextResponse.json({ success: false, error: 'Phone number is required' }, { status: 400 })
        }

        const result = await sendWhatsApp(
            phone,
            '✅ Test WhatsApp from Event Planner System Diagnostics'
        )

        return NextResponse.json({
            success: result.success,
            result,
            error: result.error
        })
    } catch (error: any) {
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 })
    }
}
