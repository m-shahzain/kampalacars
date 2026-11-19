import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { createAdminClient } from '@/lib/supabase/admin'
import { expirePublicCars } from '@/lib/cars-server'

const MAX_NAME_LENGTH = 50

async function isAdmin() {
  const session = await getSession()
  return session?.userType === 'admin'
}

const forbidden = () => NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 403 })

// Explain a missing server key instead of a bare "Internal server error".
function serverError(error: unknown) {
  console.error('Admin brands request failed:', error)
  const message = error instanceof Error && error.message.includes('SUPABASE_SERVICE_ROLE_KEY')
    ? 'Server setup: SUPABASE_SERVICE_ROLE_KEY is missing. Add it in your hosting settings and redeploy.'
    : 'Internal server error'
  return NextResponse.json({ error: message }, { status: 500 })
}

/** Trims and collapses spaces: "  land  rover " -> "land rover". Returns an error message when invalid. */
function cleanName(value: unknown): { name: string } | { error: string } {
  const name = typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : ''
  if (!name) return { error: 'Enter a brand name.' }
  if (name.length > MAX_NAME_LENGTH) return { error: `Brand names can be at most ${MAX_NAME_LENGTH} characters.` }
  return { name }
}

/** Brand names are unique regardless of case, so "toyota" can't be added next to "Toyota". */
async function nameTaken(supabase: ReturnType<typeof createAdminClient>, name: string, exceptId?: string) {
  let query = supabase.from('car_brands').select('brand_id').ilike('brand_name', name.replace(/[\\%_]/g, '\\$&'))
  if (exceptId) query = query.neq('brand_id', exceptId)
  const { data } = await query.limit(1)
  return Boolean(data?.length)
}

// GET /api/admin/brands - Every brand with how many listings use it (admin only).
export async function GET() {
  try {
    if (!(await isAdmin())) return forbidden()
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('car_brands')
      .select('brand_id, brand_name, created_at, cars(count)')
      .order('brand_name', { ascending: true })
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    const brands = (data ?? []).map(({ cars, ...brand }) => ({
      ...brand,
      car_count: (cars as unknown as { count: number }[])?.[0]?.count ?? 0,
    }))
    return NextResponse.json({ brands })
  } catch (error) {
    return serverError(error)
  }
}

// POST /api/admin/brands - Add a brand: { brand_name } (admin only).
export async function POST(request: NextRequest) {
  try {
    if (!(await isAdmin())) return forbidden()
    const body = await request.json().catch(() => ({}))
    const cleaned = cleanName(body.brand_name)
    if ('error' in cleaned) return NextResponse.json({ error: cleaned.error }, { status: 400 })

    const supabase = createAdminClient()
    if (await nameTaken(supabase, cleaned.name)) {
      return NextResponse.json({ error: `"${cleaned.name}" already exists.` }, { status: 409 })
    }

    const { data, error } = await supabase
      .from('car_brands')
      .insert({ brand_name: cleaned.name })
      .select('brand_id, brand_name, created_at')
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    expirePublicCars()
    return NextResponse.json({ brand: { ...data, car_count: 0 } }, { status: 201 })
  } catch (error) {
    return serverError(error)
  }
}

// PUT /api/admin/brands - Rename a brand: { brand_id, brand_name } (admin only).
export async function PUT(request: NextRequest) {
  try {
    if (!(await isAdmin())) return forbidden()
    const body = await request.json().catch(() => ({}))
    if (typeof body.brand_id !== 'string' || !body.brand_id) {
      return NextResponse.json({ error: 'Brand ID is required.' }, { status: 400 })
    }
    const cleaned = cleanName(body.brand_name)
    if ('error' in cleaned) return NextResponse.json({ error: cleaned.error }, { status: 400 })

    const supabase = createAdminClient()
    if (await nameTaken(supabase, cleaned.name, body.brand_id)) {
      return NextResponse.json({ error: `"${cleaned.name}" already exists.` }, { status: 409 })
    }

    const { data, error } = await supabase
      .from('car_brands')
      .update({ brand_name: cleaned.name })
      .eq('brand_id', body.brand_id)
      .select('brand_id, brand_name, created_at')
      .maybeSingle()
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    if (!data) return NextResponse.json({ error: 'Brand not found.' }, { status: 404 })

    expirePublicCars()
    return NextResponse.json({ brand: data })
  } catch (error) {
    return serverError(error)
  }
}

// DELETE /api/admin/brands?brand_id=... - Remove a brand no listing uses (admin only).
export async function DELETE(request: NextRequest) {
  try {
    if (!(await isAdmin())) return forbidden()
    const brandId = request.nextUrl.searchParams.get('brand_id')
    if (!brandId) return NextResponse.json({ error: 'Brand ID is required.' }, { status: 400 })

    const supabase = createAdminClient()
    const { count, error: countError } = await supabase
      .from('cars')
      .select('car_id', { count: 'exact', head: true })
      .eq('brand_id', brandId)
    if (countError) return NextResponse.json({ error: countError.message }, { status: 400 })
    if (count) {
      return NextResponse.json(
        { error: `This brand is used by ${count} listing${count === 1 ? '' : 's'}. Move or delete those cars first.` },
        { status: 409 }
      )
    }

    const { data, error } = await supabase.from('car_brands').delete().eq('brand_id', brandId).select('brand_id')
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    if (!data?.length) return NextResponse.json({ error: 'Brand not found.' }, { status: 404 })

    expirePublicCars()
    return NextResponse.json({ message: 'Brand deleted' })
  } catch (error) {
    return serverError(error)
  }
}
