'use client'

import { Car } from 'lucide-react'
import { ListManager } from '@/components/admin/ListManager'

export default function AdminBodyTypesPage() {
  return (
    <ListManager
      title="Body types"
      description="Add, rename and remove the body types sellers can pick from and buyers can filter by."
      icon={<Car className="h-7 w-7 text-gold-700" />}
      endpoint="/api/admin/body-types"
      noun="body type"
      placeholder="e.g. Crossover"
      maxLength={40}
    />
  )
}
