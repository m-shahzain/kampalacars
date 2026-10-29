import { createClient as createSupabaseClient } from '@supabase/supabase-js'

/**
 * A client without the visitor's cookies, for data that is the same for everyone
 * (approved listings, brands). Results from it can be cached and shared between visitors.
 */
export function createPublicClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )
}
