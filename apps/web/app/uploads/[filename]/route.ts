import { NextRequest } from 'next/server'
import path from 'path'
import { promises as fs } from 'fs'

export const runtime = 'nodejs'

function contentTypeFor(ext: string): string {
  switch (ext.toLowerCase()) {
    case '.png': return 'image/png'
    case '.jpg':
    case '.jpeg': return 'image/jpeg'
    case '.gif': return 'image/gif'
    case '.webp': return 'image/webp'
    case '.svg': return 'image/svg+xml'
    default: return 'application/octet-stream'
  }
}

export async function GET(_req: NextRequest, { params }: { params: { filename: string } }) {
  try {
    const raw = params.filename || ''
    const safe = path.basename(raw) // prevent path traversal
    const filePath = path.join(process.cwd(), 'public', 'uploads', safe)
    const file = await fs.readFile(filePath)
    const ext = path.extname(safe)
    const body = new Uint8Array(file)
    return new Response(body, {
      headers: {
        'Content-Type': contentTypeFor(ext),
        'Cache-Control': 'public, max-age=31536000, immutable'
      }
    })
  } catch (e) {
    return new Response('Not Found', { status: 404 })
  }
}
