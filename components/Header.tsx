'use client'

import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { Button } from './ui/Button'
import { Search, User, LogOut, Plus, Shield, MessageSquare } from 'lucide-react'
import { useEffect, useState } from 'react'
import { MESSAGES_CHANGED } from '@/lib/messages-events'
import { syncPush, unlinkPush } from '@/lib/push-client'

const UNREAD_POLL_MS = 30000

/** Unread message count for the signed-in user, refreshed every 30s, on focus and after reading. */
function useUnreadCount(signedIn: boolean) {
  const [unread, setUnread] = useState(0)
  useEffect(() => {
    if (!signedIn) return setUnread(0)
    let active = true
    const refresh = () => {
      if (document.visibilityState !== 'visible') return
      fetch('/api/messages/unread', { cache: 'no-store' })
        .then((response) => (response.ok ? response.json() : { unread: 0 }))
        .then((data) => { if (active) setUnread(Number(data.unread) || 0) })
        .catch(() => {})
    }
    refresh()
    const timer = setInterval(refresh, UNREAD_POLL_MS)
    window.addEventListener(MESSAGES_CHANGED, refresh)
    document.addEventListener('visibilitychange', refresh)
    return () => {
      active = false
      clearInterval(timer)
      window.removeEventListener(MESSAGES_CHANGED, refresh)
      document.removeEventListener('visibilitychange', refresh)
    }
  }, [signedIn])
  return unread
}

export function Header() {
  const { user, signOut } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const unread = useUnreadCount(Boolean(user))
  const userId = user?.user_id

  // Keep this browser's notifications linked to whoever is signed in.
  useEffect(() => {
    if (userId) syncPush()
  }, [userId])

  const handleSignOut = async () => {
    await unlinkPush()
    await signOut()
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      window.location.href = `/cars?search=${encodeURIComponent(searchQuery.trim())}`
    }
  }

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3">
            <img src="/logo.webp" alt="Kampala Cars logo" width={56} height={56} className="h-12 w-12 sm:h-14 sm:w-14 rounded-lg shrink-0" />
            <div>
              {/* Not a heading: each page has its own h1. */}
              <span className="block text-xl font-bold text-gray-900">Kampala Cars</span>
              <p className="text-sm text-gray-500 hidden sm:block">Your trusted car marketplace</p>
            </div>
          </Link>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-lg mx-8">
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Search cars by brand, model..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2.5 pl-10 pr-4 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gold-600 focus:border-transparent"
              />
              <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            </div>
            <Button type="submit" className="ml-3 bg-brand hover:bg-brand-hover">
              Search
            </Button>
          </form>

          <nav className="flex items-center space-x-3">
            <Link href="/cars" className="hidden sm:block">
              <Button variant="outline" size="sm" className="text-gray-700 border-gray-300 hover:bg-gray-50">
                Browse
              </Button>
            </Link>
            {user ? (
              <>
                <Link href="/messages" className="relative" aria-label={unread ? `Messages, ${unread} unread` : 'Messages'}>
                  <Button variant="outline" size="sm" className="text-gray-700 border-gray-300 hover:bg-gray-50">
                    <MessageSquare className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Messages</span>
                  </Button>
                  {unread > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 min-w-5 rounded-full bg-red-600 px-1 text-center text-xs font-semibold leading-5 text-white">
                      {unread > 99 ? '99+' : unread}
                    </span>
                  )}
                </Link>
                {user.user_type === 'admin' ? (
                  <Link href="/admin">
                    <Button variant="outline" size="sm" className="text-red-600 border-red-300 hover:bg-red-50">
                      <Shield className="h-4 w-4 mr-2" />
                      Admin Panel
                    </Button>
                  </Link>
                ) : (
                  <>
                    <Link href="/dashboard">
                      <Button variant="outline" size="sm" className="text-gray-700 border-gray-300 hover:bg-gray-50">
                        <User className="h-4 w-4 mr-2" />
                        Dashboard
                      </Button>
                    </Link>
                    <Link href="/upload">
                      <Button size="sm" className="bg-brand hover:bg-brand-hover text-white">
                        <Plus className="h-4 w-4 mr-2" />
                        Sell Car
                      </Button>
                    </Link>
                  </>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSignOut}
                  className="text-gray-700 border-gray-300 hover:bg-gray-50"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Link href="/auth/login">
                  <Button variant="outline" size="sm" className="text-gray-700 border-gray-300 hover:bg-gray-50">
                    Login
                  </Button>
                </Link>
                <Link href="/auth/register">
                  <Button size="sm" className="bg-brand hover:bg-brand-hover text-white">
                    Register
                  </Button>
                </Link>
              </>
            )}
          </nav>
        </div>

        {/* Mobile Search */}
        <form onSubmit={handleSearch} className="md:hidden mt-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search cars..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2.5 pl-10 pr-4 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gold-600 focus:border-transparent"
            />
            <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
          </div>
        </form>
      </div>
    </header>
  )
} 
