'use client'

import { useEffect, useRef, useState } from 'react'
import { Banknote, ChevronDown, Search, Store, Tag } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { cn, formatCompactPrice } from '@/lib/utils'

export type CarSearchValues = {
  search: string
  brand_id: string
  seller_id: string
  min_price: string
  max_price: string
}

export type SearchOptions = {
  brands: { brand_id: string; brand_name: string }[]
  sellers: { seller_id: string; fullname: string; listings_count: number }[]
  priceRange: { min: number; max: number } | null
}

export const EMPTY_SEARCH_VALUES: CarSearchValues = {
  search: '',
  brand_id: '',
  seller_id: '',
  min_price: '',
  max_price: '',
}

export function useSearchOptions() {
  const [options, setOptions] = useState<SearchOptions>({ brands: [], sellers: [], priceRange: null })

  useEffect(() => {
    fetch('/api/search-options')
      .then((response) => response.json())
      .then((data) => {
        if (data.brands) setOptions(data)
      })
      .catch(() => {})
  }, [])

  return options
}

// Pick a round slider step so the track has roughly 100 positions.
function sliderBounds(range: SearchOptions['priceRange']) {
  if (!range) return null
  const steps = [50_000, 100_000, 250_000, 500_000, 1_000_000, 2_500_000, 5_000_000, 10_000_000, 25_000_000]
  const step = steps.find((candidate) => (range.max - range.min) / candidate <= 100) ?? steps[steps.length - 1]
  const min = Math.floor(range.min / step) * step
  const max = Math.max(Math.ceil(range.max / step) * step, min + step)
  return { min, max, step }
}

export function priceLabel(minPrice: string, maxPrice: string) {
  if (minPrice && maxPrice) return `UGX ${formatCompactPrice(Number(minPrice))} – ${formatCompactPrice(Number(maxPrice))}`
  if (minPrice) return `From UGX ${formatCompactPrice(Number(minPrice))}`
  if (maxPrice) return `Up to UGX ${formatCompactPrice(Number(maxPrice))}`
  return ''
}

const segmentClass =
  'relative flex items-center h-11 rounded-xl bg-gray-50 md:bg-transparent md:rounded-none hover:bg-gray-100 md:hover:bg-gray-50 transition-colors'

interface CarSearchBarProps {
  options: SearchOptions
  values?: CarSearchValues
  onSubmit: (values: CarSearchValues) => void
  /** Apply changes as the user types or picks, without pressing Search. */
  live?: boolean
  className?: string
}

export function CarSearchBar({ options, values = EMPTY_SEARCH_VALUES, onSubmit, live = false, className }: CarSearchBarProps) {
  const [draft, setDraft] = useState(values)
  const [priceOpen, setPriceOpen] = useState(false)
  const priceRef = useRef<HTMLDivElement>(null)
  const bounds = sliderBounds(options.priceRange)

  // Follow outside changes, e.g. a filter tag being removed.
  const valuesKey = JSON.stringify(values)
  useEffect(() => {
    setDraft(values)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valuesKey])

  // Wait for a short pause so typing or dragging the slider sends one request.
  const onSubmitRef = useRef(onSubmit)
  onSubmitRef.current = onSubmit
  useEffect(() => {
    if (!live || JSON.stringify(draft) === valuesKey) return
    const timer = setTimeout(() => onSubmitRef.current(draft), 400)
    return () => clearTimeout(timer)
  }, [draft, live, valuesKey])

  useEffect(() => {
    if (!priceOpen) return
    const close = (event: MouseEvent) => {
      if (!priceRef.current?.contains(event.target as Node)) setPriceOpen(false)
    }
    const closeOnEscape = (event: KeyboardEvent) => event.key === 'Escape' && setPriceOpen(false)
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [priceOpen])

  const update = (patch: Partial<CarSearchValues>) => setDraft((current) => ({ ...current, ...patch }))

  const submit = (event?: React.FormEvent) => {
    event?.preventDefault()
    setPriceOpen(false)
    onSubmit(draft)
  }

  const low = bounds ? Math.min(Math.max(Number(draft.min_price) || bounds.min, bounds.min), bounds.max) : 0
  const high = bounds ? Math.max(Math.min(Number(draft.max_price) || bounds.max, bounds.max), low) : 0
  const percent = (value: number) => (bounds ? ((value - bounds.min) / (bounds.max - bounds.min)) * 100 : 0)

  const setLow = (value: number) => {
    if (!bounds) return
    const next = Math.min(value, high)
    update({ min_price: next <= bounds.min ? '' : String(next) })
  }

  const setHigh = (value: number) => {
    if (!bounds) return
    const next = Math.max(value, low)
    update({ max_price: next >= bounds.max ? '' : String(next) })
  }

  const currentPriceLabel = priceLabel(draft.min_price, draft.max_price)

  return (
    <form
      onSubmit={submit}
      className={cn(
        'bg-white border border-gray-200 rounded-2xl shadow-sm p-2 flex flex-col md:flex-row md:items-center gap-2 md:gap-0 text-left',
        className
      )}
    >
      {/* Keyword */}
      <div className="relative flex-1 min-w-0">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        <input
          type="text"
          aria-label="Search by keyword"
          placeholder="Search make, model or keyword"
          value={draft.search}
          onChange={(event) => update({ search: event.target.value })}
          className="w-full h-11 pl-10 pr-3 text-sm bg-transparent text-gray-900 placeholder-gray-400 rounded-xl border border-gray-200 md:border-0 focus:outline-none focus:ring-2 focus:ring-blue-500 md:focus:ring-0"
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 md:flex md:gap-0 md:divide-x md:divide-gray-200 md:border-l md:border-gray-200">
        {/* Brand */}
        <label className={cn(segmentClass, 'md:w-40')}>
          <Tag className="absolute left-3 h-4 w-4 text-gray-400 pointer-events-none" />
          <span className="sr-only">Brand</span>
          <select
            value={draft.brand_id}
            onChange={(event) => update({ brand_id: event.target.value })}
            className="w-full h-full appearance-none bg-transparent pl-9 pr-8 text-sm text-gray-700 truncate cursor-pointer focus:outline-none"
          >
            <option value="">All brands</option>
            {options.brands.map((brand) => (
              <option key={brand.brand_id} value={brand.brand_id}>{brand.brand_name}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 h-4 w-4 text-gray-400 pointer-events-none" />
        </label>

        {/* Seller */}
        <label className={cn(segmentClass, 'md:w-44')}>
          <Store className="absolute left-3 h-4 w-4 text-gray-400 pointer-events-none" />
          <span className="sr-only">Seller</span>
          <select
            value={draft.seller_id}
            onChange={(event) => update({ seller_id: event.target.value })}
            className="w-full h-full appearance-none bg-transparent pl-9 pr-8 text-sm text-gray-700 truncate cursor-pointer focus:outline-none"
          >
            <option value="">All sellers</option>
            {options.sellers.map((seller) => (
              <option key={seller.seller_id} value={seller.seller_id}>
                {seller.fullname} ({seller.listings_count})
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 h-4 w-4 text-gray-400 pointer-events-none" />
        </label>

        {/* Price */}
        <div ref={priceRef} className="relative col-span-2 sm:col-span-1">
          <button
            type="button"
            aria-expanded={priceOpen}
            onClick={() => setPriceOpen((open) => !open)}
            className={cn(segmentClass, 'w-full md:w-48 pl-9 pr-8 text-sm focus:outline-none', currentPriceLabel ? 'text-blue-700 font-medium' : 'text-gray-700')}
          >
            <Banknote className="absolute left-3 h-4 w-4 text-gray-400" />
            <span className="truncate">{currentPriceLabel || 'Any price'}</span>
            <ChevronDown className={cn('absolute right-3 h-4 w-4 text-gray-400 transition-transform', priceOpen && 'rotate-180')} />
          </button>

          {priceOpen && (
            <div className="absolute z-30 mt-2 left-0 right-0 sm:left-auto sm:w-80 bg-white border border-gray-200 rounded-2xl shadow-lg p-4">
              <div className="flex items-baseline justify-between mb-4">
                <p className="text-sm font-semibold text-gray-900">Price range</p>
                <p className="text-xs font-medium text-blue-700">{currentPriceLabel || 'Any price'}</p>
              </div>

              {bounds ? (
                <>
                  <div className="relative h-5 mb-2">
                    <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-1.5 rounded-full bg-gray-200" />
                    <div
                      className="absolute top-1/2 -translate-y-1/2 h-1.5 rounded-full bg-blue-600"
                      style={{ left: `${percent(low)}%`, right: `${100 - percent(high)}%` }}
                    />
                    <input
                      type="range"
                      aria-label="Minimum price"
                      min={bounds.min}
                      max={bounds.max}
                      step={bounds.step}
                      value={low}
                      onChange={(event) => setLow(Number(event.target.value))}
                      className={cn('range-thumb absolute inset-0 w-full h-5', low >= bounds.max - bounds.step && 'z-10')}
                    />
                    <input
                      type="range"
                      aria-label="Maximum price"
                      min={bounds.min}
                      max={bounds.max}
                      step={bounds.step}
                      value={high}
                      onChange={(event) => setHigh(Number(event.target.value))}
                      className="range-thumb absolute inset-0 w-full h-5"
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-400 mb-4">
                    <span>{formatCompactPrice(bounds.min)}</span>
                    <span>{formatCompactPrice(bounds.max)}</span>
                  </div>
                </>
              ) : (
                <p className="text-xs text-gray-500 mb-4">Enter the price range you are looking for.</p>
              )}

              <div className="flex items-center gap-2">
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  aria-label="Minimum price in UGX"
                  placeholder="Min"
                  value={draft.min_price}
                  onChange={(event) => update({ min_price: event.target.value })}
                  className="w-full h-10 px-3 text-sm border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-gray-300">–</span>
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  aria-label="Maximum price in UGX"
                  placeholder="Max"
                  value={draft.max_price}
                  onChange={(event) => update({ max_price: event.target.value })}
                  className="w-full h-10 px-3 text-sm border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-between mt-4">
                <button
                  type="button"
                  onClick={() => update({ min_price: '', max_price: '' })}
                  className="text-sm text-gray-500 hover:text-gray-900"
                >
                  Reset
                </button>
                <Button type="button" size="sm" onClick={() => setPriceOpen(false)}>
                  Done
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <Button type="submit" className="h-11 px-6 rounded-xl md:ml-2 shrink-0">
        <Search className="h-4 w-4 mr-2" />
        Search
      </Button>
    </form>
  )
}
