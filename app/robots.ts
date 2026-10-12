import type { MetadataRoute } from 'next'
import { headers } from 'next/headers'

async function getSiteUrl() {
  const requestHeaders = await headers()
  const host = requestHeaders.get('x-forwarded-host') ?? requestHeaders.get('host')
  const protocol = requestHeaders.get('x-forwarded-proto') ?? 'https'

  return (process.env.NEXT_PUBLIC_SITE_URL ?? (host ? `${protocol}://${host}` : 'http://localhost:3000')).replace(/\/$/, '')
}

export default async function robots(): Promise<MetadataRoute.Robots> {
  const siteUrl = await getSiteUrl()

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/api/', '/auth/', '/dashboard/', '/upload/'],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  }
}
