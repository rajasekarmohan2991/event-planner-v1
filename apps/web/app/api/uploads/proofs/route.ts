import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import { uploadToCloudinary, isCloudinaryConfigured } from '@/lib/cloudinary'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData()
    const file = form.get('file') as File | null
    if (!file) {
      return NextResponse.json({ message: 'file is required' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // 1. Try Cloudinary first
    if (isCloudinaryConfigured()) {
      try {
        const result = await uploadToCloudinary(buffer, 'event-planner/proofs')
        return NextResponse.json({ url: result.secure_url, provider: 'cloudinary' })
      } catch (uploadError: any) {
        console.error('Cloudinary upload failed:', uploadError)
        return NextResponse.json({ message: 'Cloudinary upload failed', error: uploadError.message }, { status: 500 })
      }
    }

    // 2. Check for Vercel environment
    const isVercel = process.env.VERCEL === '1' || process.env.AWS_LAMBDA_FUNCTION_NAME
    if (isVercel) {
       return NextResponse.json({ 
         message: 'Storage configuration missing. Please configure Cloudinary for file uploads in production.',
         error: 'Missing CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, or CLOUDINARY_API_SECRET' 
       }, { status: 500 })
    }

    // 3. Fallback to Local Filesystem
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
    await fs.mkdir(uploadsDir, { recursive: true })

    const safeName = file.name.replace(/[^a-zA-Z0-9_.-]/g, '_')
    const fileName = `${Date.now()}_${safeName}`
    const filePath = path.join(uploadsDir, fileName)
    await fs.writeFile(filePath, buffer)

    const url = `/uploads/${fileName}`
    return NextResponse.json({ url, provider: 'local' })
  } catch (e: any) {
    return NextResponse.json({ message: e?.message || 'Upload failed' }, { status: 500 })
  }
}
