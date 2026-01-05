import NextAuth from "next-auth"
import { authOptions } from "@/lib/auth"
import { NextRequest, NextResponse } from "next/server"
export const dynamic = 'force-dynamic'

const handler = NextAuth(authOptions)

// Add CORS headers to all responses
async function handlerWithCors(req: NextRequest) {
    const response = await handler(req as any, {} as any)

    // Add CORS headers
    if (response instanceof NextResponse) {
        response.headers.set('Access-Control-Allow-Credentials', 'true')
        response.headers.set('Access-Control-Allow-Origin', req.headers.get('origin') || '*')
        response.headers.set('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
        response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    }

    return response
}

// Handle OPTIONS requests for CORS preflight
export async function OPTIONS(req: NextRequest) {
    return new NextResponse(null, {
        status: 200,
        headers: {
            'Access-Control-Allow-Credentials': 'true',
            'Access-Control-Allow-Origin': req.headers.get('origin') || '*',
            'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
    })
}

export { handler as GET, handler as POST }
