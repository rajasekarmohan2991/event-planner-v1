import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { generateInvoiceHTML, generateInvoiceNumber, sendInvoiceEmail, type InvoiceData, type InvoiceType } from '@/lib/invoice-generator'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

// POST /api/events/[id]/invoices/create - Create a new invoice
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions as any)
    if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

    try {
        const eventId = params.id
        const body = await req.json()

        const {
            type, // 'EXHIBITOR' | 'SPONSOR' | 'VENDOR' | 'SPEAKER'
            entityId, // ID of the exhibitor/sponsor/vendor
            payerName,
            payerEmail,
            payerPhone,
            payerCompany,
            payerAddress,
            items, // Array of line items
            notes,
            dueDate,
            sendEmail: shouldSendEmail = false
        } = body

        // Validate required fields
        if (!type || !payerName || !payerEmail || !items || items.length === 0) {
            return NextResponse.json({
                error: 'Missing required fields: type, payerName, payerEmail, items'
            }, { status: 400 })
        }

        // Get event details
        const eventData = await prisma.$queryRaw<any[]>`
            SELECT id, name, starts_at, tenant_id
            FROM events
            WHERE id = ${BigInt(eventId)}
            LIMIT 1
        `

        if (!eventData || eventData.length === 0) {
            return NextResponse.json({ error: 'Event not found' }, { status: 404 })
        }

        const event = eventData[0]
        const tenantId = event.tenant_id

        // Get tax configuration
        const taxData = await prisma.$queryRaw<any[]>`
            SELECT tax_rate, tax_name
            FROM tax_structures
            WHERE tenant_id = ${tenantId}
            AND is_active = true
            ORDER BY created_at DESC
            LIMIT 1
        `

        const taxRate = taxData && taxData.length > 0 ? Number(taxData[0].tax_rate) : 18
        const taxName = taxData && taxData.length > 0 ? taxData[0].tax_name : 'GST'

        // Calculate amounts
        const subtotal = items.reduce((sum: number, item: any) => sum + (item.amount || 0), 0)
        const tax = Math.round((subtotal * taxRate) / 100)
        const total = subtotal + tax

        // Generate invoice number
        const invoiceNumber = generateInvoiceNumber(type as InvoiceType, eventId)
        const invoiceId = crypto.randomUUID()

        // Create invoice in database
        await prisma.$executeRaw`
            INSERT INTO invoices (
                id, invoice_number, event_id, tenant_id, type, entity_id,
                payer_name, payer_email, payer_phone, payer_company, payer_address,
                subtotal, tax_rate, tax_amount, total_amount,
                status, invoice_date, due_date, notes,
                created_at, updated_at
            ) VALUES (
                ${invoiceId},
                ${invoiceNumber},
                ${eventId},
                ${tenantId},
                ${type},
                ${entityId || null},
                ${payerName},
                ${payerEmail},
                ${payerPhone || null},
                ${payerCompany || null},
                ${payerAddress || null},
                ${subtotal},
                ${taxRate},
                ${tax},
                ${total},
                'PENDING',
                NOW(),
                ${dueDate ? new Date(dueDate) : null},
                ${notes || null},
                NOW(),
                NOW()
            )
        `

        // Insert line items
        for (const item of items) {
            await prisma.$executeRaw`
                INSERT INTO invoice_line_items (
                    invoice_id, description, quantity, unit_price, amount
                ) VALUES (
                    ${invoiceId},
                    ${item.description},
                    ${item.quantity || 1},
                    ${item.unitPrice || item.amount},
                    ${item.amount}
                )
            `
        }

        // Prepare invoice data for HTML/PDF generation
        const invoiceData: InvoiceData = {
            invoiceNumber,
            invoiceDate: new Date(),
            dueDate: dueDate ? new Date(dueDate) : undefined,
            payerName,
            payerEmail,
            payerPhone,
            payerCompany,
            payerAddress,
            eventId,
            eventName: event.name,
            eventDate: event.starts_at ? new Date(event.starts_at) : undefined,
            type: type as InvoiceType,
            description: `${type} Invoice for ${event.name}`,
            items: items.map((item: any) => ({
                description: item.description,
                quantity: item.quantity || 1,
                unitPrice: item.unitPrice || item.amount,
                amount: item.amount
            })),
            subtotal,
            tax,
            taxRate,
            total,
            paymentStatus: 'PENDING',
            notes
        }

        // Generate payment link
        const paymentLink = `${process.env.NEXTAUTH_URL}/invoices/${invoiceId}/pay`

        // Send email if requested
        if (shouldSendEmail) {
            try {
                await sendInvoiceEmail(invoiceData)
            } catch (emailError) {
                console.error('Failed to send invoice email:', emailError)
                // Don't fail the request if email fails
            }
        }

        return NextResponse.json({
            success: true,
            invoice: {
                id: invoiceId,
                invoiceNumber,
                amount: total,
                status: 'PENDING',
                paymentLink,
                downloadLink: `${process.env.NEXTAUTH_URL}/api/events/${eventId}/invoices/${invoiceId}/download`
            }
        }, { status: 201 })

    } catch (error: any) {
        console.error('Failed to create invoice:', error)
        return NextResponse.json({
            error: 'Failed to create invoice',
            details: error.message
        }, { status: 500 })
    }
}
