'use client'

import { useState, useEffect, Suspense } from 'react'
import { Layout } from '@/components/Layout'
import { CarCard } from '@/components/CarCard'
import { Button } from '@/components/ui/Button'
import { CarWithBrand } from '@/lib/supabase'
import { ChevronLeft, ChevronRight, Loader2, Car as CarIcon } from 'lucide-react'
import { useSearchParams } from 'next/navigation'

function HomeContent() {
  const [cars, setCars] = useState<CarWithBrand[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [total, setTotal] = useState(0)
  
  const searchParams = useSearchParams()
  const search = searchParams.get('search') || ''

  useEffect(() => {
    fetchCars()
  }, [page, search])

  const fetchCars = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '12',
        ...(search && { search })
      })
      
      const response = await fetch(`/api/cars?${params}`)
      const data = await response.json()
      
      if (response.ok) {
        setCars(data.cars)
        setHasMore(data.pagination.hasMore)
        setTotal(data.pagination.total)
      }
    } catch (error) {
      console.error('Error fetching cars:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 bg-white">
        {/* Hero Section */}
        <div className="text-center mb-16 bg-gray-50 border border-gray-200 rounded-2xl py-16 px-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">
            Find Your Perfect Car
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Discover amazing deals on quality vehicles in Kampala. Your trusted marketplace for buying and selling cars.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white">
              Browse Cars
            </Button>
            <Button size="lg" variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50">
              Sell Your Car
            </Button>
          </div>
        </div>

        {/* Search Results Header */}
        {search && (
          <div className="mb-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              Search Results for "{search}"
            </h2>
            <p className="text-gray-600">
              {total} car{total !== 1 ? 's' : ''} found
            </p>
          </div>
        )}

        {/* Cars Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
              <span className="text-gray-600">Loading cars...</span>
            </div>
          </div>
        ) : cars.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
              {cars.map((car) => (
                <CarCard key={car.car_id} car={car} />
              ))}
            </div>

            {/* Pagination */}
            <div className="flex justify-center items-center space-x-4 py-8">
              <Button
                variant="outline"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
                className="border-gray-300 text-gray-700"
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>
              
              <span className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 font-medium">
                Page {page}
              </span>
              
              <Button
                variant="outline"
                disabled={!hasMore}
                onClick={() => setPage(page + 1)}
                className="border-gray-300 text-gray-700"
              >
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </>
        ) : (
          <div className="text-center py-20">
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-12 max-w-md mx-auto">
              <div className="text-gray-400 mb-6">
                <CarIcon className="mx-auto h-16 w-16" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                {search ? 'No cars found' : 'No cars available'}
              </h3>
              <p className="text-gray-600 mb-6">
                {search ? 'Try adjusting your search terms.' : 'Be the first to list a car!'}
              </p>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                Sell Your Car
              </Button>
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
