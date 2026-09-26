'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'

type CustomUser = {
  user_id: string
  email: string
  fullname: string
  phone?: string
  user_type: 'seller' | 'buyer' | 'admin'
  is_premium: boolean
  profile_picture_url?: string
  created_at: string
}

type Profile = {
  full_name: string
  phone?: string
}

interface AuthContextType {
  user: CustomUser | null
  profile: Profile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signUp: (email: string, password: string, fullName: string, phone: string, address: string, profilePicture: File | null, userType?: 'buyer' | 'seller') => Promise<{ error: any }>
  signOut: () => Promise<void>
  updateProfile: (data: { full_name: string; phone: string }, profilePicture?: File | null) => Promise<{ error: any }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<CustomUser | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkSession()
  }, [])

  const checkSession = async () => {
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
  }

  const signIn = async (email: string, password: string) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (response.ok) {
        setUser(data.user)
        setProfile({
          full_name: data.user.fullname,
          phone: data.user.phone
        })
        return { error: null }
      } else {
        return { error: { message: data.error } }
      }
    } catch (error) {
      return { error: { message: 'Network error' } }
    }
  }

  const signUp = async (email: string, password: string, fullName: string, phone: string, address: string, profilePicture: File | null, userType: 'buyer' | 'seller' = 'buyer') => {
    try {
      const formData = new FormData()
      formData.append('email', email)
      formData.append('password', password)
      formData.append('fullname', fullName)
      formData.append('phone', phone)
      formData.append('address', address)
      formData.append('user_type', userType)
      if (profilePicture) formData.append('profile_picture', profilePicture)

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (response.ok) {
        setUser(data.user)
        setProfile({
          full_name: data.user.fullname,
          phone: data.user.phone
        })
        return { error: null }
      } else {
        return { error: { message: data.error } }
      }
    } catch (error) {
      return { error: { message: 'Network error' } }
    }
  }

  const signOut = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      setUser(null)
      setProfile(null)
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const updateProfile = async (data: { full_name: string; phone: string }, profilePicture?: File | null) => {
    try {
      const formData = new FormData()
      formData.append('fullname', data.full_name)
      formData.append('phone', data.phone)
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
    } catch (error) {
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
