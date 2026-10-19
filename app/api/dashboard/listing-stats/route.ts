import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'

export async function GET() {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    if (session.userType === 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const supabase = await createClient()
    const { data: cars, error: carsError } = await supabase
      .from('cars')
      .select('car_id')
      .eq('seller_id', session.userId)

    if (carsError) return NextResponse.json({ error: carsError.message }, { status: 400 })
    const carIds = (cars ?? []).map((car) => car.car_id)
    if (!carIds.length) return NextResponse.json({ totalViews: 0, viewsByCar: {} })

    const { data: views, error: viewsError } = await supabase
      .from('car_views')
      .select('car_id')
      .in('car_id', carIds)

    if (viewsError) return NextResponse.json({ error: viewsError.message }, { status: 400 })
    const viewsByCar = (views ?? []).reduce<Record<string, number>>((counts, view) => {
      counts[view.car_id] = (counts[view.car_id] ?? 0) + 1
      return counts
    }, {})

    return NextResponse.json({ totalViews: (views ?? []).length, viewsByCar })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
