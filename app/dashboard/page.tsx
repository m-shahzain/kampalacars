'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { Layout } from '@/components/Layout'
import { Button } from '@/components/ui/Button'
import { CarWithBrand } from '@/lib/types'
import { formatPrice, formatDate } from '@/lib/utils'
import { Plus, Edit, Trash2, Eye, User, Phone, Mail, Settings, Car as CarIcon, ImagePlus, X } from 'lucide-react'
import { fallbackToOriginalCarImage, getCarImageSources } from '@/lib/car-image'

export default function DashboardPage() {
  const [cars, setCars] = useState<CarWithBrand[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [editingProfile, setEditingProfile] = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileError, setProfileError] = useState('')
  const [profileForm, setProfileForm] = useState({ full_name: '', phone: '' })
  const [newProfilePicture, setNewProfilePicture] = useState<File | null>(null)
  const [profilePicturePreview, setProfilePicturePreview] = useState('')
  
  const { user, profile, updateProfile } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!user) {
      router.push('/auth/login')
    } else if (user.user_type === 'admin') {
      router.push('/admin')
    } else {
      fetchUserCars()
    }
  }, [user, router])

  const openProfileEditor = () => {
    setProfileForm({ full_name: user?.fullname || '', phone: user?.phone || '' })
    setNewProfilePicture(null)
    setProfilePicturePreview(user?.profile_picture_url || '')
    setProfileError('')
    setEditingProfile(true)
  }

  const handleProfilePictureChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 2 * 1024 * 1024) {
      setProfileError('Choose a JPG, PNG, or WebP image no larger than 2 MB.')
      event.target.value = ''
      return
    }

    setProfileError('')
    setNewProfilePicture(file)
    setProfilePicturePreview(URL.createObjectURL(file))
  }

  const handleProfileSave = async (event: React.FormEvent) => {
    event.preventDefault()
    setSavingProfile(true)
    setProfileError('')

    const { error } = await updateProfile(profileForm, newProfilePicture)
    if (error) setProfileError(error.message)
    else setEditingProfile(false)
    setSavingProfile(false)
  }

  const fetchUserCars = async () => {
    try {
      const response = await fetch('/api/cars?mine=true')
      const data = await response.json()
      
      if (response.ok) {
        setCars(data.cars)
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
          {user.user_type !== 'admin' && (
            <div className="mt-4 md:mt-0">
              <Button onClick={() => router.push('/upload')}>
                <Plus className="h-4 w-4 mr-2" />
                List New Car
              </Button>
            </div>
          )}
        </div>

        {/* Stats - only for sellers */}
        {user.user_type !== 'admin' && (
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
        )}

        {editingProfile && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <form onSubmit={handleProfileSave} className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Edit Profile</h2>
                <button type="button" onClick={() => setEditingProfile(false)} className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700" aria-label="Close profile editor">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mb-4 flex items-center gap-3">
                {profilePicturePreview ? (
                  <img src={profilePicturePreview} alt="Profile picture preview" className="h-16 w-16 rounded-full border border-gray-200 object-cover" />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                    <User className="h-7 w-7 text-gray-400" />
                  </div>
                )}
                <div>
                  <label htmlFor="editProfilePicture" className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                    <ImagePlus className="h-4 w-4" />
                    {profilePicturePreview ? 'Change picture' : 'Upload picture'}
                  </label>
                  <input id="editProfilePicture" type="file" accept="image/jpeg,image/png,image/webp" onChange={handleProfilePictureChange} className="sr-only" />
                  <p className="mt-1 text-xs text-gray-500">JPG, PNG, or WebP; max 2 MB.</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label htmlFor="profileFullName" className="mb-1 block text-sm font-medium text-gray-700">Name/Company</label>
                  <input id="profileFullName" required value={profileForm.full_name} onChange={(event) => setProfileForm({ ...profileForm, full_name: event.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label htmlFor="profilePhone" className="mb-1 block text-sm font-medium text-gray-700">Phone</label>
                  <input id="profilePhone" required type="tel" value={profileForm.phone} onChange={(event) => setProfileForm({ ...profileForm, phone: event.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>

              {profileError && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{profileError}</p>}

              <div className="mt-6 flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setEditingProfile(false)}>Cancel</Button>
                <Button type="submit" loading={savingProfile}>Save Changes</Button>
              </div>
            </form>
          </div>
        )}

        {/* Profile Section */}
        <div className="bg-white rounded-lg shadow mb-8 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Profile Information</h2>
            <Button variant="outline" size="sm" onClick={openProfileEditor}>
              <Settings className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center">
              {user.profile_picture_url ? (
                <img src={user.profile_picture_url} alt="Your display picture" className="mr-3 h-10 w-10 rounded-full object-cover" />
              ) : (
                <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
              )}
              <div>
                <p className="text-sm text-gray-600">Display Picture</p>
                <p className="font-medium">{user.profile_picture_url ? 'Added' : 'Not added'}</p>
              </div>
            </div>
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

        {/* Car Listings - only for sellers */}
        {user.user_type !== 'admin' ? (
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
                        <img
                          {...getCarImageSources(car.image_urls?.[0])}
                          src={getCarImageSources(car.image_urls?.[0])?.src || '/car-placeholder.svg'}
                          alt={`${car.car_brands.brand_name} ${car.model}`}
                          className="absolute inset-0 h-full w-full object-cover rounded-md"
                          loading="lazy"
                          onError={(event) => fallbackToOriginalCarImage(event, car.image_urls?.[0])}
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
                          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                            car.approval_status === 'approved' ? 'bg-green-100 text-green-800' :
                            car.approval_status === 'rejected' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {car.approval_status === 'approved' ? 'Approved' : car.approval_status === 'rejected' ? 'Rejected' : 'Pending approval'}
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
        ) : (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <CarIcon className="mx-auto h-12 w-12 text-gray-300 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">You&apos;re a Buyer</h2>
            <p className="text-gray-600 mb-6">Browse our listings to find your perfect car.</p>
            <Button onClick={() => router.push('/cars')}>
              Browse Cars
            </Button>
          </div>
        )}
      </div>
    </Layout>
  )
} 
