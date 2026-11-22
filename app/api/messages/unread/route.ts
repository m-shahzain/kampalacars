import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { db, participantFilter, roleIn } from '@/lib/messages-server'

// GET /api/messages/unread - How many unread messages the signed-in user has, for the header badge.
export async function GET() {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ unread: 0 })

    const { data, error } = await db()
      .from('conversations')
      .select('buyer_id, seller_id, with_admin, buyer_unread, staff_unread')
      .or(participantFilter(session))
      .or('buyer_unread.gt.0,staff_unread.gt.0')
    if (error) throw error

    const unread = (data ?? []).reduce((total, row) => {
      const role = roleIn(row, session)
      return total + (role === 'buyer' ? row.buyer_unread : role === 'staff' ? row.staff_unread : 0)
    }, 0)
    return NextResponse.json({ unread }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    // The badge is optional: before the migration has run, just show none.
    console.error('Unread count failed:', error)
    return NextResponse.json({ unread: 0 })
  }
}
