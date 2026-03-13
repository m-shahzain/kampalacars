import Image from 'next/image'
import Link from 'next/link'
import { CarWithBrand } from '@/lib/types'
import { formatPrice, formatDate } from '@/lib/utils'
import { Calendar, DollarSign, User, Phone } from 'lucide-react'

interface CarCardProps {
  car: CarWithBrand
}

export function CarCard({ car }: CarCardProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg hover:border-gray-300 transition-all duration-300">
      {/* Car Image */}
      <div className="relative h-48 w-full bg-gray-100">
        <Image
          src={car.image_url || '/image1.png'}
          alt={`${car.car_brands.brand_name} ${car.model}`}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      </div>

      {/* Car Details */}
      <div className="p-6">
        <div className="mb-3">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            {car.car_brands.brand_name} {car.model}
          </h3>
          <p className="text-gray-600 text-sm">Year: {car.year}</p>
        </div>

        <p className="text-gray-600 text-sm mb-4 line-clamp-2 leading-relaxed">
          {car.description}
        </p>

        {/* Price */}
        <div className="mb-4">
          <span className="text-2xl font-bold text-blue-600">
            {formatPrice(car.price)}
          </span>
        </div>

        {/* Seller Info */}
        {car.users && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center text-sm text-gray-700 mb-1">
              <User className="h-4 w-4 mr-2 text-gray-500" />
              <span className="font-medium">{car.users.fullname || car.users.email}</span>
            </div>
            {car.users.phone && (
              <div className="flex items-center text-sm text-gray-600">
                <Phone className="h-4 w-4 mr-2 text-gray-500" />
                <span>{car.users.phone}</span>
              </div>
            )}
          </div>
        )}

        {/* Date */}
        <div className="flex items-center text-sm text-gray-500 mb-4">
          <Calendar className="h-4 w-4 mr-2" />
          <span>Listed {formatDate(car.created_at)}</span>
        </div>

        {/* View Details Button */}
        <Link href={`/cars/${car.car_id}`}>
          <button className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium">
            View Details
          </button>
        </Link>
      </div>
    </div>
  )
} 