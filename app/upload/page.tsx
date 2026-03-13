'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { Layout } from '@/components/Layout'
import { Button } from '@/components/ui/Button'
import { CarBrand } from '@/lib/types'
import { Upload, DollarSign, Car, FileText, Calendar, AlertCircle, CheckCircle } from 'lucide-react'

export default function UploadPage() {
  const [brands, setBrands] = useState<CarBrand[]>([])
  const [formData, setFormData] = useState({
    brand_id: '',
    model: '',
    title: '',
    description: '',
    body_type: '',
    fuel_type: '',
    year: new Date().getFullYear(),
    price: '',
    mileage: '',
    color: '',
    engine_size: '',
    transmission: '',
    features: ''
  })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!user) {
      router.push('/auth/login')
    } else {
      fetchBrands()
    }
  }, [user, router])

  const fetchBrands = async () => {
    try {
      const response = await fetch('/api/brands')
      const data = await response.json()
      if (response.ok) {
        setBrands(data.brands)
      }
    } catch (error) {
      console.error('Error fetching brands:', error)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const uploadImage = async (): Promise<string> => {
    if (!imageFile) throw new Error('No image selected')
    
    setUploading(true)
    const formDataImage = new FormData()
    formDataImage.append('file', imageFile)
    
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formDataImage
    })
    
    if (!response.ok) {
      const { error } = await response.json()
      throw new Error(error)
    }
    
    const { url } = await response.json()
    setUploading(false)
    return url
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess(false)

    try {
      let imageUrl = ''
      if (imageFile) {
        imageUrl = await uploadImage()
      }

      const response = await fetch('/api/cars', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          brand_id: formData.brand_id,
          model: formData.model,
          title: formData.title,
          description: formData.description,
          body_type: formData.body_type,
          fuel_type: formData.fuel_type,
          year: parseInt(formData.year.toString()),
          price: parseFloat(formData.price),
          currency: 'USD',
          mileage: formData.mileage ? parseInt(formData.mileage) : null,
          color: formData.color || null,
          engine_size: formData.engine_size || null,
          transmission: formData.transmission,
          features: formData.features || null,
          image_url: imageUrl
        })
      })

      if (response.ok) {
        setSuccess(true)
        setTimeout(() => {
          router.push('/dashboard')
        }, 2000)
      } else {
        const { error } = await response.json()
        setError(error)
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return null // Loading or redirect
  }

  if (success) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center py-12 px-4">
          <div className="max-w-md w-full text-center">
            <div className="rounded-md bg-green-50 p-4">
              <div className="flex justify-center">
                <CheckCircle className="h-12 w-12 text-green-400" />
              </div>
              <div className="mt-3">
                <h3 className="text-lg font-medium text-green-800">
                  Car listed successfully!
                </h3>
                <div className="mt-2 text-sm text-green-700">
                  <p>Your car is now live on the marketplace. Redirecting to dashboard...</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <Car className="mx-auto h-12 w-12 text-blue-600 mb-4" />
            <h1 className="text-3xl font-bold text-gray-900">Sell Your Car</h1>
            <p className="text-gray-600 mt-2">List your car on Kampala Cars marketplace</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 bg-white rounded-lg shadow-md p-6">
            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Car Images *
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                {imagePreview ? (
                  <div className="space-y-4">
                    <img 
                      src={imagePreview} 
                      alt="Preview" 
                      className="mx-auto h-48 w-auto rounded-lg object-cover"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setImageFile(null)
                        setImagePreview('')
                      }}
                    >
                      Remove Image
                    </Button>
                  </div>
                ) : (
                  <div>
                    <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">Upload a photo of your car</p>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        required
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Basic Car Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="brand_id" className="block text-sm font-medium text-gray-700 mb-1">
                  Brand *
                </label>
                <select
                  id="brand_id"
                  name="brand_id"
                  required
                  value={formData.brand_id}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a brand</option>
                  {brands.map((brand) => (
                    <option key={brand.brand_id} value={brand.brand_id}>
                      {brand.brand_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="model" className="block text-sm font-medium text-gray-700 mb-1">
                  Model *
                </label>
                <input
                  type="text"
                  id="model"
                  name="model"
                  required
                  value={formData.model}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Camry"
                />
              </div>
            </div>

            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Listing Title *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                required
                value={formData.title}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 2020 Toyota Camry - Excellent Condition"
              />
            </div>

            {/* Car Specifications */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="body_type" className="block text-sm font-medium text-gray-700 mb-1">
                  Body Type *
                </label>
                <select
                  id="body_type"
                  name="body_type"
                  required
                  value={formData.body_type}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select body type</option>
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
                <label htmlFor="fuel_type" className="block text-sm font-medium text-gray-700 mb-1">
                  Fuel Type *
                </label>
                <select
                  id="fuel_type"
                  name="fuel_type"
                  required
                  value={formData.fuel_type}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select fuel type</option>
                  <option value="gasoline">Gasoline</option>
                  <option value="diesel">Diesel</option>
                  <option value="electric">Electric</option>
                  <option value="hybrid">Hybrid</option>
                  <option value="cng">CNG</option>
                  <option value="lpg">LPG</option>
                </select>
              </div>

              <div>
                <label htmlFor="transmission" className="block text-sm font-medium text-gray-700 mb-1">
                  Transmission *
                </label>
                <select
                  id="transmission"
                  name="transmission"
                  required
                  value={formData.transmission}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select transmission</option>
                  <option value="manual">Manual</option>
                  <option value="automatic">Automatic</option>
                  <option value="cvt">CVT</option>
                  <option value="semi-automatic">Semi-Automatic</option>
                </select>
              </div>

              <div>
                <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-1">
                  Year *
                </label>
                <select
                  id="year"
                  name="year"
                  required
                  value={formData.year}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {Array.from({ length: 30 }, (_, i) => new Date().getFullYear() - i).map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Price and Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                  Price (USD) *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <DollarSign className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="number"
                    id="price"
                    name="price"
                    min="0"
                    step="0.01"
                    required
                    value={formData.price}
                    onChange={handleChange}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="25000"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="mileage" className="block text-sm font-medium text-gray-700 mb-1">
                  Mileage (km)
                </label>
                <input
                  type="number"
                  id="mileage"
                  name="mileage"
                  min="0"
                  value={formData.mileage}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 50000"
                />
              </div>

              <div>
                <label htmlFor="color" className="block text-sm font-medium text-gray-700 mb-1">
                  Color
                </label>
                <input
                  type="text"
                  id="color"
                  name="color"
                  value={formData.color}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Red"
                />
              </div>

              <div>
                <label htmlFor="engine_size" className="block text-sm font-medium text-gray-700 mb-1">
                  Engine Size
                </label>
                <input
                  type="text"
                  id="engine_size"
                  name="engine_size"
                  value={formData.engine_size}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 2.0L"
                />
              </div>
            </div>

            <div>
              <label htmlFor="features" className="block text-sm font-medium text-gray-700 mb-1">
                Features
              </label>
              <input
                type="text"
                id="features"
                name="features"
                value={formData.features}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Leather seats, Sunroof, Navigation system"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description *
              </label>
              <textarea
                id="description"
                name="description"
                rows={4}
                required
                value={formData.description}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Describe your car's condition, maintenance history, and any additional details..."
              />
            </div>

            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertCircle className="h-5 w-5 text-red-400" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Error</h3>
                    <div className="mt-2 text-sm text-red-700">
                      <p>{error}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                loading={loading || uploading}
                size="lg"
              >
                {uploading ? 'Uploading Image...' : loading ? 'Listing Car...' : 'List Car'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  )
} 