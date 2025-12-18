import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(req: NextRequest, { params }: { params: { id: string; registrationId: string } }) {
    try {
        const registration = await prisma.registration.findUnique({
            where: { id: params.registrationId }
        })

        if (!registration) {
            return NextResponse.json({ error: 'Registration not found' }, { status: 404 })
        }

        // Get QR code from dataJson if it exists
        const dataJson = registration.dataJson as any
        const qrCode = dataJson?.qrCode

        if (!qrCode) {
            return NextResponse.json({ error: 'QR code not found' }, { status: 404 })
        }

        // Return QR code as image
        // If it's a data URL, extract the base64 part
        if (qrCode.startsWith('data:image/png;base64,')) {
            const base64Data = qrCode.replace('data:image/png;base64,', '')
            const buffer = Buffer.from(base64Data, 'base64')

            return new NextResponse(buffer, {
                headers: {
                    'Content-Type': 'image/png',
                    'Content-Disposition': `attachment; filename="qr-code-${params.registrationId}.png"`,
                    'Cache-Control': 'public, max-age=31536000'
                }
            })
        }

        return NextResponse.json({ error: 'Invalid QR code format' }, { status: 400 })
    } catch (error: any) {
        console.error('QR download error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
