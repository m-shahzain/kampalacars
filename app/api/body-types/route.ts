import { NextResponse } from 'next/server'
import { getBodyTypes } from '@/lib/cars-server'

// GET /api/body-types - The body types sellers can choose, for forms and filters.
export async function GET() {
  return NextResponse.json({ bodyTypes: await getBodyTypes() })
}
