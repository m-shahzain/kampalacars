'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { CalendarCheck, Car, CheckCircle2, KeyRound, Loader2, PhoneCall } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { KeyDesignArt } from '@/components/KeyDesignArt'
import { useAuth } from '@/lib/auth-context'
import { whatsappUrl } from '@/lib/contact'
import { cn } from '@/lib/utils'
import {
  KEY_DESIGNS,
  KEY_SERVICES,
  MAX_DAYS_AHEAD,
  SERVICE_LOCATIONS,
  TIME_SLOTS,
  kampalaToday,
  labelOf,
  validateBooking,
  type KeyBookingInput,
} from '@/lib/key-service'

const OTHER_MAKE = '__other__'

const EMPTY_FORM = {
  full_name: '',
  phone: '',
  car_make: '',
  other_make: '',
  car_model: '',
  car_year: '',
  key_type: '',
  service_type: '',
  preferred_date: '',
  preferred_time: '',
  service_location: 'workshop',
  area: '',
  notes: '',
  website: '',
}

const steps = [
  { icon: KeyRound, title: 'Choose your key', text: 'Pick the design that looks like your key.' },
  { icon: Car, title: 'Tell us about your car', text: 'Make, model and the service you need.' },
  { icon: PhoneCall, title: 'We call to confirm', text: 'We confirm the time and price by phone.' },
]

const inputClass =
  'w-full h-11 px-3 text-sm bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gold-600 focus:border-transparent'
const labelClass = 'block text-sm font-medium text-gray-700 mb-1'

export function KeyBookingClient({ makes }: { makes: string[] }) {
  const { user } = useAuth()
  const [form, setForm] = useState(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [booked, setBooked] = useState<KeyBookingInput | null>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const topRef = useRef<HTMLDivElement>(null)

  // Signed-in users get their name and phone filled in.
  useEffect(() => {
    if (!user) return
    setForm((current) => ({
      ...current,
      full_name: current.full_name || user.fullname || '',
      phone: current.phone || user.phone || '',
    }))
  }, [user])

  const update = (patch: Partial<typeof EMPTY_FORM>) => {
    setForm((current) => ({ ...current, ...patch }))
    setError('')
  }

  const chooseKey = (id: string) => {
    update({ key_type: id })
    // On phones the form is below the designs; bring it into view.
    if (window.matchMedia('(max-width: 767px)').matches) {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    const payload = { ...form, car_make: form.car_make === OTHER_MAKE ? form.other_make : form.car_make }

    // Same checks as the server, so mistakes show straight away.
    const result = validateBooking(payload)
    if ('error' in result) {
      setError(result.error)
      return
    }

    setSubmitting(true)
    setError('')
    try {
      const response = await fetch('/api/key-bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        setError(data.error || 'Could not save your booking. Please try again.')
        return
      }
      setBooked(result.booking)
      topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    } catch {
      setError('No connection. Please check your internet and try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (booked) {
    const car = [booked.car_year, booked.car_make, booked.car_model].filter(Boolean).join(' ')
    const date = new Date(`${booked.preferred_date}T12:00:00`).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })
    const message =
      `Hello Kampala Cars, I just booked a car key service.\n` +
      `Name: ${booked.full_name}\nCar: ${car}\nKey: ${labelOf(KEY_DESIGNS, booked.key_type)}\n` +
      `Service: ${labelOf(KEY_SERVICES, booked.service_type)}\nWhen: ${date}, ${labelOf(TIME_SLOTS, booked.preferred_time)}`

    return (
      <div ref={topRef} className="container mx-auto px-4 py-10">
        <div className="mx-auto max-w-lg rounded-2xl border border-gray-200 bg-white p-6 sm:p-8 text-center shadow-sm">
          <CheckCircle2 className="mx-auto h-12 w-12 text-green-600" />
          <h1 className="mt-4 text-2xl font-bold text-gray-900">Booking received</h1>
          <p className="mt-2 text-gray-600">
            Thank you, {booked.full_name.split(' ')[0]}. We will call you on <span className="font-medium text-gray-900">{booked.phone}</span> to confirm the time and price.
          </p>

          <dl className="mt-6 space-y-3 rounded-xl bg-gray-50 p-4 text-left text-sm">
            <div className="flex items-center gap-3">
              <KeyDesignArt design={booked.key_type} className="h-10 w-20 shrink-0" />
              <div>
                <dt className="sr-only">Key</dt>
                <dd className="font-medium text-gray-900">{labelOf(KEY_DESIGNS, booked.key_type)}</dd>
                <dd className="text-gray-500">{labelOf(KEY_SERVICES, booked.service_type)}</dd>
              </div>
            </div>
            <div className="flex justify-between gap-4"><dt className="text-gray-500">Car</dt><dd className="text-right font-medium text-gray-900">{car}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-gray-500">When</dt><dd className="text-right font-medium text-gray-900">{date}<br />{labelOf(TIME_SLOTS, booked.preferred_time)}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-gray-500">Where</dt><dd className="text-right font-medium text-gray-900">{booked.service_location === 'mobile' ? booked.area : labelOf(SERVICE_LOCATIONS, booked.service_location)}</dd></div>
          </dl>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <a href={whatsappUrl(message)} target="_blank" rel="noopener noreferrer">
              <Button className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white">Send on WhatsApp too</Button>
            </a>
            <Button variant="outline" onClick={() => { setBooked(null); setForm({ ...EMPTY_FORM, full_name: form.full_name, phone: form.phone }) }}>
              Book another key
            </Button>
          </div>
          <Link href="/" className="mt-4 inline-block text-sm text-gold-700 hover:underline">Back to cars</Link>
        </div>
      </div>
    )
  }

  return (
    <div ref={topRef} className="container mx-auto px-4 py-6 sm:py-10">
      {/* Intro */}
      <section className="mx-auto max-w-3xl text-center">
        <span className="inline-flex items-center gap-2 rounded-full bg-gold-50 border border-gold-200 px-3 py-1 text-xs font-medium text-gold-800">
          <KeyRound className="h-3.5 w-3.5" /> Car key service
        </span>
        <h1 className="mt-3 text-2xl md:text-3xl font-bold text-gray-900">Car keys made, copied and programmed</h1>
        <p className="mt-3 text-gray-600 text-sm sm:text-base">
          Spare keys, lost key replacement, remote and smart key programming for all makes. Book online and we will call you to confirm.
        </p>
      </section>

      <ol className="mx-auto mt-6 grid max-w-3xl gap-3 sm:grid-cols-3">
        {steps.map(({ icon: Icon, title, text }, index) => (
          <li key={title} className="flex items-start gap-3 rounded-xl border border-gray-200 bg-white p-3 sm:p-4">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gold-50">
              <Icon className="h-4 w-4 text-gold-700" />
            </span>
            <div>
              <p className="text-sm font-semibold text-gray-900">{index + 1}. {title}</p>
              <p className="text-xs text-gray-500">{text}</p>
            </div>
          </li>
        ))}
      </ol>

      <div className="mx-auto mt-8 grid max-w-5xl gap-8 md:grid-cols-[1fr_1.1fr] md:items-start">
        {/* Key designs */}
        <section aria-labelledby="key-designs">
          <h2 id="key-designs" className="text-lg font-semibold text-gray-900">1. Choose your key design</h2>
          <p className="mb-4 text-sm text-gray-500">Tap the one that looks most like your car key.</p>
          <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label="Key design">
            {KEY_DESIGNS.map((design) => {
              const selected = form.key_type === design.id
              return (
                <button
                  key={design.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => chooseKey(design.id)}
                  className={cn(
                    'relative flex flex-col rounded-xl border bg-white p-3 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-600',
                    selected ? 'border-gold-500 ring-2 ring-gold-400 bg-gold-50' : 'border-gray-200 hover:border-gold-200 hover:bg-gray-50'
                  )}
                >
                  {selected && <CheckCircle2 className="absolute right-2 top-2 h-5 w-5 text-gold-700" />}
                  <span className="flex h-20 items-center justify-center rounded-lg bg-gray-50">
                    <KeyDesignArt design={design.id} className="h-16 w-full" />
                  </span>
                  <span className="mt-2 text-sm font-semibold text-gray-900">{design.name}</span>
                  <span className="mt-0.5 text-xs leading-snug text-gray-500">{design.text}</span>
                </button>
              )
            })}
          </div>
        </section>

        {/* Booking form */}
        <form ref={formRef} onSubmit={submit} noValidate className="scroll-mt-4 rounded-2xl border border-gray-200 bg-white p-4 sm:p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <CalendarCheck className="h-5 w-5 text-gold-700" /> 2. Book an appointment
          </h2>
          {form.key_type ? (
            <p className="mt-1 text-sm text-gray-500">
              Key: <span className="font-medium text-gray-900">{labelOf(KEY_DESIGNS, form.key_type)}</span>
            </p>
          ) : (
            <p className="mt-1 text-sm text-gray-500">Choose your key design first.</p>
          )}

          {/* Hidden from people; catches bots. */}
          <input type="text" name="website" value={form.website} onChange={(e) => update({ website: e.target.value })} tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />

          <fieldset className="mt-5 space-y-4">
            <legend className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">Your details</legend>
            <div>
              <label htmlFor="full_name" className={labelClass}>Full name</label>
              <input id="full_name" autoComplete="name" value={form.full_name} onChange={(e) => update({ full_name: e.target.value })} className={inputClass} placeholder="e.g. John Mukasa" />
            </div>
            <div>
              <label htmlFor="phone" className={labelClass}>Phone number</label>
              <input id="phone" type="tel" inputMode="tel" autoComplete="tel" value={form.phone} onChange={(e) => update({ phone: e.target.value })} className={inputClass} placeholder="e.g. 0772 123 456" />
            </div>
          </fieldset>

          <fieldset className="mt-6 space-y-4">
            <legend className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">Your car</legend>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 sm:col-span-1">
                <label htmlFor="car_make" className={labelClass}>Make</label>
                <select id="car_make" value={form.car_make} onChange={(e) => update({ car_make: e.target.value })} className={inputClass}>
                  <option value="">Choose make</option>
                  {makes.map((make) => <option key={make} value={make}>{make}</option>)}
                  <option value={OTHER_MAKE}>Other</option>
                </select>
              </div>
              {form.car_make === OTHER_MAKE && (
                <div className="col-span-2 sm:col-span-1">
                  <label htmlFor="other_make" className={labelClass}>Which make?</label>
                  <input id="other_make" value={form.other_make} onChange={(e) => update({ other_make: e.target.value })} className={inputClass} placeholder="e.g. Isuzu" />
                </div>
              )}
              <div>
                <label htmlFor="car_model" className={labelClass}>Model</label>
                <input id="car_model" value={form.car_model} onChange={(e) => update({ car_model: e.target.value })} className={inputClass} placeholder="e.g. Harrier" />
              </div>
              <div>
                <label htmlFor="car_year" className={labelClass}>Year <span className="font-normal text-gray-400">(optional)</span></label>
                <input id="car_year" inputMode="numeric" maxLength={4} value={form.car_year} onChange={(e) => update({ car_year: e.target.value.replace(/\D/g, '') })} className={inputClass} placeholder="e.g. 2015" />
              </div>
            </div>
            <div>
              <label htmlFor="service_type" className={labelClass}>Service needed</label>
              <select id="service_type" value={form.service_type} onChange={(e) => update({ service_type: e.target.value })} className={inputClass}>
                <option value="">Choose service</option>
                {KEY_SERVICES.map((service) => <option key={service.id} value={service.id}>{service.name}</option>)}
              </select>
            </div>
          </fieldset>

          <fieldset className="mt-6 space-y-4">
            <legend className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">Appointment</legend>
            <div>
              <label htmlFor="preferred_date" className={labelClass}>Preferred date</label>
              <input id="preferred_date" type="date" min={kampalaToday()} max={kampalaToday(MAX_DAYS_AHEAD)} value={form.preferred_date} onChange={(e) => update({ preferred_date: e.target.value })} className={inputClass} />
            </div>
            <div>
              <span className={labelClass}>Preferred time</span>
              <div className="grid gap-2 sm:grid-cols-3" role="radiogroup" aria-label="Preferred time">
                {TIME_SLOTS.map((slot) => (
                  <label key={slot.id} className={cn('flex cursor-pointer items-center justify-center rounded-lg border px-2 py-2.5 text-center text-xs sm:text-sm transition-colors', form.preferred_time === slot.id ? 'border-gold-500 bg-gold-50 font-medium text-gray-900' : 'border-gray-300 text-gray-700 hover:bg-gray-50')}>
                    <input type="radio" name="preferred_time" value={slot.id} checked={form.preferred_time === slot.id} onChange={() => update({ preferred_time: slot.id })} className="sr-only" />
                    {slot.name}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <span className={labelClass}>Where should we do the work?</span>
              <div className="grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label="Service location">
                {SERVICE_LOCATIONS.map((place) => (
                  <label key={place.id} className={cn('flex cursor-pointer items-center justify-center rounded-lg border px-2 py-2.5 text-center text-sm transition-colors', form.service_location === place.id ? 'border-gold-500 bg-gold-50 font-medium text-gray-900' : 'border-gray-300 text-gray-700 hover:bg-gray-50')}>
                    <input type="radio" name="service_location" value={place.id} checked={form.service_location === place.id} onChange={() => update({ service_location: place.id })} className="sr-only" />
                    {place.name}
                  </label>
                ))}
              </div>
            </div>
            {form.service_location === 'mobile' && (
              <div>
                <label htmlFor="area" className={labelClass}>Your area or address</label>
                <input id="area" autoComplete="street-address" value={form.area} onChange={(e) => update({ area: e.target.value })} className={inputClass} placeholder="e.g. Ntinda, near Capital Shoppers" />
              </div>
            )}
            <div>
              <label htmlFor="notes" className={labelClass}>Anything else? <span className="font-normal text-gray-400">(optional)</span></label>
              <textarea id="notes" rows={3} maxLength={1000} value={form.notes} onChange={(e) => update({ notes: e.target.value })} className={cn(inputClass, 'h-auto py-2')} placeholder="e.g. I have one working key and need a spare" />
            </div>
          </fieldset>

          {error && (
            <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          )}

          <Button type="submit" disabled={submitting} className="mt-5 w-full h-12 text-base">
            {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Booking...</> : 'Book appointment'}
          </Button>
          <p className="mt-3 text-center text-xs text-gray-500">No payment now. We confirm the price when we call.</p>
        </form>
      </div>
    </div>
  )
}
