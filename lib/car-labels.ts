import type { Car } from '@/lib/types'
import { bodyTypeName, type BodyType } from '@/lib/body-types'

// Words buyers in Uganda use, e.g. "Petrol" rather than "gasoline".
const FUEL: Record<Car['fuel_type'], string> = {
  gasoline: 'Petrol', diesel: 'Diesel', electric: 'Electric', hybrid: 'Hybrid', cng: 'CNG', lpg: 'LPG',
}
const TRANSMISSION: Record<Car['transmission'], string> = {
  automatic: 'Automatic', manual: 'Manual', cvt: 'CVT', 'semi-automatic': 'Semi-automatic',
}

export const fuelLabel = (fuel?: string | null) => (fuel ? FUEL[fuel as Car['fuel_type']] ?? fuel : '')
export const transmissionLabel = (value?: string | null) => (value ? TRANSMISSION[value as Car['transmission']] ?? value : '')
/** Pass the live list (getBodyTypes) to show names admins have added or changed. */
export const bodyLabel = (body?: string | null, types?: BodyType[]) => bodyTypeName(body, types)
export const driveLabel = (drive?: string | null) => (drive ? drive.toUpperCase() : '')
export const mileageLabel = (mileage?: number | null) => (mileage ? `${Number(mileage).toLocaleString('en-UG')} km` : '')
