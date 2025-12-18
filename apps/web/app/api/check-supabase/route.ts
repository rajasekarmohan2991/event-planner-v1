import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

/**
 * Check Supabase Configuration
 * GET /api/check-supabase
 */
export async function GET() {
    const checks: any = {
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        checks: {}
    }

    // Check environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    checks.checks.supabaseUrl = {
        exists: !!supabaseUrl,
        valid: supabaseUrl?.includes('supabase.co') || false,
        value: supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : 'NOT SET',
        message: !supabaseUrl
            ? '❌ NEXT_PUBLIC_SUPABASE_URL not set'
            : supabaseUrl.includes('supabase.co')
                ? '✅ Valid Supabase URL'
                : '⚠️ URL format looks incorrect'
    }

    checks.checks.supabaseKey = {
        exists: !!supabaseKey,
        valid: supabaseKey?.startsWith('eyJ') || false,
        length: supabaseKey?.length || 0,
        value: supabaseKey ? `${supabaseKey.substring(0, 20)}...` : 'NOT SET',
        message: !supabaseKey
            ? '❌ NEXT_PUBLIC_SUPABASE_ANON_KEY not set'
            : supabaseKey.startsWith('eyJ')
                ? '✅ Valid anon key format'
                : '⚠️ Key format looks incorrect'
    }

    // Test Supabase connection
    if (supabaseUrl && supabaseKey) {
        try {
            const supabase = createClient(supabaseUrl, supabaseKey)

            // Try to list buckets
            const { data: buckets, error } = await supabase.storage.listBuckets()

            checks.checks.connection = {
                success: !error,
                message: error ? `❌ Connection failed: ${error.message}` : '✅ Connected to Supabase',
                bucketsFound: buckets?.length || 0,
                buckets: buckets?.map(b => ({
                    name: b.name,
                    public: b.public,
                    id: b.id
                })) || []
            }

            // Check if 'uploads' bucket exists
            const uploadsBucket = buckets?.find(b => b.name === 'uploads')
            checks.checks.uploadsBucket = {
                exists: !!uploadsBucket,
                public: uploadsBucket?.public || false,
                message: !uploadsBucket
                    ? '❌ "uploads" bucket not found - Create it in Supabase Storage'
                    : uploadsBucket.public
                        ? '✅ "uploads" bucket exists and is public'
                        : '⚠️ "uploads" bucket exists but is not public - Make it public'
            }

        } catch (error: any) {
            checks.checks.connection = {
                success: false,
                message: `❌ Connection error: ${error.message}`,
                error: error.toString()
            }
        }
    } else {
        checks.checks.connection = {
            success: false,
            message: '❌ Cannot test connection - Environment variables not set'
        }
    }

    // Overall status
    const allValid =
        checks.checks.supabaseUrl.valid &&
        checks.checks.supabaseKey.valid &&
        checks.checks.connection?.success &&
        checks.checks.uploadsBucket?.exists

    checks.ready = allValid
    checks.summary = allValid
        ? '✅ Supabase is fully configured and ready!'
        : '⚠️ Some configuration issues need to be resolved'

    return NextResponse.json(checks, {
        headers: {
            'Cache-Control': 'no-store'
        }
    })
}
