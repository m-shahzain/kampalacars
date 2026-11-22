'use client'

import { Tags } from 'lucide-react'
import { ListManager } from '@/components/admin/ListManager'

export default function AdminBrandsPage() {
  return (
    <ListManager
      title="Car brands"
      description="Add, rename and remove the makes sellers can pick from."
      icon={<Tags className="h-7 w-7 text-gold-700" />}
      endpoint="/api/admin/brands"
      noun="brand"
      placeholder="e.g. Suzuki"
      renameWarning={(brand) =>
        `Renaming "${brand.name}" changes the address of its brand page and its ${brand.car_count} listing(s). Old links will stop working. Continue?`
      }
    />
  )
}
