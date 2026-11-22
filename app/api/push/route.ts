import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { db, messagesError } from '@/lib/messages-server'

// POST /api/push - Save this browser's push subscription for the signed-in user.
// Body: the PushSubscription's JSON ({ endpoint, keys: { p256dh, auth } }).
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Sign in first.' }, { status: 401 })

    const body = await request.json().catch(() => ({}))
    const endpoint = body?.endpoint
    const p256dh = body?.keys?.p256dh
    const auth = body?.keys?.auth
    if (typeof endpoint !== 'string' || !endpoint.startsWith('https://') || endpoint.length > 1000 ||
        typeof p256dh !== 'string' || typeof auth !== 'string') {
      return NextResponse.json({ error: 'Invalid subscription.' }, { status: 400 })
    }

    // A browser belongs to whoever signed in on it last.
    const { error } = await db()
      .from('push_subscriptions')
      .upsert({ endpoint, user_id: session.userId, p256dh, auth }, { onConflict: 'endpoint' })
    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (error) {
    const message = messagesError(error)
    return NextResponse.json({ error: /push_subscriptions/.test(String((error as { message?: string })?.message))
      ? 'Notifications are not set up yet: run docs/add-push-subscriptions-migration.sql in Supabase.'
      : message }, { status: 500 })
  }
}

// DELETE /api/push - Stop notifications for this browser: { endpoint }. Used on sign-out.
export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ ok: true })
    const { endpoint } = await request.json().catch(() => ({}))
    if (typeof endpoint === 'string') {
      await db().from('push_subscriptions').delete().eq('endpoint', endpoint).eq('user_id', session.userId)
    }
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ error: messagesError(error) }, { status: 500 })
  }
}
