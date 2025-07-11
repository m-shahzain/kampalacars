'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { Layout } from '@/components/Layout'
import { Button } from '@/components/ui/Button'
import { 
  Users, 
  Car, 
  TrendingUp, 
  DollarSign, 
  UserPlus, 
  CarIcon,
  Shield,
  Activity,
  ChevronRight,
  Settings
} from 'lucide-react'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'

interface AdminStats {
  totalUsers: number
  totalCars: number
  activeCars: number
  soldCars: number
  usersByType: {
    sellers: number
    buyers: number
    admins: number
  }
  thisWeek: {
    newUsers: number
    newCars: number
  }
  topBrands: Array<{ brand_name: string; count: number }>
  recentActivity: {
    cars: Array<{
      car_id: string
      title: string
      created_at: string
      car_brands: { brand_name: string }
      users: { fullname: string }
    }>
    users: Array<{
      user_id: string
      fullname: string
      email: string
      user_type: string
      created_at: string
    }>
  }
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!user) {
      router.push('/auth/login')
      return
    }
    
    if (user.user_type !== 'admin') {
      router.push('/')
      return
    }

    fetchStats()
  }, [user, router])

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/stats')
      const data = await response.json()
      
      if (response.ok) {
        setStats(data)
      } else {
        setError(data.error || 'Failed to fetch statistics')
      }
    } catch (error) {
      setError('Error loading dashboard data')
    } finally {
      setLoading(false)
    }
  }

  if (!user || user.user_type !== 'admin') {
    return null
  }

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-300 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-300 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  if (error) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
            <p className="text-gray-600">{error}</p>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <Shield className="h-8 w-8 text-blue-600 mr-3" />
              Admin Dashboard
            </h1>
            <p className="text-gray-600 mt-1">Manage your car marketplace</p>
          </div>
          <div className="mt-4 md:mt-0 flex space-x-3">
            <Link href="/admin/users">
              <Button variant="outline">
                <Users className="h-4 w-4 mr-2" />
                Manage Users
              </Button>
            </Link>
            <Link href="/admin/cars">
              <Button variant="outline">
                <Car className="h-4 w-4 mr-2" />
                Manage Cars
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-md">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.totalUsers}</p>
                <p className="text-sm text-green-600">+{stats?.thisWeek.newUsers} this week</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-md">
                <Car className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Cars</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.totalCars}</p>
                <p className="text-sm text-green-600">+{stats?.thisWeek.newCars} this week</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-md">
                <TrendingUp className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Listings</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.activeCars}</p>
                <p className="text-sm text-gray-500">{stats?.soldCars} sold</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-md">
                <Activity className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">User Types</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.usersByType.sellers}</p>
                <p className="text-sm text-gray-500">
                  {stats?.usersByType.buyers} buyers, {stats?.usersByType.admins} admins
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Top Brands */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Top Car Brands</h2>
            </div>
            <div className="p-6">
              {stats?.topBrands.length ? (
                <div className="space-y-4">
                  {stats.topBrands.map((brand, index) => (
                    <div key={brand.brand_name} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-sm mr-3">
                          {index + 1}
                        </div>
                        <span className="font-medium text-gray-900">{brand.brand_name}</span>
                      </div>
                      <span className="text-gray-600 font-medium">{brand.count} cars</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No data available</p>
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
            </div>
            <div className="p-6">
              <div className="space-y-6">
                {/* Recent Cars */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Latest Car Listings</h3>
                  <div className="space-y-3">
                    {stats?.recentActivity.cars.slice(0, 3).map((car) => (
                      <div key={car.car_id} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <CarIcon className="h-4 w-4 text-gray-400 mr-2" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">{car.title}</p>
                            <p className="text-xs text-gray-500">by {car.users.fullname}</p>
                          </div>
                        </div>
                        <span className="text-xs text-gray-500">
                          {formatDate(car.created_at)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Users */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">New Users</h3>
                  <div className="space-y-3">
                    {stats?.recentActivity.users.slice(0, 3).map((user) => (
                      <div key={user.user_id} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <UserPlus className="h-4 w-4 text-gray-400 mr-2" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">{user.fullname}</p>
                            <p className="text-xs text-gray-500 capitalize">{user.user_type}</p>
                          </div>
                        </div>
                        <span className="text-xs text-gray-500">
                          {formatDate(user.created_at)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/admin/users">
              <div className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Users className="h-5 w-5 text-blue-600 mr-3" />
                    <span className="font-medium text-gray-900">Manage Users</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                </div>
                <p className="text-sm text-gray-500 mt-1">View and edit user accounts</p>
              </div>
            </Link>

            <Link href="/admin/cars">
              <div className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Car className="h-5 w-5 text-green-600 mr-3" />
                    <span className="font-medium text-gray-900">Manage Cars</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                </div>
                <p className="text-sm text-gray-500 mt-1">Review and moderate listings</p>
              </div>
            </Link>

            <Link href="/brands">
              <div className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Settings className="h-5 w-5 text-purple-600 mr-3" />
                    <span className="font-medium text-gray-900">Manage Brands</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                </div>
                <p className="text-sm text-gray-500 mt-1">Add and edit car brands</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  )
} 