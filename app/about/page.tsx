import type { Metadata } from 'next'
import Link from 'next/link'
import { BadgeCheck, Camera, Car, MessageCircle, Search, ShieldCheck, UserPlus } from 'lucide-react'
import { Layout } from '@/components/Layout'
import { supabase } from '@/lib/supabase'

export const metadata: Metadata = {
  title: 'About Us | Kampala Cars',
  description: 'Kampala Cars is an online marketplace for buying and selling cars in Kampala and across Uganda.',
}

// Refresh the marketplace numbers at most once an hour.
export const revalidate = 3600

async function getMarketplaceStats() {
  const [{ count: cars }, { count: sellers }, { count: brands }] = await Promise.all([
    supabase.from('cars').select('car_id', { count: 'exact', head: true }).eq('approval_status', 'approved'),
    // Every registered seller account, whether or not they have a car listed right now.
    supabase.from('users').select('user_id', { count: 'exact', head: true }).eq('user_type', 'seller'),
    supabase.from('car_brands').select('brand_id', { count: 'exact', head: true }),
  ])

  return { cars: cars ?? 0, sellers: sellers ?? 0, brands: brands ?? 0 }
}

const buyerSteps = [
  { icon: Search, title: 'Search and filter', text: 'Find cars by make, model, seller or price range.' },
  { icon: MessageCircle, title: 'Get in touch', text: 'Call or message about any car straight from its listing.' },
  { icon: Car, title: 'Inspect and buy', text: 'Meet, view the car in person and agree the deal.' },
]

const sellerSteps = [
  { icon: UserPlus, title: 'Create an account', text: 'Sign up with your email or Google in under a minute.' },
  { icon: Camera, title: 'List your car', text: 'Add photos, the price and the details buyers ask about.' },
  { icon: BadgeCheck, title: 'Go live', text: 'Our team reviews each listing before it is published.' },
]

const reasons = [
  { icon: ShieldCheck, title: 'Reviewed listings', text: 'Every listing is checked by our team before buyers can see it.' },
  { icon: BadgeCheck, title: 'Verified accounts', text: 'New accounts confirm their email with a code or sign in with Google.' },
  { icon: MessageCircle, title: 'Local and direct', text: 'Based in Kampala and reachable on WhatsApp when you need help.' },
]

function Steps({ title, steps }: { title: string; steps: typeof buyerSteps }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <h3 className="text-base font-semibold text-gray-900 mb-4">{title}</h3>
      <ol className="space-y-4">
        {steps.map(({ icon: Icon, title: stepTitle, text }, index) => (
          <li key={stepTitle} className="flex gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gold-50">
              <Icon className="h-4 w-4 text-gold-700" />
            </span>
            <div>
              <p className="text-sm font-medium text-gray-900">{index + 1}. {stepTitle}</p>
              <p className="text-sm text-gray-500">{text}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}

export default async function AboutPage() {
  const stats = await getMarketplaceStats()
  const statTiles = [
    { label: 'Cars listed', value: stats.cars },
    { label: 'Sellers', value: stats.sellers },
    { label: 'Brands', value: stats.brands },
  ].filter((tile) => tile.value > 0)

  return (
    <Layout>
      <div className="container mx-auto px-4 py-10">
        <section className="mx-auto max-w-3xl text-center">
          <img src="/logo.webp" alt="Kampala Cars logo" width={80} height={80} className="mx-auto mb-5 h-20 w-20 rounded-xl" />
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">About Kampala Cars</h1>
          <p className="mt-4 text-gray-600 leading-relaxed">
            Kampala Cars is an online marketplace that brings car buyers and sellers in Kampala together in one place.
            Whether you are looking for your next car or ready to sell one, we make it simple to find the right match
            and get in touch.
          </p>
        </section>

        {statTiles.length > 0 && (
          <section className="mx-auto mt-10 grid max-w-3xl grid-cols-3 gap-3">
            {statTiles.map((tile) => (
              <div key={tile.label} className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-center">
                <p className="text-2xl md:text-3xl font-bold text-gray-900">{tile.value.toLocaleString('en-UG')}</p>
                <p className="mt-1 text-xs md:text-sm text-gray-500">{tile.label}</p>
              </div>
            ))}
          </section>
        )}

        <section className="mx-auto mt-14 max-w-5xl">
          <h2 className="text-xl font-bold text-gray-900 text-center mb-6">How it works</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Steps title="For buyers" steps={buyerSteps} />
            <Steps title="For sellers" steps={sellerSteps} />
          </div>
        </section>

        <section className="mx-auto mt-14 max-w-5xl">
          <h2 className="text-xl font-bold text-gray-900 text-center mb-6">Why Kampala Cars</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {reasons.map(({ icon: Icon, title, text }) => (
              <div key={title} className="rounded-xl border border-gray-200 bg-white p-5">
                <Icon className="h-5 w-5 text-gold-700 mb-3" />
                <p className="text-sm font-semibold text-gray-900">{title}</p>
                <p className="mt-1 text-sm text-gray-500">{text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto mt-14 max-w-3xl rounded-2xl bg-brand px-6 py-10 text-center">
          <h2 className="text-xl font-bold text-white">Find your next car today</h2>
          <p className="mt-2 text-sm text-gray-300">Browse the latest listings or put your own car in front of buyers.</p>
          <div className="mt-6 flex flex-col sm:flex-row justify-center gap-3">
            <Link href="/cars" className="inline-flex h-11 items-center justify-center rounded-lg bg-gold-500 px-6 text-sm font-semibold text-gray-900 hover:bg-gold-400">
              Browse cars
            </Link>
            <Link href="/upload" className="inline-flex h-11 items-center justify-center rounded-lg border border-gray-600 px-6 text-sm font-semibold text-white hover:bg-white/10">
              Sell your car
            </Link>
          </div>
        </section>
      </div>
    </Layout>
  )
}
