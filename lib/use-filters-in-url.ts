'use client'

import { useEffect } from 'react'

/**
 * Keep the page address in step with the active filters, so the link can be
 * shared or bookmarked and opens with the same results.
 */
export function useFiltersInUrl(path: string, filters: Record<string, string>) {
  useEffect(() => {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([key, value]) => {
      if (value.trim()) params.set(key, value.trim())
    })
    const query = params.toString()
    const url = query ? `${path}?${query}` : path
    if (url !== `${window.location.pathname}${window.location.search}`) {
      // replaceState updates the address without adding a history entry per keystroke.
      window.history.replaceState(window.history.state, '', url)
    }
  }, [path, filters])
}
