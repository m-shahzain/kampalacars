import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

// Keep the login across browser refreshes and application restarts. Browsers
// still impose a maximum cookie lifetime, so use a long, explicit duration.
const SESSION_MAX_AGE = 60 * 60 * 24 * 365

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { email, password, fullname, phone, address, user_type = 'buyer' } = await request.json()

    if (!email || !password || !fullname || !phone || !address) {
      return NextResponse.json({ error: 'Email, password, full name, phone, and address are required' }, { status: 400 })
    }

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('user_id')
      .eq('email', email)
      .single()

    if (existingUser) {
      return NextResponse.json({ error: 'User already exists' }, { status: 400 })
    }

    // Create user with plain text password
    const { data: user, error: userError } = await supabase
      .from('users')
      .insert({
        email,
        password, // Plain text password
        fullname,
        phone,
        address,
        user_type
      })
      .select()
      .single()

    if (userError) {
      return NextResponse.json({ error: userError.message }, { status: 400 })
    }

    // Create a simple session cookie
    const cookieStore = await cookies()
    const sessionData = {
      userId: user.user_id,
      email: user.email,
      fullname: user.fullname,
      userType: user.user_type
    }

    cookieStore.set('session', JSON.stringify(sessionData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: SESSION_MAX_AGE
    })

    return NextResponse.json({ 
      user: {
        user_id: user.user_id,
        email: user.email,
        fullname: user.fullname,
        phone: user.phone,
        user_type: user.user_type,
        is_premium: user.is_premium,
        created_at: user.created_at
      }
    })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 
