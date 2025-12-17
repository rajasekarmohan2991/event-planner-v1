
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions)
    if (!session || (session.user as any)?.role !== 'SUPER_ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json({
        auth: {
            googleId: !!process.env.GOOGLE_CLIENT_ID,
            googleSecret: !!process.env.GOOGLE_CLIENT_SECRET,
            url: process.env.NEXTAUTH_URL,
            secret: !!process.env.NEXTAUTH_SECRET,
        },
        twilio: {
            sid: !!process.env.TWILIO_ACCOUNT_SID,
            sidMasked: process.env.TWILIO_ACCOUNT_SID ? `${process.env.TWILIO_ACCOUNT_SID.substring(0, 4)}...${process.env.TWILIO_ACCOUNT_SID.substring(process.env.TWILIO_ACCOUNT_SID.length - 4)}` : 'Missing',
            token: !!process.env.TWILIO_AUTH_TOKEN,
            waFrom: process.env.TWILIO_WHATSAPP_FROM,
            smsFrom: process.env.TWILIO_SMS_FROM,
        },
        storage: {
            supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
            supabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || !!process.env.SUPABASE_SERVICE_ROLE_KEY,
            cloudinaryName: !!process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
        }
    })
}
