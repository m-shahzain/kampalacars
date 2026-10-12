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
    .select('car_id, created_at')
    .eq('approval_status', 'approved')
    .order('created_at', { ascending: false })

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
    ...(cars ?? []).map((car) => ({
      url: `${siteUrl}/cars/${car.car_id}`,
      lastModified: new Date(car.created_at),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
  ]
}
