import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import HomeClient from './home-client'
import { BrowseByMake } from '@/components/BrowseByMake'
import { JsonLd } from '@/components/JsonLd'
import { getCarsPage } from '@/lib/cars-server'
import { PHONE_DISPLAY, WHATSAPP_NUMBER } from '@/lib/contact'
import { getPublicSeller, isUuid, sellerPath } from '@/lib/sellers'
import { filterParams, getSiteUrl, hasFilters, SITE_NAME } from '@/lib/site'

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }

const HOME_FILTERS = ['search', 'brand_id', 'seller_id', 'min_price', 'max_price'] as const

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  return {
    title: 'Japanese Cars for Sale in Kampala, Uganda | Kampala Cars',
    description:
      'Buy and sell Japanese cars in Kampala and across Uganda. Browse Toyota, Subaru, Mazda, Mercedes-Benz and more with prices, photos and direct seller contacts.',
    alternates: { canonical: '/' },
    // Filtered views repeat the listings; only the plain page belongs in search results.
    robots: hasFilters(await searchParams, HOME_FILTERS) ? { index: false, follow: true } : undefined,
  }
}

export default async function HomePage({ searchParams }: Props) {
  // Links filtered to one seller (?seller_id=...) open that seller's page instead.
  const params = await searchParams
  const { seller_id: sellerId, ...otherFilters } = params
  if (typeof sellerId === 'string' && isUuid(sellerId)) {
    const seller = await getPublicSeller(sellerId)
    if (seller) redirect(sellerPath(seller, otherFilters))
  }

  const siteUrl = await getSiteUrl()
  const initialPage = await getCarsPage(filterParams(params, HOME_FILTERS))

  return (
    <>
      <HomeClient initialPage={initialPage}>
        <BrowseByMake />
      </HomeClient>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@graph': [
            {
              '@type': 'AutoDealer',
              '@id': `${siteUrl}/#organization`,
              name: SITE_NAME,
              url: siteUrl,
              logo: `${siteUrl}/logo.webp`,
              image: `${siteUrl}/logo.webp`,
              telephone: `+${WHATSAPP_NUMBER}`,
              description: `Online marketplace for buying and selling Japanese cars in Kampala, Uganda. Call or WhatsApp ${PHONE_DISPLAY}.`,
              address: { '@type': 'PostalAddress', addressLocality: 'Kampala', addressCountry: 'UG' },
              areaServed: { '@type': 'Country', name: 'Uganda' },
            },
            {
              '@type': 'WebSite',
              '@id': `${siteUrl}/#website`,
              name: SITE_NAME,
              url: siteUrl,
              publisher: { '@id': `${siteUrl}/#organization` },
              potentialAction: {
                '@type': 'SearchAction',
                target: { '@type': 'EntryPoint', urlTemplate: `${siteUrl}/cars?search={search_term_string}` },
                'query-input': 'required name=search_term_string',
              },
            },
          ],
        }}
      />
    </>
  )
}
