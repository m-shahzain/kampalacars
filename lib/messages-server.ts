// In-app messages: who may see a conversation and how it looks to them.
// Server only: it uses the service-role client, so every function checks the caller first.
import { createAdminClient } from '@/lib/supabase/admin'
import { carHeading, carPath } from '@/lib/car-paths'
import type { Session } from '@/lib/session'

export const MAX_MESSAGE_LENGTH = 2000

export type ConversationRow = {
  conversation_id: string
  car_id: string | null
  buyer_id: string
  seller_id: string | null
  with_admin: boolean
  last_message: string | null
  last_message_at: string
  buyer_unread: number
  staff_unread: number
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  cars: any
  buyer: { fullname: string; profile_picture_url: string | null } | null
  seller: { fullname: string; profile_picture_url: string | null } | null
}

/** What the inbox shows for one conversation, from the viewer's side. */
export type ConversationSummary = {
  conversation_id: string
  role: 'buyer' | 'staff'
  other_name: string
  other_picture: string | null
  /** For admins answering for a standard seller: whose car it is. */
  context: string | null
  car: { heading: string; href: string; image: string | null; is_sold: boolean } | null
  last_message: string | null
  last_message_at: string
  unread: number
}

export const CONVERSATION_SELECT = `
  conversation_id, car_id, buyer_id, seller_id, with_admin, last_message, last_message_at, buyer_unread, staff_unread,
  cars(car_id, year, model, title, image_urls, is_sold, car_brands(brand_name)),
  buyer:users!conversations_buyer_id_fkey(fullname, profile_picture_url),
  seller:users!conversations_seller_id_fkey(fullname, profile_picture_url)
`

export const db = () => createAdminClient()

/** PostgREST filter for every conversation the user takes part in. */
export function participantFilter(session: Session) {
  const parts = [`buyer_id.eq.${session.userId}`, `and(seller_id.eq.${session.userId},with_admin.eq.false)`]
  if (session.userType === 'admin') parts.push('with_admin.eq.true')
  return parts.join(',')
}

/** The viewer's side of a conversation, or null when they are not part of it. */
export function roleIn(conversation: Pick<ConversationRow, 'buyer_id' | 'seller_id' | 'with_admin'>, session: Session) {
  if (conversation.buyer_id === session.userId) return 'buyer' as const
  if (conversation.with_admin ? session.userType === 'admin' : conversation.seller_id === session.userId) return 'staff' as const
  return null
}

export function summarize(row: ConversationRow, role: 'buyer' | 'staff'): ConversationSummary {
  const car = row.cars
  const otherName = role === 'staff'
    ? row.buyer?.fullname ?? 'Deleted user'
    : row.with_admin ? 'Kampala Cars' : row.seller?.fullname ?? 'Seller'
  const otherPicture = role === 'staff'
    ? row.buyer?.profile_picture_url ?? null
    : row.with_admin ? '/logo.webp' : row.seller?.profile_picture_url ?? null

  return {
    conversation_id: row.conversation_id,
    role,
    other_name: otherName,
    other_picture: otherPicture,
    context: role === 'staff' && row.with_admin && row.seller ? `Listed by ${row.seller.fullname}` : null,
    car: car
      ? { heading: carHeading(car), href: carPath(car), image: car.image_urls?.[0] ?? null, is_sold: Boolean(car.is_sold) }
      : null,
    last_message: row.last_message,
    last_message_at: row.last_message_at,
    unread: role === 'buyer' ? row.buyer_unread : row.staff_unread,
  }
}

/** Trims a message; returns an error message when it is empty or too long. */
export function cleanBody(value: unknown): { body: string } | { error: string } {
  const body = typeof value === 'string' ? value.trim() : ''
  if (!body) return { error: 'Write a message first.' }
  if (body.length > MAX_MESSAGE_LENGTH) return { error: `Messages can be at most ${MAX_MESSAGE_LENGTH} characters.` }
  return { body }
}

/** Explains a missing migration or server key instead of a bare error. */
export function messagesError(error: unknown) {
  console.error('Messages request failed:', error)
  const text = error instanceof Error ? error.message : typeof error === 'object' && error && 'message' in error ? String(error.message) : ''
  if (text.includes('SUPABASE_SERVICE_ROLE_KEY')) return 'Server setup: SUPABASE_SERVICE_ROLE_KEY is missing.'
  if (/conversations|messages/.test(text) && /does not exist|schema cache/.test(text)) {
    return 'Messages are not set up yet: run docs/add-messages-migration.sql in Supabase.'
  }
  return 'Something went wrong. Please try again.'
}
