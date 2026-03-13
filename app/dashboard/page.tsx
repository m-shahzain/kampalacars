'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { Layout } from '@/components/Layout'
import { Button } from '@/components/ui/Button'
import { CarWithBrand } from '@/lib/types'
import { formatPrice, formatDate } from '@/lib/utils'
import { Plus, Edit, Trash2, Eye, User, Phone, Mail, Settings, Car as CarIcon } from 'lucide-react'
import Image from 'next/image'

export default function DashboardPage() {
  const [cars, setCars] = useState<CarWithBrand[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)
  
  const { user, profile } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!user) {
      router.push('/auth/login')
    } else {
      fetchUserCars()
    }
  }, [user, router])

  const fetchUserCars = async () => {
    try {
      const response = await fetch('/api/cars')
      const data = await response.json()
      
      if (response.ok) {
        // Filter cars by current user (using user_id from new schema)
        const userCars = data.cars.filter((car: CarWithBrand) => car.seller_id === user?.user_id)
        setCars(userCars)
      }
    } catch (error) {
      console.error('Error fetching cars:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteCar = async (carId: string) => {
    if (!confirm('Are you sure you want to delete this car listing?')) {
      return
    }

    setDeleting(carId)
    try {
      const response = await fetch(`/api/cars/${carId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setCars(cars.filter(car => car.car_id !== carId))
      } else {
        alert('Failed to delete car')
      }
    } catch (error) {
      console.error('Error deleting car:', error)
      alert('Failed to delete car')
    } finally {
      setDeleting(null)
    }
  }

  if (!user) {
    return null
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">Welcome back, {profile?.full_name || user.email}</p>
          </div>
          <div className="mt-4 md:mt-0">
            <Button onClick={() => router.push('/upload')}>
              <Plus className="h-4 w-4 mr-2" />
              List New Car
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-md">
                <CarIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Listings</p>
                <p className="text-2xl font-bold text-gray-900">{cars.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-md">
                <Eye className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Views</p>
                <p className="text-2xl font-bold text-gray-900">-</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-md">
                <Mail className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Messages</p>
                <p className="text-2xl font-bold text-gray-900">-</p>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Section */}
        <div className="bg-white rounded-lg shadow mb-8 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Profile Information</h2>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center">
              <User className="h-5 w-5 text-gray-400 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Full Name</p>
                <p className="font-medium">{profile?.full_name || 'Not provided'}</p>
              </div>
            </div>
            <div className="flex items-center">
              <Mail className="h-5 w-5 text-gray-400 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-medium">{user.email}</p>
              </div>
            </div>
            <div className="flex items-center">
              <Phone className="h-5 w-5 text-gray-400 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Phone</p>
                <p className="font-medium">{profile?.phone || 'Not provided'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Car Listings */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Your Car Listings</h2>
          </div>

          {loading ? (
            <div className="p-6 text-center">
              <div className="animate-spin h-8 w-8 border-b-2 border-blue-600 rounded-full mx-auto"></div>
              <p className="text-gray-600 mt-2">Loading your listings...</p>
            </div>
          ) : cars.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {cars.map((car) => (
                <div key={car.car_id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="relative h-16 w-24 flex-shrink-0">
                        <Image
                          src={car.image_url || '/image1.png'}
                          alt={`${car.car_brands.brand_name} ${car.model}`}
                          fill
                          className="object-cover rounded-md"
                        />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {car.car_brands.brand_name} {car.model} ({car.year})
                        </h3>
                        <p className="text-sm text-gray-600 line-clamp-1">{car.description}</p>
                        <div className="flex items-center space-x-4 mt-1">
                          <span className="text-lg font-bold text-green-600">
                            {formatPrice(car.price)}
                          </span>
                          <span className="text-sm text-gray-500">
                            Listed {formatDate(car.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/cars/${car.car_id}`)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/cars/${car.car_id}/edit`)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        loading={deleting === car.car_id}
                        onClick={() => handleDeleteCar(car.car_id)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center">
              <CarIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No cars listed yet</h3>
              <p className="text-gray-600 mb-4">Start by listing your first car to reach potential buyers.</p>
              <Button onClick={() => router.push('/upload')}>
                <Plus className="h-4 w-4 mr-2" />
                List Your First Car
              </Button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
} 