import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/brands - Fetch all car brands
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { data: brands, error } = await supabase
      .from('car_brands')
      .select('*')
      .order('brand_name', { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ brands })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 