'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Car as CarIcon, Loader2 } from 'lucide-react'
import { CarCard } from '@/components/CarCard'
import { CarSearchBar, CarSearchValues, useSearchOptions } from '@/components/CarSearchBar'
import { Button } from '@/components/ui/Button'
import { CarWithBrand } from '@/lib/types'
import { useFiltersInUrl } from '@/lib/use-filters-in-url'

const PAGE_SIZE = 24

interface SellerListingsProps {
  sellerId: string
  /** The seller page address; filters are added to it so the link can be shared. */
  basePath: string
}

export function SellerListings({ sellerId, basePath }: SellerListingsProps) {
  const searchParams = useSearchParams()
  const searchOptions = useSearchOptions()
  const [filters, setFilters] = useState<CarSearchValues>(() => ({
    search: searchParams.get('search') || '',
    brand_id: searchParams.get('brand_id') || '',
    seller_id: sellerId,
    min_price: searchParams.get('min_price') || '',
    max_price: searchParams.get('max_price') || '',
  }))
  const [cars, setCars] = useState<CarWithBrand[]>([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(true)
  const latestRequest = useRef(0)

  // The seller is part of the page address, so only the other filters go in the query.
  const { seller_id: _seller, ...urlFilters } = filters
  useFiltersInUrl(basePath, urlFilters)
  const hasFilters = Object.values(urlFilters).some(Boolean)

  // Uses the public cars API, which applies the usual contact-detail rules.
  const load = useCallback(async (nextPage: number) => {
    setLoading(true)
    const requestId = ++latestRequest.current
    try {
      const params = new URLSearchParams({ page: String(nextPage), limit: String(PAGE_SIZE) })
      Object.entries(filters).forEach(([key, value]) => {
        if (value.trim()) params.set(key, value.trim())
      })
      params.set('seller_id', sellerId)

      const response = await fetch(`/api/cars?${params}`)
      const data = await response.json()
      // Ignore a slow response that a newer filter change has replaced.
      if (requestId !== latestRequest.current) return
      if (response.ok) {
        setCars((current) => (nextPage === 1 ? data.cars : [...current, ...data.cars]))
        setTotal(data.pagination.total)
        setHasMore(data.pagination.hasMore)
        setPage(nextPage)
      }
    } finally {
      if (requestId === latestRequest.current) setLoading(false)
    }
  }, [filters, sellerId])

  useEffect(() => {
    void load(1)
  }, [load])

  const clearFilters = () => setFilters({ search: '', brand_id: '', seller_id: sellerId, min_price: '', max_price: '' })

  return (
    <>
      <CarSearchBar
        options={searchOptions}
        values={filters}
        onSubmit={(values) => setFilters({ ...values, seller_id: sellerId })}
        live
        className="mb-4"
      />

      {hasFilters && (
        <div className="mb-4 flex items-center gap-3 text-sm">
          <span className="text-gray-500">{total} {total === 1 ? 'car matches' : 'cars match'} your filters</span>
          <button type="button" onClick={clearFilters} className="font-medium text-gold-700 hover:underline">
            Clear filters
          </button>
        </div>
      )}

      {loading && cars.length === 0 ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-gold-700" />
        </div>
      ) : cars.length > 0 ? (
        <>
          <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 transition-opacity ${loading ? 'opacity-50' : ''}`} aria-busy={loading}>
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
      ) : (
        <div className="py-16 text-center">
          <CarIcon className="mx-auto mb-3 h-10 w-10 text-gray-300" />
          <h3 className="mb-1 text-base font-semibold text-gray-900">No cars match your filters</h3>
          <p className="mb-4 text-sm text-gray-500">This seller has no cars that match. Try a different brand or price.</p>
          <Button size="sm" variant="outline" onClick={clearFilters}>Clear filters</Button>
        </div>
      )}
    </>
  )
}
