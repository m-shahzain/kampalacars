import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const VISITOR_COOKIE_MAX_AGE = 60 * 60 * 24 * 365

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('session')
    const session = sessionCookie ? JSON.parse(sessionCookie.value) : null

    // Visitors without an account are identified by a random, long-lived cookie
    // so they can like a car once and unlike it again.
    let visitorId = cookieStore.get('visitor_id')?.value
    if (!session?.userId && !visitorId) {
      visitorId = crypto.randomUUID()
      cookieStore.set('visitor_id', visitorId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: VISITOR_COOKIE_MAX_AGE,
      })
    }

    const liker = session?.userId
      ? { column: 'user_id', value: session.userId as string }
      : { column: 'visitor_id', value: visitorId as string }

    const { id: carId } = await params
    const supabase = await createClient()
    const { data: existingLike, error: findError } = await supabase
      .from('car_likes')
      .select('car_id')
      .eq('car_id', carId)
      .eq(liker.column, liker.value)
      .maybeSingle()

    if (findError) return NextResponse.json({ error: findError.message }, { status: 400 })

    const { error } = existingLike
      ? await supabase.from('car_likes').delete().eq('car_id', carId).eq(liker.column, liker.value)
      : await supabase.from('car_likes').insert({ car_id: carId, [liker.column]: liker.value })

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    const { count } = await supabase
      .from('car_likes')
      .select('*', { count: 'exact', head: true })
      .eq('car_id', carId)

    return NextResponse.json({ liked: !existingLike, likes_count: count ?? 0 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
