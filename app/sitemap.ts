import type { MetadataRoute } from 'next'
import { createClient } from '@/lib/supabase/server'
import { brandPath, carPath, modelPath } from '@/lib/car-paths'
import { getApprovedCars, getMakeCounts, isLongSold, lastChanged } from '@/lib/cars-server'
import { matchModel } from '@/lib/car-models'
import { getSiteUrl } from '@/lib/site'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = await getSiteUrl()
  const supabase = await createClient()
  const cars = await getApprovedCars()
  const makes = await getMakeCounts()

  // Newest change per seller, brand and model, so each page's date follows its listings.
  const latest = new Map<string, Date>()
  const bump = (key: string, date: Date) => {
    if (!latest.has(key) || latest.get(key)! < date) latest.set(key, date)
  }
  for (const car of cars) {
    const date = lastChanged(car)
    const brand = car.car_brands.brand_name
    bump(`seller:${car.seller_id}`, date)
    bump(`brand:${brand}`, date)
    const model = matchModel(brand, car)
    if (model) bump(`model:${brand}:${model.slug}`, date)
    bump('all', date)
  }
  const newest = latest.get('all') ?? new Date()

  // Seller pages; select('*') works before the slug column exists.
  const sellerIds = [...new Set(cars.map((car) => car.seller_id))]
  const { data: sellers } = sellerIds.length
    ? await supabase.from('users').select('*').in('user_id', sellerIds).neq('user_type', 'admin')
    : { data: [] }

  return [
    { url: siteUrl, lastModified: newest, changeFrequency: 'daily', priority: 1 },
    { url: `${siteUrl}/cars`, lastModified: newest, changeFrequency: 'daily', priority: 0.9 },
    // Only makes and models with cars for sale; empty ones are kept out of search results.
    ...makes.flatMap((make) => [
      {
        url: `${siteUrl}${brandPath(make.name)}`,
        lastModified: latest.get(`brand:${make.name}`) ?? newest,
        changeFrequency: 'daily' as const,
        priority: 0.85,
      },
      ...make.models.map((model) => ({
        url: `${siteUrl}${modelPath(make.name, model)}`,
        lastModified: latest.get(`model:${make.name}:${model.slug}`) ?? newest,
        changeFrequency: 'daily' as const,
        priority: 0.85,
      })),
    ]),
    ...cars
      .filter((car) => !isLongSold(car))
      .map((car) => ({
        url: `${siteUrl}${carPath(car)}`,
        lastModified: lastChanged(car),
        changeFrequency: 'weekly' as const,
        priority: car.is_sold ? 0.4 : 0.8,
        images: car.image_urls?.slice(0, 5),
      })),
    ...(sellers ?? []).map((seller) => ({
      url: `${siteUrl}/sellers/${seller.slug ?? seller.user_id}`,
      lastModified: latest.get(`seller:${seller.user_id}`) ?? new Date(seller.created_at),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    })),
    { url: `${siteUrl}/about`, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${siteUrl}/contact`, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${siteUrl}/privacy`, changeFrequency: 'yearly', priority: 0.1 },
  ]
}
