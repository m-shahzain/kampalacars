import { cache } from 'react'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export type PublicSeller = {
  userId: string
  slug: string | null
  name: string
  profilePictureUrl: string | null
  memberSince: string
  carsForSale: number
  carsSold: number
  coverImage: string | null
}

export const isUuid = (value: string) => UUID_PATTERN.test(value)

/** Seller names sometimes contain quotes or extra spaces; tidy them for headings and previews. */
export const displayName = (name: string) => name.replace(/["“”]/g, '').replace(/\s+/g, ' ').trim()

export const sellerPath = (seller: Pick<PublicSeller, 'slug' | 'userId'>) => `/sellers/${seller.slug ?? seller.userId}`

/**
 * Public details of a seller, looked up by their page name (slug) or user id.
 * Only sellers with at least one approved listing have a public page.
 * Cached per request so the page and its metadata share one lookup.
 */
export const getPublicSeller = cache(async (slugOrId: string): Promise<PublicSeller | null> => {
  const supabase = await createClient()
  const column = isUuid(slugOrId) ? 'user_id' : 'slug'

  // select('*') keeps this working whether or not the slug column exists yet.
  const { data: user } = await supabase.from('users').select('*').eq(column, slugOrId).maybeSingle()
  if (!user || user.user_type === 'admin') return null

  const { data: cars } = await supabase
    .from('cars')
    .select('image_urls, is_sold')
    .eq('seller_id', user.user_id)
    .eq('approval_status', 'approved')
    .order('created_at', { ascending: false })
  if (!cars?.length) return null

  const forSale = cars.filter((car) => !car.is_sold)
  return {
    userId: user.user_id,
    slug: user.slug ?? null,
    name: displayName(user.fullname),
    profilePictureUrl: user.profile_picture_url ?? null,
    memberSince: user.created_at,
    carsForSale: forSale.length,
    carsSold: cars.length - forSale.length,
    coverImage: (forSale[0] ?? cars[0]).image_urls?.[0] ?? null,
  }
})

export const carsLabel = (count: number) => `${count} ${count === 1 ? 'car' : 'cars'}`

/** Title, description and share preview (with a car photo) for a seller's listings. */
export function sellerMetadata(seller: PublicSeller): Metadata {
  const title = `${seller.name} · ${carsLabel(seller.carsForSale)} for sale`
  const description = `Browse ${carsLabel(seller.carsForSale)} for sale from ${seller.name} on Kampala Cars, Uganda's car marketplace.`

  return {
    title: `${title} | Kampala Cars`,
    description,
    alternates: { canonical: sellerPath(seller) },
    openGraph: {
      type: 'profile',
      title,
      description,
      siteName: 'Kampala Cars',
      url: sellerPath(seller),
      ...(seller.coverImage ? { images: [{ url: seller.coverImage, alt: `Cars from ${seller.name}` }] } : {}),
    },
    twitter: {
      card: seller.coverImage ? 'summary_large_image' : 'summary',
      title,
      description,
      ...(seller.coverImage ? { images: [seller.coverImage] } : {}),
    },
  }
}
