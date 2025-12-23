import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
    try {
        // 1. Add comprehensive columns to sponsors table
        await prisma.$executeRawUnsafe(`
      ALTER TABLE sponsors 
      ADD COLUMN IF NOT EXISTS contact_data JSONB DEFAULT '{}',
      ADD COLUMN IF NOT EXISTS payment_data JSONB DEFAULT '{}',
      ADD COLUMN IF NOT EXISTS branding_online JSONB DEFAULT '{}',
      ADD COLUMN IF NOT EXISTS branding_offline JSONB DEFAULT '{}',
      ADD COLUMN IF NOT EXISTS event_presence JSONB DEFAULT '{}',
      ADD COLUMN IF NOT EXISTS giveaway_data JSONB DEFAULT '{}',
      ADD COLUMN IF NOT EXISTS legal_data JSONB DEFAULT '{}',
      ADD COLUMN IF NOT EXISTS timeline_data JSONB DEFAULT '{}',
      ADD COLUMN IF NOT EXISTS post_event_data JSONB DEFAULT '{}';
    `)

        // 2. Add settings columns to events table
        await prisma.$executeRawUnsafe(`
      ALTER TABLE events
      ADD COLUMN IF NOT EXISTS promote_data JSONB DEFAULT '{}',
      ADD COLUMN IF NOT EXISTS engagement_data JSONB DEFAULT '{}';
    `)

        return NextResponse.json({ message: 'Database schema updated successfully' })
    } catch (error: any) {
        console.error('Setup DB failed:', error)
        return NextResponse.json({ message: 'Failed to setup DB', error: error.message }, { status: 500 })
    }
}
