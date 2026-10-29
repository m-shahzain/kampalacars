import type { Metadata } from 'next'
import { notFound, permanentRedirect } from 'next/navigation'
import { findModelBySlug, matchModel } from '@/lib/car-models'
import { modelPath, parseCarId } from '@/lib/car-paths'
import { getBrandBySlug } from '@/lib/cars-server'
import { landingMetadata, LandingPage } from '../landing-page'

// /cars/toyota/land-cruiser-prado
type Props = { params: Promise<{ slug: string; model: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, model } = await params
  return landingMetadata(slug, model)
}

export default async function ModelPage({ params }: Props) {
  const { slug, model } = await params
  if (parseCarId(slug)) notFound()

  // Spellings people type, such as /cars/toyota/landcruiser-prado or /cars/mazda/cx5, move to the model's page.
  const brand = await getBrandBySlug(slug)
  if (brand && !findModelBySlug(brand.brand_name, model)) {
    const meant = matchModel(brand.brand_name, { model: model.replace(/-/g, ' ') })
    if (meant) permanentRedirect(modelPath(brand.brand_name, meant))
  }

  return <LandingPage slug={slug} modelSlug={model} />
}
