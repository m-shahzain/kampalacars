import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import CarsClient from './cars-client'
import { BrowseByMake } from '@/components/BrowseByMake'
import { getCarsPage, LISTING_FILTERS } from '@/lib/cars-server'
import { getPublicSeller, isUuid, sellerPath } from '@/lib/sellers'
import { filterParams, hasFilters } from '@/lib/site'

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }

// The filters the listing page reads from its address.
const PAGE_FILTERS = ['search', 'brand_id', 'seller_id', 'body_type', 'fuel_type', 'transmission', 'min_price', 'max_price', 'min_year', 'max_year'] as const

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  return {
    title: 'Browse All Japanese Cars for Sale in Uganda | Kampala Cars',
    description:
      'Search every Japanese car for sale on Kampala Cars. Filter by make, price, year, fuel and body type, and contact sellers in Kampala directly.',
    alternates: { canonical: '/cars' },
    // Filtered views repeat the listings; the make and model pages cover the searches people make.
    robots: hasFilters(await searchParams, LISTING_FILTERS) ? { index: false, follow: true } : undefined,
  }
}

export default async function CarsPage({ searchParams }: Props) {
  // Links filtered to one seller (?seller_id=...) open that seller's page instead.
  const params = await searchParams
  const { seller_id: sellerId, ...otherFilters } = params
  if (typeof sellerId === 'string' && isUuid(sellerId)) {
    const seller = await getPublicSeller(sellerId)
    if (seller) redirect(sellerPath(seller, otherFilters))
  }

  const initialPage = await getCarsPage(filterParams(params, PAGE_FILTERS))

  return (
    <CarsClient initialPage={initialPage}>
      <BrowseByMake />
    </CarsClient>
  )
}
