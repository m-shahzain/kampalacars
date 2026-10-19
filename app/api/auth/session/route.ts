import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET /api/auth/session - The signed-in user's profile, or null for visitors.
export async function GET() {
  try {
    const supabase = await createClient()
    const { data } = await supabase.auth.getClaims()
    const userId = data?.claims?.sub

    if (!userId) {
      return NextResponse.json({ user: null })
    }

    const { data: user } = await supabase
      .from('users')
      .select('user_id, fullname, email, phone, address, user_type, is_premium, profile_picture_url, created_at')
      .eq('user_id', userId)
      .maybeSingle()

    if (!user) {
      return NextResponse.json({ user: null })
    }

    return NextResponse.json({
      user: {
        ...user,
        // For backward compatibility with components expecting profile
        profile: {
          full_name: user.fullname,
          phone: user.phone
        }
      }
    })
  } catch {
    return NextResponse.json({ user: null })
  }
}
