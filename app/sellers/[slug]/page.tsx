import type { Metadata } from 'next'
import Image from 'next/image'
import { notFound, permanentRedirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, UserRound } from 'lucide-react'
import { Layout } from '@/components/Layout'
import { SellerListings } from '@/components/SellerListings'
import { ShareLinkButtons } from '@/components/ShareLinkButtons'
import { carsLabel, getPublicSeller, isUuid, sellerMetadata, sellerPath } from '@/lib/sellers'

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const seller = await getPublicSeller(decodeURIComponent(slug))

  if (!seller) {
    return { title: 'Seller not found | Kampala Cars', robots: { index: false, follow: false } }
  }
  return sellerMetadata(seller)
}

export default async function SellerPage({ params }: Props) {
  const { slug } = await params
  const seller = await getPublicSeller(decodeURIComponent(slug))
  if (!seller) notFound()

  // Links that use the account id move to the short, readable address.
  if (isUuid(slug) && seller.slug) permanentRedirect(sellerPath(seller))

  const memberSince = new Intl.DateTimeFormat('en-UG', { month: 'long', year: 'numeric' }).format(new Date(seller.memberSince))

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <Link href="/cars" className="mb-4 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900">
          <ArrowLeft className="h-4 w-4" />
          All cars
        </Link>

        <section className="mb-8 flex flex-col gap-5 rounded-2xl border border-gray-200 bg-gray-50 p-6 sm:flex-row sm:items-center">
          {seller.profilePictureUrl ? (
            <Image
              src={seller.profilePictureUrl}
              alt={`${seller.name}'s profile picture`}
              width={88}
              height={88}
              className="h-22 w-22 shrink-0 rounded-full border border-gray-200 object-cover"
            />
          ) : (
            <span className="flex h-22 w-22 shrink-0 items-center justify-center rounded-full bg-gray-200">
              <UserRound className="h-10 w-10 text-gray-400" />
            </span>
          )}
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold text-gray-900">{seller.name}</h1>
            <p className="mt-1 text-sm text-gray-500">Selling on Kampala Cars since {memberSince}</p>
            <p className="mt-2 text-sm text-gray-700">
              <span className="font-semibold text-gray-900">{carsLabel(seller.carsForSale)}</span> for sale
              {seller.carsSold > 0 && <span className="text-gray-500"> · {seller.carsSold} sold</span>}
            </p>
          </div>
          <ShareLinkButtons message={`Check out cars from ${seller.name} on Kampala Cars:`} />
        </section>

        <SellerListings sellerId={seller.userId} />
      </div>
    </Layout>
  )
}
