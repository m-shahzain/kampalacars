import { createClient } from '@/lib/supabase/server'
import { NextResponse, type NextRequest } from 'next/server'

// Only allow redirects back into this site.
function safeNext(next: string | null) {
  return next && next.startsWith('/') && !next.startsWith('//') ? next : '/dashboard'
}

// GET /auth/callback - Google sends the user back here after signing in.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = safeNext(searchParams.get('next'))

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      // Google does not share a phone number or address, so new users add them once.
      const { data: profile } = await supabase
        .from('users')
        .select('phone, address')
        .eq('user_id', data.user.id)
        .maybeSingle()

      const destination = profile?.phone && profile?.address
        ? next
        : `/auth/complete-profile?next=${encodeURIComponent(next)}`
      return NextResponse.redirect(`${origin}${destination}`)
    }
  }

  return NextResponse.redirect(`${origin}/auth/login?error=google`)
}
