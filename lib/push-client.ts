// Browser side of push notifications: register the service worker, ask permission,
// and keep the server's copy of this browser's subscription up to date.

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? ''

export function pushSupported() {
  return typeof window !== 'undefined' &&
    'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window && Boolean(VAPID_PUBLIC_KEY)
}

function keyBytes(base64url: string) {
  const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/')
  return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0))
}

async function currentSubscription(create: boolean) {
  const registration = await navigator.serviceWorker.register('/sw.js')
  await navigator.serviceWorker.ready
  const existing = await registration.pushManager.getSubscription()
  if (existing || !create) return existing
  return registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(VAPID_PUBLIC_KEY) })
}

async function saveSubscription(subscription: PushSubscription) {
  const response = await fetch('/api/push', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(subscription.toJSON()),
  })
  if (!response.ok) throw new Error((await response.json().catch(() => ({}))).error || 'Could not turn on notifications.')
}

/** Asks for permission (call it from a click) and subscribes this browser. */
export async function enablePush(): Promise<NotificationPermission> {
  const permission = await Notification.requestPermission()
  if (permission === 'granted') await saveSubscription((await currentSubscription(true))!)
  return permission
}

/**
 * When notifications are already allowed, makes sure this browser is subscribed and linked
 * to whoever is signed in now. Quiet: failures only go to the console.
 */
export async function syncPush() {
  if (!pushSupported() || Notification.permission !== 'granted') return
  try {
    const subscription = await currentSubscription(true)
    if (subscription) await saveSubscription(subscription)
  } catch (err) {
    console.warn('Push sync failed', err)
  }
}

/** On sign-out: stop sending this account's messages to this browser. */
export async function unlinkPush() {
  if (!pushSupported()) return
  try {
    const subscription = await currentSubscription(false)
    if (!subscription) return
    await fetch('/api/push', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ endpoint: subscription.endpoint }),
    })
  } catch (err) {
    console.warn('Push unlink failed', err)
  }
}
