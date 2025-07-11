import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

// Check if user is admin
async function checkAdminAuth() {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get('session')

  if (!sessionCookie) {
    return { isAdmin: false, user: null }
  }

  const sessionData = JSON.parse(sessionCookie.value)
  return { 
    isAdmin: sessionData.userType === 'admin', 
    user: sessionData 
  }
}

// GET /api/admin/cars - Get all cars (admin only)
export async function GET(request: NextRequest) {
  try {
    const { isAdmin } = await checkAdminAuth()
    
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 403 })
    }

    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search')
    const brand_id = searchParams.get('brand_id')
    const is_sold = searchParams.get('is_sold')
    const offset = (page - 1) * limit

    let query = supabase
      .from('cars')
      .select(`
        *,
        car_brands!inner(brand_id, brand_name),
        users!inner(user_id, fullname, email, phone)
      `)
      .order('created_at', { ascending: false })

    // Apply filters
    if (search) {
      query = query.or(`model.ilike.%${search}%,title.ilike.%${search}%,description.ilike.%${search}%`)
    }

    if (brand_id) {
      query = query.eq('brand_id', brand_id)
    }

    if (is_sold !== null && is_sold !== undefined) {
      query = query.eq('is_sold', is_sold === 'true')
    }

    // Get total count
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
        totalPages: Math.ceil((count || 0) / limit)
      }
    })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/admin/cars - Update car (admin only)
export async function PUT(request: NextRequest) {
  try {
    const { isAdmin } = await checkAdminAuth()
    
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 403 })
    }

    const supabase = await createClient()
    const body = await request.json()
    const { 
      car_id, 
      brand_id, 
      model, 
      title, 
      description, 
      body_type, 
      fuel_type, 
      year, 
      price, 
      currency,
      mileage, 
      color, 
      engine_size, 
      transmission, 
      features, 
      is_sold 
    } = body

    if (!car_id) {
      return NextResponse.json({ error: 'Car ID is required' }, { status: 400 })
    }

    const { data: car, error } = await supabase
      .from('cars')
      .update({
        brand_id,
        model,
        title,
        description,
        body_type,
        fuel_type,
        year: year ? parseInt(year) : undefined,
        price: price ? parseFloat(price) : undefined,
        currency,
        mileage: mileage ? parseInt(mileage) : null,
        color,
        engine_size,
        transmission,
        features,
        is_sold: is_sold !== undefined ? is_sold : undefined
      })
      .eq('car_id', car_id)
      .select(`
        *,
        car_brands!inner(brand_id, brand_name),
        users!inner(user_id, fullname, email, phone)
      `)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ car })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/admin/cars - Delete car (admin only)
export async function DELETE(request: NextRequest) {
  try {
    const { isAdmin } = await checkAdminAuth()
    
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 403 })
    }

    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const carId = searchParams.get('car_id')

    if (!carId) {
      return NextResponse.json({ error: 'Car ID is required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('cars')
      .delete()
      .eq('car_id', carId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ message: 'Car deleted successfully' })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 