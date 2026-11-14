import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validateBooking } from '@/lib/key-service'

// POST /api/key-bookings - Book a car key service. Open to visitors and signed-in users.
export async function POST(request: NextRequest) {
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }

  // Hidden field that people never see; bots that fill every field get a quiet "success".
  if (typeof body.website === 'string' && body.website.trim()) {
    return NextResponse.json({ ok: true })
  }

  const result = validateBooking(body)
  if ('error' in result) {
    return NextResponse.json({ error: result.error }, { status: 400 })
  }

  try {
    const supabase = await createClient()
    const { data } = await supabase.auth.getClaims()
    const { booking } = result

    // No .select() afterwards: visitors may add bookings but not read them back.
    const { error } = await supabase.from('key_bookings').insert({
      ...booking,
      car_year: booking.car_year ? Number(booking.car_year) : null,
      area: booking.area || null,
      notes: booking.notes || null,
      user_id: data?.claims?.sub ?? null,
    })

    if (error) {
      console.error('Key booking insert error:', error)
      return NextResponse.json({ error: 'Could not save your booking. Please try again or contact us on WhatsApp.' }, { status: 500 })
    }

    return NextResponse.json({ ok: true }, { status: 201 })
  } catch (error) {
    console.error('Key booking error:', error)
    return NextResponse.json({ error: 'Could not save your booking. Please try again or contact us on WhatsApp.' }, { status: 500 })
  }
}
