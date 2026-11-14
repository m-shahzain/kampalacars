// Car key service: the key designs, services and time slots a customer can book,
// shared by the booking page, the booking API and the admin page.

export const KEY_DESIGNS = [
  { id: 'standard', name: 'Standard key', text: 'Plain metal key, common on older cars.' },
  { id: 'transponder', name: 'Transponder key', text: 'Key with a security chip in the head. The car only starts with the right chip.' },
  { id: 'remote-head', name: 'Remote head key', text: 'Lock and unlock buttons built into the key head.' },
  { id: 'flip', name: 'Flip key', text: 'The blade folds into the remote and flips out at the press of a button.' },
  { id: 'smart', name: 'Smart key', text: 'Keyless entry and push-button start. Stays in your pocket.' },
  { id: 'not-sure', name: 'Not sure', text: 'We will help you identify your key when we call.' },
] as const

export const KEY_SERVICES = [
  { id: 'spare', name: 'Spare / duplicate key' },
  { id: 'lost', name: 'All keys lost' },
  { id: 'programming', name: 'Remote or chip programming' },
  { id: 'shell', name: 'Key shell / case replacement' },
  { id: 'repair', name: 'Key or remote not working' },
] as const

export const TIME_SLOTS = [
  { id: 'morning', name: 'Morning (8am – 12pm)' },
  { id: 'afternoon', name: 'Afternoon (12pm – 4pm)' },
  { id: 'evening', name: 'Evening (4pm – 7pm)' },
] as const

export const SERVICE_LOCATIONS = [
  { id: 'workshop', name: 'I will bring the car to you' },
  { id: 'mobile', name: 'Come to my location' },
] as const

export const BOOKING_STATUSES = ['new', 'confirmed', 'completed', 'cancelled'] as const

export type KeyDesignId = (typeof KEY_DESIGNS)[number]['id']
export type KeyServiceId = (typeof KEY_SERVICES)[number]['id']
export type TimeSlotId = (typeof TIME_SLOTS)[number]['id']
export type ServiceLocationId = (typeof SERVICE_LOCATIONS)[number]['id']
export type BookingStatus = (typeof BOOKING_STATUSES)[number]

export type KeyBookingInput = {
  full_name: string
  phone: string
  car_make: string
  car_model: string
  car_year: string
  key_type: KeyDesignId
  service_type: KeyServiceId
  preferred_date: string
  preferred_time: TimeSlotId
  service_location: ServiceLocationId
  area: string
  notes: string
}

export type KeyBooking = Omit<KeyBookingInput, 'car_year'> & {
  booking_id: string
  user_id: string | null
  car_year: number | null
  status: BookingStatus
  created_at: string
}

/** How far ahead a booking can be made. */
export const MAX_DAYS_AHEAD = 60

/** Today's date in Kampala as YYYY-MM-DD, so bookings are checked against the local day. */
export function kampalaToday(offsetDays = 0) {
  const date = new Date(Date.now() + offsetDays * 86_400_000)
  return date.toLocaleDateString('en-CA', { timeZone: 'Africa/Kampala' })
}

export function labelOf(list: readonly { id: string; name: string }[], id: string) {
  return list.find((item) => item.id === id)?.name ?? id
}

const isOneOf = (list: readonly { id: string }[], value: unknown) => list.some((item) => item.id === value)
const text = (value: unknown) => (typeof value === 'string' ? value.trim() : '')

/**
 * Checks a booking from the form. Returns the cleaned booking, or the first
 * problem as a message the customer can act on.
 */
export function validateBooking(body: Record<string, unknown>): { booking: KeyBookingInput } | { error: string } {
  const booking: KeyBookingInput = {
    full_name: text(body.full_name),
    phone: text(body.phone),
    car_make: text(body.car_make),
    car_model: text(body.car_model),
    car_year: text(body.car_year),
    key_type: text(body.key_type) as KeyDesignId,
    service_type: text(body.service_type) as KeyServiceId,
    preferred_date: text(body.preferred_date),
    preferred_time: text(body.preferred_time) as TimeSlotId,
    service_location: text(body.service_location) as ServiceLocationId,
    area: text(body.area),
    notes: text(body.notes),
  }

  if (booking.full_name.length < 2 || booking.full_name.length > 100) return { error: 'Please enter your name.' }
  const digits = booking.phone.replace(/\D/g, '')
  if (!/^\+?[\d\s()-]+$/.test(booking.phone) || digits.length < 9 || digits.length > 15) {
    return { error: 'Please enter a valid phone number, e.g. 0772 123 456.' }
  }
  if (!booking.car_make || booking.car_make.length > 60) return { error: 'Please choose the make of your car.' }
  if (!booking.car_model || booking.car_model.length > 60) return { error: 'Please enter the model of your car.' }
  if (booking.car_year) {
    const year = Number(booking.car_year)
    if (!Number.isInteger(year) || year < 1950 || year > new Date().getFullYear() + 1) return { error: 'Please enter a valid year.' }
  }
  if (!isOneOf(KEY_DESIGNS, booking.key_type)) return { error: 'Please choose your key type.' }
  if (!isOneOf(KEY_SERVICES, booking.service_type)) return { error: 'Please choose the service you need.' }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(booking.preferred_date) || booking.preferred_date < kampalaToday() || booking.preferred_date > kampalaToday(MAX_DAYS_AHEAD)) {
    return { error: `Please choose a date between today and ${MAX_DAYS_AHEAD} days from now.` }
  }
  if (!isOneOf(TIME_SLOTS, booking.preferred_time)) return { error: 'Please choose a time.' }
  if (!isOneOf(SERVICE_LOCATIONS, booking.service_location)) return { error: 'Please choose where the work should be done.' }
  if (booking.service_location === 'mobile' && booking.area.length < 2) return { error: 'Please tell us your area or address.' }
  if (booking.area.length > 200) return { error: 'The address is too long.' }
  if (booking.notes.length > 1000) return { error: 'Notes can be at most 1000 characters.' }

  return { booking }
}
