import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET /api/signatures/[id]/download - Download the signed document
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id

    const rows: any[] = await prisma.$queryRawUnsafe(
      `SELECT 
         id,
         document_title as "documentTitle",
         document_type as "documentType",
         document_content as "documentContent",
         signer_name as "signerName",
         signer_email as "signerEmail",
         signed_document_url as "signedDocumentUrl",
         status,
         signed_at as "signedAt"
       FROM signature_requests
       WHERE id = $1
       LIMIT 1`,
      id
    )

    if (!rows || rows.length === 0) {
      return NextResponse.json({ error: 'Signature request not found' }, { status: 404 })
    }

    const sig = rows[0]

    // Prefer a hosted signed document URL if present
    if (sig.signedDocumentUrl && typeof sig.signedDocumentUrl === 'string') {
      // If it looks like an external URL, redirect; otherwise we could proxy, but redirect is simplest
      if (/^https?:\/\//i.test(sig.signedDocumentUrl)) {
        return NextResponse.redirect(sig.signedDocumentUrl)
      }
    }

    // Otherwise, stream the stored HTML content as a download
    const content: string = sig.documentContent || '<p>No document content available.</p>'

    const title = (sig.documentTitle || sig.documentType || 'Signed_Document')
      .toString()
      .replace(/[^A-Za-z0-9_\- ]/g, '')
      .replace(/\s+/g, '_')

    const signedAt = sig.signedAt ? new Date(sig.signedAt).toLocaleString() : ''
    const signer = sig.signerName || ''

    const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${title}</title>
  <style>
    body{font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; padding:24px;}
    .meta{margin-top:24px; padding-top:12px; border-top:1px solid #e5e7eb; color:#374151; font-size:14px}
  </style>
</head>
<body>
  ${content}
  <div class="meta">
    <div><strong>Signed By:</strong> ${signer}</div>
    <div><strong>Signed At:</strong> ${signedAt}</div>
    <div><strong>Status:</strong> ${sig.status}</div>
  </div>
</body>
</html>`

    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `attachment; filename="${title}.html"`,
        'Cache-Control': 'no-store'
      }
    })
  } catch (error: any) {
    console.error('Error downloading signed document:', error)
    return NextResponse.json({ error: 'Failed to download document', details: error.message }, { status: 500 })
  }
}
