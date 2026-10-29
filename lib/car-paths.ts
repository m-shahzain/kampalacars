import { CarModel, modelName, slugify } from '@/lib/car-models'

type BrandRelation = { brand_name: string } | { brand_name: string }[] | null | undefined

type CarNameSource = {
  car_id: string
  year: number
  model?: string | null
  title?: string | null
  car_brands?: BrandRelation
}

const UUID_AT_END = /([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i

/** Supabase returns the brand as an object, or as a one-item list for some joins. */
export function brandOf(car: { car_brands?: BrandRelation }) {
  const brand = Array.isArray(car.car_brands) ? car.car_brands[0] : car.car_brands
  return brand?.brand_name ?? ''
}

/** "Toyota Land Cruiser Prado" */
export function carName(car: CarNameSource) {
  const brand = brandOf(car)
  return `${brand} ${modelName(brand, car)}`.trim()
}

/** "2021 Toyota Land Cruiser Prado" */
export function carHeading(car: CarNameSource) {
  return `${car.year} ${carName(car)}`.trim()
}

/** /cars/2021-toyota-land-cruiser-prado-<id>: readable, with the id at the end so it always resolves. */
export function carPath(car: CarNameSource) {
  return `/cars/${slugify(carHeading(car))}-${car.car_id}`
}

/** The listing id from a car address, or null when the address is a brand page. */
export function parseCarId(slug: string) {
  return UUID_AT_END.exec(slug)?.[1].toLowerCase() ?? null
}

export const brandPath = (brandName: string) => `/cars/${slugify(brandName)}`

export const modelPath = (brandName: string, model: Pick<CarModel, 'slug'>) => `${brandPath(brandName)}/${model.slug}`

export function sellerHref(car: { seller_id: string; users?: { slug?: string | null } | null }) {
  return `/sellers/${car.users?.slug ?? car.seller_id}`
}
