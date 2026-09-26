import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

// Keep the login across browser refreshes and application restarts. Browsers
// still impose a maximum cookie lifetime, so use a long, explicit duration.
const SESSION_MAX_AGE = 60 * 60 * 24 * 365

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const formData = await request.formData()
    const email = formData.get('email')?.toString()
    const password = formData.get('password')?.toString()
    const fullname = formData.get('fullname')?.toString()
    const phone = formData.get('phone')?.toString()
    const address = formData.get('address')?.toString()
    const user_type = formData.get('user_type')?.toString() || 'buyer'
    const profilePicture = formData.get('profile_picture')

    if (!email || !password || !fullname || !phone || !address) {
      return NextResponse.json({ error: 'Email, password, full name, phone, and address are required' }, { status: 400 })
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (profilePicture instanceof File && !allowedTypes.includes(profilePicture.type)) {
      return NextResponse.json({ error: 'Display picture must be a JPG, PNG, or WebP image' }, { status: 400 })
    }

    if (profilePicture instanceof File && profilePicture.size > 2 * 1024 * 1024) {
      return NextResponse.json({ error: 'Display picture must be 2 MB or smaller' }, { status: 400 })
    }

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('user_id')
      .eq('email', email)
      .single()

    if (existingUser) {
      return NextResponse.json({ error: 'User already exists' }, { status: 400 })
    }

    // Create user with plain text password
    const { data: user, error: userError } = await supabase
      .from('users')
      .insert({
        email,
        password, // Plain text password
        fullname,
        phone,
        address,
        user_type
      })
      .select()
      .single()

    if (userError) {
      return NextResponse.json({ error: userError.message }, { status: 400 })
    }

    let registeredUser = user
    if (profilePicture instanceof File) {
      const extension = profilePicture.type === 'image/png'
        ? 'png'
        : profilePicture.type === 'image/webp'
          ? 'webp'
          : 'jpg'
      const fileName = `profile-pictures/${user.user_id}/${Date.now()}.${extension}`
      const { error: uploadError } = await supabase.storage
        .from('car-images')
        .upload(fileName, profilePicture, { contentType: profilePicture.type, upsert: false })

      if (uploadError) {
        await supabase.from('users').delete().eq('user_id', user.user_id)
        return NextResponse.json({ error: 'Unable to upload display picture. Please try again.' }, { status: 400 })
      }

      const { data: { publicUrl } } = supabase.storage
        .from('car-images')
        .getPublicUrl(fileName)

      const { data: userWithPicture, error: pictureUpdateError } = await supabase
        .from('users')
        .update({ profile_picture_url: publicUrl })
        .eq('user_id', user.user_id)
        .select()
        .single()

      if (pictureUpdateError) {
        await supabase.storage.from('car-images').remove([fileName])
        await supabase.from('users').delete().eq('user_id', user.user_id)
        return NextResponse.json({ error: 'Unable to save display picture. Please try again.' }, { status: 400 })
      }

      registeredUser = userWithPicture
    }

    // Create a simple session cookie
    const cookieStore = await cookies()
    const sessionData = {
      userId: registeredUser.user_id,
      email: registeredUser.email,
      fullname: registeredUser.fullname,
      userType: registeredUser.user_type
    }

    cookieStore.set('session', JSON.stringify(sessionData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: SESSION_MAX_AGE
    })

    return NextResponse.json({ 
      user: {
        user_id: registeredUser.user_id,
        email: registeredUser.email,
        fullname: registeredUser.fullname,
        phone: registeredUser.phone,
        user_type: registeredUser.user_type,
        is_premium: registeredUser.is_premium,
        profile_picture_url: registeredUser.profile_picture_url,
        created_at: registeredUser.created_at
      }
    })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 
