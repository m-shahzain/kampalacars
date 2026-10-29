import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Car as CarIcon } from 'lucide-react'
import { Layout } from '@/components/Layout'
import { Breadcrumbs, type Crumb } from '@/components/Breadcrumbs'
import { CarCard } from '@/components/CarCard'
import { JsonLd } from '@/components/JsonLd'
import { findModelBySlug, matchModel } from '@/lib/car-models'
import { brandPath, carPath, modelPath } from '@/lib/car-paths'
import { fuelLabel } from '@/lib/car-labels'
import { getBrandBySlug, getBrandListings, getMakeCounts } from '@/lib/cars-server'
import { getSiteUrl, SITE_NAME } from '@/lib/site'
import type { CarWithBrand } from '@/lib/types'
import { formatPrice, truncate } from '@/lib/utils'

const MAX_SHOWN = 48

type LinkItem = { label: string; href: string; count?: number }

/** Everything a landing page needs: a brand (/cars/toyota) or a model (/cars/toyota/noah). */
type Landing = {
  /** "Toyota Noah", "Double Cabin" */
  name: string
  noun: { one: string; many: string }
  /** Main heading, e.g. "Toyota Noah for Sale in Kampala" */
  heading: string
  /** What the model is, shown under the summary. */
  about?: string
  path: string
  crumbs: Crumb[]
  forSale: CarWithBrand[]
  sold: CarWithBrand[]
  /** Model names for the "Popular models include ..." sentence. */
  popular: string[]
  links: { title: string; items: LinkItem[] }
  seeAllHref: string
  fallback: LinkItem
  /** The make to leave out of "Browse other makes". */
  brandName?: string
}

const split = (cars: CarWithBrand[]) => ({ forSale: cars.filter((car) => !car.is_sold), sold: cars.filter((car) => car.is_sold) })

async function brandOrModelLanding(brandSlug: string, modelSlug?: string): Promise<Landing | null> {
  const brand = await getBrandBySlug(brandSlug)
  if (!brand) return null
  const brandName = brand.brand_name
  const model = modelSlug ? findModelBySlug(brandName, modelSlug) : null
  if (modelSlug && !model) return null

  const listings = await getBrandListings(brand.brand_id)
  const cars = model ? listings.filter((car) => matchModel(brandName, car)?.slug === model.slug) : listings
  const modelsForSale = (await getMakeCounts()).find((make) => make.name === brandName)?.models ?? []
  const name = model ? `${brandName} ${model.name}` : brandName
  const modelLinks = modelsForSale
    .filter((item) => item.slug !== model?.slug)
    .map((item) => ({ label: item.name, href: modelPath(brandName, item), count: item.count }))

  return {
    name,
    noun: { one: 'car', many: 'cars' },
    heading: model ? `${name} for Sale in Kampala` : `${name} Cars for Sale in Kampala`,
    about: model?.about,
    path: model ? modelPath(brandName, model) : brandPath(brandName),
    crumbs: [
      { name: 'Cars', href: '/cars' },
      { name: brandName, href: brandPath(brandName) },
      ...(model ? [{ name: model.name, href: modelPath(brandName, model) }] : []),
    ],
    ...split(cars),
    popular: model ? [] : modelsForSale.map((item) => item.name),
    links: {
      title: model ? `Other ${brandName} models` : `${brandName} models`,
      items: model ? [...modelLinks, { label: `All ${brandName} cars`, href: brandPath(brandName) }] : modelLinks,
    },
    seeAllHref: `/cars?brand_id=${brand.brand_id}${model ? `&search=${encodeURIComponent(model.name)}` : ''}`,
    fallback: model ? { label: `Browse all ${brandName} cars`, href: brandPath(brandName) } : { label: 'Browse all cars', href: '/cars' },
    brandName,
  }
}

/** /cars/<brand> or /cars/<brand>/<model>. */
export const resolveLanding = brandOrModelLanding

const list = (items: string[]) =>
  items.length > 1 ? `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}` : items[0] ?? ''

function mostCommon(values: string[], limit: number) {
  const counts = new Map<string, number>()
  values.filter(Boolean).forEach((value) => counts.set(value, (counts.get(value) ?? 0) + 1))
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit).map(([value]) => value)
}

/** A short introduction written from the listings themselves: count, prices, years and fuel. */
function summary({ name, noun, forSale, popular }: Landing) {
  if (!forSale.length) {
    return `There are no ${name} ${noun.many} for sale on Kampala Cars right now. New listings are added every day, so check back soon or browse similar cars below.`
  }
  // Some prices are typed in millions ("190" for UGX 190M); keep those out of the quoted range.
  const prices = forSale.map((car) => Number(car.price)).filter((price) => price >= 1_000_000)
  const years = forSale.map((car) => car.year)
  const minPrice = Math.min(...prices)
  const maxPrice = Math.max(...prices)
  const priceText = !prices.length
    ? ''
    : minPrice === maxPrice ? ` at ${formatPrice(minPrice)}` : `, priced from ${formatPrice(minPrice)} to ${formatPrice(maxPrice)}`
  const fuels = mostCommon(forSale.map((car) => fuelLabel(car.fuel_type).toLowerCase()), 2)
  const sentences = [
    `${forSale.length} used ${name} ${forSale.length === 1 ? `${noun.one} is` : `${noun.many} are`} for sale in Kampala on Kampala Cars${priceText}.`,
    Math.min(...years) === Math.max(...years)
      ? `${forSale.length === 1 ? 'It is a' : 'All are'} ${years[0]} ${forSale.length === 1 ? 'model' : 'models'}${fuels.length ? `, ${list(fuels)}` : ''}.`
      : `Model years range from ${Math.min(...years)} to ${Math.max(...years)}${fuels.length ? `, with ${list(fuels)} options` : ''}.`,
  ]
  if (popular.length > 1) sentences.push(`Popular models include ${list(popular.slice(0, 3))}.`)
  sentences.push('Compare prices, see photos and contact sellers directly.')
  return sentences.join(' ')
}

export async function landingMetadata(slug: string, modelSlug?: string): Promise<Metadata> {
  const page = await resolveLanding(slug, modelSlug)
  if (!page) return { title: 'Not Found | Kampala Cars', robots: { index: false, follow: false } }

  const title = `${page.heading}, Uganda`
  const count = page.forSale.length
  const description = truncate(summary(page), 160)
  const cover = page.forSale[0]?.image_urls?.[0]

  return {
    title: `${title}${count ? ` · ${count} ${count === 1 ? 'Listing' : 'Listings'}` : ''} | ${SITE_NAME}`,
    description,
    alternates: { canonical: page.path },
    // An empty page is kept for visitors but left out of search results until cars are listed.
    robots: count ? undefined : { index: false, follow: true },
    openGraph: { type: 'website', url: page.path, title, description, siteName: SITE_NAME, images: cover ? [cover] : undefined },
  }
}

export async function LandingPage({ slug, modelSlug }: { slug: string; modelSlug?: string }) {
  const page = await resolveLanding(slug, modelSlug)
  if (!page) notFound()

  const { name, noun, heading, crumbs, forSale, sold, links } = page
  const siteUrl = await getSiteUrl()
  const otherMakes = (await getMakeCounts()).filter((make) => make.name !== page.brandName)
  const shown = forSale.slice(0, MAX_SHOWN)
  const chip = 'inline-flex items-center gap-1.5 rounded-full border border-gray-200 px-3 py-1 text-sm text-gray-700 hover:border-gold-600 hover:text-gold-700'

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <Breadcrumbs items={crumbs} />

        <header className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">{heading}</h1>
          {page.about && <p className="max-w-3xl mb-2 text-sm leading-relaxed text-gray-700">{page.about}</p>}
          <p className="max-w-3xl text-sm leading-relaxed text-gray-600">{summary(page)}</p>
        </header>

        {links.items.length > 0 && (
          <nav aria-label={links.title} className="mb-6">
            <h2 className="mb-2 text-sm font-semibold text-gray-900">{links.title}</h2>
            <ul className="flex flex-wrap gap-2">
              {links.items.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className={chip}>
                    {item.label}
                    {item.count !== undefined && <span className="text-xs text-gray-400">{item.count}</span>}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}

        {shown.length > 0 ? (
          <section aria-label={`${name} ${noun.many} for sale`}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {shown.map((car, index) => <CarCard key={car.car_id} car={car} priority={index < 4} />)}
            </div>
            {forSale.length > shown.length && (
              <p className="mt-6 text-center">
                <Link href={page.seeAllHref} className="text-sm font-medium text-gold-700 hover:underline">
                  See all {forSale.length} {name} {noun.many} →
                </Link>
              </p>
            )}
          </section>
        ) : (
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-8 text-center">
            <CarIcon className="mx-auto mb-3 h-10 w-10 text-gray-300" />
            <p className="mb-4 text-sm text-gray-600">No {name} {noun.many} are for sale right now.</p>
            <Link href={page.fallback.href} className="text-sm font-medium text-gold-700 hover:underline">
              {page.fallback.label} →
            </Link>
          </div>
        )}

        {sold.length > 0 && (
          <section className="mt-10">
            <h2 className="mb-1 text-lg font-semibold text-gray-900">Recently sold {name} {noun.many}</h2>
            <p className="mb-4 text-sm text-gray-500">Useful for comparing prices.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {sold.slice(0, 4).map((car) => <CarCard key={car.car_id} car={car} />)}
            </div>
          </section>
        )}

        {otherMakes.length > 0 && (
          <nav aria-label="Other makes" className="mt-10 border-t border-gray-200 pt-6">
            <h2 className="mb-3 text-sm font-semibold text-gray-900">{page.brandName ? 'Browse other makes' : 'Browse by make'}</h2>
            <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
              {otherMakes.map((make) => (
                <li key={make.slug}>
                  <Link href={brandPath(make.name)} className="text-gray-600 hover:text-gold-700">
                    {make.name} <span className="text-gray-400">({make.count})</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </div>
      {shown.length > 0 && (
        <JsonLd
          data={{
            '@context': 'https://schema.org',
            '@type': 'ItemList',
            name: `${name} ${noun.many} for sale in Kampala`,
            numberOfItems: forSale.length,
            itemListElement: shown.map((car, index) => ({
              '@type': 'ListItem',
              position: index + 1,
              url: `${siteUrl}${carPath(car)}`,
            })),
          }}
        />
      )}
    </Layout>
  )
}
