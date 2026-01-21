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

        // 1. Update Order Status
        // Find the order linked to this registration
        // We use raw sql to match the JSON meta field
        const orders = await prisma.$queryRaw<any[]>`
      SELECT "id" FROM "Order" 
      WHERE "meta"->>'registrationId' = ${registrationId}
      LIMIT 1
    `

        if (orders.length > 0) {
            const orderId = orders[0].id
            // Update to COMPLETED
            await prisma.$executeRaw`
         UPDATE "Order"
         SET "paymentStatus" = 'COMPLETED',
             "paymentMethod" = ${paymentMethod || 'CARD'},
             "updatedAt" = NOW()
         WHERE "id" = ${orderId}
       `
            console.log('[PAYMENT CONFIRM] Order updated:', orderId)
        } else {
            console.warn('[PAYMENT CONFIRM] Order not found for registration:', registrationId)
            // Optional: Create an order if missing? 
            // For now, we assume registration created it.
        }

        return NextResponse.json({ success: true })
    } catch (e: any) {
        console.error('[PAYMENT CONFIRM] Error:', e)
        return NextResponse.json({ error: e.message || 'Payment confirmation failed' }, { status: 500 })
    }
}
