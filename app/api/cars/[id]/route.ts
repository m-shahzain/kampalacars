import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

// GET /api/cars/[id] - Fetch single car
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params
    
    const { data: car, error } = await supabase
      .from('cars')
      .select(`
        *,
        car_brands!inner(brand_id, brand_name),
        users!inner(user_id, fullname, email, phone)
      `)
      .eq('car_id', id)
      .single()

    if (error) {
      return NextResponse.json({ error: 'Car not found' }, { status: 404 })
    }

    return NextResponse.json({ car })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/cars/[id] - Update car (only by owner)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('session')

    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const sessionData = JSON.parse(sessionCookie.value)
    const supabase = await createClient()
    const { id } = await params
    
    // Check if user owns the car
    const { data: existingCar, error: fetchError } = await supabase
      .from('cars')
      .select('seller_id')
      .eq('car_id', id)
      .single()

    if (fetchError || !existingCar) {
      return NextResponse.json({ error: 'Car not found' }, { status: 404 })
    }

    if (existingCar.seller_id !== sessionData.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

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
      currency,
      mileage, 
      color, 
      engine_size, 
      transmission, 
      features, 
      image_url,
      is_sold 
    } = body

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
        image_url,
        is_sold: is_sold !== undefined ? is_sold : undefined
      })
      .eq('car_id', id)
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

// DELETE /api/cars/[id] - Delete car (only by owner)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('session')

    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const sessionData = JSON.parse(sessionCookie.value)
    const supabase = await createClient()
    const { id } = await params
    
    // Check if user owns the car
    const { data: existingCar, error: fetchError } = await supabase
      .from('cars')
      .select('seller_id')
      .eq('car_id', id)
      .single()

    if (fetchError || !existingCar) {
      return NextResponse.json({ error: 'Car not found' }, { status: 404 })
    }

    if (existingCar.seller_id !== sessionData.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { error } = await supabase
      .from('cars')
      .delete()
      .eq('car_id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ message: 'Car deleted successfully' })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 