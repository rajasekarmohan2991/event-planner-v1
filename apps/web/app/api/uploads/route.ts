import { NextRequest, NextResponse } from 'next/server'
import { mkdir, stat, writeFile } from 'fs/promises'
import path from 'path'

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
    return NextResponse.json({ url, name: file.name, size: buffer.length, type: file.type || 'application/octet-stream' })
  } catch (e: any) {
    return NextResponse.json({ message: e?.message || 'Upload failed' }, { status: 500 })
  }
}
