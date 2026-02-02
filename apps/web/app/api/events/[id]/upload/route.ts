import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth'
import { uploadToSupabase } from '@/lib/supabase-storage'

export const dynamic = 'force-dynamic'

/**
 * Upload Image for Event (speakers, banners, etc.)
 * POST /api/events/[id]/upload
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const session = await getAuthSession()
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const formData = await req.formData()
        const file = formData.get('file') as File
        const type = formData.get('type') as string || 'general' // speaker, banner, general

        if (!file) {
            return NextResponse.json(
                { error: 'No file provided' },
                { status: 400 }
            )
        }

        console.log(`📤 [EVENT UPLOAD] Uploading ${type} image for event ${params.id}:`, file.name, file.size, 'bytes')

        // Determine folder based on type
        let folder = `events/${params.id}`
        if (type === 'speaker') {
            folder = `events/${params.id}/speakers`
        } else if (type === 'banner') {
            folder = `events/${params.id}/banners`
        }

        // Upload to Supabase
        const result = await uploadToSupabase(file, folder)

        if (!result) {
            return NextResponse.json(
                { error: 'Upload failed' },
                { status: 500 }
            )
        }

        console.log(`✅ [EVENT UPLOAD] Upload successful:`, result.url)

        return NextResponse.json({
            success: true,
            url: result.url,
            path: result.path,
            message: 'File uploaded successfully'
        })
    } catch (error: any) {
        console.error(`❌ [EVENT UPLOAD] Error:`, error)
        return NextResponse.json(
            { error: error.message || 'Upload failed' },
            { status: 500 }
        )
    }
}
