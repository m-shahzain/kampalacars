import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { JsonLd } from '@/components/JsonLd'
import { getSiteUrl } from '@/lib/site'

export type Crumb = { name: string; href: string }

/** The trail above a page (Home › Cars › Toyota), also given to search engines as a BreadcrumbList. */
export async function Breadcrumbs({ items }: { items: Crumb[] }) {
  const siteUrl = await getSiteUrl()
  const trail = [{ name: 'Home', href: '/' }, ...items]

  return (
    <nav aria-label="Breadcrumb" className="mb-4 text-sm text-gray-500">
      <ol className="flex flex-wrap items-center gap-1">
        {trail.map((crumb, index) => (
          <li key={crumb.href} className="flex items-center gap-1">
            {index > 0 && <ChevronRight className="h-3.5 w-3.5 text-gray-400" aria-hidden="true" />}
            {index === trail.length - 1 ? (
              <span aria-current="page" className="text-gray-900">{crumb.name}</span>
            ) : (
              <Link href={crumb.href} className="hover:text-gold-700">{crumb.name}</Link>
            )}
          </li>
        ))}
      </ol>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: trail.map((crumb, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: crumb.name,
            item: `${siteUrl}${crumb.href === '/' ? '' : crumb.href}`,
          })),
        }}
      />
    </nav>
  )
}
