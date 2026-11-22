import { after, NextRequest, NextResponse } from 'next/server'
import { getSession, type Session } from '@/lib/session'
import { CONVERSATION_SELECT, cleanBody, db, messagesError, roleIn, summarize, type ConversationRow } from '@/lib/messages-server'
import { notifyNewMessage } from '@/lib/web-push'

type Params = { params: Promise<{ id: string }> }

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** The conversation and the viewer's side of it, or a response explaining why not. */
async function openConversation(id: string, session: Session | null) {
  if (!session) return { response: NextResponse.json({ error: 'Sign in to read messages.' }, { status: 401 }) }
  const notFound = { response: NextResponse.json({ error: 'Conversation not found.' }, { status: 404 }) }
  if (!UUID.test(id)) return notFound

  const { data, error } = await db().from('conversations').select(CONVERSATION_SELECT).eq('conversation_id', id).maybeSingle()
  if (error) throw error
  const row = data as unknown as ConversationRow | null
  const role = row && roleIn(row, session)
  if (!row || !role) return notFound
  return { row, role }
}

// GET /api/messages/:id?after=<ISO time> - The conversation and its messages (only newer ones
// with ?after, for polling). Marks the viewer's side as read.
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const opened = await openConversation(id, await getSession())
    if ('response' in opened) return opened.response
    const { row, role } = opened

    const supabase = db()
    let query = supabase
      .from('messages')
      .select('message_id, sender_id, body, created_at')
      .eq('conversation_id', id)
      .order('created_at', { ascending: true })
      .limit(500)
    const after = request.nextUrl.searchParams.get('after')
    if (after && !Number.isNaN(Date.parse(after))) query = query.gt('created_at', after)
    const { data: messages, error } = await query
    if (error) throw error

    const unreadColumn = role === 'buyer' ? 'buyer_unread' : 'staff_unread'
    if (row[unreadColumn] > 0) {
      await supabase.from('conversations').update({ [unreadColumn]: 0 }).eq('conversation_id', id)
    }

    return NextResponse.json({
      conversation: { ...summarize(row, role), unread: 0 },
      messages: (messages ?? []).map((message) => ({
        message_id: message.message_id,
        body: message.body,
        created_at: message.created_at,
        // Admins share one side of a Kampala Cars conversation, so "mine" means "my side".
        mine: (message.sender_id === row.buyer_id) === (role === 'buyer'),
      })),
    })
  } catch (error) {
    return NextResponse.json({ error: messagesError(error) }, { status: 500 })
  }
}

// POST /api/messages/:id - Reply in a conversation: { body }.
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const session = await getSession()
    const opened = await openConversation(id, session)
    if ('response' in opened) return opened.response

    const { body: rawBody } = await request.json().catch(() => ({}))
    const cleaned = cleanBody(rawBody)
    if ('error' in cleaned) return NextResponse.json({ error: cleaned.error }, { status: 400 })

    const { data: message, error } = await db()
      .from('messages')
      .insert({ conversation_id: id, sender_id: session!.userId, body: cleaned.body })
      .select('message_id, body, created_at')
      .single()
    if (error) throw error

    after(() => notifyNewMessage(opened.row, session!.userId))
    return NextResponse.json({ message: { ...message, mine: true } }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: messagesError(error) }, { status: 500 })
  }
}
