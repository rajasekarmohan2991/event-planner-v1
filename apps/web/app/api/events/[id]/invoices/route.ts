import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { generateInvoiceNumber } from '@/lib/invoice-generator'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions as any)
    if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

    try {
        const eventId = params.id
        const { searchParams } = new URL(req.url)
        const type = searchParams.get('type') // 'EXHIBITOR', 'SPONSOR', 'VENDOR'
        const status = searchParams.get('status') // 'PAID', 'PENDING'

        // Fetch Exhibitors
        const fetchExhibitors = async () => {
            if (type && type !== 'EXHIBITOR') return []

            let query = `
        SELECT id, name, company_name, payment_amount, payment_status, created_at, paid_at
        FROM exhibitor_registrations
        WHERE event_id = $1
      `
            const args: any[] = [eventId]

            if (status) {
                query += ` AND payment_status = $2`
                args.push(status)
            }

            const rows = await prisma.$queryRawUnsafe(query, ...args) as any[]

            return rows.map(row => ({
                id: `EXH-${row.id}`, // Virtual ID for UI key
                entityId: row.id,
                number: generateInvoiceNumber('EXHIBITOR', eventId), // Note: This generates a NEW number each time. Ideally we store this, but for now consistent format is ok.
                name: row.company_name || row.name,
                type: 'EXHIBITOR',
                amount: Number(row.payment_amount || 0),
                status: row.payment_status || 'PENDING',
                date: row.created_at,
                paidAt: row.paid_at
            }))
        }

        // Fetch Sponsors
        const fetchSponsors = async () => {
            if (type && type !== 'SPONSOR') return []

            // Sponsors table structure is different, payment info in JSONB
            // We can't easily filter by status in SQL if it's deep in JSON without specific operator
            // Will fetch all and filter in JS for now
            const query = `
        SELECT id, name, payment_data, created_at
        FROM sponsors
        WHERE event_id = $1
      `
            const rows = await prisma.$queryRawUnsafe(query, eventId) as any[]

            return rows.map(row => {
                const payment = typeof row.payment_data === 'string'
                    ? JSON.parse(row.payment_data)
                    : (row.payment_data || {})

                return {
                    id: `SPO-${row.id}`,
                    entityId: row.id,
                    number: generateInvoiceNumber('SPONSOR', eventId),
                    name: row.name,
                    type: 'SPONSOR',
                    amount: Number(payment.amount || 0),
                    status: payment.status || 'PENDING',
                    date: row.created_at,
                    paidAt: payment.paidAt
                }
            }).filter(item => !status || item.status === status)
        }

        // Fetch Vendors
        const fetchVendors = async () => {
            if (type && type !== 'VENDOR') return []

            let query = `
        SELECT id, name, contract_amount, paid_amount, payment_status, created_at, payment_due_date
        FROM event_vendors
        WHERE event_id = $1
      `
            const args: any[] = [eventId]

            if (status) {
                query += ` AND payment_status = $2`
                args.push(status)
            }

            const rows = await prisma.$queryRawUnsafe(query, ...args) as any[]

            return rows.map(row => ({
                id: `VEN-${row.id}`,
                entityId: row.id,
                number: generateInvoiceNumber('VENDOR', eventId),
                name: row.name,
                type: 'VENDOR',
                amount: Number(row.contract_amount || 0),
                status: row.payment_status || 'PENDING',
                date: row.created_at,
                dueDate: row.payment_due_date
            }))
        }

        // Execute relevant fetches
        const [exhibitors, sponsors, vendors] = await Promise.all([
            fetchExhibitors(),
            fetchSponsors(),
            fetchVendors()
        ])

        // Combine and sort by date descending
        const allInvoices = [...exhibitors, ...sponsors, ...vendors]
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

        return NextResponse.json({
            data: allInvoices,
            count: allInvoices.length
        })

    } catch (error: any) {
        console.error('Failed to fetch invoices:', error)
        return NextResponse.json({
            error: 'Failed to fetch invoices',
            details: error.message
        }, { status: 500 })
    }
}
