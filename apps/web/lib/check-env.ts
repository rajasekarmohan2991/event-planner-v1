/**
 * Environment Variables Checker
 * Run this to verify Supabase configuration
 */

export function checkSupabaseConfig() {
    const checks = {
        supabaseUrl: {
            key: 'NEXT_PUBLIC_SUPABASE_URL',
            value: process.env.NEXT_PUBLIC_SUPABASE_URL,
            valid: false,
            message: ''
        },
        supabaseKey: {
            key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
            value: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
            valid: false,
            message: ''
        }
    }

    // Check Supabase URL
    if (!checks.supabaseUrl.value) {
        checks.supabaseUrl.message = '❌ Missing - Add to .env.local and Vercel'
    } else if (!checks.supabaseUrl.value.includes('supabase.co')) {
        checks.supabaseUrl.message = '⚠️ Invalid format - Should be https://xxxxx.supabase.co'
    } else {
        checks.supabaseUrl.valid = true
        checks.supabaseUrl.message = '✅ Configured correctly'
    }

    // Check Supabase Anon Key
    if (!checks.supabaseKey.value) {
        checks.supabaseKey.message = '❌ Missing - Add to .env.local and Vercel'
    } else if (!checks.supabaseKey.value.startsWith('eyJ')) {
        checks.supabaseKey.message = '⚠️ Invalid format - Should start with eyJ'
    } else if (checks.supabaseKey.value.length < 100) {
        checks.supabaseKey.message = '⚠️ Too short - Anon key should be ~200+ characters'
    } else {
        checks.supabaseKey.valid = true
        checks.supabaseKey.message = '✅ Configured correctly'
    }

    return checks
}

export function getConfigStatus() {
    const checks = checkSupabaseConfig()
    const allValid = Object.values(checks).every(check => check.valid)

    return {
        ready: allValid,
        checks,
        summary: allValid
            ? '✅ All environment variables configured correctly!'
            : '⚠️ Some environment variables need attention'
    }
}
