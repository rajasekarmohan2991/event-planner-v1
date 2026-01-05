
import { NextRequest, NextResponse } from 'next/server'
import { mkdir, stat, writeFile } from 'fs/promises'
import path from 'path'
import { uploadToCloudinary, isCloudinaryConfigured } from '@/lib/cloudinary'
import { supabase } from '@/lib/supabase'
export const dynamic = 'force-dynamic'

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
        // Fall through to other providers if one fails? Or just error? 
        // Usually if Cloudinary is configured but fails, we might want to try others, or maybe just error.
        // Let's fall through for now.
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

        // Check if client is actually configured
        if (!supabase || (supabase as any).storage?.from?.()?.upload?.().error?.message === 'Supabase not configured') {
          throw new Error('Supabase client is not properly configured. Check SUPABASE_URL and Keys.')
        }

        // Upload
        const { data, error } = await supabase.storage
          .from(bucket)
          .upload(fileName, buffer, {
            contentType: file.type || 'application/octet-stream',
            upsert: false
          })

        if (error) {
          console.warn('Supabase upload warning:', error)

          if (error.message.includes('bucket not found') || error.message.includes('row not found') || error.message.includes('The resource was not found')) {
            throw new Error(`Supabase Storage bucket "${bucket}" is missing. Please create a Public bucket named "${bucket}" in your Supabase project.`)
          }
          if (error.message.includes('new row violates row-level security policy')) {
            throw new Error('RLS policy violation. Ensure your "uploads" bucket allows INSERTs (or use Service Role Key in .env).')
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

        // Detailed logging for debugging
        console.log('Supabase Config Check:', {
          url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing',
          serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Missing',
          anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Missing'
        })

        // If we are on Vercel and Supabase failed, we must error out
        // UNLESS we are in development mode (local vercel dev), in which case we can try local fs
      }
    } else {
      console.log('Skipping Supabase upload: NEXT_PUBLIC_SUPABASE_URL is not set.')
    }

    // 3. Fallback to Local Filesystem (Only if writable)
    // We attempt to write. If this fails (e.g. read-only filesystem on Vercel), the global catch will handle it.


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

    console.log(`📂 Uploading to local FS: ${dest}`)

    try {
      await writeFile(dest, buffer)
    } catch (writeErr: any) {
      console.error(`❌ Upload writeFile failed at ${dest}:`, writeErr)
      throw new Error(`Failed to write file to ${dest}: ${writeErr.message}`)
    }

    const url = `/uploads/${fileName}`
    return NextResponse.json({
      url,
      name: file.name,
      size: buffer.length,
      type: file.type || 'application/octet-stream',
      provider: 'local'
    })
  } catch (e: any) {
    console.error('❌ General upload error:', e)
    return NextResponse.json({
      message: e?.message || 'Upload failed',
      details: e.toString()
    }, { status: 500 })
  }
}
