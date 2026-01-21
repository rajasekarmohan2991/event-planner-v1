import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const session = await getServerSession(authOptions as any)
        // Note: This endpoint might be called by public user (client-side) after payment?
        // If so, we can't restrict to admin. 
        // But ideally, secure payments use webhooks. 
        // Since this is "Demo" / "Manual" confirmation from client, we allow it but log it.

        const { registrationId, amount, paymentMethod } = await req.json()
        const eventIdStr = params.id

        console.log('[PAYMENT CONFIRM] Confirming payment for:', { registrationId, amount })

        // 1. Fetch Registration to ensure it exists and get details
        const registration = await prisma.registration.findUnique({
            where: { id: registrationId }
        })

        if (!registration) {
            return NextResponse.json({ error: 'Registration not found' }, { status: 404 })
        }

        // 2. Check for existing Order
        const orders = await prisma.$queryRaw<any[]>`
            SELECT "id" FROM "Order" 
            WHERE "meta"->>'registrationId' = ${registrationId}
            LIMIT 1
        `

        let orderId: string | null = null

        if (orders.length > 0) {
            // Update existing
            orderId = orders[0].id
            await prisma.$executeRaw`
                UPDATE "Order"
                SET "paymentStatus" = 'COMPLETED',
                    "status" = 'PAID',
                    "paymentMethod" = ${paymentMethod || 'CARD'},
                    "updatedAt" = NOW()
                WHERE "id" = ${orderId}
            `
            console.log('[PAYMENT CONFIRM] Order updated:', orderId)
        } else {
            // Create new Order (Self-healing)
            console.log('[PAYMENT CONFIRM] Order missing, creating new one...')
            const newOrderId = crypto.randomUUID ? crypto.randomUUID() : Date.now().toString()
            const metaJson = JSON.stringify({ registrationId: registration.id })

            // Assuming tenantId from registration or fallback
            // We cast eventId to string as Order.eventId is String usually
            const eventIdStr = registration.eventId.toString()
            const email = registration.email || 'unknown@example.com'

            await prisma.$executeRaw`
                INSERT INTO "Order" (
                    "id", "eventId", "tenantId", "userId", "email", "status", 
                    "paymentStatus", "totalInr", "meta", "createdAt", "updatedAt"
                ) VALUES (
                    ${newOrderId},
                    ${eventIdStr},
                    ${registration.tenantId},
                    NULL, -- userId might be null for guest
                    ${email},
                    'PAID',
                    'COMPLETED',
                    ${amount},
                    ${metaJson}::jsonb,
                    NOW(),
                    NOW()
                )
            `
            orderId = newOrderId
            console.log('[PAYMENT CONFIRM] Order created:', orderId)
        }

        return NextResponse.json({ success: true })
    } catch (e: any) {
        console.error('[PAYMENT CONFIRM] Error:', e)
        return NextResponse.json({ error: e.message || 'Payment confirmation failed' }, { status: 500 })
    }
}
