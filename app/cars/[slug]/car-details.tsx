import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, permanentRedirect } from 'next/navigation'
import { Calendar, Gauge, User } from 'lucide-react'
import { Layout } from '@/components/Layout'
import { Breadcrumbs, type Crumb } from '@/components/Breadcrumbs'
import { CarCard } from '@/components/CarCard'
import { JsonLd } from '@/components/JsonLd'
import { getBrandListings, getCarDetails, isLongSold, type CarDetails } from '@/lib/cars-server'
import { matchModel, modelName } from '@/lib/car-models'
import { brandOf, brandPath, carHeading, carPath, modelPath, sellerHref } from '@/lib/car-paths'
import { bodyLabel, driveLabel, fuelLabel, mileageLabel, transmissionLabel } from '@/lib/car-labels'
import { PREVIEW_HEIGHT, PREVIEW_WIDTH } from '@/lib/preview-image'
import { getSiteUrl, SITE_NAME } from '@/lib/site'
import { formatCompactPrice, formatDate, formatPrice, truncate } from '@/lib/utils'
import { CarActions, CarContactCard, CarGallery } from './car-details-client'

function keyFacts(car: CarDetails) {
  return [fuelLabel(car.fuel_type), transmissionLabel(car.transmission), mileageLabel(car.mileage), driveLabel(car.drive_type)]
    .filter(Boolean)
    .join(', ')
}

function describe(car: CarDetails) {
  const facts = keyFacts(car)
  const intro = `${carHeading(car)} ${car.is_sold ? 'sold' : 'for sale'} in Kampala for ${formatPrice(Number(car.price))}${facts ? ` – ${facts}` : ''}.`
  const text = car.description?.replace(/\s+/g, ' ').trim()
  return truncate(`${intro} ${text || 'See photos and contact the seller on Kampala Cars.'}`, 160)
}

export async function carMetadata(id: string): Promise<Metadata> {
  const car = await getCarDetails(id)
  if (!car) return { title: 'Car Not Found | Kampala Cars', robots: { index: false, follow: false } }

  const heading = carHeading(car)
  const shareTitle = `${heading} · ${car.is_sold ? 'SOLD' : formatPrice(Number(car.price))}`
  const title = `${heading} for Sale in Kampala · ${car.is_sold ? 'Sold' : `UGX ${formatCompactPrice(Number(car.price))}`}`
  const description = describe(car)
  const path = carPath(car)
  // A branded JPEG preview; the version changes when the main photo changes so apps refresh it.
  const photoVersion = car.image_urls?.[0]?.split('/').pop()?.replace(/\.[^.]+$/, '') ?? 'none'
  const image = {
    url: `/cars/${car.car_id}/preview.jpg?v=${photoVersion}`,
    width: PREVIEW_WIDTH,
    height: PREVIEW_HEIGHT,
    type: 'image/jpeg',
    alt: heading,
  }
  const hidden = car.approval_status !== 'approved' || isLongSold(car)

  return {
    title: `${title} | ${SITE_NAME}`,
    description,
    alternates: { canonical: path },
    robots: hidden ? { index: false, follow: true } : undefined,
    openGraph: { type: 'website', url: path, title: shareTitle, description, siteName: SITE_NAME, images: [image] },
    twitter: { card: 'summary_large_image', title: shareTitle, description, images: [image.url] },
  }
}

async function carJsonLd(car: CarDetails) {
  const siteUrl = await getSiteUrl()
  const brand = brandOf(car)
  const url = `${siteUrl}${carPath(car)}`
  return {
    '@context': 'https://schema.org',
    '@type': 'Car',
    name: carHeading(car),
    url,
    image: car.image_urls ?? [],
    description: car.description?.replace(/\s+/g, ' ').trim() || describe(car),
    brand: { '@type': 'Brand', name: brand },
    model: modelName(brand, car) || undefined,
    vehicleModelDate: String(car.year),
    bodyType: bodyLabel(car.body_type) || undefined,
    fuelType: fuelLabel(car.fuel_type) || undefined,
    vehicleTransmission: transmissionLabel(car.transmission) || undefined,
    driveWheelConfiguration: car.drive_type === '4wd' ? 'https://schema.org/FourWheelDriveConfiguration' : undefined,
    mileageFromOdometer: car.mileage ? { '@type': 'QuantitativeValue', value: car.mileage, unitCode: 'KMT' } : undefined,
    color: car.color || undefined,
    vehicleEngine: car.engine_size ? { '@type': 'EngineSpecification', name: car.engine_size } : undefined,
    itemCondition: 'https://schema.org/UsedCondition',
    offers: {
      '@type': 'Offer',
      url,
      price: Number(car.price),
      priceCurrency: car.currency || 'UGX',
      availability: car.is_sold ? 'https://schema.org/SoldOut' : 'https://schema.org/InStock',
      itemCondition: 'https://schema.org/UsedCondition',
      areaServed: { '@type': 'City', name: 'Kampala' },
      seller: car.contact.is_seller
        ? { '@type': 'Organization', name: car.contact.fullname }
        : { '@type': 'Organization', name: SITE_NAME, url: siteUrl },
    },
  }
}

/** Other cars of the same model (or else brand), cars for sale first. */
async function relatedCars(car: CarDetails) {
  const brand = brandOf(car)
  const model = matchModel(brand, car)
  const others = (await getBrandListings(car.brand_id)).filter((other) => other.car_id !== car.car_id)
  const sameModel = model ? others.filter((other) => matchModel(brand, other)?.slug === model.slug) : []
  const pool = (sameModel.length ? sameModel : others).sort((a, b) => Number(a.is_sold) - Number(b.is_sold))
  return { cars: pool.slice(0, 4), isSameModel: sameModel.length > 0 }
}

export async function CarDetailsPage({ id, slug }: { id: string; slug: string }) {
  const car = await getCarDetails(id)
  if (!car) notFound()
  // Old links (/cars/<id>) and outdated names move to the current address.
  const path = carPath(car)
  if (`/cars/${slug}` !== path) permanentRedirect(path)

  const brand = brandOf(car)
  const model = matchModel(brand, car)
  const heading = carHeading(car)
  const related = await relatedCars(car)
  const price = car.is_sold ? 'SOLD' : formatPrice(Number(car.price))
  const crumbs: Crumb[] = [
    { name: 'Cars', href: '/cars' },
    { name: brand, href: brandPath(brand) },
    ...(model ? [{ name: model.name, href: modelPath(brand, model) }] : []),
    { name: heading, href: path },
  ]
  const specs = [
    ['Make', brand],
    ['Model', modelName(brand, car)],
    ['Year', String(car.year)],
    ['Body type', bodyLabel(car.body_type)],
    ['Fuel', fuelLabel(car.fuel_type)],
    ['Transmission', transmissionLabel(car.transmission)],
    ['Drive', driveLabel(car.drive_type)],
    ['Mileage', mileageLabel(car.mileage)],
    ['Engine', car.engine_size ?? ''],
    ['Colour', car.color ?? ''],
    ['Chassis No.', car.chassis_number ?? ''],
  ].filter(([, value]) => value)
  // The seller's own title often adds detail ("Push 2 start, 7 seater"); show it when it says something new.
  const sellerTitle = car.title?.trim()
  const showSellerTitle = sellerTitle && sellerTitle.toLowerCase() !== heading.toLowerCase()
  const modelLabel = model ? `${brand} ${model.name}` : brand

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <Breadcrumbs items={crumbs} />

        {car.is_sold && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            This car has been sold.{' '}
            <Link href={model ? modelPath(brand, model) : brandPath(brand)} className="font-medium underline">
              See other {modelLabel} cars for sale
            </Link>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <CarGallery images={car.image_urls ?? []} heading={heading} isSold={car.is_sold} />

            <div className="bg-white rounded-lg border border-gray-200 p-5">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{heading}</h1>
                  {showSellerTitle && <p className="mt-1 text-sm text-gray-600">{sellerTitle}</p>}
                </div>
                <CarActions
                  carId={car.car_id}
                  shareText={`Check out this ${heading} for ${formatPrice(Number(car.price))}`}
                  likesCount={car.likes_count}
                  liked={car.liked_by_current_user}
                />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
                <div className="text-center p-2.5 bg-gray-50 rounded-lg">
                  <Calendar className="h-5 w-5 mx-auto text-gold-700 mb-1" />
                  <p className="text-xs text-gray-500">Year</p>
                  <p className="text-sm font-semibold">{car.year}</p>
                </div>
                <div className="text-center p-2.5 bg-gray-50 rounded-lg">
                  <span className="block h-5 mb-1 text-sm font-bold leading-5 text-gold-700" aria-hidden="true">USh</span>
                  <p className="text-xs text-gray-500">Price</p>
                  <p className="text-sm font-semibold text-gray-900">{formatPrice(Number(car.price))}</p>
                </div>
                <div className="text-center p-2.5 bg-gray-50 rounded-lg">
                  <Gauge className="h-5 w-5 mx-auto text-gold-700 mb-1" />
                  <p className="text-xs text-gray-500">Mileage</p>
                  <p className="text-sm font-semibold">{mileageLabel(car.mileage) || '—'}</p>
                </div>
                <div className="text-center p-2.5 bg-gray-50 rounded-lg">
                  <User className="h-5 w-5 mx-auto text-gold-700 mb-1" />
                  <p className="text-xs text-gray-500">Seller</p>
                  <p className="text-sm font-semibold">{car.contact?.fullname || 'Kampala Cars'}</p>
                </div>
              </div>

              <h2 className="text-base font-semibold text-gray-900 mb-2">Specifications</h2>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 mb-5 text-sm">
                {specs.map(([label, value]) => (
                  <div key={label} className="flex justify-between gap-4 border-b border-gray-100 py-2">
                    <dt className="text-gray-500">{label}</dt>
                    <dd className="font-medium text-gray-900 text-right">{value}</dd>
                  </div>
                ))}
                <div className="flex justify-between gap-4 border-b border-gray-100 py-2">
                  <dt className="text-gray-500">Listed</dt>
                  <dd className="font-medium text-gray-900 text-right">{formatDate(car.created_at)}</dd>
                </div>
              </dl>

              {car.description && (
                <>
                  <h2 className="text-base font-semibold text-gray-900 mb-2">Description</h2>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap mb-5">{car.description}</p>
                </>
              )}

              {car.features && (
                <>
                  <h2 className="text-base font-semibold text-gray-900 mb-2">Features</h2>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{car.features}</p>
                </>
              )}
            </div>
          </div>

          <div className="lg:col-span-1">
            <CarContactCard
              price={price}
              contact={car.contact}
              sellerName={car.users?.fullname ?? ''}
              sellerPicture={car.users?.profile_picture_url}
              sellerHref={sellerHref(car)}
            />
          </div>
        </div>

        {related.cars.length > 0 && (
          <section className="mt-10">
            <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-lg font-semibold text-gray-900">
                {related.isSameModel ? `More ${modelLabel} cars` : `More ${brand} cars`}
              </h2>
              <Link href={related.isSameModel && model ? modelPath(brand, model) : brandPath(brand)} className="text-sm font-medium text-gold-700 hover:underline">
                See all {related.isSameModel ? modelLabel : brand} cars for sale →
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {related.cars.map((other) => <CarCard key={other.car_id} car={other} />)}
            </div>
          </section>
        )}
      </div>
      <JsonLd data={await carJsonLd(car)} />
    </Layout>
  )
}
