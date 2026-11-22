import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { expirePublicCars } from '@/lib/cars-server'
import { slugify } from '@/lib/car-models'
import { badRequest, cleanName, embeddedCount, forbidden, ilikeExact, isAdmin, serverError } from '@/lib/admin-api'

// A body type has a fixed code (slug, stored on each car and used in filter links) and a
// name admins can change. Renaming keeps the code, so existing links keep working.
const MAX_NAME_LENGTH = 40
const MIGRATION = { table: 'body_types', file: 'docs/add-body-types-migration.sql' }

const toItem = (type: { slug: string; name: string }, carCount: number) => ({ id: type.slug, name: type.name, car_count: carCount })

async function nameTaken(supabase: ReturnType<typeof createAdminClient>, name: string, exceptSlug?: string) {
  let query = supabase.from('body_types').select('slug').ilike('name', ilikeExact(name))
  if (exceptSlug) query = query.neq('slug', exceptSlug)
  const { data } = await query.limit(1)
  return Boolean(data?.length)
}

// GET /api/admin/body-types - Every body type with how many listings use it (admin only).
export async function GET() {
  try {
    if (!(await isAdmin())) return forbidden()
    const { data, error } = await createAdminClient().from('body_types').select('slug, name, cars(count)').order('name')
    if (error) throw error
    return NextResponse.json({ items: (data ?? []).map((type) => toItem(type, embeddedCount(type.cars))) })
  } catch (error) {
    return serverError(error, MIGRATION)
  }
}

// POST /api/admin/body-types - Add a body type: { name } (admin only).
export async function POST(request: NextRequest) {
  try {
    if (!(await isAdmin())) return forbidden()
    const body = await request.json().catch(() => ({}))
    const cleaned = cleanName(body.name, MAX_NAME_LENGTH)
    if ('error' in cleaned) return badRequest(cleaned.error)
    const slug = slugify(cleaned.name)
    if (!slug) return badRequest('Use letters or numbers in the name.')

    const supabase = createAdminClient()
    const { data: sameSlug } = await supabase.from('body_types').select('name').eq('slug', slug).maybeSingle()
    if (sameSlug || (await nameTaken(supabase, cleaned.name))) {
      return badRequest(`"${sameSlug?.name ?? cleaned.name}" already exists.`, 409)
    }

    const { data, error } = await supabase.from('body_types').insert({ slug, name: cleaned.name }).select('slug, name').single()
    if (error) throw error

    expirePublicCars()
    return NextResponse.json({ item: toItem(data, 0) }, { status: 201 })
  } catch (error) {
    return serverError(error, MIGRATION)
  }
}

// PUT /api/admin/body-types - Rename a body type: { id (the slug), name } (admin only).
export async function PUT(request: NextRequest) {
  try {
    if (!(await isAdmin())) return forbidden()
    const body = await request.json().catch(() => ({}))
    if (typeof body.id !== 'string' || !body.id) return badRequest('Body type is required.')
    const cleaned = cleanName(body.name, MAX_NAME_LENGTH)
    if ('error' in cleaned) return badRequest(cleaned.error)

    const supabase = createAdminClient()
    if (await nameTaken(supabase, cleaned.name, body.id)) return badRequest(`"${cleaned.name}" already exists.`, 409)

    const { data, error } = await supabase
      .from('body_types')
      .update({ name: cleaned.name })
      .eq('slug', body.id)
      .select('slug, name')
      .maybeSingle()
    if (error) throw error
    if (!data) return badRequest('Body type not found.', 404)

    expirePublicCars()
    return NextResponse.json({ item: { id: data.slug, name: data.name } })
  } catch (error) {
    return serverError(error, MIGRATION)
  }
}

// DELETE /api/admin/body-types?id=<slug> - Remove a body type no listing uses (admin only).
export async function DELETE(request: NextRequest) {
  try {
    if (!(await isAdmin())) return forbidden()
    const id = request.nextUrl.searchParams.get('id')
    if (!id) return badRequest('Body type is required.')

    const supabase = createAdminClient()
    const { count, error: countError } = await supabase.from('cars').select('car_id', { count: 'exact', head: true }).eq('body_type', id)
    if (countError) throw countError
    if (count) return badRequest(`This body type is used by ${count} listing${count === 1 ? '' : 's'}. Change those cars first.`, 409)

    const { data, error } = await supabase.from('body_types').delete().eq('slug', id).select('slug')
    if (error) throw error
    if (!data?.length) return badRequest('Body type not found.', 404)

    expirePublicCars()
    return NextResponse.json({ message: 'Body type deleted' })
  } catch (error) {
    return serverError(error, MIGRATION)
  }
}
