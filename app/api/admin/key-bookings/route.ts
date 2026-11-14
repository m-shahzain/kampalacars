import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSession } from '@/lib/session'
import { BOOKING_STATUSES } from '@/lib/key-service'

async function adminClient() {
  const supabase = await createClient()
  const session = await getSession(supabase)
  return session?.userType === 'admin' ? supabase : null
}

// GET /api/admin/key-bookings?status=new - Key service bookings, newest first (admin only).
export async function GET(request: NextRequest) {
  const supabase = await adminClient()
  if (!supabase) {
    return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 403 })
  }

  const status = request.nextUrl.searchParams.get('status')
  let query = supabase.from('key_bookings').select('*').order('created_at', { ascending: false }).limit(500)
  if (status && (BOOKING_STATUSES as readonly string[]).includes(status)) query = query.eq('status', status)

  const { data, error } = await query
  if (error) {
    console.error('Key bookings fetch error:', error)
    return NextResponse.json({ error: 'Could not load bookings. Has docs/add-key-bookings-migration.sql been run?' }, { status: 500 })
  }

  return NextResponse.json({ bookings: data ?? [] })
}

// PATCH /api/admin/key-bookings - Change a booking's status (admin only).
export async function PATCH(request: NextRequest) {
  const supabase = await adminClient()
  if (!supabase) {
    return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 403 })
  }

  const { booking_id, status } = await request.json().catch(() => ({}))
  if (typeof booking_id !== 'string' || !(BOOKING_STATUSES as readonly string[]).includes(status)) {
    return NextResponse.json({ error: 'Invalid booking or status.' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('key_bookings')
    .update({ status })
    .eq('booking_id', booking_id)
    .select('booking_id, status')
    .maybeSingle()

  if (error || !data) {
    console.error('Key booking update error:', error)
    return NextResponse.json({ error: 'Could not update the booking.' }, { status: 500 })
  }

  return NextResponse.json({ booking: data })
}
