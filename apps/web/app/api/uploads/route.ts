import { NextRequest, NextResponse } from 'next/server'
import { mkdir, stat, writeFile } from 'fs/promises'
import path from 'path'
import { uploadToCloudinary, isCloudinaryConfigured } from '@/lib/cloudinary'

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
        return NextResponse.json({ message: 'Cloudinary upload failed', error: uploadError.message }, { status: 500 })
      }
    }

    // 2. Fallback to Local Filesystem (Only works in Dev or environments with write access)
    // In Vercel serverless, this will likely fail or be ephemeral
    
    // Check if we are likely in a read-only environment
    const isVercel = process.env.VERCEL === '1' || process.env.AWS_LAMBDA_FUNCTION_NAME
    
    if (isVercel) {
       return NextResponse.json({ 
         message: 'Storage configuration missing. Please configure Cloudinary for file uploads in production.',
         error: 'Missing CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, or CLOUDINARY_API_SECRET' 
       }, { status: 500 })
    }

    const ext = path.extname(file.name || '') || '.bin'
    const safeExt = ext.length <= 8 ? ext : '.bin'
    const base = `${Date.now()}-${Math.random().toString(36).slice(2,8)}`
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
