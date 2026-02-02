import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
export const dynamic = 'force-dynamic'

// GET single vendor
export async function GET(
    req: NextRequest,
    { params }: { params: { id: string; vendorId: string } }
) {
    const session = await getServerSession(authOptions as any)
    if (!session) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    try {
        const vendorId = params.vendorId

        const vendors = await prisma.$queryRawUnsafe(`
            SELECT 
                id, event_id as "eventId", name, category, budget,
                contact_name as "contactName", contact_email as "contactEmail", contact_phone as "contactPhone",
                contract_amount as "contractAmount", paid_amount as "paidAmount",
                payment_status as "paymentStatus", payment_due_date as "paymentDueDate",
                status, notes, contract_url as "contractUrl", invoice_url as "invoiceUrl",
                bank_name as "bankName", account_number as "accountNumber", ifsc_code as "ifscCode",
                account_holder_name as "accountHolderName", upi_id as "upiId",
                created_at as "createdAt", updated_at as "updatedAt"
            FROM event_vendors WHERE id = $1
        `, vendorId) as any[]

        if (!vendors.length) {
            return NextResponse.json({ message: 'Vendor not found' }, { status: 404 })
        }

        return NextResponse.json(vendors[0])
    } catch (error: any) {
        console.error('Error fetching vendor:', error)
        return NextResponse.json(
            { message: 'Failed to fetch vendor', error: error.message },
            { status: 500 }
        )
    }
}

// PUT update vendor
export async function PUT(
    req: NextRequest,
    { params }: { params: { id: string; vendorId: string } }
) {
    const session = await getServerSession(authOptions as any)
    if (!session) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    try {
        const eventId = params.id
        const vendorId = params.vendorId
        const body = await req.json()

        const {
            name, contactName, contactEmail, contactPhone,
            contractAmount, paidAmount, paymentStatus, status, notes
        } = body

        await prisma.$executeRawUnsafe(`
            UPDATE event_vendors SET
                name = COALESCE($1, name),
                contact_name = COALESCE($2, contact_name),
                contact_email = COALESCE($3, contact_email),
                contact_phone = COALESCE($4, contact_phone),
                contract_amount = COALESCE($5, contract_amount),
                paid_amount = COALESCE($6, paid_amount),
                payment_status = COALESCE($7, payment_status),
                status = COALESCE($8, status),
                notes = COALESCE($9, notes),
                updated_at = NOW()
            WHERE id = $10 AND event_id = $11
        `,
            name || null,
            contactName || null,
            contactEmail || null,
            contactPhone || null,
            contractAmount ?? null,
            paidAmount ?? null,
            paymentStatus || null,
            status || null,
            notes || null,
            vendorId,
            eventId
        )

        return NextResponse.json({ message: 'Vendor updated successfully' })
    } catch (error: any) {
        console.error('Error updating vendor:', error)
        return NextResponse.json(
            { message: 'Failed to update vendor', error: error.message },
            { status: 500 }
        )
    }
}

// DELETE vendor
export async function DELETE(
    req: NextRequest,
    { params }: { params: { id: string; vendorId: string } }
) {
    const session = await getServerSession(authOptions as any)
    if (!session) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    try {
        const eventId = params.id
        const vendorId = params.vendorId

        // Delete the vendor
        await prisma.$executeRawUnsafe(
            `DELETE FROM event_vendors WHERE id = $1 AND event_id = $2`,
            vendorId,
            eventId
        )

        return new NextResponse(null, { status: 204 })
    } catch (error: any) {
        console.error('Error deleting vendor:', error)
        return NextResponse.json(
            { message: 'Failed to delete vendor', error: error.message },
            { status: 500 }
        )
    }
}
