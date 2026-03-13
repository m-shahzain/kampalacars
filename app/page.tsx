'use client'

import { useState, useEffect, Suspense } from 'react'
import { Layout } from '@/components/Layout'
import { CarCard } from '@/components/CarCard'
import { Button } from '@/components/ui/Button'
import { CarWithBrand } from '@/lib/types'
import { ChevronLeft, ChevronRight, Loader2, Car as CarIcon } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'

function HomeContent() {
  const { user } = useAuth()
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
      <div className="container mx-auto px-4 py-6">
        {/* Hero Section */}
        <div className="text-center mb-8 bg-gray-50 border border-gray-200 rounded-xl py-10 px-6">
          <h1 className="text-2xl md:text-3xl font-bold mb-3 text-gray-900">
            Find Your Perfect Car
          </h1>
          <p className="text-gray-500 mb-6 max-w-lg mx-auto text-sm">
            Discover quality vehicles in Kampala. Your trusted marketplace for buying and selling cars.
          </p>
          <div className="flex gap-3 justify-center">
            <Link href="/cars">
              <Button size="md" className="bg-blue-600 hover:bg-blue-700 text-white">
                Browse Cars
              </Button>
            </Link>
            <Link href="/upload">
              <Button size="md" variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50">
                Sell Your Car
              </Button>
            </Link>
          </div>
        </div>

        {search && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h2 className="text-lg font-semibold text-gray-900">
              Results for &ldquo;{search}&rdquo;
              <span className="ml-2 text-sm font-normal text-gray-500">{total} found</span>
            </h2>
          </div>
        )}

        {/* Cars Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-16">
            <div className="text-center">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600 mx-auto mb-3" />
              <span className="text-sm text-gray-500">Loading cars...</span>
            </div>
          </div>
        ) : cars.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
              {cars.map((car, index) => (
                <CarCard key={car.car_id} car={car} priority={index < 4} />
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
          <div className="text-center py-12">
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 max-w-xs mx-auto">
              <CarIcon className="mx-auto h-10 w-10 text-gray-300 mb-3" />
              <h3 className="text-base font-semibold text-gray-900 mb-1">
                {search ? 'No cars found' : 'No cars available'}
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                {search ? 'Try adjusting your search.' : 'Be the first to list a car!'}
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
