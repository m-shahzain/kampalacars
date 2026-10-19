'use client'

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type CustomUser = {
  user_id: string
  email: string
  fullname: string
  phone?: string
  address?: string
  user_type: 'seller' | 'buyer' | 'admin'
  is_premium: boolean
  profile_picture_url?: string
  created_at: string
}

type Profile = {
  full_name: string
  phone?: string
}

type AuthError = { message: string } | null

type SignUpData = {
  email: string
  password: string
  fullName: string
  phone: string
  address: string
  userType?: 'buyer' | 'seller'
}

interface AuthContextType {
  user: CustomUser | null
  profile: Profile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: AuthError; needsVerification?: boolean }>
  signUp: (data: SignUpData) => Promise<{ error: AuthError }>
  verifyEmailCode: (email: string, code: string) => Promise<{ error: AuthError }>
  resendEmailCode: (email: string) => Promise<{ error: AuthError }>
  signInWithGoogle: (next?: string) => Promise<{ error: AuthError }>
  sendPasswordResetCode: (email: string) => Promise<{ error: AuthError }>
  resetPassword: (email: string, code: string, newPassword: string) => Promise<{ error: AuthError }>
  signOut: () => Promise<void>
  updateProfile: (data: { full_name: string; phone: string; address?: string }, profilePicture?: File | null) => Promise<{ error: AuthError }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Supabase error messages are written for developers; show friendlier ones.
function friendlyError(error: { message: string; code?: string } | null): AuthError {
  if (!error) return null
  switch (error.code) {
    case 'invalid_credentials':
      return { message: 'Incorrect email or password.' }
    case 'otp_expired':
      return { message: 'That code is wrong or has expired. Check the latest email or send a new code.' }
    case 'over_email_send_rate_limit':
    case 'over_request_rate_limit':
      return { message: 'Please wait a minute before asking for another code.' }
    case 'weak_password':
      return { message: 'Please choose a stronger password (at least 6 characters).' }
    case 'user_already_exists':
    case 'email_exists':
      return { message: 'An account with this email already exists. Please sign in instead.' }
    default:
      return { message: error.message }
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [supabase] = useState(() => createClient())
  const [user, setUser] = useState<CustomUser | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  const checkSession = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/session')
      const data = await response.json()

      if (data.user) {
        setUser(data.user)
        setProfile(data.user.profile)
      } else {
        setUser(null)
        setProfile(null)
      }
    } catch (error) {
      console.error('Error checking session:', error)
      setUser(null)
      setProfile(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // Fires once on load (INITIAL_SESSION) and again whenever the user signs in or out.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'USER_UPDATED') {
        void checkSession()
      }
    })
    return () => subscription.unsubscribe()
  }, [supabase, checkSession])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error?.code === 'email_not_confirmed') {
      // Send a fresh code so the user can finish verifying right away.
      await supabase.auth.resend({ type: 'signup', email })
      return { error: null, needsVerification: true }
    }
    if (!error) await checkSession()
    return { error: friendlyError(error) }
  }

  const signUp = async ({ email, password, fullName, phone, address, userType = 'buyer' }: SignUpData) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // Copied into the users table by a database trigger.
        data: { fullname: fullName, phone, address, user_type: userType },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) return { error: friendlyError(error) }
    // Supabase hides whether an email is taken; an empty identity list means it is.
    if (data.user && data.user.identities?.length === 0) {
      return { error: { message: 'An account with this email already exists. Please sign in instead.' } }
    }
    return { error: null }
  }

  const verifyEmailCode = async (email: string, code: string) => {
    const { error } = await supabase.auth.verifyOtp({ email, token: code, type: 'email' })
    if (!error) await checkSession()
    return { error: friendlyError(error) }
  }

  const resendEmailCode = async (email: string) => {
    const { error } = await supabase.auth.resend({ type: 'signup', email })
    return { error: friendlyError(error) }
  }

  const signInWithGoogle = async (next = '/dashboard') => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
    })
    return { error: friendlyError(error) }
  }

  const sendPasswordResetCode = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email)
    return { error: friendlyError(error) }
  }

  const resetPassword = async (email: string, code: string, newPassword: string) => {
    const { error } = await supabase.auth.verifyOtp({ email, token: code, type: 'recovery' })
    if (error) return { error: friendlyError(error) }
    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword })
    if (!updateError) await checkSession()
    return { error: friendlyError(updateError) }
  }

  const signOut = async () => {
    try {
      await supabase.auth.signOut()
    } catch (error) {
      console.error('Error signing out:', error)
    } finally {
      setUser(null)
      setProfile(null)
    }
  }

  const updateProfile = async (data: { full_name: string; phone: string; address?: string }, profilePicture?: File | null) => {
    try {
      const formData = new FormData()
      formData.append('fullname', data.full_name)
      formData.append('phone', data.phone)
      if (data.address) formData.append('address', data.address)
      if (profilePicture) formData.append('profile_picture', profilePicture)

      const response = await fetch('/api/profile', {
        method: 'PUT',
        body: formData,
      })

      const result = await response.json()

      if (response.ok) {
        setUser(result.user)
        setProfile({
          full_name: result.user.fullname,
          phone: result.user.phone
        })
        return { error: null }
      } else {
        return { error: { message: result.error } }
      }
    } catch {
      return { error: { message: 'Network error' } }
    }
  }

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      loading,
      signIn,
      signUp,
      verifyEmailCode,
      resendEmailCode,
      signInWithGoogle,
      sendPasswordResetCode,
      resetPassword,
      signOut,
      updateProfile,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
