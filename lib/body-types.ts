// Body types sellers pick from. Admins manage them at /admin/body-types; the list below is
// what the site shipped with, used until the live list has loaded (or if the body_types
// table has not been created yet).
export type BodyType = { slug: string; name: string }

export const DEFAULT_BODY_TYPES: BodyType[] = [
  { slug: 'sedan', name: 'Sedan' },
  { slug: 'hatchback', name: 'Hatchback' },
  { slug: 'suv', name: 'SUV' },
  { slug: 'coupe', name: 'Coupe' },
  { slug: 'convertible', name: 'Convertible' },
  { slug: 'wagon', name: 'Station wagon' },
  { slug: 'pickup', name: 'Pickup' },
  { slug: 'van', name: 'Van' },
  { slug: 'minivan', name: 'Minivan' },
]

/** "double-cabin" -> "Double cabin", for a code that is in no list. */
const fromSlug = (slug: string) => (slug.charAt(0).toUpperCase() + slug.slice(1)).replace(/-/g, ' ')

export function bodyTypeName(slug: string | null | undefined, types: BodyType[] = DEFAULT_BODY_TYPES) {
  if (!slug) return ''
  return types.find((type) => type.slug === slug)?.name ?? DEFAULT_BODY_TYPES.find((type) => type.slug === slug)?.name ?? fromSlug(slug)
}
