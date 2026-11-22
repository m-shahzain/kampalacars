import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { expirePublicCars } from '@/lib/cars-server'
import { badRequest, cleanName, embeddedCount, forbidden, ilikeExact, isAdmin, serverError } from '@/lib/admin-api'

const MAX_NAME_LENGTH = 50

const toItem = (brand: { brand_id: string; brand_name: string }, carCount: number) =>
  ({ id: brand.brand_id, name: brand.brand_name, car_count: carCount })

/** Brand names are unique regardless of case, so "toyota" can't be added next to "Toyota". */
async function nameTaken(supabase: ReturnType<typeof createAdminClient>, name: string, exceptId?: string) {
  let query = supabase.from('car_brands').select('brand_id').ilike('brand_name', ilikeExact(name))
  if (exceptId) query = query.neq('brand_id', exceptId)
  const { data } = await query.limit(1)
  return Boolean(data?.length)
}

// GET /api/admin/brands - Every brand with how many listings use it (admin only).
export async function GET() {
  try {
    if (!(await isAdmin())) return forbidden()
    const { data, error } = await createAdminClient()
      .from('car_brands')
      .select('brand_id, brand_name, cars(count)')
      .order('brand_name', { ascending: true })
    if (error) throw error
    return NextResponse.json({ items: (data ?? []).map((brand) => toItem(brand, embeddedCount(brand.cars))) })
  } catch (error) {
    return serverError(error)
  }
}

// POST /api/admin/brands - Add a brand: { name } (admin only).
export async function POST(request: NextRequest) {
  try {
    if (!(await isAdmin())) return forbidden()
    const body = await request.json().catch(() => ({}))
    const cleaned = cleanName(body.name, MAX_NAME_LENGTH)
    if ('error' in cleaned) return badRequest(cleaned.error)

    const supabase = createAdminClient()
    if (await nameTaken(supabase, cleaned.name)) return badRequest(`"${cleaned.name}" already exists.`, 409)

    const { data, error } = await supabase.from('car_brands').insert({ brand_name: cleaned.name }).select('brand_id, brand_name').single()
    if (error) throw error

    expirePublicCars()
    return NextResponse.json({ item: toItem(data, 0) }, { status: 201 })
  } catch (error) {
    return serverError(error)
  }
}

// PUT /api/admin/brands - Rename a brand: { id, name } (admin only).
export async function PUT(request: NextRequest) {
  try {
    if (!(await isAdmin())) return forbidden()
    const body = await request.json().catch(() => ({}))
    if (typeof body.id !== 'string' || !body.id) return badRequest('Brand ID is required.')
    const cleaned = cleanName(body.name, MAX_NAME_LENGTH)
    if ('error' in cleaned) return badRequest(cleaned.error)

    const supabase = createAdminClient()
    if (await nameTaken(supabase, cleaned.name, body.id)) return badRequest(`"${cleaned.name}" already exists.`, 409)

    const { data, error } = await supabase
      .from('car_brands')
      .update({ brand_name: cleaned.name })
      .eq('brand_id', body.id)
      .select('brand_id, brand_name')
      .maybeSingle()
    if (error) throw error
    if (!data) return badRequest('Brand not found.', 404)

    expirePublicCars()
    return NextResponse.json({ item: { id: data.brand_id, name: data.brand_name } })
  } catch (error) {
    return serverError(error)
  }
}

// DELETE /api/admin/brands?id=... - Remove a brand no listing uses (admin only).
export async function DELETE(request: NextRequest) {
  try {
    if (!(await isAdmin())) return forbidden()
    const id = request.nextUrl.searchParams.get('id')
    if (!id) return badRequest('Brand ID is required.')

    const supabase = createAdminClient()
    const { count, error: countError } = await supabase.from('cars').select('car_id', { count: 'exact', head: true }).eq('brand_id', id)
    if (countError) throw countError
    if (count) return badRequest(`This brand is used by ${count} listing${count === 1 ? '' : 's'}. Move or delete those cars first.`, 409)

    const { data, error } = await supabase.from('car_brands').delete().eq('brand_id', id).select('brand_id')
    if (error) throw error
    if (!data?.length) return badRequest('Brand not found.', 404)

    expirePublicCars()
    return NextResponse.json({ message: 'Brand deleted' })
  } catch (error) {
    return serverError(error)
  }
}
