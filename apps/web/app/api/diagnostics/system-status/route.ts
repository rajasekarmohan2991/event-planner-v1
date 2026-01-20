import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
    return NextResponse.json({
        auth: {
            googleId: !!process.env.GOOGLE_CLIENT_ID,
            googleSecret: !!process.env.GOOGLE_CLIENT_SECRET,
            url: process.env.NEXTAUTH_URL,
            secret: !!process.env.NEXTAUTH_SECRET
        },
        twilio: {
            sid: !!process.env.TWILIO_ACCOUNT_SID,
            sidMasked: process.env.TWILIO_ACCOUNT_SID ? `${process.env.TWILIO_ACCOUNT_SID.slice(0, 4)}...${process.env.TWILIO_ACCOUNT_SID.slice(-4)}` : null,
            token: !!process.env.TWILIO_AUTH_TOKEN,
            waFrom: process.env.TWILIO_WHATSAPP_FROM,
            smsFrom: process.env.TWILIO_PHONE_NUMBER
        },
        storage: {
            supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
            supabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
            cloudinaryName: process.env.CLOUDINARY_CLOUD_NAME,
            vblob: !!process.env.BLOB_READ_WRITE_TOKEN
        }
    })
}
