'use client'

import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Check, Loader2, Pencil, Plus, Search, Trash2, X } from 'lucide-react'
import { Layout } from '@/components/Layout'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/lib/auth-context'

/** One row as the admin API returns it: an id, a display name and how many cars use it. */
export type ListItem = { id: string; name: string; car_count: number }

type Props = {
  title: string
  description: string
  icon: ReactNode
  /** Admin API with GET (list), POST { name }, PUT { id, name } and DELETE ?id=. */
  endpoint: string
  /** Singular, lower case: "brand", "body type". */
  noun: string
  placeholder: string
  maxLength?: number
  /** A warning to confirm before renaming an item cars already use, or null for none. */
  renameWarning?: (item: ListItem) => string | null
}

const byName = (a: ListItem, b: ListItem) => a.name.localeCompare(b.name)

async function send(url: string, init: RequestInit) {
  const response = await fetch(url, { ...init, headers: { 'Content-Type': 'application/json' } })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.error || 'Something went wrong.')
  return data
}

/** Admin page to add, rename and delete the entries of a simple list (brands, body types). */
export function ListManager({ title, description, icon, endpoint, noun, placeholder, maxLength = 50, renameWarning }: Props) {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [items, setItems] = useState<ListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  const [newName, setNewName] = useState('')
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState('')

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)
  const [rowError, setRowError] = useState<{ id: string; message: string } | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await send(endpoint, { method: 'GET' })
      setItems(data.items)
    } catch (err) {
      setError(err instanceof Error ? err.message : `Could not load the ${noun}s.`)
    } finally {
      setLoading(false)
    }
  }, [endpoint, noun])

  useEffect(() => {
    if (authLoading) return
    if (!user) return router.push('/auth/login')
    if (user.user_type !== 'admin') return router.push('/')
    load()
  }, [user, authLoading, router, load])

  const addItem = async (event: FormEvent) => {
    event.preventDefault()
    setAdding(true)
    setAddError('')
    try {
      const { item } = await send(endpoint, { method: 'POST', body: JSON.stringify({ name: newName }) })
      setItems((current) => [...current, item].sort(byName))
      setNewName('')
    } catch (err) {
      setAddError(err instanceof Error ? err.message : `Could not add the ${noun}.`)
    } finally {
      setAdding(false)
    }
  }

  const startEdit = (item: ListItem) => {
    setEditingId(item.id)
    setEditName(item.name)
    setRowError(null)
  }

  const saveEdit = async (item: ListItem) => {
    if (editName.trim() === item.name) return setEditingId(null)
    const warning = item.car_count > 0 ? renameWarning?.(item) : null
    if (warning && !confirm(warning)) return

    setBusyId(item.id)
    setRowError(null)
    try {
      const { item: updated } = await send(endpoint, { method: 'PUT', body: JSON.stringify({ id: item.id, name: editName }) })
      setItems((current) => current.map((entry) => (entry.id === item.id ? { ...entry, ...updated } : entry)).sort(byName))
      setEditingId(null)
    } catch (err) {
      setRowError({ id: item.id, message: err instanceof Error ? err.message : `Could not rename the ${noun}.` })
    } finally {
      setBusyId(null)
    }
  }

  const deleteItem = async (item: ListItem) => {
    if (!confirm(`Delete the ${noun} "${item.name}"? This cannot be undone.`)) return
    setBusyId(item.id)
    setRowError(null)
    try {
      await send(`${endpoint}?id=${encodeURIComponent(item.id)}`, { method: 'DELETE' })
      setItems((current) => current.filter((entry) => entry.id !== item.id))
    } catch (err) {
      setRowError({ id: item.id, message: err instanceof Error ? err.message : `Could not delete the ${noun}.` })
    } finally {
      setBusyId(null)
    }
  }

  if (authLoading || !user || user.user_type !== 'admin') return null

  const query = search.trim().toLowerCase()
  const visible = query ? items.filter((item) => item.name.toLowerCase().includes(query)) : items

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Link href="/admin" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-900 mb-4">
          <ArrowLeft className="h-4 w-4 mr-1" /> Admin dashboard
        </Link>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-3">
          {icon} {title}
        </h1>
        <p className="text-gray-600 mt-1">{description}</p>

        <form onSubmit={addItem} className="mt-6 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <label htmlFor="new-item" className="block text-sm font-medium text-gray-700 mb-2">Add a {noun}</label>
          <div className="flex gap-2">
            <input
              id="new-item"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              maxLength={maxLength}
              placeholder={placeholder}
              className="h-10 flex-1 rounded-lg border border-gray-300 px-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gold-600"
            />
            <Button type="submit" disabled={adding || !newName.trim()}>
              {adding ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
              Add
            </Button>
          </div>
          {addError && <p className="mt-2 text-sm text-red-600">{addError}</p>}
        </form>

        <div className="mt-6 flex items-center justify-between gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`Search ${noun}s`}
              className="h-10 w-full rounded-lg border border-gray-300 pl-9 pr-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gold-600"
            />
          </div>
          {!loading && !error && <p className="text-sm text-gray-500">{items.length} {noun}s</p>}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-500">
            <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading...
          </div>
        ) : error ? (
          <p className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p>
        ) : visible.length === 0 ? (
          <p className="mt-6 rounded-lg border border-gray-200 bg-gray-50 p-8 text-center text-sm text-gray-500">
            {query ? `No ${noun}s match your search.` : `No ${noun}s yet. Add the first one above.`}
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white shadow-sm">
            {visible.map((item) => {
              const editing = editingId === item.id
              const busy = busyId === item.id
              return (
                <li key={item.id} className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {editing ? (
                      <input
                        autoFocus
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveEdit(item)
                          if (e.key === 'Escape') setEditingId(null)
                        }}
                        maxLength={maxLength}
                        aria-label={`${noun} name`}
                        className="h-9 flex-1 rounded-lg border border-gray-300 px-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gold-600"
                      />
                    ) : (
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{item.name}</p>
                        <p className="text-xs text-gray-500">
                          {item.car_count === 0 ? 'No listings' : `${item.car_count} listing${item.car_count === 1 ? '' : 's'}`}
                        </p>
                      </div>
                    )}

                    <div className="flex items-center gap-1 shrink-0">
                      {busy ? (
                        <Loader2 className="h-4 w-4 animate-spin text-gray-400 m-2" />
                      ) : editing ? (
                        <>
                          <button onClick={() => saveEdit(item)} disabled={!editName.trim()} title="Save" className="rounded-lg p-2 text-green-700 hover:bg-green-50 disabled:opacity-40">
                            <Check className="h-4 w-4" />
                          </button>
                          <button onClick={() => setEditingId(null)} title="Cancel" className="rounded-lg p-2 text-gray-500 hover:bg-gray-100">
                            <X className="h-4 w-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => startEdit(item)} title="Rename" className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900">
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => deleteItem(item)}
                            disabled={item.car_count > 0}
                            title={item.car_count > 0 ? `A ${noun} with listings cannot be deleted` : 'Delete'}
                            className="rounded-lg p-2 text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:text-gray-300 disabled:hover:bg-transparent"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  {rowError?.id === item.id && <p className="mt-1 text-sm text-red-600">{rowError.message}</p>}
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </Layout>
  )
}
