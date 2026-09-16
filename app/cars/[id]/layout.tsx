import type { Metadata } from "next"
import { headers } from "next/headers"
import { createClient } from "@/lib/supabase/server"

type ListingMetadata = {
  title: string
  model: string
  year: number
  description: string | null
  image_urls: string[] | null
  car_brands: { brand_name: string }[] | null
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
    .select("title, model, year, description, image_urls, car_brands!inner(brand_name)")
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
  const title = `${listing.year} ${listing.car_brands?.[0]?.brand_name ?? ""} ${listing.model}`.replace(/\s+/g, " ").trim()
  const description = descriptionFor(listing, title)
  const image = listing.image_urls?.[0]
  const baseUrl = await siteUrl()
  const url = new URL(`/cars/${id}`, baseUrl).toString()

  return {
    title: `${title} | Kampala Cars`,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      url,
      title: `${title} | Kampala Cars`,
      description,
      siteName: "Kampala Cars",
      ...(image ? { images: [{ url: image, alt: title }] } : {}),
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title: `${title} | Kampala Cars`,
      description,
      ...(image ? { images: [image] } : {}),
    },
  }
}

export default function CarDetailsLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children
}
