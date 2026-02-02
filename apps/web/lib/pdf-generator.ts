/**
 * PDF Generator Utility
 * 
 * Note: Server-side PDF generation doesn't work well in serverless environments.
 * This utility provides HTML that can be converted to PDF client-side using browser's print function.
 */

export interface PDFOptions {
    format?: 'A4' | 'Letter'
    printBackground?: boolean
}

/**
 * Generate print-optimized HTML for PDF conversion
 * @param html HTML string to prepare for PDF
 * @param options PDF generation options
 * @returns Print-ready HTML
 */
export function generatePrintableHTML(
    html: string,
    options: PDFOptions = {}
): string {
    // Add print-specific styles
    const printStyles = `
    <style>
      @media print {
        @page {
          size: ${options.format || 'A4'};
          margin: 0;
        }
        body {
          margin: 0;
          padding: 0;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .no-print {
          display: none !important;
        }
      }
    </style>
  `

    // Insert print styles before closing head tag
    return html.replace('</head>', `${printStyles}</head>`)
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
 * Create HTML response headers for browser PDF generation
 * @param filename PDF filename
 * @returns Headers object for NextResponse
 */
export function createHTMLHeaders(filename: string): Record<string, string> {
    return {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `inline; filename="${filename.replace('.pdf', '.html')}"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
    }
}
