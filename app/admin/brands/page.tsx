'use client'

import { useCallback, useEffect, useState, type FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Check, Loader2, Pencil, Plus, Search, Tags, Trash2, X } from 'lucide-react'
import { Layout } from '@/components/Layout'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/lib/auth-context'

type AdminBrand = {
  brand_id: string
  brand_name: string
  created_at: string
  car_count: number
}

const byName = (a: AdminBrand, b: AdminBrand) => a.brand_name.localeCompare(b.brand_name)

async function send(url: string, init: RequestInit) {
  const response = await fetch(url, { ...init, headers: { 'Content-Type': 'application/json' } })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.error || 'Something went wrong.')
  return data
}

export default function AdminBrandsPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [brands, setBrands] = useState<AdminBrand[]>([])
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
      const data = await send('/api/admin/brands', { method: 'GET' })
      setBrands(data.brands)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load brands.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (authLoading) return
    if (!user) return router.push('/auth/login')
    if (user.user_type !== 'admin') return router.push('/')
    load()
  }, [user, authLoading, router, load])

  const addBrand = async (event: FormEvent) => {
    event.preventDefault()
    setAdding(true)
    setAddError('')
    try {
      const { brand } = await send('/api/admin/brands', { method: 'POST', body: JSON.stringify({ brand_name: newName }) })
      setBrands((current) => [...current, brand].sort(byName))
      setNewName('')
    } catch (err) {
      setAddError(err instanceof Error ? err.message : 'Could not add the brand.')
    } finally {
      setAdding(false)
    }
  }

  const startEdit = (brand: AdminBrand) => {
    setEditingId(brand.brand_id)
    setEditName(brand.brand_name)
    setRowError(null)
  }

  const saveEdit = async (brand: AdminBrand) => {
    if (editName.trim() === brand.brand_name) return setEditingId(null)
    if (
      brand.car_count > 0 &&
      !confirm(`Renaming "${brand.brand_name}" changes the address of its brand page and its ${brand.car_count} listing(s). Old links will stop working. Continue?`)
    ) return

    setBusyId(brand.brand_id)
    setRowError(null)
    try {
      const { brand: updated } = await send('/api/admin/brands', {
        method: 'PUT',
        body: JSON.stringify({ brand_id: brand.brand_id, brand_name: editName }),
      })
      setBrands((current) => current.map((item) => (item.brand_id === brand.brand_id ? { ...item, ...updated } : item)).sort(byName))
      setEditingId(null)
    } catch (err) {
      setRowError({ id: brand.brand_id, message: err instanceof Error ? err.message : 'Could not rename the brand.' })
    } finally {
      setBusyId(null)
    }
  }

  const deleteBrand = async (brand: AdminBrand) => {
    if (!confirm(`Delete the brand "${brand.brand_name}"? This cannot be undone.`)) return
    setBusyId(brand.brand_id)
    setRowError(null)
    try {
      await send(`/api/admin/brands?brand_id=${encodeURIComponent(brand.brand_id)}`, { method: 'DELETE' })
      setBrands((current) => current.filter((item) => item.brand_id !== brand.brand_id))
    } catch (err) {
      setRowError({ id: brand.brand_id, message: err instanceof Error ? err.message : 'Could not delete the brand.' })
    } finally {
      setBusyId(null)
    }
  }

  if (authLoading || !user || user.user_type !== 'admin') return null

  const query = search.trim().toLowerCase()
  const visible = query ? brands.filter((brand) => brand.brand_name.toLowerCase().includes(query)) : brands

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Link href="/admin" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-900 mb-4">
          <ArrowLeft className="h-4 w-4 mr-1" /> Admin dashboard
        </Link>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center">
          <Tags className="h-7 w-7 text-gold-700 mr-3" /> Car brands
        </h1>
        <p className="text-gray-600 mt-1">Add, rename and remove the makes sellers can pick from.</p>

        <form onSubmit={addBrand} className="mt-6 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <label htmlFor="new-brand" className="block text-sm font-medium text-gray-700 mb-2">Add a brand</label>
          <div className="flex gap-2">
            <input
              id="new-brand"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              maxLength={50}
              placeholder="e.g. Suzuki"
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
              placeholder="Search brands"
              className="h-10 w-full rounded-lg border border-gray-300 pl-9 pr-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gold-600"
            />
          </div>
          {!loading && !error && <p className="text-sm text-gray-500">{brands.length} brands</p>}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-500">
            <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading brands...
          </div>
        ) : error ? (
          <p className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p>
        ) : visible.length === 0 ? (
          <p className="mt-6 rounded-lg border border-gray-200 bg-gray-50 p-8 text-center text-sm text-gray-500">
            {query ? 'No brands match your search.' : 'No brands yet. Add the first one above.'}
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white shadow-sm">
            {visible.map((brand) => {
              const editing = editingId === brand.brand_id
              const busy = busyId === brand.brand_id
              return (
                <li key={brand.brand_id} className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {editing ? (
                      <input
                        autoFocus
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveEdit(brand)
                          if (e.key === 'Escape') setEditingId(null)
                        }}
                        maxLength={50}
                        aria-label="Brand name"
                        className="h-9 flex-1 rounded-lg border border-gray-300 px-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gold-600"
                      />
                    ) : (
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{brand.brand_name}</p>
                        <p className="text-xs text-gray-500">
                          {brand.car_count === 0 ? 'No listings' : `${brand.car_count} listing${brand.car_count === 1 ? '' : 's'}`}
                        </p>
                      </div>
                    )}

                    <div className="flex items-center gap-1 shrink-0">
                      {busy ? (
                        <Loader2 className="h-4 w-4 animate-spin text-gray-400 m-2" />
                      ) : editing ? (
                        <>
                          <button onClick={() => saveEdit(brand)} disabled={!editName.trim()} title="Save" className="rounded-lg p-2 text-green-700 hover:bg-green-50 disabled:opacity-40">
                            <Check className="h-4 w-4" />
                          </button>
                          <button onClick={() => setEditingId(null)} title="Cancel" className="rounded-lg p-2 text-gray-500 hover:bg-gray-100">
                            <X className="h-4 w-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => startEdit(brand)} title="Rename" className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900">
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => deleteBrand(brand)}
                            disabled={brand.car_count > 0}
                            title={brand.car_count > 0 ? 'Brands with listings cannot be deleted' : 'Delete'}
                            className="rounded-lg p-2 text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:text-gray-300 disabled:hover:bg-transparent"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  {rowError?.id === brand.brand_id && <p className="mt-1 text-sm text-red-600">{rowError.message}</p>}
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </Layout>
  )
}
