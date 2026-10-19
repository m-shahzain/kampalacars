import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'

// GET /api/profile - Get current user profile
export async function GET() {
  try {
    const supabase = await createClient()
    const sessionData = await getSession(supabase)

    if (!sessionData) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('user_id, fullname, email, phone, address, profile_picture_url, user_type, is_premium, created_at')
      .eq('user_id', sessionData.userId)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ user })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/profile - Update user profile
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    const sessionData = await getSession(supabase)

    if (!sessionData) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const formData = await request.formData()
    const fullname = formData.get('fullname')?.toString()
    const phone = formData.get('phone')?.toString()
    const address = formData.get('address')?.toString().trim()
    const profilePicture = formData.get('profile_picture')

    if (!fullname || !phone) {
      return NextResponse.json({ error: 'Full name and phone are required' }, { status: 400 })
    }

    if (profilePicture instanceof File) {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
      if (!allowedTypes.includes(profilePicture.type)) {
        return NextResponse.json({ error: 'Display picture must be a JPG, PNG, or WebP image' }, { status: 400 })
      }
      if (profilePicture.size > 2 * 1024 * 1024) {
        return NextResponse.json({ error: 'Display picture must be 2 MB or smaller' }, { status: 400 })
      }
    }

    let profilePictureUrl: string | undefined
    let uploadedFileName: string | undefined
    if (profilePicture instanceof File) {
      const extension = profilePicture.type === 'image/png'
        ? 'png'
        : profilePicture.type === 'image/webp'
          ? 'webp'
          : 'jpg'
      uploadedFileName = `profile-pictures/${sessionData.userId}/${Date.now()}.${extension}`
      const { error: uploadError } = await supabase.storage
        .from('car-images')
        .upload(uploadedFileName, profilePicture, { contentType: profilePicture.type, upsert: false })

      if (uploadError) {
        return NextResponse.json({ error: 'Unable to upload display picture. Please try again.' }, { status: 400 })
      }

      const { data: { publicUrl } } = supabase.storage
        .from('car-images')
        .getPublicUrl(uploadedFileName)
      profilePictureUrl = publicUrl
    }

    const { data: user, error } = await supabase
      .from('users')
      .update({
        fullname,
        phone,
        ...(address && { address }),
        ...(profilePictureUrl && { profile_picture_url: profilePictureUrl })
      })
      .eq('user_id', sessionData.userId)
      .select('user_id, fullname, email, phone, address, profile_picture_url, user_type, is_premium, created_at')
      .single()

    if (error) {
      if (uploadedFileName) await supabase.storage.from('car-images').remove([uploadedFileName])
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ user })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 
