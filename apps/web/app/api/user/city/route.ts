import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { cities } = await req.json()
    if (!cities || !Array.isArray(cities) || cities.length === 0) {
      return NextResponse.json({ message: 'Invalid cities' }, { status: 400 })
    }

    // Update user's selected city (store first city as primary)
    await prisma.user.update({
      where: { email: session.user.email },
      data: { selectedCity: cities.join(',') }
    })

    return NextResponse.json({ message: 'City saved successfully' })
  } catch (error) {
    console.error('Error saving city:', error)
    return NextResponse.json({ message: 'Failed to save city' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    // Return null city if not authenticated (not an error)
    if (!session?.user?.email) {
      return NextResponse.json({ city: null })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { selectedCity: true }
    })

    return NextResponse.json({ city: user?.selectedCity || null })
  } catch (error) {
    console.error('Error fetching city:', error)
    return NextResponse.json({ city: null, error: 'Failed to fetch city' }, { status: 500 })
  }
}
