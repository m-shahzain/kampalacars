import type { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

export type Session = {
  userId: string
  email: string
  fullname: string
  phone: string | null
  userType: 'buyer' | 'seller' | 'admin'
  isPremium: boolean
}

/**
 * The signed-in user, verified from the Supabase Auth cookie, with the role
 * and details stored in the users table. Returns null for visitors.
 */
export async function getSession(supabase?: SupabaseClient): Promise<Session | null> {
  const client = supabase ?? (await createClient())
  const { data } = await client.auth.getClaims()
  const userId = data?.claims?.sub
  if (!userId) return null

  const { data: profile } = await client
    .from('users')
    .select('email, fullname, phone, user_type, is_premium')
    .eq('user_id', userId)
    .maybeSingle()
  if (!profile) return null

  return {
    userId,
    email: profile.email,
    fullname: profile.fullname,
    phone: profile.phone,
    userType: profile.user_type,
    isPremium: profile.is_premium,
  }
}
