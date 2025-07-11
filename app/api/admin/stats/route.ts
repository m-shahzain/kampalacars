import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

// Check if user is admin
async function checkAdminAuth() {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get('session')

  if (!sessionCookie) {
    return { isAdmin: false, user: null }
  }

  const sessionData = JSON.parse(sessionCookie.value)
  return { 
    isAdmin: sessionData.userType === 'admin', 
    user: sessionData 
  }
}

// GET /api/admin/stats - Get dashboard statistics (admin only)
export async function GET() {
  try {
    const { isAdmin } = await checkAdminAuth()
    
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 403 })
    }

    const supabase = await createClient()

    // Get total counts
    const [
      { count: totalUsers },
      { count: totalCars },
      { count: activeCars },
      { count: soldCars },
      { count: sellers },
      { count: buyers },
      { count: admins }
    ] = await Promise.all([
      supabase.from('users').select('*', { count: 'exact', head: true }),
      supabase.from('cars').select('*', { count: 'exact', head: true }),
      supabase.from('cars').select('*', { count: 'exact', head: true }).eq('is_sold', false),
      supabase.from('cars').select('*', { count: 'exact', head: true }).eq('is_sold', true),
      supabase.from('users').select('*', { count: 'exact', head: true }).eq('user_type', 'seller'),
      supabase.from('users').select('*', { count: 'exact', head: true }).eq('user_type', 'buyer'),
      supabase.from('users').select('*', { count: 'exact', head: true }).eq('user_type', 'admin')
    ])

    // Get recent users (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    
    const { count: newUsersThisWeek } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', sevenDaysAgo.toISOString())

    // Get recent cars (last 7 days)
    const { count: newCarsThisWeek } = await supabase
      .from('cars')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', sevenDaysAgo.toISOString())

    // Get top brands by car count
    const { data: topBrands } = await supabase
      .from('cars')
      .select(`
        brand_id,
        car_brands!inner(brand_name)
      `)
      .then(({ data, error }) => {
        if (error) return { data: [] }
        
        // Count cars by brand
        const brandCounts = data?.reduce((acc: any, car: any) => {
          const brandName = car.car_brands.brand_name
          acc[brandName] = (acc[brandName] || 0) + 1
          return acc
        }, {})

        // Convert to array and sort
        const sortedBrands = Object.entries(brandCounts || {})
          .map(([name, count]) => ({ brand_name: name, count }))
          .sort((a: any, b: any) => b.count - a.count)
          .slice(0, 5)

        return { data: sortedBrands }
      })

    // Get recent activities (latest cars and users)
    const { data: recentCars } = await supabase
      .from('cars')
      .select(`
        car_id,
        title,
        created_at,
        car_brands!inner(brand_name),
        users!inner(fullname)
      `)
      .order('created_at', { ascending: false })
      .limit(5)

    const { data: recentUsers } = await supabase
      .from('users')
      .select('user_id, fullname, email, user_type, created_at')
      .order('created_at', { ascending: false })
      .limit(5)

    return NextResponse.json({
      totalUsers: totalUsers || 0,
      totalCars: totalCars || 0,
      activeCars: activeCars || 0,
      soldCars: soldCars || 0,
      usersByType: {
        sellers: sellers || 0,
        buyers: buyers || 0,
        admins: admins || 0
      },
      thisWeek: {
        newUsers: newUsersThisWeek || 0,
        newCars: newCarsThisWeek || 0
      },
      topBrands: topBrands || [],
      recentActivity: {
        cars: recentCars || [],
        users: recentUsers || []
      }
    })
  } catch (error) {
    console.error('Admin stats error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 