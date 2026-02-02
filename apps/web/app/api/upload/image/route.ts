import { NextRequest, NextResponse } from 'next/server'
import { uploadToSupabase, uploadMultipleToSupabase } from '@/lib/supabase-storage'

export const dynamic = 'force-dynamic'

/**
 * Upload Image to Supabase Storage
 * POST /api/upload/image
 */
export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData()
        const file = formData.get('file') as File
        const folder = formData.get('folder') as string || 'events'

        if (!file) {
            return NextResponse.json(
                { error: 'No file provided' },
                { status: 400 }
            )
        }

        console.log('📤 Uploading file:', file.name, file.size, 'bytes')

        // Upload to Supabase
        const result = await uploadToSupabase(file, folder)

        if (!result) {
            return NextResponse.json(
                { error: 'Upload failed' },
                { status: 500 }
            )
        }

        console.log('✅ Upload successful:', result.url)

        return NextResponse.json({
            success: true,
            url: result.url,
            path: result.path,
            message: 'File uploaded successfully'
        })
    } catch (error: any) {
        console.error('❌ Upload error:', error)
        return NextResponse.json(
            { error: error.message || 'Upload failed' },
            { status: 500 }
        )
    }
}

/**
 * Upload Multiple Images
 * POST /api/upload/images (with multiple files)
 */
export async function PUT(req: NextRequest) {
    try {
        const formData = await req.formData()
        const files: File[] = []
        const folder = formData.get('folder') as string || 'events'

        // Get all files from formData
        for (const [key, value] of formData.entries()) {
            if (value instanceof File) {
                files.push(value)
            }
        }

        if (files.length === 0) {
            return NextResponse.json(
                { error: 'No files provided' },
                { status: 400 }
            )
        }

        console.log(`📤 Uploading ${files.length} files`)

        // Upload all files
        const results = await uploadMultipleToSupabase(files, folder)

        console.log(`✅ Uploaded ${results.length} files successfully`)

        return NextResponse.json({
            success: true,
            files: results,
            count: results.length,
            message: `${results.length} files uploaded successfully`
        })
    } catch (error: any) {
        console.error('❌ Multiple upload error:', error)
        return NextResponse.json(
            { error: error.message || 'Upload failed' },
            { status: 500 }
        )
    }
}
