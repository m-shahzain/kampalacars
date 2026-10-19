'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { Layout } from '@/components/Layout'
import { GoogleSignInButton, OrDivider } from '@/components/GoogleSignInButton'
import { VerifyCodeForm } from '@/components/VerifyCodeForm'
import { Button } from '@/components/ui/Button'
import { Mail, Lock, AlertCircle } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [needsVerification, setNeedsVerification] = useState(false)
  
  const { signIn, verifyEmailCode, resendEmailCode } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('error') === 'google') {
      setError('Google sign-in did not finish. Please try again.')
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error, needsVerification } = await signIn(email.trim(), password)
    
    if (error) {
      setError(error.message)
    } else if (needsVerification) {
      // The account exists but the email was never confirmed; a code was just sent.
      setNeedsVerification(true)
    } else {
      router.push('/dashboard')
    }
    
    setLoading(false)
  }

  const handleVerify = async (code: string) => {
    const { error } = await verifyEmailCode(email.trim(), code)
    if (!error) router.push('/dashboard')
    return { error }
  }

  return (
    <Layout>
      <div className="flex items-center justify-center py-16 px-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-6">
            <img src="/logo.webp" alt="Kampala Cars logo" width={80} height={80} className="mx-auto h-20 w-20 rounded-xl mb-4" />
            <h2 className="text-xl font-bold text-gray-900">Welcome back</h2>
            <p className="mt-1 text-sm text-gray-500">Sign in to your account</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            {needsVerification ? (
              <VerifyCodeForm
                email={email.trim()}
                onVerify={handleVerify}
                onResend={() => resendEmailCode(email.trim())}
                onChangeEmail={() => setNeedsVerification(false)}
              />
            ) : (
            <>
            <GoogleSignInButton onError={setError} />
            <OrDivider />
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2.5 text-sm border border-gray-300 rounded-lg placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-gold-600 focus:border-transparent"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <Link href="/auth/forgot-password" className="text-xs font-medium text-gold-700 hover:text-gold-800">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2.5 text-sm border border-gray-300 rounded-lg placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-gold-600 focus:border-transparent"
                    placeholder="Enter your password"
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <Button type="submit" loading={loading} className="w-full bg-brand hover:bg-brand-hover text-white" size="md">
                Sign in
              </Button>
            </form>
            </>
            )}
          </div>

          <p className="text-center text-sm text-gray-500 mt-4">
            Don&apos;t have an account?{' '}
            <Link href="/auth/register" className="font-medium text-gold-700 hover:text-gold-800">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </Layout>
  )
}
