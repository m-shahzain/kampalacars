import type { Metadata } from 'next'
import { Layout } from '@/components/Layout'
import { getBrands } from '@/lib/cars-server'
import { KeyBookingClient } from './key-booking-client'

export const metadata: Metadata = {
  title: 'Car Key Service in Kampala | Kampala Cars',
  description:
    'Spare car keys, lost key replacement, transponder and smart key programming in Kampala. See the key designs and book an appointment online.',
  alternates: { canonical: '/services/car-keys' },
}

export default async function CarKeysPage() {
  const brands = await getBrands()

  return (
    <Layout>
      <KeyBookingClient makes={brands.map((brand) => brand.brand_name)} />
    </Layout>
  )
}
