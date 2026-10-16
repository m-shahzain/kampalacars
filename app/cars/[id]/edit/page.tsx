'use client'

import { ChangeEvent, FormEvent, useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Layout } from '@/components/Layout'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/lib/auth-context'
import { compressImages } from '@/lib/compress-image'
import { CarBrand, CarWithBrand } from '@/lib/types'

const initialForm = {
  brand_id: '', model: '', title: '', chassis_number: '', description: '',
  body_type: 'sedan', fuel_type: 'gasoline', year: new Date().getFullYear(),
  price: '', mileage: '', color: '', engine_size: '', transmission: 'automatic',
  drive_type: '2wd', features: '', image_urls: [] as string[],
}

export default function EditCarPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [form, setForm] = useState(initialForm)
  const [brands, setBrands] = useState<CarBrand[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [processingPhotos, setProcessingPhotos] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (authLoading) return
    if (!user) { router.replace('/auth/login'); return }
    if (user.user_type === 'admin') { router.replace('/admin'); return }

    Promise.all([fetch(`/api/cars/${id}`), fetch('/api/brands')])
      .then(async ([carResponse, brandsResponse]) => {
        const carData = await carResponse.json()
        const brandData = await brandsResponse.json()
        if (!carResponse.ok) throw new Error(carData.error || 'Unable to load this listing')
        const car: CarWithBrand = carData.car
        if (car.seller_id !== user.user_id) throw new Error('You can only edit your own listings')
        setForm({
          brand_id: car.brand_id, model: car.model, title: car.title,
          chassis_number: car.chassis_number || '', description: car.description || '',
          body_type: car.body_type, fuel_type: car.fuel_type, year: car.year,
          price: String(car.price), mileage: car.mileage ? String(car.mileage) : '',
          color: car.color || '', engine_size: car.engine_size || '',
          transmission: car.transmission, drive_type: car.drive_type || '2wd',
          features: car.features || '', image_urls: car.image_urls || [],
        })
        if (brandsResponse.ok) setBrands(brandData.brands)
      })
      .catch((reason) => setError(reason instanceof Error ? reason.message : 'Unable to load listing'))
      .finally(() => setLoading(false))
  }, [authLoading, id, router, user])

  const uploadPhotos = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    event.target.value = ''
    if (!files.length) return
    setError('')
    let compressed: File[]
    setProcessingPhotos(true)
    try { compressed = await compressImages(files) }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to process photos'); return }
    finally { setProcessingPhotos(false) }
    setUploading(true)
    try {
      const urls = await Promise.all(compressed.map(async (file) => {
        const data = new FormData(); data.append('file', file)
        const response = await fetch('/api/upload', { method: 'POST', body: data })
        const result = await response.json()
        if (!response.ok) throw new Error(result.error || 'Unable to upload photo')
        return result.url as string
      }))
      setForm((current) => ({ ...current, image_urls: [...current.image_urls, ...urls] }))
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to upload photos') }
    finally { setUploading(false) }
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!form.image_urls.length) { setError('Add at least one photo.'); return }
    setSaving(true); setError('')
    try {
      const response = await fetch(`/api/cars/${id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, year: Number(form.year), price: Number(form.price), mileage: form.mileage ? Number(form.mileage) : null }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Unable to save listing')
      router.push('/dashboard')
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to save listing') }
    finally { setSaving(false) }
  }

  if (authLoading || loading) return <Layout><div className="container mx-auto px-4 py-12 text-center text-gray-600">Loading listing...</div></Layout>

  return <Layout><div className="container mx-auto max-w-4xl px-4 py-8">
    <h1 className="mb-2 text-2xl font-bold text-gray-900">Edit Car Listing</h1>
    <p className="mb-6 text-sm text-gray-600">Changes to listing details will be sent for admin approval.</p>
    {error && <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    <form onSubmit={submit} className="space-y-6 rounded-lg border border-gray-200 bg-white p-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field label="Brand"><select required value={form.brand_id} onChange={e => setForm({...form, brand_id: e.target.value})}>{brands.map(b => <option key={b.brand_id} value={b.brand_id}>{b.brand_name}</option>)}</select></Field>
        <Field label="Model"><input required value={form.model} onChange={e => setForm({...form, model: e.target.value})}/></Field>
        <Field label="Listing title"><input required value={form.title} onChange={e => setForm({...form, title: e.target.value})}/></Field>
        <Field label="Chassis number"><input required value={form.chassis_number} onChange={e => setForm({...form, chassis_number: e.target.value})}/></Field>
        <Field label="Year"><input required type="number" value={form.year} onChange={e => setForm({...form, year: Number(e.target.value)})}/></Field>
        <Field label="Price (UGX)"><input required min="1" type="number" value={form.price} onChange={e => setForm({...form, price: e.target.value})}/></Field>
        <Field label="Body type"><select value={form.body_type} onChange={e => setForm({...form, body_type: e.target.value})}>{['sedan','hatchback','suv','coupe','convertible','wagon','pickup','van','minivan'].map(v => <option key={v}>{v}</option>)}</select></Field>
        <Field label="Fuel type"><select value={form.fuel_type} onChange={e => setForm({...form, fuel_type: e.target.value})}>{['gasoline','diesel','electric','hybrid','cng','lpg'].map(v => <option key={v}>{v}</option>)}</select></Field>
        <Field label="Transmission"><select value={form.transmission} onChange={e => setForm({...form, transmission: e.target.value})}>{['automatic','manual','cvt','semi-automatic'].map(v => <option key={v}>{v}</option>)}</select></Field>
        <Field label="Drive type"><select value={form.drive_type} onChange={e => setForm({...form, drive_type: e.target.value})}><option value="2wd">2WD</option><option value="4wd">4WD</option></select></Field>
        <Field label="Mileage (km)"><input type="number" value={form.mileage} onChange={e => setForm({...form, mileage: e.target.value})}/></Field>
        <Field label="Color"><input value={form.color} onChange={e => setForm({...form, color: e.target.value})}/></Field>
        <Field label="Engine size"><input value={form.engine_size} onChange={e => setForm({...form, engine_size: e.target.value})}/></Field>
      </div>
      <Field label="Description"><textarea rows={4} value={form.description} onChange={e => setForm({...form, description: e.target.value})}/></Field>
      <Field label="Features"><textarea rows={3} value={form.features} onChange={e => setForm({...form, features: e.target.value})}/></Field>
      <div><label className="mb-2 block text-sm font-medium text-gray-700">Photos</label><div className="mb-3 flex flex-wrap gap-3">{form.image_urls.map((url, index) => <div key={`${url}-${index}`} className="relative h-24 w-32 overflow-hidden rounded border"><img src={url} alt={`Car photo ${index + 1}`} className="h-full w-full object-cover"/><button type="button" onClick={() => setForm({...form, image_urls: form.image_urls.filter((_, i) => i !== index)})} className="absolute right-1 top-1 rounded bg-red-600 px-2 py-1 text-xs text-white">Remove</button></div>)}</div><input type="file" accept="image/jpeg,image/png,image/webp" multiple disabled={uploading || processingPhotos} onChange={uploadPhotos}/><p className="mt-1 text-xs text-gray-500" aria-live="polite">{processingPhotos ? 'Processing photos...' : uploading ? 'Uploading photos...' : 'Add or remove photos. JPG, PNG, or WebP.'}</p></div>
      <div className="flex justify-end gap-3"><Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button><Button type="submit" loading={saving || uploading || processingPhotos}>Save Changes</Button></div>
    </form>
  </div></Layout>
}

function Field({ label, children }: { label: string, children: React.ReactNode }) {
  return <label className="block text-sm font-medium text-gray-700">{label}<span className="mt-1 block [&_input]:w-full [&_input]:rounded-md [&_input]:border [&_input]:border-gray-300 [&_input]:px-3 [&_input]:py-2 [&_select]:w-full [&_select]:rounded-md [&_select]:border [&_select]:border-gray-300 [&_select]:px-3 [&_select]:py-2 [&_textarea]:w-full [&_textarea]:rounded-md [&_textarea]:border [&_textarea]:border-gray-300 [&_textarea]:px-3 [&_textarea]:py-2">{children}</span></label>
}
