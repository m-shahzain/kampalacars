'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { Layout } from '@/components/Layout'
import { Button } from '@/components/ui/Button'
import { VerifyCodeForm } from '@/components/VerifyCodeForm'
import { Mail, Lock, AlertCircle } from 'lucide-react'

const inputClass = 'block w-full pl-10 pr-3 py-2.5 text-sm border border-gray-300 rounded-lg placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-gold-600 focus:border-transparent'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [step, setStep] = useState<'email' | 'code'>('email')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  const { sendPasswordResetCode, resetPassword } = useAuth()
  const router = useRouter()

  const handleSendCode = async (event: React.FormEvent) => {
    event.preventDefault()
    setSending(true)
    setError('')
    const { error } = await sendPasswordResetCode(email.trim())
    if (error) setError(error.message)
    else setStep('code')
    setSending(false)
  }

  const handleReset = async (code: string) => {
    if (newPassword.length < 6) {
      return { error: { message: 'Your new password must be at least 6 characters.' } }
    }
    const { error } = await resetPassword(email.trim(), code, newPassword)
    if (!error) router.push('/dashboard')
    return { error }
  }

  return (
    <Layout>
      <div className="flex items-center justify-center py-16 px-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-6">
            <img src="/logo.webp" alt="Kampala Cars logo" width={80} height={80} className="mx-auto h-20 w-20 rounded-xl mb-4" />
            <h2 className="text-xl font-bold text-gray-900">Reset your password</h2>
            <p className="mt-1 text-sm text-gray-500">We&apos;ll email you a code to set a new one</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            {step === 'code' ? (
              <VerifyCodeForm
                email={email.trim()}
                onVerify={handleReset}
                onResend={() => sendPasswordResetCode(email.trim())}
                onChangeEmail={() => setStep('email')}
                submitLabel="Set new password"
              >
                <div>
                  <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">New password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      id="newPassword"
                      type="password"
                      autoComplete="new-password"
                      value={newPassword}
                      onChange={(event) => setNewPassword(event.target.value)}
                      className={inputClass}
                      placeholder="Min. 6 characters"
                    />
                  </div>
                </div>
              </VerifyCodeForm>
            ) : (
              <form className="space-y-4" onSubmit={handleSendCode}>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      id="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      className={inputClass}
                      placeholder="you@example.com"
                    />
                  </div>
                </div>

                {error && (
                  <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                    <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <Button type="submit" loading={sending} className="w-full" size="md">
                  Send code
                </Button>
              </form>
            )}
          </div>

          <p className="text-center text-sm text-gray-500 mt-4">
            Remembered it?{' '}
            <Link href="/auth/login" className="font-medium text-gold-700 hover:text-gold-800">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </Layout>
  )
}
