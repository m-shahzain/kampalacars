import type { MetadataRoute } from 'next'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

async function getSiteUrl() {
  const requestHeaders = await headers()
  const host = requestHeaders.get('x-forwarded-host') ?? requestHeaders.get('host')
  const protocol = requestHeaders.get('x-forwarded-proto') ?? 'https'

  return (process.env.NEXT_PUBLIC_SITE_URL ?? (host ? `${protocol}://${host}` : 'http://localhost:3000')).replace(/\/$/, '')
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = await getSiteUrl()
  const supabase = await createClient()
  const { data: cars } = await supabase
    .from('cars')
    .select('car_id, seller_id, created_at')
    .eq('approval_status', 'approved')
    .order('created_at', { ascending: false })

  // Seller pages, newest listing first; select('*') works before the slug column exists.
  const sellerIds = [...new Set((cars ?? []).map((car) => car.seller_id))]
  const { data: sellers } = sellerIds.length
    ? await supabase.from('users').select('*').in('user_id', sellerIds).neq('user_type', 'admin')
    : { data: [] }
  const lastListing = new Map<string, string>()
  for (const car of cars ?? []) if (!lastListing.has(car.seller_id)) lastListing.set(car.seller_id, car.created_at)

  return [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${siteUrl}/cars`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    ...(sellers ?? []).map((seller) => ({
      url: `${siteUrl}/sellers/${seller.slug ?? seller.user_id}`,
      lastModified: new Date(lastListing.get(seller.user_id) ?? seller.created_at),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })),
    ...(cars ?? []).map((car) => ({
      url: `${siteUrl}/cars/${car.car_id}`,
      lastModified: new Date(car.created_at),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
  ]
}
