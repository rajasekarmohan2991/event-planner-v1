import { NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

export async function GET(
  request: Request,
  { params }: { params: { path: string[] } }
) {
  try {
    const filePath = path.join(
      process.cwd(),
      'public',
      'animations',
      ...params.path
    )
    
    const fileContents = await fs.readFile(filePath, 'utf8')
    return new NextResponse(fileContents, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch (error) {
    return new NextResponse(null, { status: 404 })
  }
}
