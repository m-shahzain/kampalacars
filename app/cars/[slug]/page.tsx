import type { Metadata } from 'next'
import { permanentRedirect } from 'next/navigation'
import { parseCarId } from '@/lib/car-paths'
import { carMetadata, CarDetailsPage } from './car-details'
import { landingMetadata, LandingPage } from './landing-page'

// One address shape serves both: /cars/2021-toyota-land-cruiser-prado-<id> is a car, /cars/toyota a brand.
type Props = { params: Promise<{ slug: string }> }

// Short names people search for that mean one model.
const SHORTCUTS: Record<string, string> = {
  'double-cabin': '/cars/toyota/hilux-double-cabin',
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const carId = parseCarId(slug)
  return carId ? carMetadata(carId) : landingMetadata(slug)
}

export default async function CarOrLandingPage({ params }: Props) {
  const { slug } = await params
  if (SHORTCUTS[slug]) permanentRedirect(SHORTCUTS[slug])
  const carId = parseCarId(slug)
  return carId ? <CarDetailsPage id={carId} slug={slug} /> : <LandingPage slug={slug} />
}
