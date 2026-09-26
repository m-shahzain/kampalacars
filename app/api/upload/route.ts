import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createCarImageVariants } from '@/lib/car-image-variants'

const MAX_IMAGE_SIZE_BYTES = 4 * 1024 * 1024

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('session')

    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const sessionData = JSON.parse(sessionCookie.value)
    if (sessionData.userType === 'admin') {
      return NextResponse.json({ error: 'Admins cannot upload marketplace car images' }, { status: 403 })
    }

    const supabase = await createClient()

    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 })
    }

    // Keep below the deployment request-body limit so this handler can return JSON.
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      return NextResponse.json({ error: 'Each image must be 4 MB or smaller' }, { status: 400 })
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop()
    const fileName = `${sessionData.userId}/${Date.now()}.${fileExt}`

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('car-images')
      .upload(fileName, file, {
        contentType: file.type,
        upsert: false
      })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    try {
      const source = Buffer.from(await file.arrayBuffer())
      await createCarImageVariants(supabase.storage, fileName, source)
    } catch (variantError) {
      await supabase.storage.from('car-images').remove([fileName])
      console.error('Unable to create car image variants:', variantError)
      return NextResponse.json({ error: 'Unable to optimize image. Please try again.' }, { status: 500 })
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('car-images')
      .getPublicUrl(fileName)

    return NextResponse.json({ 
      url: publicUrl,
      path: data.path 
    })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 
