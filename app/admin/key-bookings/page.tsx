'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, KeyRound, Loader2, MapPin, Phone } from 'lucide-react'
import { Layout } from '@/components/Layout'
import { KeyDesignArt } from '@/components/KeyDesignArt'
import { useAuth } from '@/lib/auth-context'
import { cn } from '@/lib/utils'
import {
  BOOKING_STATUSES,
  KEY_DESIGNS,
  KEY_SERVICES,
  SERVICE_LOCATIONS,
  TIME_SLOTS,
  labelOf,
  type BookingStatus,
  type KeyBooking,
} from '@/lib/key-service'

const STATUS_STYLES: Record<BookingStatus, string> = {
  new: 'bg-gold-100 text-gold-800 border-gold-200',
  confirmed: 'bg-blue-50 text-blue-700 border-blue-200',
  completed: 'bg-green-50 text-green-700 border-green-200',
  cancelled: 'bg-gray-100 text-gray-500 border-gray-200',
}

const FILTERS: { id: BookingStatus | 'all'; name: string }[] = [
  { id: 'all', name: 'All' },
  { id: 'new', name: 'New' },
  { id: 'confirmed', name: 'Confirmed' },
  { id: 'completed', name: 'Completed' },
  { id: 'cancelled', name: 'Cancelled' },
]

function formatDay(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
}

/** "0772 123 456" -> "256772123456", for WhatsApp links. */
function whatsappNumber(phone: string) {
  const digits = phone.replace(/\D/g, '')
  return digits.startsWith('0') ? `256${digits.slice(1)}` : digits
}

export default function AdminKeyBookingsPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [bookings, setBookings] = useState<KeyBooking[]>([])
  const [filter, setFilter] = useState<BookingStatus | 'all'>('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updating, setUpdating] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch(`/api/admin/key-bookings${filter === 'all' ? '' : `?status=${filter}`}`)
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Could not load bookings.')
      setBookings(data.bookings)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load bookings.')
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => {
    if (authLoading) return
    if (!user) return router.push('/auth/login')
    if (user.user_type !== 'admin') return router.push('/')
    load()
  }, [user, authLoading, router, load])

  const setStatus = async (booking: KeyBooking, status: BookingStatus) => {
    setUpdating(booking.booking_id)
    try {
      const response = await fetch('/api/admin/key-bookings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ booking_id: booking.booking_id, status }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error)
      setBookings((current) =>
        filter === 'all' || filter === status
          ? current.map((item) => (item.booking_id === booking.booking_id ? { ...item, status } : item))
          : current.filter((item) => item.booking_id !== booking.booking_id)
      )
    } catch (err) {
      alert(err instanceof Error && err.message ? err.message : 'Could not update the booking.')
    } finally {
      setUpdating(null)
    }
  }

  if (authLoading || !user || user.user_type !== 'admin') return null

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <Link href="/admin" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-900 mb-4">
          <ArrowLeft className="h-4 w-4 mr-1" /> Admin dashboard
        </Link>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center">
          <KeyRound className="h-7 w-7 text-gold-700 mr-3" /> Key service bookings
        </h1>

        <div className="mt-6 flex flex-wrap gap-2">
          {FILTERS.map((item) => (
            <button
              key={item.id}
              onClick={() => setFilter(item.id)}
              className={cn('rounded-full border px-3 py-1.5 text-sm', filter === item.id ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-300 text-gray-700 hover:bg-gray-50')}
            >
              {item.name}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-500">
            <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading bookings...
          </div>
        ) : error ? (
          <p className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p>
        ) : bookings.length === 0 ? (
          <p className="mt-6 rounded-lg border border-gray-200 bg-gray-50 p-8 text-center text-sm text-gray-500">No bookings here yet.</p>
        ) : (
          <ul className="mt-6 grid gap-4 lg:grid-cols-2">
            {bookings.map((booking) => {
              const car = [booking.car_year, booking.car_make, booking.car_model].filter(Boolean).join(' ')
              return (
                <li key={booking.booking_id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                  <div className="flex items-start gap-3">
                    <span className="flex h-14 w-24 shrink-0 items-center justify-center rounded-lg bg-gray-50">
                      <KeyDesignArt design={booking.key_type} className="h-12 w-full" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-semibold text-gray-900">{booking.full_name}</p>
                        <span className={cn('shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium capitalize', STATUS_STYLES[booking.status])}>{booking.status}</span>
                      </div>
                      <p className="text-sm text-gray-700">{car}</p>
                      <p className="text-sm text-gray-500">
                        {labelOf(KEY_DESIGNS, booking.key_type)} · {labelOf(KEY_SERVICES, booking.service_type)}
                      </p>
                    </div>
                  </div>

                  <dl className="mt-3 grid gap-1 text-sm">
                    <div className="flex gap-2"><dt className="text-gray-500 w-14 shrink-0">When</dt><dd className="text-gray-900">{formatDay(booking.preferred_date)}, {labelOf(TIME_SLOTS, booking.preferred_time)}</dd></div>
                    <div className="flex gap-2">
                      <dt className="text-gray-500 w-14 shrink-0">Where</dt>
                      <dd className="text-gray-900 flex items-start gap-1">
                        {booking.service_location === 'mobile' && <MapPin className="h-4 w-4 mt-0.5 text-gray-400 shrink-0" />}
                        {booking.service_location === 'mobile' ? booking.area : labelOf(SERVICE_LOCATIONS, booking.service_location)}
                      </dd>
                    </div>
                    {booking.notes && <div className="flex gap-2"><dt className="text-gray-500 w-14 shrink-0">Notes</dt><dd className="text-gray-900 whitespace-pre-line">{booking.notes}</dd></div>}
                    <div className="flex gap-2"><dt className="text-gray-500 w-14 shrink-0">Booked</dt><dd className="text-gray-500">{new Date(booking.created_at).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}</dd></div>
                  </dl>

                  <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-gray-100 pt-3">
                    <a href={`tel:${booking.phone.replace(/[^\d+]/g, '')}`} className="inline-flex items-center rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50">
                      <Phone className="h-4 w-4 mr-1.5" /> {booking.phone}
                    </a>
                    <a href={`https://wa.me/${whatsappNumber(booking.phone)}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center rounded-lg bg-[#25D366] px-3 py-1.5 text-sm text-white hover:bg-[#20bd5a]">
                      WhatsApp
                    </a>
                    <label className="ml-auto flex items-center gap-2 text-sm text-gray-500">
                      Status
                      <select
                        value={booking.status}
                        disabled={updating === booking.booking_id}
                        onChange={(e) => setStatus(booking, e.target.value as BookingStatus)}
                        className="h-9 rounded-lg border border-gray-300 bg-white px-2 text-sm text-gray-900 capitalize focus:outline-none focus:ring-2 focus:ring-gold-600"
                      >
                        {BOOKING_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
                      </select>
                    </label>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </Layout>
  )
}
