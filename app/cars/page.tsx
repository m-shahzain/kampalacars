import { redirect } from 'next/navigation'
import CarsClient from './cars-client'
import { getPublicSeller, isUuid, sellerPath } from '@/lib/sellers'

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }

export default async function CarsPage({ searchParams }: Props) {
  // Links filtered to one seller (?seller_id=...) open that seller's page instead.
  const { seller_id: sellerId } = await searchParams
  if (typeof sellerId === 'string' && isUuid(sellerId)) {
    const seller = await getPublicSeller(sellerId)
    if (seller) redirect(sellerPath(seller))
  }

  return <CarsClient />
}
