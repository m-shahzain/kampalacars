import type { Car } from '@/lib/types'

// Words buyers in Uganda use, e.g. "Petrol" rather than "gasoline".
const FUEL: Record<Car['fuel_type'], string> = {
  gasoline: 'Petrol', diesel: 'Diesel', electric: 'Electric', hybrid: 'Hybrid', cng: 'CNG', lpg: 'LPG',
}
const TRANSMISSION: Record<Car['transmission'], string> = {
  automatic: 'Automatic', manual: 'Manual', cvt: 'CVT', 'semi-automatic': 'Semi-automatic',
}
const BODY: Record<Car['body_type'], string> = {
  sedan: 'Sedan', hatchback: 'Hatchback', suv: 'SUV', coupe: 'Coupe', convertible: 'Convertible',
  wagon: 'Station wagon', pickup: 'Pickup', van: 'Van', minivan: 'Minivan',
}

export const fuelLabel = (fuel?: string | null) => (fuel ? FUEL[fuel as Car['fuel_type']] ?? fuel : '')
export const transmissionLabel = (value?: string | null) => (value ? TRANSMISSION[value as Car['transmission']] ?? value : '')
export const bodyLabel = (body?: string | null) => (body ? BODY[body as Car['body_type']] ?? body : '')
export const driveLabel = (drive?: string | null) => (drive ? drive.toUpperCase() : '')
export const mileageLabel = (mileage?: number | null) => (mileage ? `${Number(mileage).toLocaleString('en-UG')} km` : '')
