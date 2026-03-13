import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

// GET /api/cars - Fetch all cars with optional search and filters
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const brand_id = searchParams.get('brand_id')
    const min_price = searchParams.get('min_price')
    const max_price = searchParams.get('max_price')
    const min_year = searchParams.get('min_year')
    const max_year = searchParams.get('max_year')
    const body_type = searchParams.get('body_type')
    const fuel_type = searchParams.get('fuel_type')
    const transmission = searchParams.get('transmission')
    const max_mileage = searchParams.get('max_mileage')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '12')
    const offset = (page - 1) * limit

    let query = supabase
      .from('cars')
      .select(`
        *,
        car_brands!inner(brand_id, brand_name),
        users!inner(user_id, fullname, email, phone)
      `)
      .eq('is_sold', false)
      .order('created_at', { ascending: false })

    // Apply search filters
    if (search) {
      query = query.or(`model.ilike.%${search}%,title.ilike.%${search}%,description.ilike.%${search}%`)
    }

    if (brand_id) {
      query = query.eq('brand_id', brand_id)
    }

    if (min_price) {
      query = query.gte('price', parseFloat(min_price))
    }

    if (max_price) {
      query = query.lte('price', parseFloat(max_price))
    }

    if (min_year) {
      query = query.gte('year', parseInt(min_year))
    }

    if (max_year) {
      query = query.lte('year', parseInt(max_year))
    }

    if (body_type) {
      query = query.eq('body_type', body_type)
    }

    if (fuel_type) {
      query = query.eq('fuel_type', fuel_type)
    }

    if (transmission) {
      query = query.eq('transmission', transmission)
    }

    if (max_mileage) {
      query = query.lte('mileage', parseInt(max_mileage))
    }

    // Get total count for pagination
    const { count } = await query

    // Apply pagination
    const { data: cars, error } = await query.range(offset, offset + limit - 1)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ 
      cars, 
      pagination: {
        page,
        limit,
        total: count || 0,
        hasMore: (count || 0) > offset + limit
      }
    })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/cars - Create a new car listing
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('session')

    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const sessionData = JSON.parse(sessionCookie.value)
    if (sessionData.userType !== 'seller') {
      return NextResponse.json({ error: 'Only sellers can create car listings' }, { status: 403 })
    }
    const supabase = await createClient()
    
    const body = await request.json()
    const { 
      brand_id, 
      model, 
      title, 
      description, 
      body_type, 
      fuel_type, 
      year, 
      price, 
      currency = 'USD',
      mileage, 
      color, 
      engine_size, 
      transmission, 
      features, 
      image_urls 
    } = body

    if (!brand_id || !model || !title || !body_type || !fuel_type || !year || !price || !transmission || !image_urls?.length) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const { data: car, error } = await supabase
      .from('cars')
      .insert({
        seller_id: sessionData.userId,
        brand_id,
        model,
        title,
        description,
        body_type,
        fuel_type,
        year: parseInt(year),
        price: parseFloat(price),
        currency,
        mileage: mileage ? parseInt(mileage) : null,
        color,
        engine_size,
        transmission,
        features,
        image_urls,
        is_sold: false
      })
      .select(`
        *,
        car_brands!inner(brand_id, brand_name),
        users!inner(user_id, fullname, email, phone)
      `)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ car }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 