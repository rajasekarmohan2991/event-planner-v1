import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(
  req: NextRequest,
  { params }: { params: { name: string } }
) {
  try {
    const lookupName = params.name
    const defaultDietary = [
      { value: 'VEGETARIAN', label: 'Vegetarian' },
      { value: 'VEGAN', label: 'Vegan' },
      { value: 'GLUTEN_FREE', label: 'Gluten Free' },
      { value: 'HALAL', label: 'Halal' },
      { value: 'KOSHER', label: 'Kosher' },
      { value: 'NUT_ALLERGY', label: 'Nut Allergy' },
      { value: 'DAIRY_FREE', label: 'Dairy Free' },
      { value: 'OTHER', label: 'Other' }
    ]

    let group = await prisma.lookupGroup.findUnique({
      where: { name: lookupName },
      include: {
        options: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' }
        }
      }
    })

    // Auto-seed dietary restrictions if missing
    if (!group && lookupName === 'dietary_restrictions') {
      group = await prisma.lookupGroup.create({
        data: {
          name: 'dietary_restrictions',
          label: 'Dietary Restrictions',
          description: 'Standard dietary restrictions',
          isActive: true,
          options: {
            create: [
              { value: 'VEGETARIAN', label: 'Vegetarian', sortOrder: 1 },
              { value: 'VEGAN', label: 'Vegan', sortOrder: 2 },
              { value: 'GLUTEN_FREE', label: 'Gluten Free', sortOrder: 3 },
              { value: 'HALAL', label: 'Halal', sortOrder: 4 },
              { value: 'KOSHER', label: 'Kosher', sortOrder: 5 },
              { value: 'NUT_ALLERGY', label: 'Nut Allergy', sortOrder: 6 },
              { value: 'DAIRY_FREE', label: 'Dairy Free', sortOrder: 7 },
              { value: 'OTHER', label: 'Other', sortOrder: 8 }
            ]
          }
        },
        include: {
          options: {
            where: { isActive: true },
            orderBy: { sortOrder: 'asc' }
          }
        }
      })
    }

    if (!group) {
      // Graceful fallback for dietary options when DB is not seeded yet
      if (lookupName === 'dietary_restrictions' || lookupName === 'dietary_preference') {
        return NextResponse.json({
          options: defaultDietary.map((o, idx) => ({ id: `fallback-${idx}`, value: o.value, label: o.label, isDefault: idx === 0 }))
        })
      }
      return NextResponse.json({ 
        options: [],
        message: 'Lookup group not found' 
      }, { status: 404 })
    }

    return NextResponse.json({
      options: group.options.map(opt => ({
        id: opt.id,
        value: opt.value,
        label: opt.label,
        description: opt.description,
        isDefault: opt.isDefault
      }))
    })
  } catch (error: any) {
    console.error('Failed to fetch lookup options:', error)
    // If lookup tables are missing, return safe defaults for dietary options
    const url = new URL(req.url)
    const pathName = url.pathname || ''
    if (pathName.includes('dietary_restrictions') || pathName.includes('dietary_preference')) {
      return NextResponse.json({
        options: [
          { id: 'fallback-0', value: 'VEGETARIAN', label: 'Vegetarian' },
          { id: 'fallback-1', value: 'VEGAN', label: 'Vegan' },
          { id: 'fallback-2', value: 'GLUTEN_FREE', label: 'Gluten Free' },
          { id: 'fallback-3', value: 'HALAL', label: 'Halal' },
          { id: 'fallback-4', value: 'KOSHER', label: 'Kosher' },
          { id: 'fallback-5', value: 'NUT_ALLERGY', label: 'Nut Allergy' },
          { id: 'fallback-6', value: 'DAIRY_FREE', label: 'Dairy Free' },
          { id: 'fallback-7', value: 'OTHER', label: 'Other' }
        ]
      })
    }
    return NextResponse.json({ options: [], message: error?.message || 'Failed to fetch options' }, { status: 500 })
  }
}
