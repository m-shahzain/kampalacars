import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { createAdminClient } from '@/lib/supabase/admin'

// Check if user is admin
async function checkAdminAuth() {
  const session = await getSession()
  return { isAdmin: session?.userType === 'admin', user: session }
}

// Explain a missing server key instead of a bare "Internal server error".
function adminErrorResponse(error: unknown) {
  console.error('Admin users request failed:', error)
  const message = error instanceof Error && error.message.includes('SUPABASE_SERVICE_ROLE_KEY')
    ? 'Server setup: SUPABASE_SERVICE_ROLE_KEY is missing. Add it in your hosting settings and redeploy.'
    : 'Internal server error'
  return NextResponse.json({ error: message }, { status: 500 })
}

// GET /api/admin/users - Get all users (admin only)
export async function GET(request: NextRequest) {
  try {
    const { isAdmin } = await checkAdminAuth()
    
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 403 })
    }

    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search')
    const userType = searchParams.get('user_type')
    const offset = (page - 1) * limit

    let query = supabase
      .from('users')
      .select('user_id, fullname, email, phone, user_type, is_premium, created_at')
      .order('created_at', { ascending: false })

    // Apply filters
    if (search) {
      query = query.or(`fullname.ilike.%${search}%,email.ilike.%${search}%`)
    }

    if (userType) {
      query = query.eq('user_type', userType)
    }

    // Get total count
    const { count } = await query

    // Apply pagination
    const { data: users, error } = await query.range(offset, offset + limit - 1)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ 
      users, 
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })
  } catch (error) {
    return adminErrorResponse(error)
  }
}

// PUT /api/admin/users - Update user (admin only)
export async function PUT(request: NextRequest) {
  try {
    const { isAdmin } = await checkAdminAuth()
    
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 403 })
    }

    // Roles and emails are protected columns, so admin changes use the service role.
    const supabase = createAdminClient()
    const body = await request.json()
    const { user_id, fullname, email, phone, user_type, is_premium } = body

    if (!user_id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Keep the login email in sync with the profile email.
    if (email) {
      const { data: authUser } = await supabase.auth.admin.getUserById(user_id)
      if (authUser.user && authUser.user.email !== email) {
        const { error: authError } = await supabase.auth.admin.updateUserById(user_id, { email, email_confirm: true })
        if (authError) {
          return NextResponse.json({ error: authError.message }, { status: 400 })
        }
      }
    }

    const { data: user, error } = await supabase
      .from('users')
      .update({
        fullname,
        email,
        phone,
        user_type,
        is_premium: Boolean(is_premium)
      })
      .eq('user_id', user_id)
      .select('user_id, fullname, email, phone, user_type, is_premium, created_at')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ user })
  } catch (error) {
    return adminErrorResponse(error)
  }
}

// DELETE /api/admin/users - Delete user (admin only)
export async function DELETE(request: NextRequest) {
  try {
    const { isAdmin } = await checkAdminAuth()
    
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 403 })
    }

    const supabase = createAdminClient()
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id')

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Remove the login account; a user who was never migrated has none.
    const { error: authError } = await supabase.auth.admin.deleteUser(userId)
    if (authError && authError.status !== 404) {
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    const { error } = await supabase
      .from('users')
      .delete()
      .eq('user_id', userId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ message: 'User deleted successfully' })
  } catch (error) {
    return adminErrorResponse(error)
  }
} 
