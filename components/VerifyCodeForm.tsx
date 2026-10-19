'use client'

import { useEffect, useState } from 'react'
import { AlertCircle, MailCheck } from 'lucide-react'
import { Button } from '@/components/ui/Button'

const RESEND_COOLDOWN_SECONDS = 60

interface VerifyCodeFormProps {
  email: string
  onVerify: (code: string) => Promise<{ error: { message: string } | null }>
  onResend: () => Promise<{ error: { message: string } | null }>
  onChangeEmail?: () => void
  submitLabel?: string
  /** Extra fields shown above the button, e.g. a new password. */
  children?: React.ReactNode
}

export function VerifyCodeForm({ email, onVerify, onResend, onChangeEmail, submitLabel = 'Verify email', children }: VerifyCodeFormProps) {
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SECONDS)

  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setTimeout(() => setCooldown((seconds) => seconds - 1), 1000)
    return () => clearTimeout(timer)
  }, [cooldown])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (code.length < 6) {
      setError('Enter the code from the email.')
      return
    }
    setVerifying(true)
    setError('')
    const { error } = await onVerify(code)
    if (error) setError(error.message)
    setVerifying(false)
  }

  const handleResend = async () => {
    setError('')
    setNotice('')
    const { error } = await onResend()
    if (error) {
      setError(error.message)
    } else {
      setNotice('A new code is on its way.')
      setCooldown(RESEND_COOLDOWN_SECONDS)
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gold-50">
          <MailCheck className="h-6 w-6 text-gold-700" />
        </div>
        <h3 className="text-base font-semibold text-gray-900">Check your email</h3>
        <p className="mt-1 text-sm text-gray-500">
          We sent a code to <span className="font-medium text-gray-900">{email}</span>
        </p>
      </div>

      <div>
        <label htmlFor="verification-code" className="sr-only">Verification code</label>
        <input
          id="verification-code"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          autoFocus
          maxLength={10}
          value={code}
          onChange={(event) => setCode(event.target.value.replace(/\D/g, ''))}
          className="block w-full rounded-lg border border-gray-300 px-3 py-3 text-center text-2xl font-semibold tracking-[0.5em] text-gray-900 placeholder-gray-300 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-gold-600"
          placeholder="••••••"
        />
        <p className="mt-2 text-center text-xs text-gray-500">Can&apos;t find it? Check your spam folder.</p>
      </div>

      {children}

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {notice && <p className="text-center text-sm text-green-700">{notice}</p>}

      <Button type="submit" loading={verifying} className="w-full" size="md">
        {submitLabel}
      </Button>

      <div className="flex items-center justify-between text-sm">
        <button
          type="button"
          onClick={handleResend}
          disabled={cooldown > 0}
          className="font-medium text-gold-700 hover:text-gold-800 disabled:font-normal disabled:text-gray-400"
        >
          {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend code'}
        </button>
        {onChangeEmail && (
          <button type="button" onClick={onChangeEmail} className="text-gray-500 hover:text-gray-900">
            Change email
          </button>
        )}
      </div>
    </form>
  )
}
