
import { createClient } from '@supabase/supabase-js'

// Avoid build-time static evaluation of env vars
export const dynamic = 'force-dynamic'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const supabase = (supabaseUrl && supabaseKey)
    ? createClient(supabaseUrl, supabaseKey)
    : { storage: { from: () => ({ upload: () => ({ error: { message: 'Supabase not configured' } }) }) } } as any
