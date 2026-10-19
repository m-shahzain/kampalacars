'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { Layout } from '@/components/Layout'
import { Button } from '@/components/ui/Button'
import { User, Phone, MapPin, AlertCircle, Loader2 } from 'lucide-react'

const inputClass = 'block w-full pl-10 pr-3 py-2.5 text-sm border border-gray-300 rounded-lg placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-gold-600 focus:border-transparent'

function nextPath() {
  const next = new URLSearchParams(window.location.search).get('next')
  return next && next.startsWith('/') && !next.startsWith('//') ? next : '/dashboard'
}

// Shown once after a first Google sign-in, which does not share a phone number or address.
export default function CompleteProfilePage() {
  const { user, loading, updateProfile } = useAuth()
  const router = useRouter()
  const [form, setForm] = useState({ fullName: '', phone: '', address: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (loading) return
    if (!user) {
      router.replace('/auth/login')
      return
    }
    setForm({ fullName: user.fullname || '', phone: user.phone || '', address: user.address || '' })
  }, [loading, user, router])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    const { error } = await updateProfile({ full_name: form.fullName.trim(), phone: form.phone.trim(), address: form.address.trim() })
    if (error) {
      setError(error.message)
      setSaving(false)
    } else {
      router.replace(nextPath())
    }
  }

  if (loading || !user) {
    return (
      <Layout>
        <div className="flex justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-gold-700" />
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="flex items-center justify-center py-16 px-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-6">
            <img src="/logo.webp" alt="Kampala Cars logo" width={80} height={80} className="mx-auto h-20 w-20 rounded-xl mb-4" />
            <h2 className="text-xl font-bold text-gray-900">Almost done</h2>
            <p className="mt-1 text-sm text-gray-500">Buyers contact sellers by phone, so we need a few details</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">Name/Company</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input id="fullName" required maxLength={50} value={form.fullName} onChange={(event) => setForm({ ...form, fullName: event.target.value })} className={inputClass} placeholder="Your name or company" />
                </div>
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input id="phone" type="tel" autoComplete="tel" required maxLength={20} value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} className={inputClass} placeholder="+256 700 000 000" />
                </div>
              </div>

              <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <textarea id="address" required rows={2} value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} className={inputClass} placeholder="Your area, city, and street address" />
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <Button type="submit" loading={saving} className="w-full" size="md">
                Continue
              </Button>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  )
}
