import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { CONVERSATION_SELECT, db, participantFilter, roleIn, summarize, type ConversationRow } from '@/lib/messages-server'

const noStore = { headers: { 'Cache-Control': 'no-store' } }

// GET /api/messages/latest - The newest conversation with unread messages, for the text of a
// push notification (the service worker calls this when a push arrives).
export async function GET() {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ latest: null }, noStore)

    const { data, error } = await db()
      .from('conversations')
      .select(CONVERSATION_SELECT)
      .or(participantFilter(session))
      .or('buyer_unread.gt.0,staff_unread.gt.0')
      .order('last_message_at', { ascending: false })
      .limit(10)
    if (error) throw error

    for (const row of data as unknown as ConversationRow[]) {
      const role = roleIn(row, session)
      if (!role) continue
      const summary = summarize(row, role)
      if (summary.unread > 0) {
        return NextResponse.json({
          latest: {
            conversation_id: summary.conversation_id,
            title: summary.other_name,
            body: summary.last_message ?? 'New message',
            car: summary.car?.heading ?? null,
            unread: summary.unread,
          },
        }, noStore)
      }
    }
    return NextResponse.json({ latest: null }, noStore)
  } catch (error) {
    console.error('Latest message lookup failed:', error)
    return NextResponse.json({ latest: null }, noStore)
  }
}
