// Kampala Cars service worker: shows a notification when a new message arrives.
// Pushes carry no text; we ask the site what arrived, using the visitor's login cookie.

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()))

async function focusedClientAt(path) {
  const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
  return windows.find((client) => client.focused && new URL(client.url).pathname + new URL(client.url).search === path)
}

self.addEventListener('push', (event) => {
  event.waitUntil((async () => {
    let latest = null
    try {
      const response = await fetch('/api/messages/latest', { credentials: 'include', cache: 'no-store' })
      if (response.ok) latest = (await response.json()).latest
    } catch {
      // Offline or signed out: fall back to a plain notification.
    }

    const url = latest ? `/messages?c=${latest.conversation_id}` : '/messages'
    // Already reading this conversation in a focused tab: the chat updates by itself.
    if (await focusedClientAt(url)) return

    const body = latest
      ? `${latest.body}${latest.car ? `\n${latest.car}` : ''}`
      : 'You have a new message.'

    await self.registration.showNotification(latest ? latest.title : 'Kampala Cars', {
      body,
      icon: '/logo.webp',
      tag: latest ? latest.conversation_id : 'messages',
      renotify: true,
      data: { url },
    })
  })())
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = new URL(event.notification.data?.url || '/messages', self.location.origin).href
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
    const open = windows.find((client) => new URL(client.url).origin === self.location.origin)
    if (open) {
      await open.focus()
      return open.navigate(url)
    }
    return self.clients.openWindow(url)
  })())
})
