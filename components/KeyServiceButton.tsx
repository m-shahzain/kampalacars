'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { KeyRound } from 'lucide-react'

const KEY_SERVICE_PATH = '/services/car-keys'

/** Floating button for the car key service, stacked above the WhatsApp button. */
export function KeyServiceButton() {
  // Not needed on the booking page itself.
  if (usePathname() === KEY_SERVICE_PATH) return null

  return (
    <Link
      href={KEY_SERVICE_PATH}
      aria-label="Car key service: book an appointment"
      title="Car key service"
      className="fixed bottom-[5.5rem] right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full border-2 border-gold-500 bg-brand text-gold-400 shadow-lg transition-transform duration-200 hover:scale-110 hover:bg-brand-hover focus:outline-none focus:ring-4 focus:ring-gold-400/40 sm:bottom-[6.5rem] sm:right-6"
    >
      <KeyRound className="h-7 w-7" aria-hidden="true" />
    </Link>
  )
}
