import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: carId } = await params
    const supabase = await createClient()
    const { data: car, error: carError } = await supabase
      .from('cars')
      .select('seller_id, approval_status')
      .eq('car_id', carId)
      .maybeSingle()

    if (carError || !car || car.approval_status !== 'approved') {
      return NextResponse.json({ error: 'Car not found' }, { status: 404 })
    }

    const session = await getSession(supabase)
    // The seller and admins can inspect a listing without inflating its audience count.
    if (session?.userId === car.seller_id || session?.userType === 'admin') {
      return NextResponse.json({ recorded: false })
    }

    const { error } = await supabase.from('car_views').insert({ car_id: carId })
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    return NextResponse.json({ recorded: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
