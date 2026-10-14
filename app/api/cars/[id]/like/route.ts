import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('session')
    if (!sessionCookie) return NextResponse.json({ error: 'Please log in to like a car' }, { status: 401 })

    const session = JSON.parse(sessionCookie.value)
    const { id: carId } = await params
    const supabase = await createClient()
    const { data: existingLike, error: findError } = await supabase
      .from('car_likes')
      .select('car_id')
      .eq('car_id', carId)
      .eq('user_id', session.userId)
      .maybeSingle()

    if (findError) return NextResponse.json({ error: findError.message }, { status: 400 })

    const { error } = existingLike
      ? await supabase.from('car_likes').delete().eq('car_id', carId).eq('user_id', session.userId)
      : await supabase.from('car_likes').insert({ car_id: carId, user_id: session.userId })

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
