'use client'

import { useEffect, useState } from 'react'
import { Bell, BellOff, Loader2, X } from 'lucide-react'
import { enablePush, pushSupported } from '@/lib/push-client'
import { cn } from '@/lib/utils'

const DISMISSED_KEY = 'notification-prompt-dismissed'

/**
 * Invites a signed-in user to turn on browser notifications for new messages.
 * Hidden when unsupported, already on, or dismissed; explains how to undo a block.
 */
export function NotificationPrompt({ className }: { className?: string }) {
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported' | null>(null)
  const [dismissed, setDismissed] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setPermission(pushSupported() ? Notification.permission : 'unsupported')
    setDismissed(localStorage.getItem(DISMISSED_KEY) === '1')
  }, [])

  const turnOn = async () => {
    setBusy(true)
    setError('')
    try {
      setPermission(await enablePush())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not turn on notifications.')
    } finally {
      setBusy(false)
    }
  }

  const dismiss = () => {
    localStorage.setItem(DISMISSED_KEY, '1')
    setDismissed(true)
  }

  if (permission === 'default' && !dismissed) {
    return (
      <div className={cn('flex flex-wrap items-center gap-3 rounded-xl border border-gold-200 bg-gold-50 px-4 py-3', className)}>
        <Bell className="h-5 w-5 shrink-0 text-gold-700" />
        <p className="flex-1 min-w-[200px] text-sm text-gray-800">
          <span className="font-medium">Get notified of new messages.</span> We&apos;ll show a notification on this device when a buyer or seller replies, even when the site is closed.
        </p>
        <button onClick={turnOn} disabled={busy} className="inline-flex items-center rounded-lg bg-brand px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-hover disabled:opacity-50">
          {busy && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />} Turn on
        </button>
        <button onClick={dismiss} aria-label="Not now" className="p-1 text-gray-400 hover:text-gray-700">
          <X className="h-4 w-4" />
        </button>
        {error && <p className="basis-full text-sm text-red-600">{error}</p>}
      </div>
    )
  }

  if (permission === 'denied') {
    return (
      <p className={cn('flex items-center gap-2 text-xs text-gray-500', className)}>
        <BellOff className="h-4 w-4 shrink-0" />
        Notifications are blocked. To get them, click the icon left of the address bar, set Notifications to Allow, and reload.
      </p>
    )
  }

  return error ? <p className={cn('text-sm text-red-600', className)}>{error}</p> : null
}
