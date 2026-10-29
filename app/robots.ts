import type { MetadataRoute } from 'next'
import { getSiteUrl } from '@/lib/site'

export default async function robots(): Promise<MetadataRoute.Robots> {
  const siteUrl = await getSiteUrl()

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/api/', '/auth/', '/dashboard/', '/upload/', '/cars/*/edit'],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  }
}
