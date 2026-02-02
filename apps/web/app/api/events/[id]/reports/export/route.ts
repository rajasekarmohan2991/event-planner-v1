import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions, checkUserRole } from '@/lib/auth'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || !checkUserRole(session, ['ADMIN', 'ORGANIZER'])) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const eventId = params.id
  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type') || 'registrations'
  const format = searchParams.get('format') || 'csv'

  try {
    let data: any[] = []
    let filename = `${type}-${eventId}-${new Date().toISOString().split('T')[0]}`

    switch (type) {
      case 'registrations':
        data = await prisma.registration.findMany({
          where: { eventId },
          orderBy: { createdAt: 'desc' }
        })
        break
      case 'orders':
        data = await prisma.order.findMany({
          where: { eventId },
          orderBy: { createdAt: 'desc' }
        })
        break
      case 'rsvps':
        data = await prisma.rSVP.findMany({
          where: { eventId },
          orderBy: { createdAt: 'desc' }
        })
        break
      case 'exhibitors':
        data = await prisma.exhibitor.findMany({
          where: { eventId },
          include: { booths: true },
          orderBy: { createdAt: 'desc' }
        })
        break
      default:
        return NextResponse.json({ message: 'Invalid export type' }, { status: 400 })
    }

    if (format === 'csv') {
      const csv = convertToCSV(data)
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${filename}.csv"`
        }
      })
    } else {
      // For XLSX, we'd need a library like xlsx or exceljs
      // For now, return JSON with proper headers
      return new NextResponse(JSON.stringify(data, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="${filename}.json"`
        }
      })
    }
  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json({ message: 'Export failed' }, { status: 500 })
  }
}

function convertToCSV(data: any[]): string {
  if (!data.length) return ''
  
  const headers = Object.keys(data[0])
  const csvRows = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header]
        if (value === null || value === undefined) return ''
        if (typeof value === 'object') return JSON.stringify(value)
        return `"${String(value).replace(/"/g, '""')}"`
      }).join(',')
    )
  ]
  
  return csvRows.join('\n')
}
