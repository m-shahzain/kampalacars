import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export async function requireAdmin() {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get('session')

  if (!sessionCookie) {
    redirect('/auth/login?message=Please login to access admin area')
  }

  const sessionData = JSON.parse(sessionCookie.value)
  
  if (sessionData.userType !== 'admin') {
    redirect('/?message=Access denied - Admin privileges required')
  }

  return sessionData
}

export async function isAdmin() {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('session')

    if (!sessionCookie) {
      return false
    }

    const sessionData = JSON.parse(sessionCookie.value)
    return sessionData.userType === 'admin'
  } catch {
    return false
  }
} 