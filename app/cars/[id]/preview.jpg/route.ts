import { createClient } from '@/lib/supabase/server'
import { previewImageResponse } from '@/lib/preview-image'
import { formatPrice } from '@/lib/utils'

type BrandRelation = { brand_name: string } | { brand_name: string }[] | null

// GET /cars/[id]/preview.jpg - the image shown when a car link is shared.
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: car } = await supabase
    .from('cars')
    .select('model, year, price, mileage, transmission, is_sold, image_urls, car_brands(brand_name)')
    .eq('car_id', id)
    .eq('approval_status', 'approved')
    .maybeSingle()

  if (!car) return new Response('Not found', { status: 404 })

  const brandRelation = car.car_brands as BrandRelation
  const brand = (Array.isArray(brandRelation) ? brandRelation[0] : brandRelation)?.brand_name ?? ''
  const details = [
    car.year,
    car.mileage ? `${Number(car.mileage).toLocaleString('en-UG')} km` : null,
    car.transmission ? car.transmission.charAt(0).toUpperCase() + car.transmission.slice(1) : null,
  ].filter(Boolean).join('  ·  ')

  return previewImageResponse({
    photoUrl: car.image_urls?.[0],
    title: `${brand} ${car.model}`.trim(),
    highlight: formatPrice(Number(car.price)),
    details,
    badge: car.is_sold ? 'SOLD' : undefined,
  })
}
