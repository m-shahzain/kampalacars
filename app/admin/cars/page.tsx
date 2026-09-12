'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { Layout } from '@/components/Layout'
import { Button } from '@/components/ui/Button'
import { CarWithBrand } from '@/lib/types'
import { 
  Car, 
  Search, 
  Edit, 
  Trash2, 
  Filter,
  ChevronLeft,
  ChevronRight,
  Eye,
  CheckCircle,
  XCircle,
  DollarSign
} from 'lucide-react'
import { formatPrice, formatDate } from '@/lib/utils'
import Link from 'next/link'
import Image from 'next/image'

interface CarsPagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

interface EditCarForm {
  car_id: string
  title: string
  model: string
  year: number
  price: number
  body_type: string
  fuel_type: string
  transmission: string
  mileage: number | null
  color: string
  engine_size: string
  description: string
  is_sold: boolean
}

export default function AdminCarsPage() {
  const [cars, setCars] = useState<CarWithBrand[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [updating, setUpdating] = useState<string | null>(null)
  const [editing, setEditing] = useState<EditCarForm | null>(null)
  const [saving, setSaving] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [brandFilter, setBrandFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [approvalFilter, setApprovalFilter] = useState('')
  const [pagination, setPagination] = useState<CarsPagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  })
  
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

    fetchCars()
  }, [user, router, pagination.page, searchQuery, brandFilter, statusFilter, approvalFilter])

  const fetchCars = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(searchQuery && { search: searchQuery }),
        ...(brandFilter && { brand_id: brandFilter }),
        ...(statusFilter && { is_sold: statusFilter }),
        ...(approvalFilter && { approval_status: approvalFilter })
      })

      const response = await fetch(`/api/admin/cars?${params}`)
      const data = await response.json()
      
      if (response.ok) {
        setCars(data.cars)
        setPagination(data.pagination)
      } else {
        alert(data.error || 'Failed to fetch cars')
      }
    } catch (error) {
      alert('Error loading cars')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPagination(prev => ({ ...prev, page: 1 }))
    fetchCars()
  }

  const handleDeleteCar = async (carId: string) => {
    if (!confirm('Are you sure you want to delete this car listing? This action cannot be undone.')) {
      return
    }

    setDeleting(carId)
    try {
      const response = await fetch(`/api/admin/cars?car_id=${carId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setCars(cars.filter(car => car.car_id !== carId))
        setPagination(prev => ({ ...prev, total: prev.total - 1 }))
      } else {
        const { error } = await response.json()
        alert(error || 'Failed to delete car')
      }
    } catch (error) {
      alert('Error deleting car')
    } finally {
      setDeleting(null)
    }
  }

  const handleToggleSoldStatus = async (car: CarWithBrand) => {
    setUpdating(car.car_id)
    try {
      const response = await fetch('/api/admin/cars', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          car_id: car.car_id,
          is_sold: !car.is_sold
        })
      })

      if (response.ok) {
        const { car: updatedCar } = await response.json()
        setCars(cars.map(c => c.car_id === updatedCar.car_id ? updatedCar : c))
      } else {
        const { error } = await response.json()
        alert(error || 'Failed to update car status')
      }
    } catch (error) {
      alert('Error updating car status')
    } finally {
      setUpdating(null)
    }
  }

  const handleApproval = async (car: CarWithBrand, approval_status: 'approved' | 'rejected') => {
    setUpdating(car.car_id)
    try {
      const response = await fetch('/api/admin/cars', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ car_id: car.car_id, approval_status })
      })
      const data = await response.json()
      if (response.ok) setCars(cars.map(c => c.car_id === data.car.car_id ? data.car : c))
      else alert(data.error || 'Failed to update approval')
    } catch {
      alert('Error updating approval')
    } finally { setUpdating(null) }
  }

  const openEditModal = (car: CarWithBrand) => {
    setEditing({
      car_id: car.car_id,
      title: car.title,
      model: car.model,
      year: car.year,
      price: car.price,
      body_type: car.body_type,
      fuel_type: car.fuel_type,
      transmission: car.transmission,
      mileage: car.mileage ?? null,
      color: car.color || '',
      engine_size: car.engine_size || '',
      description: car.description || '',
      is_sold: car.is_sold,
    })
  }

  const handleEditCar = async () => {
    if (!editing) return
    setSaving(true)
    try {
      const response = await fetch('/api/admin/cars', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editing),
      })

      if (response.ok) {
        const { car: updatedCar } = await response.json()
        setCars(cars.map(c => c.car_id === updatedCar.car_id ? updatedCar : c))
        setEditing(null)
      } else {
        const { error } = await response.json()
        alert(error || 'Failed to update car')
      }
    } catch {
      alert('Error updating car')
    } finally {
      setSaving(false)
    }
  }

  if (!user || user.user_type !== 'admin') {
    return null
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <Link href="/admin">
                <Button variant="outline" size="sm">
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Back to Dashboard
                </Button>
              </Link>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <Car className="h-8 w-8 text-blue-600 mr-3" />
              Car Management
            </h1>
            <p className="text-gray-600 mt-1">Manage all car listings</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <form onSubmit={handleSearch} className="flex-1">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search cars by title, model, or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
            </form>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Status</option>
              <option value="false">Available</option>
              <option value="true">Sold</option>
            </select>
            <select
              value={approvalFilter}
              onChange={(e) => setApprovalFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All approvals</option>
              <option value="pending">Pending approval</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>

            <Button type="submit" onClick={handleSearch}>
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
          </div>
        </div>

        {/* Cars Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Car Listings ({pagination.total})
              </h2>
            </div>
          </div>

          {loading ? (
            <div className="p-6 text-center">
              <div className="animate-spin h-8 w-8 border-b-2 border-blue-600 rounded-full mx-auto"></div>
              <p className="text-gray-600 mt-2">Loading cars...</p>
            </div>
          ) : cars.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Car
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Details
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Seller
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Price
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Listed
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {cars.map((car) => (
                      <tr key={car.car_id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-16 w-24">
                              <Image
                                src={car.image_urls?.[0] || '/car-placeholder.svg'}
                                alt={`${car.car_brands.brand_name} ${car.model}`}
                                width={96}
                                height={64}
                                className="h-16 w-24 rounded-md object-cover"
                              />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {car.title}
                              </div>
                              <div className="text-sm text-gray-500">
                                {car.car_brands.brand_name} {car.model} ({car.year})
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            <div>{car.body_type} • {car.fuel_type}</div>
                            <div className="text-gray-500">{car.transmission}</div>
                            {car.mileage && (
                              <div className="text-gray-500">{car.mileage.toLocaleString()} km</div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            <div>{car.users.fullname}</div>
                            <div className="text-gray-500">{car.users.email}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-green-600">
                            {formatPrice(car.price)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            car.is_sold 
                              ? 'bg-red-100 text-red-800'
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {car.is_sold ? (
                              <>
                                <XCircle className="h-3 w-3 mr-1" />
                                Sold
                              </>
                            ) : (
                              <>
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Available
                              </>
                            )}
                          </span>
                          <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            car.approval_status === 'approved' ? 'bg-green-100 text-green-800' : car.approval_status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {car.approval_status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(car.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            {car.approval_status === 'pending' && (
                              <>
                                <Button size="sm" loading={updating === car.car_id} onClick={() => handleApproval(car, 'approved')}>Approve</Button>
                                <Button variant="outline" size="sm" loading={updating === car.car_id} onClick={() => handleApproval(car, 'rejected')}>Reject</Button>
                              </>
                            )}
                            <Link href={`/cars/${car.car_id}`}>
                              <Button variant="outline" size="sm">
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </Button>
                            </Link>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditModal(car)}
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              loading={updating === car.car_id}
                              onClick={() => handleToggleSoldStatus(car)}
                            >
                              {car.is_sold ? (
                                <>
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Mark Available
                                </>
                              ) : (
                                <>
                                  <XCircle className="h-4 w-4 mr-1" />
                                  Mark Sold
                                </>
                              )}
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
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="px-6 py-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                    {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                    {pagination.total} cars
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.page === 1}
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </Button>
                    <span className="px-3 py-1 bg-gray-100 rounded text-sm font-medium">
                      {pagination.page} of {pagination.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.page === pagination.totalPages}
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="p-6 text-center">
              <Car className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No cars found</h3>
              <p className="text-gray-500">Try adjusting your search or filter criteria.</p>
            </div>
          )}
        </div>
      </div>

      {editing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit Car Listing</h3>
            <form onSubmit={(e) => { e.preventDefault(); handleEditCar() }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input
                    type="text"
                    value={editing.title}
                    onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
                  <input
                    type="text"
                    value={editing.model}
                    onChange={(e) => setEditing({ ...editing, model: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                  <input
                    type="number"
                    value={editing.year}
                    onChange={(e) => setEditing({ ...editing, year: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price (UGX)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editing.price}
                    onChange={(e) => setEditing({ ...editing, price: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mileage (km)</label>
                  <input
                    type="number"
                    value={editing.mileage ?? ''}
                    onChange={(e) => setEditing({ ...editing, mileage: e.target.value ? parseInt(e.target.value) : null })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Body Type</label>
                  <select
                    value={editing.body_type}
                    onChange={(e) => setEditing({ ...editing, body_type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fuel Type</label>
                  <select
                    value={editing.fuel_type}
                    onChange={(e) => setEditing({ ...editing, fuel_type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="gasoline">Gasoline</option>
                    <option value="diesel">Diesel</option>
                    <option value="electric">Electric</option>
                    <option value="hybrid">Hybrid</option>
                    <option value="cng">CNG</option>
                    <option value="lpg">LPG</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Transmission</label>
                  <select
                    value={editing.transmission}
                    onChange={(e) => setEditing({ ...editing, transmission: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="automatic">Automatic</option>
                    <option value="manual">Manual</option>
                    <option value="cvt">CVT</option>
                    <option value="semi-automatic">Semi-Automatic</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                  <input
                    type="text"
                    value={editing.color}
                    onChange={(e) => setEditing({ ...editing, color: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Engine Size</label>
                  <input
                    type="text"
                    value={editing.engine_size}
                    onChange={(e) => setEditing({ ...editing, engine_size: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={editing.is_sold ? 'sold' : 'available'}
                    onChange={(e) => setEditing({ ...editing, is_sold: e.target.value === 'sold' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="available">Available</option>
                    <option value="sold">Sold</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={editing.description}
                    onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <Button type="button" variant="outline" onClick={() => setEditing(null)}>
                  Cancel
                </Button>
                <Button type="submit" loading={saving}>
                  Save Changes
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  )
} 
