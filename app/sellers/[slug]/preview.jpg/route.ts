import { previewImageResponse } from '@/lib/preview-image'
import { carsLabel, getPublicSeller } from '@/lib/sellers'

// GET /sellers/[slug]/preview.jpg - the image shown when a seller link is shared.
export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const seller = await getPublicSeller(decodeURIComponent(slug))
  if (!seller) return new Response('Not found', { status: 404 })

  return previewImageResponse({
    photoUrl: seller.coverImage,
    title: seller.name,
    highlight: `${carsLabel(seller.carsForSale)} for sale`,
    details: 'kampalacars.com',
  })
}
