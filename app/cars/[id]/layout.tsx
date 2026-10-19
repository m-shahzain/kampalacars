import type { Metadata } from "next"
import { headers } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import { PREVIEW_HEIGHT, PREVIEW_WIDTH } from "@/lib/preview-image"
import { formatPrice } from "@/lib/utils"

type ListingMetadata = {
  title: string
  model: string
  year: number
  description: string | null
  price: number
  is_sold: boolean
  image_urls: string[] | null
  car_brands: { brand_name: string } | { brand_name: string }[] | null
}

function descriptionFor(car: ListingMetadata, title: string) {
  const description = car.description?.replace(/\s+/g, " ").trim()

  return description
    ? description.slice(0, 200)
    : `View this ${car.year} ${title} on Kampala Cars.`
}

async function siteUrl() {
  const requestHeaders = await headers()
  const forwardedHost = requestHeaders.get("x-forwarded-host")
  const host = forwardedHost ?? requestHeaders.get("host")
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "https"

  return process.env.NEXT_PUBLIC_SITE_URL ?? (host ? `${protocol}://${host}` : "http://localhost:3000")
}

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data: car } = await supabase
    .from("cars")
    .select("title, model, year, description, price, is_sold, image_urls, car_brands!inner(brand_name)")
    .eq("car_id", id)
    .eq("approval_status", "approved")
    .maybeSingle()

  if (!car) {
    return {
      title: "Car Not Found | Kampala Cars",
      robots: { index: false, follow: false },
    }
  }

  const listing = car as ListingMetadata
  // Supabase returns the brand as an object for this one-to-one join.
  const brand = Array.isArray(listing.car_brands) ? listing.car_brands[0] : listing.car_brands
  const title = `${listing.year} ${brand?.brand_name ?? ""} ${listing.model}`.replace(/\s+/g, " ").trim()
  const price = listing.is_sold ? "SOLD" : formatPrice(Number(listing.price))
  const shareTitle = `${title} · ${price}`
  const description = descriptionFor(listing, title)
  const baseUrl = await siteUrl()
  const url = new URL(`/cars/${id}`, baseUrl).toString()
  // A branded JPEG preview; the version changes when the main photo changes so apps refresh it.
  const photoVersion = listing.image_urls?.[0]?.split("/").pop()?.replace(/\.[^.]+$/, "") ?? "none"
  const image = {
    url: new URL(`/cars/${id}/preview.jpg?v=${photoVersion}`, baseUrl).toString(),
    width: PREVIEW_WIDTH,
    height: PREVIEW_HEIGHT,
    type: "image/jpeg",
    alt: title,
  }

  return {
    title: `${shareTitle} | Kampala Cars`,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      url,
      title: shareTitle,
      description,
      siteName: "Kampala Cars",
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title: shareTitle,
      description,
      images: [image.url],
    },
  }
}

export default function CarDetailsLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children
}
