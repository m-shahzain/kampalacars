'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { Layout } from '@/components/Layout'
import { CarCard } from '@/components/CarCard'
import { Button } from '@/components/ui/Button'
import { CarSearchBar, CarSearchValues, EMPTY_SEARCH_VALUES, useSearchOptions } from '@/components/CarSearchBar'
import { CarWithBrand } from '@/lib/types'
import { Loader2, Car as CarIcon } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'

function HomeContent() {
  const { user } = useAuth()
  const [cars, setCars] = useState<CarWithBrand[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [total, setTotal] = useState(0)
  const loadMoreRef = useRef<HTMLDivElement>(null)
  const latestRequest = useRef(0)
  
  const searchOptions = useSearchOptions()
  const searchParams = useSearchParams()
  const [filters, setFilters] = useState<CarSearchValues>({
    ...EMPTY_SEARCH_VALUES,
    search: searchParams.get('search') || '',
  })
  const hasFilters = Object.values(filters).some(Boolean)

  const fetchCars = async (nextPage: number, append = false) => {
    append ? setLoadingMore(true) : setLoading(true)
    const requestId = ++latestRequest.current
    try {
      const params = new URLSearchParams({ page: nextPage.toString(), limit: '12' })
      Object.entries(filters).forEach(([key, value]) => {
        if (value.trim()) params.set(key, value.trim())
      })
      
      const response = await fetch(`/api/cars?${params}`)
      const data = await response.json()
      // Ignore a slow response that a newer filter change has replaced.
      if (requestId !== latestRequest.current) return
      
      if (response.ok) {
        setCars((currentCars) => append ? [...currentCars, ...data.cars] : data.cars)
        setHasMore(data.pagination.hasMore)
        setTotal(data.pagination.total)
        setPage(nextPage)
      }
    } catch (error) {
      console.error('Error fetching cars:', error)
    } finally {
      if (requestId === latestRequest.current) append ? setLoadingMore(false) : setLoading(false)
    }
  }

  useEffect(() => {
    fetchCars(1)
  }, [filters])

  useEffect(() => {
    const target = loadMoreRef.current
    if (!target || !hasMore || loading || loadingMore) return
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) fetchCars(page + 1, true)
    }, { rootMargin: '400px' })
    observer.observe(target)
    return () => observer.disconnect()
  }, [hasMore, loading, loadingMore, page, filters])

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        {/* Hero Section */}
        <div className="text-center mb-8 bg-gray-50 border border-gray-200 rounded-xl py-10 px-4 sm:px-6">
          <h1 className="text-2xl md:text-3xl font-bold mb-3 text-gray-900">
            Find Your Perfect Car
          </h1>
          <p className="text-gray-500 mb-6 max-w-lg mx-auto text-sm">
            Discover quality vehicles in Kampala. Your trusted marketplace for buying and selling cars.
          </p>
          <CarSearchBar
            options={searchOptions}
            values={filters}
            onSubmit={setFilters}
            live
            className="max-w-4xl mx-auto"
          />
          <p className="mt-5 text-sm text-gray-500">
            Want to sell?{' '}
            <Link href="/upload" className="font-medium text-blue-600 hover:underline">
              List your car
            </Link>
          </p>
        </div>

        {hasFilters && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-gray-900">
              {filters.search ? <>Results for &ldquo;{filters.search}&rdquo;</> : 'Filtered results'}
              <span className="ml-2 text-sm font-normal text-gray-500">{total} found</span>
            </h2>
            <button onClick={() => setFilters(EMPTY_SEARCH_VALUES)} className="text-sm text-blue-700 hover:underline shrink-0">
              Clear filters
            </button>
          </div>
        )}

        {/* Cars Grid */}
        {loading && cars.length === 0 ? (
          <div className="flex justify-center items-center py-16">
            <div className="text-center">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600 mx-auto mb-3" />
              <span className="text-sm text-gray-500">Loading cars...</span>
            </div>
          </div>
        ) : cars.length > 0 ? (
          <>
            <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8 transition-opacity ${loading ? 'opacity-50' : ''}`} aria-busy={loading}>
              {cars.map((car, index) => (
                <CarCard key={car.car_id} car={car} priority={index < 4} />
              ))}
            </div>

            <div ref={loadMoreRef} className="flex justify-center py-6" aria-live="polite">
              {loadingMore && <><Loader2 className="mr-2 h-5 w-5 animate-spin text-blue-600" /><span className="text-sm text-gray-500">Loading more cars...</span></>}
              {!hasMore && <span className="text-sm text-gray-500">You have reached the end of the listings.</span>}
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 max-w-xs mx-auto">
              <CarIcon className="mx-auto h-10 w-10 text-gray-300 mb-3" />
              <h3 className="text-base font-semibold text-gray-900 mb-1">
                {hasFilters ? 'No cars found' : 'No cars available'}
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                {hasFilters ? 'Try adjusting your search.' : 'Be the first to list a car!'}
              </p>
              {user?.user_type !== 'buyer' && (
                <Link href="/upload">
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                    Sell Your Car
                  </Button>
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}

export default function Home() {
  return (
    <Suspense fallback={
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Loading...</span>
          </div>
        </div>
      </Layout>
    }>
      <HomeContent />
    </Suspense>
  )
}
