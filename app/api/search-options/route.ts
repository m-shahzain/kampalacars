import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

type ListingRow = {
  seller_id: string
  price: number
  users: { fullname: string } | null
}

// GET /api/search-options - Brands, sellers with live listings and the price
// range of the public catalogue, used to build the search bar.
export async function GET() {
  try {
    const supabase = await createClient()

    const [{ data: brands, error: brandsError }, { data: listings, error: listingsError }] = await Promise.all([
      supabase.from('car_brands').select('brand_id, brand_name').order('brand_name', { ascending: true }),
      supabase
        .from('cars')
        .select('seller_id, price, users!cars_seller_id_fkey(fullname)')
        .eq('approval_status', 'approved'),
    ])

    if (brandsError || listingsError) {
      return NextResponse.json({ error: (brandsError || listingsError)?.message }, { status: 400 })
    }

    const rows = (listings ?? []) as unknown as ListingRow[]
    const sellers = new Map<string, { seller_id: string; fullname: string; listings_count: number }>()
    let minPrice = Infinity
    let maxPrice = 0

    for (const row of rows) {
      const price = Number(row.price)
      minPrice = Math.min(minPrice, price)
      maxPrice = Math.max(maxPrice, price)

      const seller = sellers.get(row.seller_id)
      if (seller) {
        seller.listings_count += 1
      } else if (row.users?.fullname) {
        sellers.set(row.seller_id, { seller_id: row.seller_id, fullname: row.users.fullname, listings_count: 1 })
      }
    }

    return NextResponse.json({
      brands: brands ?? [],
      sellers: [...sellers.values()].sort((a, b) => a.fullname.localeCompare(b.fullname)),
      priceRange: rows.length ? { min: minPrice, max: maxPrice } : null,
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
