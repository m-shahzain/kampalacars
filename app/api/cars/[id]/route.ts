import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

// GET /api/cars/[id] - Fetch single car
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('session')
    const sessionData = sessionCookie ? JSON.parse(sessionCookie.value) : null
    
    const { data: car, error } = await supabase
      .from('cars')
      .select(`
        *,
        car_brands!inner(brand_id, brand_name),
        users!cars_seller_id_fkey!inner(user_id, fullname, email, phone, is_premium, profile_picture_url)
      `)
      .eq('car_id', id)
      .single()

    if (error || !car) {
      return NextResponse.json({ error: 'Car not found' }, { status: 404 })
    }

    const canViewUnapproved = sessionData?.userType === 'admin' || sessionData?.userId === car.seller_id
    if (car.approval_status !== 'approved' && !canViewUnapproved) {
      return NextResponse.json({ error: 'Car not found' }, { status: 404 })
    }

    const { data: adminContact } = car.users.is_premium
      ? { data: null }
      : await supabase
          .from('users')
          .select('fullname, email, phone')
          .eq('user_type', 'admin')
          .order('created_at', { ascending: true })
          .limit(1)
          .maybeSingle()

    const contact = car.users.is_premium
      ? { fullname: car.users.fullname, email: car.users.email, phone: car.users.phone, is_seller: true }
      : { ...(adminContact || { fullname: 'Kampala Cars', email: '', phone: null }), is_seller: false }

    const isPrivateViewer = sessionData?.userType === 'admin' || sessionData?.userId === car.seller_id
    const safeCar = !isPrivateViewer && !car.users.is_premium
      ? { ...car, users: { user_id: car.users.user_id, fullname: car.users.fullname, is_premium: false, profile_picture_url: car.users.profile_picture_url } }
      : car

    const { count: likesCount } = await supabase
      .from('car_likes')
      .select('*', { count: 'exact', head: true })
      .eq('car_id', id)
    const { data: currentUserLike } = sessionData?.userId
      ? await supabase
          .from('car_likes')
          .select('car_id')
          .eq('car_id', id)
          .eq('user_id', sessionData.userId)
          .maybeSingle()
      : { data: null }

    return NextResponse.json({
      car: {
        ...safeCar,
        contact,
        likes_count: likesCount ?? 0,
        liked_by_current_user: Boolean(currentUserLike),
      },
    })
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
      chassis_number,
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
      drive_type,
      features, 
      image_urls,
      is_sold 
    } = body

    // Changing only the availability status is not a content edit. Keeping the
    // current approval lets a seller mark an already-public car as sold without
    // making it disappear while awaiting another admin review.
    const statusOnlyUpdate =
      typeof is_sold === 'boolean' &&
      Object.keys(body).every((key) => key === 'is_sold')

    if (statusOnlyUpdate) {
      const { data: car, error } = await supabase
        .from('cars')
        .update({ is_sold })
        .eq('car_id', id)
        .select(`
          *,
          car_brands!inner(brand_id, brand_name),
          users!cars_seller_id_fkey!inner(user_id, fullname, email, phone, is_premium, profile_picture_url)
        `)
        .single()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }

      return NextResponse.json({ car })
    }

    const { data: car, error } = await supabase
      .from('cars')
      .update({
        brand_id,
        model,
        title,
        chassis_number: chassis_number?.trim().toUpperCase(),
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
        drive_type,
        features,
        image_urls,
        is_sold: is_sold !== undefined ? is_sold : undefined,
        // Any owner edit must be reviewed again before being public.
        approval_status: 'pending',
        approved_at: null,
        approved_by: null
      })
      .eq('car_id', id)
      .select(`
        *,
        car_brands!inner(brand_id, brand_name),
        users!cars_seller_id_fkey!inner(user_id, fullname, email, phone, is_premium, profile_picture_url)
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
