
'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { CarWithBrand } from '@/lib/types'
import { formatPrice } from '@/lib/utils'
import { Fuel, Gauge, Car as CarIcon } from 'lucide-react'

interface CarCardProps {
  car: CarWithBrand
  priority?: boolean
}

export function CarCard({ car, priority = false }: CarCardProps) {
  const [imgError, setImgError] = useState(false)

  return (
    <Link href={`/cars/${car.car_id}`} className="group block">
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md hover:border-gray-300 transition-all duration-200">
        <div className="relative aspect-[16/10] w-full bg-gray-100">
          {imgError ? (
            <div className="flex items-center justify-center h-full bg-gray-50">
              <CarIcon className="h-12 w-12 text-gray-300" />
            </div>
          ) : (
            <Image
              src={car.image_urls?.[0] || '/car-placeholder.svg'}
              alt={`${car.car_brands.brand_name} ${car.model}`}
              fill
              className="object-cover group-hover:scale-[1.02] transition-transform duration-200"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              priority={priority}
              onError={() => setImgError(true)}
            />
          )}
          {car.is_sold && (
            <div className="absolute top-2 left-2 bg-red-600 text-white text-xs font-semibold px-2 py-1 rounded">
              SOLD
            </div>
          )}
        </div>

        <div className="p-4">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="text-sm font-semibold text-gray-900 line-clamp-1 group-hover:text-blue-600 transition-colors">
              {car.car_brands.brand_name} {car.model}
            </h3>
            <span className="text-xs text-gray-500 shrink-0">{car.year}</span>
          </div>

          <p className="text-lg font-bold text-gray-900 mb-2">
            {formatPrice(car.price)}
          </p>

          <div className="flex items-center gap-3 text-xs text-gray-500">
            {car.mileage && (
              <span className="flex items-center gap-1">
                <Gauge className="h-3.5 w-3.5" />
                {car.mileage.toLocaleString()} km
              </span>
            )}
            <span className="flex items-center gap-1">
              <Fuel className="h-3.5 w-3.5" />
              {car.fuel_type}
            </span>
            <span className="capitalize">{car.transmission}</span>
          </div>
        </div>
      </div>
    </Link>
  )
}
