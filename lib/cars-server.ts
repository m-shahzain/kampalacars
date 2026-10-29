import { cache } from 'react'
import { cookies } from 'next/headers'
import { revalidateTag, unstable_cache } from 'next/cache'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { createPublicClient } from '@/lib/supabase/public'
import { getSession } from '@/lib/session'
import { matchModel, slugify, type CarModel } from '@/lib/car-models'
import type { CarBrand, CarWithBrand } from '@/lib/types'

export const CAR_SELECT = `
  *,
  car_brands!inner(brand_id, brand_name),
  users!cars_seller_id_fkey!inner(user_id, fullname, email, phone, is_premium, profile_picture_url, slug)
`

/** Query parameters the public car listings understand. */
export const LISTING_FILTERS = [
  'search', 'brand_id', 'seller_id', 'min_price', 'max_price', 'min_year', 'max_year',
  'body_type', 'fuel_type', 'transmission', 'max_mileage',
] as const

/**
 * Cars matching the listing filters, newest first. An owner sees all of their own
 * listings; everyone else sees approved ones. Sold cars stay in the public catalogue
 * and the card marks them with a SOLD badge.
 */
export function carsQuery(supabase: SupabaseClient, params: URLSearchParams, ownerId?: string) {
  let query = supabase
    .from('cars')
    .select(CAR_SELECT, { count: 'exact' })
    .order('created_at', { ascending: false })
  query = ownerId ? query.eq('seller_id', ownerId) : query.eq('approval_status', 'approved')

  const value = (key: (typeof LISTING_FILTERS)[number]) => params.get(key)?.trim() || null
  const search = value('search')
  if (search) query = query.or(`model.ilike.%${search}%,title.ilike.%${search}%,description.ilike.%${search}%`)
  const brandId = value('brand_id')
  if (brandId) query = query.eq('brand_id', brandId)
  const sellerId = value('seller_id')
  if (sellerId && !ownerId) query = query.eq('seller_id', sellerId)
  const minPrice = value('min_price')
  if (minPrice) query = query.gte('price', parseFloat(minPrice))
  const maxPrice = value('max_price')
  if (maxPrice) query = query.lte('price', parseFloat(maxPrice))
  const minYear = value('min_year')
  if (minYear) query = query.gte('year', parseInt(minYear))
  const maxYear = value('max_year')
  if (maxYear) query = query.lte('year', parseInt(maxYear))
  const bodyType = value('body_type')
  if (bodyType) query = query.eq('body_type', bodyType)
  const fuelType = value('fuel_type')
  if (fuelType) query = query.eq('fuel_type', fuelType)
  const transmission = value('transmission')
  if (transmission) query = query.eq('transmission', transmission)
  const maxMileage = value('max_mileage')
  if (maxMileage) query = query.lte('mileage', parseInt(maxMileage))
  return query
}

async function getAdminContact(supabase: SupabaseClient) {
  const { data } = await supabase
    .from('users')
    .select('fullname, email, phone')
    .eq('user_type', 'admin')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()
  return data
}

/**
 * Adds who to contact about each car. Premium sellers are contacted directly; for
 * everyone else the marketplace is the contact and the seller's details stay private.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function withContacts(supabase: SupabaseClient, cars: any[], { showSellerDetails = false } = {}): Promise<CarWithBrand[]> {
  const adminContact = cars.some((car) => !car.users?.is_premium) ? await getAdminContact(supabase) : null

  return cars.map((car) => ({
    ...car,
    // A standard seller's details must never be exposed publicly.
    users: !showSellerDetails && !car.users?.is_premium
      ? {
          user_id: car.users.user_id,
          fullname: car.users.fullname,
          is_premium: false,
          profile_picture_url: car.users.profile_picture_url,
          slug: car.users.slug ?? null,
        }
      : car.users,
    contact: car.users?.is_premium
      ? { fullname: car.users.fullname, email: car.users.email, phone: car.users.phone, is_seller: true }
      : { ...(adminContact || { fullname: 'Kampala Cars', email: '', phone: null }), is_seller: false },
  }))
}

export type CarsPage = { cars: CarWithBrand[]; total: number; hasMore: boolean }

/** The first page of public listings, so pages can show cars in their HTML before any script runs. */
export async function getCarsPage(params: URLSearchParams, limit = 12): Promise<CarsPage> {
  const supabase = await createClient()
  const { data, count, error } = await carsQuery(supabase, params).range(0, limit - 1)
  if (error || !data) return { cars: [], total: 0, hasMore: false }
  return { cars: await withContacts(supabase, data), total: count ?? 0, hasMore: (count ?? 0) > limit }
}

export type CarDetails = CarWithBrand & { likes_count: number; liked_by_current_user: boolean }

/**
 * One car with its contact, likes and whether this visitor liked it. Unapproved cars
 * are only returned to their owner and admins. Cached per request so the page and
 * its metadata share one lookup.
 */
export const getCarDetails = cache(async (id: string): Promise<CarDetails | null> => {
  const supabase = await createClient()
  const session = await getSession(supabase)
  const { data: car } = await supabase.from('cars').select(CAR_SELECT).eq('car_id', id).maybeSingle()
  if (!car) return null

  const isPrivateViewer = session?.userType === 'admin' || session?.userId === car.seller_id
  if (car.approval_status !== 'approved' && !isPrivateViewer) return null

  const [withContact] = await withContacts(supabase, [car], { showSellerDetails: isPrivateViewer })

  const { count: likesCount } = await supabase
    .from('car_likes')
    .select('*', { count: 'exact', head: true })
    .eq('car_id', id)
  const visitorId = (await cookies()).get('visitor_id')?.value
  const liker = session?.userId
    ? { column: 'user_id', value: session.userId }
    : visitorId ? { column: 'visitor_id', value: visitorId } : null
  const { data: currentUserLike } = liker
    ? await supabase.from('car_likes').select('car_id').eq('car_id', id).eq(liker.column, liker.value).maybeSingle()
    : { data: null }

  return { ...withContact, likes_count: likesCount ?? 0, liked_by_current_user: Boolean(currentUserLike) }
})

/** Cache tag for public listing data; expire it with expirePublicCars() after a listing changes. */
const CARS_TAG = 'public-cars'
const PUBLIC_REVALIDATE_SECONDS = 600

/**
 * Data that is the same for every visitor is kept in Next's data cache across requests,
 * so brand, model and sitemap pages don't reload every listing from Supabase on each
 * visit (that was the bulk of the server CPU). React's cache() then dedupes within a request.
 */
function sharedCache<T>(key: string, load: () => Promise<T>) {
  return cache(unstable_cache(load, [key], { revalidate: PUBLIC_REVALIDATE_SECONDS, tags: [CARS_TAG] }))
}

/** Call after a car is added, edited, approved, sold or deleted so public pages update right away. */
export function expirePublicCars() {
  revalidateTag(CARS_TAG, { expire: 0 })
}

export const getBrands = sharedCache('brands', async (): Promise<CarBrand[]> => {
  const { data } = await createPublicClient().from('car_brands').select('*').order('brand_name')
  return data ?? []
})

export const getBrandBySlug = cache(async (slug: string) => {
  return (await getBrands()).find((brand) => slugify(brand.brand_name) === slug) ?? null
})

/** Every approved listing, newest first, ready for car cards. */
export const getPublicListings = sharedCache('public-listings', async () => {
  const supabase = createPublicClient()
  const { data } = await supabase
    .from('cars')
    .select(CAR_SELECT)
    .eq('approval_status', 'approved')
    .order('created_at', { ascending: false })
    .limit(2000)
  return withContacts(supabase, data ?? [])
})

export const getBrandListings = cache(async (brandId: string) => {
  return (await getPublicListings()).filter((car) => car.brand_id === brandId)
})


export type ApprovedCar = CarWithBrand

/** All approved listings with their brand (no contact details), for the sitemap and make/model counts. */
export const getApprovedCars = sharedCache('approved-cars', async (): Promise<ApprovedCar[]> => {
  // select('*') keeps this working before the updated_at column exists.
  const { data } = await createPublicClient()
    .from('cars')
    .select('*, car_brands!inner(brand_id, brand_name)')
    .eq('approval_status', 'approved')
    .order('created_at', { ascending: false })
  return (data ?? []) as ApprovedCar[]
})

/** When the listing last changed, falling back to approval or creation before updated_at exists. */
export function lastChanged(car: Pick<CarWithBrand, 'updated_at' | 'approved_at' | 'created_at'>) {
  return new Date(car.updated_at ?? car.approved_at ?? car.created_at)
}

const SOLD_INDEX_DAYS = 60

/**
 * Sold cars stay findable for a while (people still search for them, and the page
 * points to similar cars); after that they leave the search index and the sitemap.
 */
export function isLongSold(car: Pick<CarWithBrand, 'is_sold' | 'updated_at' | 'approved_at' | 'created_at'>) {
  return car.is_sold && Date.now() - lastChanged(car).getTime() > SOLD_INDEX_DAYS * 24 * 60 * 60 * 1000
}

export type ModelCount = CarModel & { count: number }
export type MakeCount = { brandId: string; name: string; slug: string; count: number; models: ModelCount[] }

/** Brands and catalog models with cars for sale, most listings first. */
export const getMakeCounts = cache(async (): Promise<MakeCount[]> => {
  const makes = new Map<string, MakeCount>()
  for (const car of await getApprovedCars()) {
    if (car.is_sold) continue
    const name = car.car_brands.brand_name
    const make = makes.get(name) ?? { brandId: car.brand_id, name, slug: slugify(name), count: 0, models: [] }
    make.count++
    const found = matchModel(name, car)
    if (found) {
      const entry = make.models.find((item) => item.slug === found.slug)
      if (entry) entry.count++
      else make.models.push({ ...found, count: 1 })
    }
    makes.set(name, make)
  }
  return [...makes.values()]
    .map((make) => ({ ...make, models: make.models.sort((a, b) => b.count - a.count) }))
    .sort((a, b) => b.count - a.count)
})
