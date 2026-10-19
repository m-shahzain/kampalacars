'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { Layout } from '@/components/Layout'
import { CarCard } from '@/components/CarCard'
import { Button } from '@/components/ui/Button'
import { CarSearchBar, CarSearchValues, priceLabel, useSearchOptions } from '@/components/CarSearchBar'
import { CarWithBrand } from '@/lib/types'
import { useFiltersInUrl } from '@/lib/use-filters-in-url'
import {
  SlidersHorizontal,
  X,
  Loader2,
  Car as CarIcon,
} from 'lucide-react'
import { Suspense } from 'react'

function CarsContent() {
  const searchParams = useSearchParams()

  const [cars, setCars] = useState<CarWithBrand[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const loadMoreRef = useRef<HTMLDivElement>(null)
  const latestRequest = useRef(0)

  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    brand_id: searchParams.get('brand_id') || '',
    seller_id: searchParams.get('seller_id') || '',
    body_type: searchParams.get('body_type') || '',
    fuel_type: searchParams.get('fuel_type') || '',
    transmission: searchParams.get('transmission') || '',
    min_price: searchParams.get('min_price') || '',
    max_price: searchParams.get('max_price') || '',
    min_year: searchParams.get('min_year') || '',
    max_year: searchParams.get('max_year') || '',
  })

  useFiltersInUrl('/cars', filters)

  const searchOptions = useSearchOptions()
  const { brands, sellers } = searchOptions

  const fetchCars = useCallback(async (nextPage: number, append = false) => {
    append ? setLoadingMore(true) : setLoading(true)
    const params = new URLSearchParams({ page: nextPage.toString(), limit: '12' })

    Object.entries(filters).forEach(([k, v]) => {
      if (v) params.set(k, v)
    })

    const requestId = ++latestRequest.current

    try {
      const res = await fetch(`/api/cars?${params}`)
      const data = await res.json()
      // Ignore a slow response that a newer filter change has replaced.
      if (requestId !== latestRequest.current) return
      if (res.ok) {
        setCars((currentCars) => append ? [...currentCars, ...data.cars] : data.cars)
        setTotal(data.pagination.total)
        setHasMore(data.pagination.hasMore)
        setPage(nextPage)
      }
    } catch {
      console.error('Error fetching cars')
    } finally {
      if (requestId === latestRequest.current) append ? setLoadingMore(false) : setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    fetchCars(1)
  }, [fetchCars])

  useEffect(() => {
    const target = loadMoreRef.current
    if (!target || !hasMore || loading || loadingMore) return
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) fetchCars(page + 1, true)
    }, { rootMargin: '400px' })
    observer.observe(target)
    return () => observer.disconnect()
  }, [fetchCars, hasMore, loading, loadingMore, page])

  const applyFilters = (nextFilters = filters, closePanel = true) => {
    setFilters(nextFilters)
    setPage(1)
    if (closePanel) setShowFilters(false)
  }

  const clearFilters = () => {
    setFilters({
      search: '', brand_id: '', seller_id: '', body_type: '', fuel_type: '',
      transmission: '', min_price: '', max_price: '', min_year: '', max_year: '',
    })
    setPage(1)
  }

  const activeFilterCount = Object.values(filters).filter(v => v).length
  const moreFilterCount = [filters.body_type, filters.fuel_type, filters.transmission, filters.min_year, filters.max_year].filter(v => v).length
  const searchBarValues: CarSearchValues = {
    search: filters.search,
    brand_id: filters.brand_id,
    seller_id: filters.seller_id,
    min_price: filters.min_price,
    max_price: filters.max_price,
  }
  const activePriceLabel = priceLabel(filters.min_price, filters.max_price)

  const selectClass = "w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-gold-600"
  const inputClass = selectClass

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        {/* Search bar */}
        <CarSearchBar
          options={searchOptions}
          values={searchBarValues}
          onSubmit={(values) => applyFilters({ ...filters, ...values }, false)}
          live
          className="mb-3"
        />

        <div className="flex justify-end mb-4">
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-gold-700"
          >
            <SlidersHorizontal className="h-4 w-4" />
            More filters
            {moreFilterCount > 0 && (
              <span className="bg-brand text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                {moreFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* Filters panel */}
        {showFilters && (
          <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-900">More filters</h3>
              <button onClick={clearFilters} className="text-xs text-gold-700 hover:underline">
                Clear all
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Body Type</label>
                <select value={filters.body_type} onChange={e => setFilters({ ...filters, body_type: e.target.value })} className={selectClass}>
                  <option value="">All Types</option>
                  <option value="sedan">Sedan</option>
                  <option value="hatchback">Hatchback</option>
                  <option value="suv">SUV</option>
                  <option value="coupe">Coupe</option>
                  <option value="convertible">Convertible</option>
                  <option value="wagon">Wagon</option>
                  <option value="pickup">Pickup</option>
                  <option value="van">Van</option>
                  <option value="minivan">Minivan</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-1">Fuel Type</label>
                <select value={filters.fuel_type} onChange={e => setFilters({ ...filters, fuel_type: e.target.value })} className={selectClass}>
                  <option value="">All Fuels</option>
                  <option value="gasoline">Gasoline</option>
                  <option value="diesel">Diesel</option>
                  <option value="electric">Electric</option>
                  <option value="hybrid">Hybrid</option>
                  <option value="cng">CNG</option>
                  <option value="lpg">LPG</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-1">Transmission</label>
                <select value={filters.transmission} onChange={e => setFilters({ ...filters, transmission: e.target.value })} className={selectClass}>
                  <option value="">All</option>
                  <option value="automatic">Automatic</option>
                  <option value="manual">Manual</option>
                  <option value="cvt">CVT</option>
                  <option value="semi-automatic">Semi-Auto</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-1">Min Year</label>
                <input type="number" placeholder="e.g. 2018" value={filters.min_year} onChange={e => setFilters({ ...filters, min_year: e.target.value })} className={inputClass} />
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-1">Max Year</label>
                <input type="number" placeholder="e.g. 2024" value={filters.max_year} onChange={e => setFilters({ ...filters, max_year: e.target.value })} className={inputClass} />
              </div>
            </div>

            <div className="flex justify-end mt-3">
              <Button size="sm" onClick={() => applyFilters()} className="bg-brand hover:bg-brand-hover text-white">
                Apply Filters
              </Button>
            </div>
          </div>
        )}

        {/* Active filter tags */}
        {activeFilterCount > 0 && (
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="text-xs text-gray-500">{total} result{total !== 1 ? 's' : ''}</span>
            {filters.search && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-gold-50 text-gold-700 text-xs rounded-md">
                &ldquo;{filters.search}&rdquo;
                <button onClick={() => { setFilters({ ...filters, search: '' }); setPage(1) }}><X className="h-3 w-3" /></button>
              </span>
            )}
            {filters.brand_id && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-gold-50 text-gold-700 text-xs rounded-md">
                {brands.find(b => b.brand_id === filters.brand_id)?.brand_name}
                <button onClick={() => setFilters({ ...filters, brand_id: '' })}><X className="h-3 w-3" /></button>
              </span>
            )}
            {filters.seller_id && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-gold-50 text-gold-700 text-xs rounded-md">
                {sellers.find(s => s.seller_id === filters.seller_id)?.fullname ?? 'Seller'}
                <button onClick={() => setFilters({ ...filters, seller_id: '' })}><X className="h-3 w-3" /></button>
              </span>
            )}
            {activePriceLabel && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-gold-50 text-gold-700 text-xs rounded-md">
                {activePriceLabel}
                <button onClick={() => setFilters({ ...filters, min_price: '', max_price: '' })}><X className="h-3 w-3" /></button>
              </span>
            )}
            {filters.body_type && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-gold-50 text-gold-700 text-xs rounded-md capitalize">
                {filters.body_type}
                <button onClick={() => setFilters({ ...filters, body_type: '' })}><X className="h-3 w-3" /></button>
              </span>
            )}
            <button onClick={clearFilters} className="text-xs text-gray-500 hover:text-red-600 ml-1">
              Clear all
            </button>
          </div>
        )}

        {/* Results */}
        {loading && cars.length === 0 ? (
          <div className="flex justify-center items-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-gold-700 mr-2" />
            <span className="text-sm text-gray-500">Loading cars...</span>
          </div>
        ) : cars.length > 0 ? (
          <>
            <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6 transition-opacity ${loading ? 'opacity-50' : ''}`} aria-busy={loading}>
              {cars.map((car, i) => (
                <CarCard key={car.car_id} car={car} priority={i < 4} />
              ))}
            </div>

            <div ref={loadMoreRef} className="flex justify-center py-6" aria-live="polite">
              {loadingMore && <><Loader2 className="mr-2 h-5 w-5 animate-spin text-gold-700" /><span className="text-sm text-gray-500">Loading more cars...</span></>}
              {!hasMore && <span className="text-sm text-gray-500">You have reached the end of the listings.</span>}
            </div>
          </>
        ) : (
          <div className="text-center py-16">
            <CarIcon className="mx-auto h-10 w-10 text-gray-300 mb-3" />
            <h3 className="text-base font-semibold text-gray-900 mb-1">No cars found</h3>
            <p className="text-sm text-gray-500 mb-4">Try adjusting your filters or search terms.</p>
            <Button size="sm" variant="outline" onClick={clearFilters}>Clear Filters</Button>
          </div>
        )}
      </div>
    </Layout>
  )
}

export default function CarsPage() {
  return (
    <Suspense fallback={
      <Layout>
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-gold-700" />
        </div>
      </Layout>
    }>
      <CarsContent />
    </Suspense>
  )
}
