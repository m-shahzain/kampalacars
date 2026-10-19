'use client'

import { useCallback, useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { CarCard } from '@/components/CarCard'
import { Button } from '@/components/ui/Button'
import { CarWithBrand } from '@/lib/types'

const PAGE_SIZE = 24

export function SellerListings({ sellerId }: { sellerId: string }) {
  const [cars, setCars] = useState<CarWithBrand[]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(true)

  // Uses the public cars API, which applies the usual contact-detail rules.
  const load = useCallback(async (nextPage: number) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ seller_id: sellerId, page: String(nextPage), limit: String(PAGE_SIZE) })
      const response = await fetch(`/api/cars?${params}`)
      const data = await response.json()
      if (response.ok) {
        setCars((current) => (nextPage === 1 ? data.cars : [...current, ...data.cars]))
        setHasMore(data.pagination.hasMore)
        setPage(nextPage)
      }
    } finally {
      setLoading(false)
    }
  }, [sellerId])

  useEffect(() => {
    void load(1)
  }, [load])

  if (loading && cars.length === 0) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-gold-700" />
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {cars.map((car, index) => (
          <CarCard key={car.car_id} car={car} priority={index < 4} showSeller={false} />
        ))}
      </div>
      {hasMore && (
        <div className="mt-6 flex justify-center">
          <Button variant="outline" loading={loading} onClick={() => load(page + 1)}>
            Show more cars
          </Button>
        </div>
      )}
    </>
  )
}
