
import { NextRequest, NextResponse } from 'next/server'
import { mkdir, stat, writeFile } from 'fs/promises'
import path from 'path'
import { uploadToCloudinary, isCloudinaryConfigured } from '@/lib/cloudinary'
import { supabase } from '@/lib/supabase'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData()
    const file = form.get('file') as File | null
    if (!file) {
      return NextResponse.json({ message: 'file is required (multipart/form-data, field name "file")' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // 1. Try Cloudinary first (Recommended for Vercel/Production)
    if (isCloudinaryConfigured()) {
      try {
        const result = await uploadToCloudinary(buffer, 'event-planner/uploads')
        return NextResponse.json({
          url: result.secure_url,
          name: file.name,
          size: buffer.length,
          type: file.type || 'application/octet-stream',
          provider: 'cloudinary'
        })
      } catch (uploadError: any) {
        console.error('Cloudinary upload failed:', uploadError)
      }
    }

    // 2. Try Supabase Storage (Preferred Alternative)
    if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
      try {
        const ext = path.extname(file.name || '') || '.bin'
        const safeExt = ext.length <= 8 ? ext : '.bin'
        const base = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
        const fileName = `${base}${safeExt}`
        const bucket = 'uploads'

        // Upload
        const { data, error } = await supabase.storage
          .from(bucket)
          .upload(fileName, buffer, {
            contentType: file.type || 'application/octet-stream',
            upsert: false
          })

        if (error) {
          console.warn('Supabase upload warning:', error)
          // If bucket doesn't exist, we might want to tell the user, but for now fall through
          if (error.message.includes('bucket not found') || error.message.includes('row not found')) {
            throw new Error('Supabase Storage bucket "uploads" likely missing. Please create it and set as Public.')
          }
          throw error
        }

        // Get Public URL
        const { data: { publicUrl } } = supabase.storage
          .from(bucket)
          .getPublicUrl(fileName)

        return NextResponse.json({
          url: publicUrl,
          name: file.name,
          size: buffer.length,
          type: file.type,
          provider: 'supabase'
        })
      } catch (sbError: any) {
        console.error('Supabase upload failed:', sbError)
        // If we are on Vercel and Supabase failed, we must error out
        const isVercel = process.env.VERCEL === '1' || process.env.AWS_LAMBDA_FUNCTION_NAME
        if (isVercel && !isCloudinaryConfigured()) {
          return NextResponse.json({
            message: 'Storage upload failed. Ensure the "uploads" bucket exists in Supabase and is Public.',
            error: sbError.message
          }, { status: 500 })
        }
      }
    }

    // 3. Fallback to Local Filesystem (Only for local dev)
    const isVercel = process.env.VERCEL === '1' || process.env.AWS_LAMBDA_FUNCTION_NAME

    if (isVercel) {
      return NextResponse.json({
        message: 'Storage configuration missing. Please configure Supabase (Bucket "uploads") or Cloudinary for production.',
        error: 'No valid storage provider found.'
      }, { status: 500 })
    }

    const ext = path.extname(file.name || '') || '.bin'
    const safeExt = ext.length <= 8 ? ext : '.bin'
    const base = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const fileName = `${base}${safeExt}`

    const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
    try {
      await stat(uploadsDir)
    } catch {
      await mkdir(uploadsDir, { recursive: true })
    }

    const dest = path.join(uploadsDir, fileName)
    await writeFile(dest, buffer)

    const url = `/uploads/${fileName}`
    return NextResponse.json({
      url,
      name: file.name,
      size: buffer.length,
      type: file.type || 'application/octet-stream',
      provider: 'local'
    })
  } catch (e: any) {
    return NextResponse.json({ message: e?.message || 'Upload failed' }, { status: 500 })
  }
}
