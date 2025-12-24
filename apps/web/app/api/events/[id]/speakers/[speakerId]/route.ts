import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

// PUT /api/events/[id]/speakers/[speakerId] - Update speaker
export async function PUT(req: NextRequest, { params }: { params: { id: string, speakerId: string } }) {
  try {
    const session = await getServerSession(authOptions as any)
    if (!session) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 })
    }

    const body = await req.json()
    const speakerId = BigInt(params.speakerId)

    console.log('📝 Updating speaker:', speakerId, 'Data:', body)

    // Update speaker
    const updated = await prisma.$queryRaw`
      UPDATE speakers
      SET 
        name = ${body.name},
        title = ${body.title || null},
        bio = ${body.bio || null},
        photo_url = ${body.photoUrl || null},
        email = ${body.email || null},
        linkedin = ${body.linkedin || null},
        twitter = ${body.twitter || null},
        website = ${body.website || null},
        updated_at = NOW()
      WHERE id = ${speakerId}
      RETURNING 
        id::text as id,
        name,
        title,
        bio,
        photo_url as "photoUrl",
        email,
        linkedin,
        twitter,
        website,
        event_id::text as "eventId"
    ` as any[]

    // Update session link if provided
    if (body.sessionId) {
      const speakerIdBigInt = BigInt(speakerId)
      const sessionIdBigInt = BigInt(body.sessionId)

      console.log('🔗 Linking speaker to session:', { speakerId: speakerIdBigInt.toString(), sessionId: sessionIdBigInt.toString() })

      // First remove existing links (assuming single session assignment for this UI)
      await prisma.$executeRawUnsafe(`DELETE FROM session_speakers WHERE speaker_id = $1`, speakerIdBigInt)

      // Add new link
      await prisma.$executeRawUnsafe(`
        INSERT INTO session_speakers (session_id, speaker_id) 
        VALUES ($1, $2)
        ON CONFLICT DO NOTHING
      `, sessionIdBigInt, speakerIdBigInt)

      console.log('✅ Speaker-session link created')
    }

    if (!updated || updated.length === 0) {
      return NextResponse.json({ message: 'Speaker not found' }, { status: 404 })
    }

    console.log('✅ Speaker updated successfully:', updated[0])

    return NextResponse.json(updated[0])

  } catch (error: any) {
    console.error('❌ Update speaker error:', error)
    return NextResponse.json({
      message: 'Failed to update speaker',
      error: error.message
    }, { status: 500 })
  }
}

// DELETE /api/events/[id]/speakers/[speakerId] - Delete speaker
export async function DELETE(_req: NextRequest, { params }: { params: { id: string, speakerId: string } }) {
  try {
    const session = await getServerSession(authOptions as any)
    if (!session) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 })
    }

    const speakerId = BigInt(params.speakerId)

    console.log('🗑️ Deleting speaker:', speakerId)

    // First, remove speaker from sessions (speaker_id is bigint)
    await prisma.$executeRawUnsafe(`
      DELETE FROM session_speakers WHERE speaker_id = $1
    `, speakerId)

    // Then delete the speaker
    await prisma.$executeRaw`
      DELETE FROM speakers WHERE id = ${speakerId}
    `

    console.log('✅ Speaker deleted successfully')

    return new NextResponse(null, { status: 204 })

  } catch (error: any) {
    console.error('❌ Delete speaker error:', error)
    return NextResponse.json({
      message: 'Failed to delete speaker',
      error: error.message
    }, { status: 500 })
  }
}
