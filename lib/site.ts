import { headers } from 'next/headers'

export const SITE_NAME = 'Kampala Cars'

/** The public address of the site, e.g. https://kampalacars.com, without a trailing slash. */
export async function getSiteUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '')
  const requestHeaders = await headers()
  const host = requestHeaders.get('x-forwarded-host') ?? requestHeaders.get('host')
  const protocol = requestHeaders.get('x-forwarded-proto') ?? 'https'
  return host ? `${protocol}://${host}` : 'http://localhost:3000'
}

/** True when the page address carries any of these filters, e.g. ?min_price=... */
export function hasFilters(searchParams: Record<string, string | string[] | undefined>, keys: readonly string[]) {
  return keys.some((key) => {
    const value = searchParams[key]
    return typeof value === 'string' ? value.trim() !== '' : Array.isArray(value) && value.length > 0
  })
}

/** The filters from the page address, limited to the ones the page understands. */
export function filterParams(searchParams: Record<string, string | string[] | undefined>, keys: readonly string[]) {
  const params = new URLSearchParams()
  for (const key of keys) {
    const value = searchParams[key]
    if (typeof value === 'string' && value.trim()) params.set(key, value.trim())
  }
  return params
}
