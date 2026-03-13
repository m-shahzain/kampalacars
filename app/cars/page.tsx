'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Layout } from '@/components/Layout'
import { CarCard } from '@/components/CarCard'
import { Button } from '@/components/ui/Button'
import { CarWithBrand, CarBrand } from '@/lib/types'
import {
  Search,
  SlidersHorizontal,
  X,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Car as CarIcon,
} from 'lucide-react'
import { Suspense } from 'react'

function CarsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [cars, setCars] = useState<CarWithBrand[]>([])
  const [brands, setBrands] = useState<CarBrand[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    brand_id: searchParams.get('brand_id') || '',
    body_type: searchParams.get('body_type') || '',
    fuel_type: searchParams.get('fuel_type') || '',
    transmission: searchParams.get('transmission') || '',
    min_price: searchParams.get('min_price') || '',
    max_price: searchParams.get('max_price') || '',
    min_year: searchParams.get('min_year') || '',
    max_year: searchParams.get('max_year') || '',
  })

  useEffect(() => {
    fetch('/api/brands')
      .then(r => r.json())
      .then(d => setBrands(d.brands || []))
      .catch(() => {})
  }, [])

  const fetchCars = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ page: page.toString(), limit: '12' })

    Object.entries(filters).forEach(([k, v]) => {
      if (v) params.set(k, v)
    })

    try {
      const res = await fetch(`/api/cars?${params}`)
      const data = await res.json()
      if (res.ok) {
        setCars(data.cars)
        setTotal(data.pagination.total)
        setHasMore(data.pagination.hasMore)
      }
    } catch {
      console.error('Error fetching cars')
    } finally {
      setLoading(false)
    }
  }, [page, filters])

  useEffect(() => {
    fetchCars()
  }, [fetchCars])

  const applyFilters = () => {
    setPage(1)
    setShowFilters(false)

    const params = new URLSearchParams()
    Object.entries(filters).forEach(([k, v]) => {
      if (v) params.set(k, v)
    })
    router.replace(`/cars?${params.toString()}`, { scroll: false })
  }

  const clearFilters = () => {
    setFilters({
      search: '', brand_id: '', body_type: '', fuel_type: '',
      transmission: '', min_price: '', max_price: '', min_year: '', max_year: '',
    })
    setPage(1)
    router.replace('/cars', { scroll: false })
  }

  const activeFilterCount = Object.values(filters).filter(v => v).length

  const selectClass = "w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
  const inputClass = selectClass

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        {/* Search bar + filter toggle */}
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by brand, model, or keyword..."
              value={filters.search}
              onChange={e => setFilters({ ...filters, search: e.target.value })}
              onKeyDown={e => e.key === 'Enter' && applyFilters()}
              className="w-full pl-10 pr-3 py-2.5 text-sm border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <Button size="md" onClick={applyFilters} className="bg-blue-600 hover:bg-blue-700 text-white shrink-0">
            Search
          </Button>
          <Button
            size="md"
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="shrink-0 relative"
          >
            <SlidersHorizontal className="h-4 w-4 mr-1.5" />
            Filters
            {activeFilterCount > (filters.search ? 1 : 0) && (
              <span className="absolute -top-1.5 -right-1.5 bg-blue-600 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                {activeFilterCount - (filters.search ? 1 : 0)}
              </span>
            )}
          </Button>
        </div>

        {/* Filters panel */}
        {showFilters && (
          <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-900">Filters</h3>
              <button onClick={clearFilters} className="text-xs text-blue-600 hover:underline">
                Clear all
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Brand</label>
                <select value={filters.brand_id} onChange={e => setFilters({ ...filters, brand_id: e.target.value })} className={selectClass}>
                  <option value="">All Brands</option>
                  {brands.map(b => <option key={b.brand_id} value={b.brand_id}>{b.brand_name}</option>)}
                </select>
              </div>

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
                <label className="block text-xs text-gray-500 mb-1">Min Price</label>
                <input type="number" placeholder="e.g. 5000" value={filters.min_price} onChange={e => setFilters({ ...filters, min_price: e.target.value })} className={inputClass} />
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-1">Max Price</label>
                <input type="number" placeholder="e.g. 50000" value={filters.max_price} onChange={e => setFilters({ ...filters, max_price: e.target.value })} className={inputClass} />
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
              <Button size="sm" onClick={applyFilters} className="bg-blue-600 hover:bg-blue-700 text-white">
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
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-md">
                &ldquo;{filters.search}&rdquo;
                <button onClick={() => { setFilters({ ...filters, search: '' }); setPage(1) }}><X className="h-3 w-3" /></button>
              </span>
            )}
            {filters.brand_id && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-md">
                {brands.find(b => b.brand_id === filters.brand_id)?.brand_name}
                <button onClick={() => setFilters({ ...filters, brand_id: '' })}><X className="h-3 w-3" /></button>
              </span>
            )}
            {filters.body_type && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-md capitalize">
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
        {loading ? (
          <div className="flex justify-center items-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600 mr-2" />
            <span className="text-sm text-gray-500">Loading cars...</span>
          </div>
        ) : cars.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
              {cars.map((car, i) => (
                <CarCard key={car.car_id} car={car} priority={i < 4} />
              ))}
            </div>

            <div className="flex justify-center items-center gap-3 py-4">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                <ChevronLeft className="h-4 w-4 mr-1" /> Previous
              </Button>
              <span className="text-sm text-gray-600 px-3 py-1 bg-gray-50 border border-gray-200 rounded-lg">
                Page {page}
              </span>
              <Button variant="outline" size="sm" disabled={!hasMore} onClick={() => setPage(p => p + 1)}>
                Next <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
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
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
        </div>
      </Layout>
    }>
      <CarsContent />
    </Suspense>
  )
}
