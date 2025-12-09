import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

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
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
    await fs.mkdir(uploadsDir, { recursive: true })

    const safeName = file.name.replace(/[^a-zA-Z0-9_.-]/g, '_')
    const fileName = `${Date.now()}_${safeName}`
    const filePath = path.join(uploadsDir, fileName)
    await fs.writeFile(filePath, buffer)

    const url = `/uploads/${fileName}`
    return NextResponse.json({ url })
  } catch (e: any) {
    return NextResponse.json({ message: e?.message || 'Upload failed' }, { status: 500 })
  }
}
