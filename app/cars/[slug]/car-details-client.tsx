'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Heart, Mail, Phone, Share2, User } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { fallbackToOriginalCarImage, getCarImageSources } from '@/lib/car-image'

export function CarGallery({ images, heading, isSold }: { images: string[]; heading: string; isSold: boolean }) {
  const [activeImage, setActiveImage] = useState(0)
  const activeCarImage = getCarImageSources(images[activeImage])

  return (
    <>
      <div className="relative aspect-[16/9] w-full mb-2 rounded-lg overflow-hidden bg-gray-100">
        <img
          src={activeCarImage?.src || '/car-placeholder.svg'}
          srcSet={activeCarImage?.srcSet}
          sizes={activeCarImage?.sizes}
          alt={images.length > 1 ? `${heading} – photo ${activeImage + 1} of ${images.length}` : heading}
          className="absolute inset-0 h-full w-full object-cover"
          fetchPriority="high"
          onError={(event) => fallbackToOriginalCarImage(event, images[activeImage])}
        />
        {isSold && (
          <div className="absolute top-3 left-3 rounded bg-red-600 px-3 py-1.5 text-sm font-semibold text-white">
            SOLD
          </div>
        )}
        {images.length > 1 && (
          <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
            {activeImage + 1} / {images.length}
          </div>
        )}
      </div>

      {images.length > 1 && (
        <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1">
          {images.map((url, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActiveImage(i)}
              aria-label={`Show photo ${i + 1}`}
              className={`relative w-16 h-12 rounded-md overflow-hidden shrink-0 border-2 transition-all ${
                i === activeImage ? 'border-brand' : 'border-transparent opacity-70 hover:opacity-100'
              }`}
            >
              <img
                {...getCarImageSources(url)}
                alt={`${heading} – photo ${i + 1}`}
                className="h-full w-full object-cover"
                loading="lazy"
                onError={(event) => fallbackToOriginalCarImage(event, url)}
              />
            </button>
          ))}
        </div>
      )}
    </>
  )
}

/** Share and like buttons; also counts the visit once the page opens. */
export function CarActions({ carId, shareText, likesCount, liked }: {
  carId: string
  shareText: string
  likesCount: number
  liked: boolean
}) {
  const [likes, setLikes] = useState({ count: likesCount, liked })
  const [liking, setLiking] = useState(false)

  useEffect(() => {
    void fetch(`/api/cars/${carId}/view`, { method: 'POST' })
  }, [carId])

  const handleLike = async () => {
    if (liking) return
    setLiking(true)
    try {
      const response = await fetch(`/api/cars/${carId}/like`, { method: 'POST' })
      const data = await response.json()
      if (response.ok) setLikes({ count: data.likes_count, liked: data.liked })
      else alert(data.error || 'Unable to update like')
    } catch {
      alert('Unable to update like')
    } finally {
      setLiking(false)
    }
  }

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href)
    alert('Link copied to clipboard!')
  }

  const handleShare = async () => {
    if (!navigator.share) return copyLink()
    try {
      await navigator.share({ title: document.title, text: shareText, url: window.location.href })
    } catch {
      copyLink()
    }
  }

  return (
    <div className="flex space-x-2 shrink-0">
      <Button variant="outline" size="sm" onClick={handleShare}>
        <Share2 className="h-4 w-4 mr-2" />
        Share
      </Button>
      <Button variant="outline" size="sm" onClick={handleLike} loading={liking} aria-pressed={likes.liked}>
        <Heart className={`h-4 w-4 mr-2 ${likes.liked ? 'fill-red-500 text-red-500' : ''}`} />
        {likes.count}
      </Button>
    </div>
  )
}

type Contact = { fullname: string; email: string; phone?: string | null; is_seller: boolean }

export function CarContactCard({ price, contact, sellerName, sellerPicture, sellerHref }: {
  price: string
  contact: Contact
  sellerName: string
  sellerPicture?: string | null
  sellerHref: string
}) {
  const [sellerImageError, setSellerImageError] = useState(false)
  const [showContactForm, setShowContactForm] = useState(false)
  const [contactForm, setContactForm] = useState({ name: '', email: '', phone: '', message: '' })
  const who = contact.is_seller ? 'Seller' : 'Kampala Cars'

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // In a real app, this would send an email or message to the seller
    alert('Message sent to seller successfully!')
    setShowContactForm(false)
    setContactForm({ name: '', email: '', phone: '', message: '' })
  }

  const inputClass = 'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gold-600'

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5 sticky top-4">
      <div className="text-center mb-4">
        <p className="text-2xl font-bold text-gray-900">{price}</p>
      </div>

      <div className="mb-4">
        <h2 className="text-sm font-semibold text-gray-900 mb-2">
          {contact.is_seller ? 'Seller Information' : 'Kampala Cars Contact'}
        </h2>
        <div className="flex items-center gap-3 mb-3">
          {contact.is_seller && sellerPicture && !sellerImageError ? (
            <Image
              src={sellerPicture}
              alt={`${sellerName}'s display picture`}
              width={80}
              height={80}
              className="h-20 w-20 rounded-full object-cover"
              onError={() => setSellerImageError(true)}
            />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-100">
              <User className="h-10 w-10 text-gray-400" />
            </div>
          )}
          <div>
            <p className="text-sm font-medium text-gray-900">{contact.fullname || 'Kampala Cars'}</p>
            <p className="text-xs text-gray-500">{contact.is_seller ? 'Seller' : 'Marketplace contact'}</p>
          </div>
        </div>
        <div className="space-y-2">
          {contact.email && (
            <div className="flex items-center">
              <Mail className="h-4 w-4 text-gray-400 mr-2" />
              <span className="text-sm">{contact.email}</span>
            </div>
          )}
          {contact.phone && (
            <div className="flex items-center">
              <Phone className="h-4 w-4 text-gray-400 mr-2" />
              <span className="text-sm">{contact.phone}</span>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <Button className="w-full" onClick={() => setShowContactForm(!showContactForm)}>
          <Mail className="h-4 w-4 mr-2" />
          Contact {who}
        </Button>
        {contact.phone && (
          <a href={`tel:${contact.phone}`} className="block">
            <Button variant="outline" className="w-full">
              <Phone className="h-4 w-4 mr-2" />
              Call {who}
            </Button>
          </a>
        )}
        <Link href={sellerHref} className="block pt-1 text-center text-sm font-medium text-gold-700 hover:text-gold-800">
          See all cars from {sellerName || 'this seller'} →
        </Link>
      </div>

      {showContactForm && (
        <form onSubmit={handleContactSubmit} className="mt-6 space-y-4 border-t pt-4">
          <input type="text" placeholder="Your Name" value={contactForm.name} required className={inputClass}
            onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })} />
          <input type="email" placeholder="Your Email" value={contactForm.email} required className={inputClass}
            onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })} />
          <input type="tel" placeholder="Your Phone (Optional)" value={contactForm.phone} className={inputClass}
            onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })} />
          <textarea placeholder="Your Message" rows={3} value={contactForm.message} required className={inputClass}
            onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })} />
          <Button type="submit" className="w-full">Send Message</Button>
        </form>
      )}
    </div>
  )
}
