import htmlPdf from 'html-pdf-node'

export interface PDFOptions {
    format?: 'A4' | 'Letter'
    printBackground?: boolean
    margin?: {
        top?: string
        right?: string
        bottom?: string
        left?: string
    }
}

/**
 * Generate PDF from HTML content
 * @param html HTML string to convert to PDF
 * @param options PDF generation options
 * @returns PDF buffer
 */
export async function generatePDFFromHTML(
    html: string,
    options: PDFOptions = {}
): Promise<Buffer> {
    const defaultOptions = {
        format: 'A4',
        printBackground: true,
        margin: {
            top: '0',
            right: '0',
            bottom: '0',
            left: '0'
        },
        ...options
    }

    const file = { content: html }

    try {
        const pdfBuffer = await htmlPdf.generatePdf(file, defaultOptions)
        return pdfBuffer
    } catch (error) {
        console.error('PDF generation error:', error)
        throw new Error('Failed to generate PDF')
    }
}

/**
 * Generate filename for invoice/receipt PDF
 * @param type Type of document (Invoice or Receipt)
 * @param number Document number
 * @param entityName Name of the entity
 * @returns Sanitized filename
 */
export function generatePDFFilename(
    type: 'Invoice' | 'Receipt',
    number: string,
    entityName: string
): string {
    // Sanitize entity name for filename
    const sanitized = entityName
        .replace(/[^a-zA-Z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .substring(0, 30)

    return `${type}-${number}-${sanitized}.pdf`
}

/**
 * Create PDF response headers
 * @param filename PDF filename
 * @returns Headers object for NextResponse
 */
export function createPDFHeaders(filename: string): Record<string, string> {
    return {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
    }
}
