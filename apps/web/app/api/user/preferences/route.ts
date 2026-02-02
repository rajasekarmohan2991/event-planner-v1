import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET /api/user/preferences - Get user preferences
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions as any)
    if (!session || !(session as any).user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let userId: bigint
    try {
      userId = BigInt((session as any).user.id)
    } catch (e) {
      console.error('Invalid user ID format:', (session as any).user.id)
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 })
    }

    let userPref = await prisma.userPreference.findUnique({
      where: { userId }
    })

    // Create default preferences if not exists
    if (!userPref) {
      try {
        userPref = await prisma.userPreference.create({
          data: {
            userId,
            language: 'en',
            sidebarCollapsed: false,
            theme: 'light',
          }
        })
      } catch (createError) {
        // Handle race condition where it might have been created in parallel
        userPref = await prisma.userPreference.findUnique({
          where: { userId }
        })
      }
    }

    if (!userPref) {
        return NextResponse.json({ error: 'Could not fetch or create preferences' }, { status: 500 })
    }

    return NextResponse.json({
      language: userPref.language,
      sidebarCollapsed: userPref.sidebarCollapsed,
      theme: userPref.theme,
      emailNotifications: userPref.emailNotifications,
      pushNotifications: userPref.pushNotifications,
      ...((userPref.preferences as any) || {})
    })
  } catch (error: any) {
    console.error('Error fetching preferences:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch preferences',
      message: error.message
    }, { status: 500 })
  }
}

// POST /api/user/preferences - Update user preferences
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions as any)
    if (!session || !(session as any).user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let userId: bigint
    try {
      userId = BigInt((session as any).user.id)
    } catch (e) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 })
    }
    
    const body = await req.json()

    const { language, sidebarCollapsed, theme, emailNotifications, pushNotifications, ...otherPrefs } = body

    const userPref = await prisma.userPreference.upsert({
      where: { userId },
      update: {
        ...(language !== undefined && { language }),
        ...(sidebarCollapsed !== undefined && { sidebarCollapsed }),
        ...(theme !== undefined && { theme }),
        ...(emailNotifications !== undefined && { emailNotifications }),
        ...(pushNotifications !== undefined && { pushNotifications }),
        ...(Object.keys(otherPrefs).length > 0 && { preferences: otherPrefs }),
      },
      create: {
        userId,
        language: language || 'en',
        sidebarCollapsed: sidebarCollapsed || false,
        theme: theme || 'light',
        emailNotifications: emailNotifications !== undefined ? emailNotifications : true,
        pushNotifications: pushNotifications !== undefined ? pushNotifications : true,
        preferences: Object.keys(otherPrefs).length > 0 ? otherPrefs : null,
      }
    })

    // Convert BigInt to string for JSON serialization
    const serializedPref = {
      ...userPref,
      userId: userPref.userId.toString(),
      id: userPref.id
    }
    return NextResponse.json({ success: true, preferences: serializedPref })
  } catch (error: any) {
    console.error('Error updating preferences:', error)
    return NextResponse.json({ 
      error: 'Failed to update preferences',
      message: error.message
    }, { status: 500 })
  }
}
