'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Layout } from '@/components/Layout'
import { Button } from '@/components/ui/Button'
import { CarWithBrand } from '@/lib/supabase'
import { formatPrice, formatDate } from '@/lib/utils'
import { Calendar, DollarSign, User, Phone, Mail, ArrowLeft, Heart, Share2 } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

export default function CarDetailsPage() {
  const [car, setCar] = useState<CarWithBrand | null>(null)
  const [loading, setLoading] = useState(true)
  const [showContactForm, setShowContactForm] = useState(false)
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  })
  
  const params = useParams()
  const carId = params.id as string

  useEffect(() => {
    fetchCarDetails()
  }, [carId])

  const fetchCarDetails = async () => {
    try {
      const response = await fetch(`/api/cars/${carId}`)
      const data = await response.json()
      
      if (response.ok) {
        setCar(data.car)
      } else {
        console.error('Car not found')
      }
    } catch (error) {
      console.error('Error fetching car:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // In a real app, this would send an email or message to the seller
    alert('Message sent to seller successfully!')
    setShowContactForm(false)
    setContactForm({ name: '', email: '', phone: '', message: '' })
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${car?.car_brands.brand_name} ${car?.model}`,
          text: `Check out this ${car?.car_brands.brand_name} ${car?.model} for ${formatPrice(car?.price || 0)}`,
          url: window.location.href,
        })
      } catch (error) {
        // Fallback to copying to clipboard
        navigator.clipboard.writeText(window.location.href)
        alert('Link copied to clipboard!')
      }
    } else {
      // Fallback to copying to clipboard
      navigator.clipboard.writeText(window.location.href)
      alert('Link copied to clipboard!')
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-1/4 mb-4"></div>
            <div className="h-64 bg-gray-300 rounded mb-4"></div>
            <div className="h-4 bg-gray-300 rounded w-1/3 mb-2"></div>
            <div className="h-4 bg-gray-300 rounded w-1/2"></div>
          </div>
        </div>
      </Layout>
    )
  }

  if (!car) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Car Not Found</h1>
          <p className="text-gray-600 mb-4">The car you're looking for doesn't exist.</p>
          <Link href="/">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <div className="mb-6">
          <Link href="/">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Listings
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Car Image */}
            <div className="relative h-96 w-full mb-6">
              <Image
                src={car.image_url || '/image1.png'}
                alt={`${car.car_brands.brand_name} ${car.model}`}
                fill
                className="object-cover rounded-lg"
                priority
              />
            </div>

            {/* Car Details */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-3xl font-bold text-gray-900">
                  {car.car_brands.brand_name} {car.model}
                </h1>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" onClick={handleShare}>
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                  <Button variant="outline" size="sm">
                    <Heart className="h-4 w-4 mr-2" />
                    Save
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <Calendar className="h-6 w-6 mx-auto text-blue-600 mb-2" />
                  <p className="text-sm text-gray-600">Year</p>
                  <p className="font-semibold">{car.year}</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <DollarSign className="h-6 w-6 mx-auto text-green-600 mb-2" />
                  <p className="text-sm text-gray-600">Price</p>
                  <p className="font-semibold text-green-600">{formatPrice(car.price)}</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <Calendar className="h-6 w-6 mx-auto text-purple-600 mb-2" />
                  <p className="text-sm text-gray-600">Listed</p>
                  <p className="font-semibold">{formatDate(car.created_at)}</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <User className="h-6 w-6 mx-auto text-orange-600 mb-2" />
                  <p className="text-sm text-gray-600">Seller</p>
                  <p className="font-semibold text-sm">{car.users?.fullname || 'Private'}</p>
                </div>
              </div>

              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">Description</h2>
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {car.description}
                </p>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Price & Contact */}
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
              <div className="text-center mb-6">
                <p className="text-3xl font-bold text-green-600">
                  {formatPrice(car.price)}
                </p>
              </div>

              {/* Seller Info */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">Seller Information</h3>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <User className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-sm">{car.users?.fullname || car.users?.email}</span>
                  </div>
                  <div className="flex items-center">
                    <Mail className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-sm">{car.users?.email}</span>
                  </div>
                  {car.users?.phone && (
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm">{car.users.phone}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Contact Buttons */}
              <div className="space-y-3">
                <Button
                  className="w-full"
                  onClick={() => setShowContactForm(!showContactForm)}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Contact Seller
                </Button>
                {car.users?.phone && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => window.open(`tel:${car.users?.phone}`)}
                  >
                    <Phone className="h-4 w-4 mr-2" />
                    Call Seller
                  </Button>
                )}
              </div>

              {/* Contact Form */}
              {showContactForm && (
                <form onSubmit={handleContactSubmit} className="mt-6 space-y-4 border-t pt-4">
                  <div>
                    <input
                      type="text"
                      placeholder="Your Name"
                      value={contactForm.name}
                      onChange={(e) => setContactForm({...contactForm, name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <input
                      type="email"
                      placeholder="Your Email"
                      value={contactForm.email}
                      onChange={(e) => setContactForm({...contactForm, email: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <input
                      type="tel"
                      placeholder="Your Phone (Optional)"
                      value={contactForm.phone}
                      onChange={(e) => setContactForm({...contactForm, phone: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <textarea
                      placeholder="Your Message"
                      rows={3}
                      value={contactForm.message}
                      onChange={(e) => setContactForm({...contactForm, message: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full">
                    Send Message
                  </Button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
} 