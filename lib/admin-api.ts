// Shared pieces of the admin list APIs (brands, body types).
import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'

export async function isAdmin() {
  const session = await getSession()
  return session?.userType === 'admin'
}

export const forbidden = () => NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 403 })

export const badRequest = (error: string, status = 400) => NextResponse.json({ error }, { status })

/** Explains a missing server key or migration instead of a bare "Internal server error". */
export function serverError(error: unknown, migration?: { table: string; file: string }) {
  console.error('Admin request failed:', error)
  const text = error instanceof Error ? error.message : String((error as { message?: string })?.message ?? '')
  const message = text.includes('SUPABASE_SERVICE_ROLE_KEY')
    ? 'Server setup: SUPABASE_SERVICE_ROLE_KEY is missing. Add it in your hosting settings and redeploy.'
    : migration && text.includes(migration.table)
      ? `Not set up yet: run ${migration.file} in Supabase.`
      : 'Internal server error'
  return NextResponse.json({ error: message }, { status: 500 })
}

/** Trims and collapses spaces: "  land  rover " -> "land rover". */
export function cleanName(value: unknown, maxLength: number): { name: string } | { error: string } {
  const name = typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : ''
  if (!name) return { error: 'Enter a name.' }
  if (name.length > maxLength) return { error: `Names can be at most ${maxLength} characters.` }
  return { name }
}

/** Escapes % and _ so a name can be matched exactly (ignoring case) with ilike. */
export const ilikeExact = (value: string) => value.replace(/[\\%_]/g, '\\$&')

/** Supabase returns an embedded count as [{ count }]. */
export const embeddedCount = (value: unknown) => (value as { count: number }[] | null)?.[0]?.count ?? 0
