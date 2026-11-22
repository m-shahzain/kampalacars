'use client'

import { useCallback, useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, Loader2, MessageSquare, Send, User } from 'lucide-react'
import { Layout } from '@/components/Layout'
import { useAuth } from '@/lib/auth-context'
import { getCarImageSources } from '@/lib/car-image'
import { cn } from '@/lib/utils'
import { notifyUnreadChanged } from '@/lib/messages-events'
import { NotificationPrompt } from '@/components/NotificationPrompt'

type ConversationSummary = {
  conversation_id: string
  role: 'buyer' | 'staff'
  other_name: string
  other_picture: string | null
  context: string | null
  car: { heading: string; href: string; image: string | null; is_sold: boolean } | null
  last_message: string | null
  last_message_at: string
  unread: number
}

type Message = { message_id: string; body: string; created_at: string; mine: boolean }

const THREAD_POLL_MS = 5000
const LIST_POLL_MS = 15000
const MAX_LENGTH = 2000


function shortTime(iso: string) {
  const date = new Date(iso)
  const now = new Date()
  if (date.toDateString() === now.toDateString()) return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  const days = (now.getTime() - date.getTime()) / 86400000
  if (days < 6) return date.toLocaleDateString('en-GB', { weekday: 'short' })
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

function dayLabel(iso: string) {
  const date = new Date(iso)
  const today = new Date()
  const yesterday = new Date(today.getTime() - 86400000)
  if (date.toDateString() === today.toDateString()) return 'Today'
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

async function getJson(url: string, init?: RequestInit) {
  const response = await fetch(url, { cache: 'no-store', ...init, headers: { 'Content-Type': 'application/json' } })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.error || 'Something went wrong.')
  return data
}

/** Runs the callback every `ms` while the tab is visible, and again when it becomes visible. */
function usePolling(callback: () => void, ms: number, enabled: boolean) {
  const saved = useRef(callback)
  saved.current = callback
  useEffect(() => {
    if (!enabled) return
    const tick = () => { if (document.visibilityState === 'visible') saved.current() }
    const timer = setInterval(tick, ms)
    document.addEventListener('visibilitychange', tick)
    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', tick)
    }
  }, [ms, enabled])
}

function Avatar({ name, picture, size = 'md' }: { name: string; picture: string | null; size?: 'sm' | 'md' }) {
  const [failed, setFailed] = useState(false)
  const classes = size === 'sm' ? 'h-9 w-9' : 'h-11 w-11'
  if (picture && !failed) {
    return <img src={picture} alt="" className={cn(classes, 'shrink-0 rounded-full object-cover bg-gray-100')} onError={() => setFailed(true)} />
  }
  return (
    <span className={cn(classes, 'shrink-0 rounded-full bg-gold-100 text-gold-800 flex items-center justify-center font-semibold')}>
      {name.trim()[0]?.toUpperCase() ?? <User className="h-4 w-4" />}
    </span>
  )
}

export function MessagesClient() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const selectedId = useSearchParams().get('c')

  const [conversations, setConversations] = useState<ConversationSummary[]>([])
  const [listLoading, setListLoading] = useState(true)
  const [listError, setListError] = useState('')

  const loadList = useCallback(async () => {
    try {
      const data = await getJson('/api/messages')
      setConversations(data.conversations)
      setListError('')
    } catch (err) {
      setListError(err instanceof Error ? err.message : 'Could not load your messages.')
    } finally {
      setListLoading(false)
    }
  }, [])

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      router.replace(`/auth/login?next=${encodeURIComponent(`/messages${selectedId ? `?c=${selectedId}` : ''}`)}`)
      return
    }
    loadList()
  }, [user, authLoading, router, loadList, selectedId])

  usePolling(loadList, LIST_POLL_MS, Boolean(user))

  // Opening a conversation clears its unread count here right away.
  const markRead = useCallback((id: string) => {
    setConversations((current) => current.map((item) => (item.conversation_id === id ? { ...item, unread: 0 } : item)))
    notifyUnreadChanged()
  }, [])

  const onSent = useCallback((id: string, message: Message) => {
    setConversations((current) => {
      const updated = current.map((item) =>
        item.conversation_id === id ? { ...item, last_message: message.body, last_message_at: message.created_at } : item
      )
      return updated.sort((a, b) => b.last_message_at.localeCompare(a.last_message_at))
    })
  }, [])

  if (authLoading || !user) return null

  const selected = conversations.find((item) => item.conversation_id === selectedId) ?? null

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        <h1 className={cn('text-2xl font-bold text-gray-900 mb-4 flex items-center', selectedId && 'hidden md:flex')}>
          <MessageSquare className="h-6 w-6 text-gold-700 mr-2" /> Messages
        </h1>
        <NotificationPrompt className={cn('mb-4', selectedId && 'hidden md:flex')} />

        <div className="grid md:grid-cols-[320px_1fr] rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden h-[calc(100vh-220px)] min-h-[480px]">
          {/* Conversation list */}
          <aside className={cn('border-r border-gray-200 overflow-y-auto', selectedId && 'hidden md:block')}>
            {listLoading ? (
              <div className="flex items-center justify-center py-16 text-gray-500">
                <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading...
              </div>
            ) : listError ? (
              <p className="m-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{listError}</p>
            ) : conversations.length === 0 ? (
              <div className="p-8 text-center text-sm text-gray-500">
                <MessageSquare className="h-8 w-8 mx-auto mb-3 text-gray-300" />
                <p>No messages yet.</p>
                <p className="mt-1">Press <span className="font-medium text-gray-700">Contact Seller</span> on any car to start a conversation.</p>
                <Link href="/cars" className="mt-4 inline-block font-medium text-gold-700 hover:underline">Browse cars →</Link>
              </div>
            ) : (
              <ul>
                {conversations.map((item) => (
                  <li key={item.conversation_id}>
                    <Link
                      href={`/messages?c=${item.conversation_id}`}
                      scroll={false}
                      className={cn(
                        'flex gap-3 px-4 py-3 border-b border-gray-100 hover:bg-gray-50',
                        item.conversation_id === selectedId && 'bg-gold-50 hover:bg-gold-50'
                      )}
                    >
                      <Avatar name={item.other_name} picture={item.other_picture} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-2">
                          <p className={cn('truncate text-sm', item.unread ? 'font-bold text-gray-900' : 'font-medium text-gray-900')}>{item.other_name}</p>
                          <span className="shrink-0 text-xs text-gray-400">{shortTime(item.last_message_at)}</span>
                        </div>
                        <p className="truncate text-xs text-gold-800">{item.car?.heading ?? 'Listing removed'}</p>
                        <div className="flex items-center gap-2">
                          <p className={cn('truncate text-sm flex-1', item.unread ? 'text-gray-900' : 'text-gray-500')}>{item.last_message}</p>
                          {item.unread > 0 && (
                            <span className="shrink-0 rounded-full bg-red-600 px-1.5 text-xs font-semibold leading-5 text-white">{item.unread}</span>
                          )}
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </aside>

          {/* Open conversation */}
          <section className={cn('min-h-0 flex-col', selectedId ? 'flex' : 'hidden md:flex')}>
            {selectedId ? (
              <Thread key={selectedId} id={selectedId} summary={selected} onRead={markRead} onSent={onSent} />
            ) : (
              <div className="flex flex-1 items-center justify-center text-sm text-gray-400">Choose a conversation</div>
            )}
          </section>
        </div>
      </div>
    </Layout>
  )
}

function Thread({ id, summary, onRead, onSent }: {
  id: string
  summary: ConversationSummary | null
  onRead: (id: string) => void
  onSent: (id: string, message: Message) => void
}) {
  const [conversation, setConversation] = useState<ConversationSummary | null>(summary)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const lastAt = useRef<string | null>(null)

  const addMessages = useCallback((incoming: Message[]) => {
    if (!incoming.length) return
    setMessages((current) => {
      const known = new Set(current.map((message) => message.message_id))
      const merged = [...current, ...incoming.filter((message) => !known.has(message.message_id))]
      lastAt.current = merged[merged.length - 1]?.created_at ?? lastAt.current
      return merged
    })
  }, [])

  const load = useCallback(async () => {
    try {
      const after = lastAt.current ? `?after=${encodeURIComponent(lastAt.current)}` : ''
      const data = await getJson(`/api/messages/${id}${after}`)
      setConversation(data.conversation)
      if (data.messages.length) {
        addMessages(data.messages)
        onRead(id)
      }
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load this conversation.')
    } finally {
      setLoading(false)
    }
  }, [id, addMessages, onRead])

  useEffect(() => { load() }, [load])
  usePolling(load, THREAD_POLL_MS, !error)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' })
  }, [messages.length])

  const send = async (event?: FormEvent) => {
    event?.preventDefault()
    const body = draft.trim()
    if (!body || sending) return
    setSending(true)
    setSendError('')
    try {
      const { message } = await getJson(`/api/messages/${id}`, { method: 'POST', body: JSON.stringify({ body }) })
      addMessages([message])
      onSent(id, message)
      setDraft('')
    } catch (err) {
      setSendError(err instanceof Error ? err.message : 'Message not sent. Please try again.')
    } finally {
      setSending(false)
    }
  }

  // Enter sends; Shift+Enter starts a new line.
  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault()
      send()
    }
  }

  const info = conversation ?? summary
  const carImage = getCarImageSources(info?.car?.image ?? undefined)

  return (
    <>
      <header className="flex items-center gap-3 border-b border-gray-200 px-4 py-3">
        <Link href="/messages" scroll={false} className="md:hidden -ml-1 p-1 text-gray-500 hover:text-gray-900" aria-label="Back to messages">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        {info && <Avatar name={info.other_name} picture={info.other_picture} size="sm" />}
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-gray-900">{info?.other_name ?? ' '}</p>
          {info?.context && <p className="truncate text-xs text-gray-500">{info.context}</p>}
        </div>
        {info?.car && (
          <Link href={info.car.href} className="flex items-center gap-2 rounded-lg border border-gray-200 p-1 pr-3 hover:bg-gray-50 max-w-[50%]">
            {carImage && <img src={carImage.src} alt="" className="h-9 w-14 shrink-0 rounded object-cover bg-gray-100" />}
            <span className="min-w-0">
              <span className="block truncate text-xs font-medium text-gray-900">{info.car.heading}</span>
              {info.car.is_sold && <span className="text-xs font-semibold text-red-600">SOLD</span>}
            </span>
          </Link>
        )}
      </header>

      <div className="flex-1 overflow-y-auto bg-gray-50 px-4 py-4">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-500">
            <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading...
          </div>
        ) : error ? (
          <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>
        ) : (
          <ol className="space-y-2">
            {messages.map((message, index) => {
              const newDay = index === 0 || new Date(messages[index - 1].created_at).toDateString() !== new Date(message.created_at).toDateString()
              return (
                <li key={message.message_id}>
                  {newDay && <p className="my-3 text-center text-xs text-gray-400">{dayLabel(message.created_at)}</p>}
                  <div className={cn('flex', message.mine ? 'justify-end' : 'justify-start')}>
                    <div className={cn(
                      'max-w-[80%] rounded-2xl px-3 py-2 text-sm shadow-sm',
                      message.mine ? 'bg-brand text-white rounded-br-sm' : 'bg-white text-gray-900 border border-gray-200 rounded-bl-sm'
                    )}>
                      <p className="whitespace-pre-wrap break-words">{message.body}</p>
                      <p className={cn('mt-0.5 text-right text-[11px]', message.mine ? 'text-white/70' : 'text-gray-400')}>
                        {new Date(message.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                </li>
              )
            })}
          </ol>
        )}
        <div ref={bottomRef} />
      </div>

      {!error && (
        <form onSubmit={send} className="border-t border-gray-200 p-3">
          {sendError && <p className="mb-2 text-sm text-red-600">{sendError}</p>}
          <div className="flex items-end gap-2">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={onKeyDown}
              rows={1}
              maxLength={MAX_LENGTH}
              placeholder="Write a message..."
              aria-label="Message"
              className="max-h-32 min-h-10 flex-1 resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gold-600 [field-sizing:content]"
            />
            <button
              type="submit"
              disabled={!draft.trim() || sending}
              aria-label="Send"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand text-white hover:bg-brand-hover disabled:opacity-40"
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
          </div>
        </form>
      )}
    </>
  )
}
