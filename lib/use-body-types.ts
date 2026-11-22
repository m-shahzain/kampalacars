'use client'

import { useEffect, useState } from 'react'
import { DEFAULT_BODY_TYPES, type BodyType } from '@/lib/body-types'

let cached: Promise<BodyType[]> | null = null

/** The live list of body types, shared by every component on the page. */
export function useBodyTypes() {
  const [types, setTypes] = useState<BodyType[]>(DEFAULT_BODY_TYPES)
  useEffect(() => {
    cached ??= fetch('/api/body-types')
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => (data?.bodyTypes?.length ? data.bodyTypes : DEFAULT_BODY_TYPES))
      .catch(() => {
        cached = null
        return DEFAULT_BODY_TYPES
      })
    let active = true
    cached.then((list) => { if (active) setTypes(list) })
    return () => { active = false }
  }, [])
  return types
}
