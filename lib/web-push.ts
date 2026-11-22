// Sends browser push notifications (Web Push with VAPID), using only Web Crypto so it runs
// on Cloudflare Workers. Pushes carry no payload: the service worker (public/sw.js) asks
// /api/messages/latest what arrived, with the user's own login cookie. That keeps message
// text off the push services and needs no payload encryption.
import { db } from '@/lib/messages-server'

const SUBJECT = 'https://kampalacars.com'
const TTL_SECONDS = 24 * 60 * 60

const b64url = {
  encode: (bytes: ArrayBuffer | Uint8Array) =>
    btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''),
  decode: (text: string) => Uint8Array.from(atob(text.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0)),
}

let signingKey: Promise<CryptoKey> | null = null

function vapidKeys() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const privateKey = process.env.VAPID_PRIVATE_KEY
  return publicKey && privateKey ? { publicKey, privateKey } : null
}

/** The private key as a Web Crypto key; x and y come from the public key (0x04 || x || y). */
function getSigningKey(publicKey: string, privateKey: string) {
  signingKey ??= (() => {
    const point = b64url.decode(publicKey)
    return crypto.subtle.importKey(
      'jwk',
      { kty: 'EC', crv: 'P-256', x: b64url.encode(point.slice(1, 33)), y: b64url.encode(point.slice(33, 65)), d: privateKey, ext: true },
      { name: 'ECDSA', namedCurve: 'P-256' },
      false,
      ['sign']
    )
  })()
  return signingKey
}

/** A signed VAPID token for one push service (its origin is the audience). */
async function vapidToken(endpoint: string, keys: { publicKey: string; privateKey: string }) {
  const encoder = new TextEncoder()
  const header = b64url.encode(encoder.encode(JSON.stringify({ typ: 'JWT', alg: 'ES256' })))
  const claims = b64url.encode(encoder.encode(JSON.stringify({
    aud: new URL(endpoint).origin,
    exp: Math.floor(Date.now() / 1000) + 12 * 60 * 60,
    sub: SUBJECT,
  })))
  const unsigned = `${header}.${claims}`
  // Web Crypto returns the raw r || s signature, which is what ES256 JWTs use.
  const signature = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, await getSigningKey(keys.publicKey, keys.privateKey), encoder.encode(unsigned))
  return `${unsigned}.${b64url.encode(signature)}`
}

/** Wakes every browser these users turned notifications on in. Never throws. */
export async function pushToUsers(userIds: string[]) {
  const keys = vapidKeys()
  if (!keys || userIds.length === 0) return

  try {
    const supabase = db()
    const { data: subscriptions, error } = await supabase.from('push_subscriptions').select('endpoint').in('user_id', userIds)
    if (error) throw error

    const gone: string[] = []
    await Promise.all((subscriptions ?? []).map(async ({ endpoint }) => {
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            Authorization: `vapid t=${await vapidToken(endpoint, keys)}, k=${keys.publicKey}`,
            TTL: String(TTL_SECONDS),
            Urgency: 'high',
            'Content-Length': '0',
          },
        })
        // 404/410: the browser unsubscribed or the subscription expired.
        if (response.status === 404 || response.status === 410) gone.push(endpoint)
        else if (!response.ok) console.error('Push failed', response.status, await response.text().catch(() => ''))
      } catch (err) {
        console.error('Push request failed', err)
      }
    }))

    if (gone.length) await supabase.from('push_subscriptions').delete().in('endpoint', gone)
  } catch (err) {
    console.error('Sending push notifications failed', err)
  }
}

/** Who should hear about a new message: the other side of the conversation. */
export async function notifyNewMessage(
  conversation: { buyer_id: string; seller_id: string | null; with_admin: boolean },
  senderId: string
) {
  let recipients: string[]
  if (senderId !== conversation.buyer_id) {
    recipients = [conversation.buyer_id]
  } else if (conversation.with_admin) {
    const { data } = await db().from('users').select('user_id').eq('user_type', 'admin')
    recipients = (data ?? []).map((admin) => admin.user_id)
  } else {
    recipients = conversation.seller_id ? [conversation.seller_id] : []
  }
  await pushToUsers(recipients.filter((id) => id !== senderId))
}
