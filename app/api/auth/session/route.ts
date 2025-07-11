import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('session')

    if (!sessionCookie) {
      return NextResponse.json({ user: null })
    }

    const sessionData = JSON.parse(sessionCookie.value)
    const supabase = await createClient()

    // Get user from users table (no profiles table in new schema)
    const { data: user, error } = await supabase
      .from('users')
      .select('user_id, fullname, email, phone, user_type, created_at')
      .eq('user_id', sessionData.userId)
      .single()

    if (error || !user) {
      // Clear invalid session
      cookieStore.delete('session')
      return NextResponse.json({ user: null })
    }

    return NextResponse.json({ 
      user: {
        user_id: user.user_id,
        email: user.email,
        fullname: user.fullname,
        phone: user.phone,
        user_type: user.user_type,
        created_at: user.created_at,
        // For backward compatibility with components expecting profile
        profile: {
          full_name: user.fullname,
          phone: user.phone
        }
      }
    })
  } catch (error) {
    return NextResponse.json({ user: null })
  }
} 