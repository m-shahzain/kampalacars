import { after, NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import {
  CONVERSATION_SELECT,
  cleanBody,
  db,
  messagesError,
  participantFilter,
  roleIn,
  summarize,
  type ConversationRow,
} from '@/lib/messages-server'
import { notifyNewMessage } from '@/lib/web-push'

const signInFirst = () => NextResponse.json({ error: 'Sign in to send messages.' }, { status: 401 })

// GET /api/messages - The signed-in user's conversations, most recent first.
export async function GET() {
  try {
    const session = await getSession()
    if (!session) return signInFirst()

    const { data, error } = await db()
      .from('conversations')
      .select(CONVERSATION_SELECT)
      .or(participantFilter(session))
      .order('last_message_at', { ascending: false })
      .limit(200)
    if (error) throw error

    const conversations = (data as unknown as ConversationRow[]).flatMap((row) => {
      const role = roleIn(row, session)
      return role ? [summarize(row, role)] : []
    })
    return NextResponse.json({ conversations })
  } catch (error) {
    return NextResponse.json({ error: messagesError(error) }, { status: 500 })
  }
}

// POST /api/messages - Message the seller about a car: { car_id, body }.
// Reuses the buyer's conversation about that car when there is one.
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return signInFirst()

    const { car_id: carId, body: rawBody } = await request.json().catch(() => ({}))
    const cleaned = cleanBody(rawBody)
    if ('error' in cleaned) return NextResponse.json({ error: cleaned.error }, { status: 400 })
    if (typeof carId !== 'string' || !carId) return NextResponse.json({ error: 'Which car is this about?' }, { status: 400 })

    const supabase = db()
    const { data: car, error: carError } = await supabase
      .from('cars')
      .select('car_id, seller_id, approval_status, users!cars_seller_id_fkey(is_premium)')
      .eq('car_id', carId)
      .maybeSingle()
    if (carError) throw carError
    if (!car || car.approval_status !== 'approved') {
      return NextResponse.json({ error: 'This listing is no longer available.' }, { status: 404 })
    }
    if (car.seller_id === session.userId) {
      return NextResponse.json({ error: 'This is your own listing.' }, { status: 400 })
    }

    const seller = (Array.isArray(car.users) ? car.users[0] : car.users) as { is_premium?: boolean } | null
    // Standard sellers' details stay private, so Kampala Cars answers for them.
    const withAdmin = !seller?.is_premium
    if (withAdmin && session.userType === 'admin') {
      return NextResponse.json({ error: 'Admins answer the messages for this listing, so you cannot message it.' }, { status: 400 })
    }

    const findExisting = () =>
      supabase.from('conversations').select('conversation_id, buyer_id, seller_id, with_admin').eq('car_id', carId).eq('buyer_id', session.userId).maybeSingle()

    let { data: conversation } = await findExisting()
    if (!conversation) {
      const { data: created, error } = await supabase
        .from('conversations')
        .insert({ car_id: carId, buyer_id: session.userId, seller_id: car.seller_id, with_admin: withAdmin })
        .select('conversation_id, buyer_id, seller_id, with_admin')
        .single()
      // 23505: the same buyer started this conversation in another tab a moment ago.
      if (error?.code === '23505') conversation = (await findExisting()).data
      else if (error) throw error
      else conversation = created
    }
    if (!conversation) throw new Error('Conversation could not be created')

    const { error: messageError } = await supabase
      .from('messages')
      .insert({ conversation_id: conversation.conversation_id, sender_id: session.userId, body: cleaned.body })
    if (messageError) throw messageError

    const thread = conversation
    after(() => notifyNewMessage(thread, session.userId))
    return NextResponse.json({ conversation_id: conversation.conversation_id }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: messagesError(error) }, { status: 500 })
  }
}
