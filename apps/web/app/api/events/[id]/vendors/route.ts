import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { checkPermissionInRoute } from '@/lib/permission-middleware'
import { getTenantId } from '@/lib/tenant-context'

// GET - List all vendors for an event
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions as any)
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  try {
    const { searchParams } = new URL(req.url)
    const category = searchParams.get('category')
    const paymentStatus = searchParams.get('paymentStatus')

    const vendors = await (prisma as any).eventVendor?.findMany({
      where: {
        eventId: params.id,
        ...(category && { category }),
        ...(paymentStatus && { paymentStatus })
      },
      orderBy: { createdAt: 'desc' }
    }) || []

    // Calculate totals
    const totals = vendors.reduce((acc, vendor) => ({
      contracted: acc.contracted + Number(vendor.contractAmount),
      paid: acc.paid + Number(vendor.paidAmount),
      pending: acc.pending + (Number(vendor.contractAmount) - Number(vendor.paidAmount))
    }), { contracted: 0, paid: 0, pending: 0 })

    return NextResponse.json({ vendors, totals })
  } catch (error: any) {
    console.error('Get vendors error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST - Add new vendor
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions as any)
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  const permError = await checkPermissionInRoute('events.manage_vendors', 'Add Vendor')
  if (permError) return permError

  try {
    const body = await req.json()
    const {
      name,
      category,
      contactName,
      contactEmail,
      contactPhone,
      contractAmount,
      paymentDueDate,
      notes,
      contractUrl,
      invoiceUrl
    } = body
    const tenantId = getTenantId()

    if (!name || !category || !contractAmount) {
      return NextResponse.json({
        message: 'Name, category, and contract amount required'
      }, { status: 400 })
    }

    const vendor = await (prisma as any).eventVendor.create({
      data: {
        eventId: params.id,
        name,
        category,
        contactName,
        contactEmail,
        contactPhone,
        contractAmount: Number(contractAmount),
        paidAmount: 0,
        paymentStatus: 'PENDING',
        paymentDueDate: paymentDueDate ? new Date(paymentDueDate) : null,
        status: 'ACTIVE',
        notes,
        contractUrl,
        invoiceUrl,
        tenantId
      }
    })

    return NextResponse.json({ message: 'Vendor added', vendor }, { status: 201 })
  } catch (error: any) {
    console.error('Add vendor error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PATCH - Update vendor (payment, status)
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions as any)
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  const permError = await checkPermissionInRoute('events.manage_vendors', 'Update Vendor')
  if (permError) return permError

  try {
    const body = await req.json()
    const { vendorId, paidAmount, status, notes, contractUrl, invoiceUrl } = body

    if (!vendorId) {
      return NextResponse.json({ message: 'Vendor ID required' }, { status: 400 })
    }

    const current = await (prisma as any).eventVendor.findUnique({
      where: { id: vendorId }
    })

    if (!current) {
      return NextResponse.json({ message: 'Vendor not found' }, { status: 404 })
    }

    const newPaidAmount = paidAmount !== undefined ? Number(paidAmount) : Number(current.paidAmount)
    const contractAmount = Number(current.contractAmount)

    // Determine payment status
    let paymentStatus = current.paymentStatus
    if (newPaidAmount >= contractAmount) {
      paymentStatus = 'PAID'
    } else if (newPaidAmount > 0) {
      paymentStatus = 'PARTIAL'
    } else {
      paymentStatus = 'PENDING'
    }

    // Check if overdue
    if (current.paymentDueDate && new Date() > current.paymentDueDate && paymentStatus !== 'PAID') {
      paymentStatus = 'OVERDUE'
    }

    const updated = await (prisma as any).eventVendor.update({
      where: { id: vendorId },
      data: {
        ...(paidAmount !== undefined && { paidAmount: newPaidAmount }),
        paymentStatus,
        ...(status !== undefined && { status }),
        ...(notes !== undefined && { notes }),
        ...(contractUrl !== undefined && { contractUrl }),
        ...(invoiceUrl !== undefined && { invoiceUrl })
      }
    })

    return NextResponse.json({ message: 'Vendor updated', vendor: updated })
  } catch (error: any) {
    console.error('Update vendor error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE - Delete vendor
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions as any)
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  const permError = await checkPermissionInRoute('events.manage_vendors', 'Delete Vendor')
  if (permError) return permError

  try {
    const { searchParams } = new URL(req.url)
    const vendorId = searchParams.get('vendorId')

    if (!vendorId) {
      return NextResponse.json({ message: 'Vendor ID required' }, { status: 400 })
    }

    await (prisma as any).eventVendor.delete({
      where: { id: vendorId }
    })

    return NextResponse.json({ message: 'Vendor deleted' })
  } catch (error: any) {
    console.error('Delete vendor error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
