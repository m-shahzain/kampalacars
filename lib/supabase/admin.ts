import { createClient } from '@supabase/supabase-js'

/**
 * Service-role client for admin-only operations (managing auth users,
 * changing roles). It bypasses row level security, so only use it in server
 * code after checking the caller is an admin. Never import it in client code.
 */
export function createAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set')
  }

  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
