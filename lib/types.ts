export type User = {
  user_id: string
  fullname: string
  email: string
  password: string
  phone?: string
  address?: string
  user_type: 'seller' | 'buyer' | 'admin'
  is_premium: boolean
  created_at: string
}

export type CarBrand = {
  brand_id: string
  brand_name: string
  created_at: string
}

export type Car = {
  car_id: string
  seller_id: string
  brand_id: string
  model: string
  title: string
  chassis_number?: string
  description?: string
  body_type: 'sedan' | 'hatchback' | 'suv' | 'coupe' | 'convertible' | 'wagon' | 'pickup' | 'van' | 'minivan'
  fuel_type: 'gasoline' | 'diesel' | 'electric' | 'hybrid' | 'cng' | 'lpg'
  year: number
  price: number
  currency: string
  mileage?: number
  color?: string
  engine_size?: string
  transmission: 'manual' | 'automatic' | 'cvt' | 'semi-automatic'
  drive_type?: '2wd' | '4wd'
  features?: string
  is_sold: boolean
  approval_status: 'pending' | 'approved' | 'rejected'
  approved_at?: string | null
  image_urls: string[]
  created_at: string
}

export type CarWithBrand = Car & {
  car_brands: CarBrand
  users: Pick<User, 'user_id' | 'fullname' | 'email' | 'phone' | 'is_premium'>
  contact: Pick<User, 'fullname' | 'email' | 'phone'> & { is_seller: boolean }
}

export type CarWithDetails = Car & {
  brand_name: string
  seller_name: string
  seller_email: string
  seller_phone?: string
}

export type CreateCarData = Omit<Car, 'car_id' | 'created_at' | 'seller_id'>
export type UpdateCarData = Partial<CreateCarData>

export type CreateUserData = Omit<User, 'user_id' | 'created_at'>
export type UpdateUserData = Partial<Omit<User, 'user_id' | 'created_at'>>

export type CarSearchFilters = {
  search?: string
  brand_id?: string
  min_price?: number
  max_price?: number
  min_year?: number
  max_year?: number
  body_type?: Car['body_type']
  fuel_type?: Car['fuel_type']
  transmission?: Car['transmission']
  max_mileage?: number
  is_sold?: boolean
}

export type SortOptions = {
  sort_by?: 'price' | 'year' | 'mileage' | 'created_at'
  sort_order?: 'asc' | 'desc'
}
