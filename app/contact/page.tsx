import type { Metadata } from 'next'
import Link from 'next/link'
import { Car, ChevronRight, Flag, KeyRound, Phone, Tag } from 'lucide-react'
import { Layout } from '@/components/Layout'
import { PHONE_DISPLAY, WHATSAPP_NUMBER, whatsappUrl } from '@/lib/contact'

export const metadata: Metadata = {
  title: 'Contact Us | Kampala Cars',
  description: 'Get in touch with Kampala Cars on WhatsApp or by phone.',
}

// Each topic opens WhatsApp with a message already started.
const topics = [
  { icon: Car, title: 'Buying a car', text: 'Questions about a car or how buying works.', message: 'Hello Kampala Cars, I have a question about buying a car.' },
  { icon: Tag, title: 'Selling a car', text: 'Help listing your car or with your listing.', message: 'Hello Kampala Cars, I need help with selling my car.' },
  { icon: KeyRound, title: 'Account help', text: 'Trouble signing in or with your account.', message: 'Hello Kampala Cars, I need help with my account.' },
  { icon: Flag, title: 'Report a listing', text: 'Something looks wrong or suspicious.', message: 'Hello Kampala Cars, I would like to report a listing:' },
]

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={className}>
      <path fill="currentColor" d="M16.01 3C8.84 3 3 8.83 3 16c0 2.29.6 4.53 1.74 6.49L3 29l6.68-1.7A12.94 12.94 0 0 0 16.01 29C23.17 29 29 23.17 29 16S23.17 3 16.01 3Zm0 23.63c-2.03 0-4.02-.55-5.75-1.6l-.41-.24-3.96 1.01 1.06-3.86-.27-.4A10.58 10.58 0 0 1 5.04 16c0-6.05 4.92-10.97 10.97-10.97S26.98 9.95 26.98 16s-4.92 10.63-10.97 10.63Zm6.01-7.97c-.33-.17-1.95-.96-2.25-1.07-.3-.11-.52-.17-.74.17-.22.33-.85 1.07-1.04 1.29-.19.22-.39.24-.72.08-.33-.17-1.4-.52-2.66-1.66a9.95 9.95 0 0 1-1.84-2.29c-.19-.33-.02-.51.14-.67.15-.15.33-.39.5-.58.17-.19.22-.33.33-.55.11-.22.06-.41-.03-.58-.08-.17-.74-1.78-1.01-2.44-.27-.65-.54-.56-.74-.57h-.63c-.22 0-.58.08-.88.41-.3.33-1.15 1.12-1.15 2.73 0 1.61 1.18 3.17 1.34 3.39.17.22 2.32 3.54 5.62 4.97.78.34 1.39.54 1.87.69.79.25 1.51.21 2.08.13.63-.09 1.95-.8 2.22-1.57.27-.77.27-1.43.19-1.57-.08-.14-.3-.22-.63-.39Z" />
    </svg>
  )
}

export default function ContactPage() {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-10">
        <section className="mx-auto max-w-3xl text-center">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Contact us</h1>
          <p className="mt-3 text-gray-600">
            The quickest way to reach us is on WhatsApp. Pick a topic below and your message will be started for you.
          </p>
        </section>

        <section className="mx-auto mt-8 grid max-w-3xl gap-3 sm:grid-cols-2">
          <a
            href={whatsappUrl('Hello Kampala Cars, I would like to make an enquiry.')}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-4 rounded-xl bg-[#25D366] p-5 text-white transition-colors hover:bg-[#20bd5a]"
          >
            <WhatsAppIcon className="h-9 w-9 shrink-0" />
            <div>
              <p className="font-semibold">Chat on WhatsApp</p>
              <p className="text-sm text-white/90">{PHONE_DISPLAY}</p>
            </div>
          </a>
          <a
            href={`tel:+${WHATSAPP_NUMBER}`}
            className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-5 transition-colors hover:bg-gray-50"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand">
              <Phone className="h-4 w-4 text-white" />
            </span>
            <div>
              <p className="font-semibold text-gray-900">Call us</p>
              <p className="text-sm text-gray-500">{PHONE_DISPLAY}</p>
            </div>
          </a>
        </section>

        <section className="mx-auto mt-12 max-w-3xl">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">What can we help with?</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {topics.map(({ icon: Icon, title, text, message }) => (
              <a
                key={title}
                href={whatsappUrl(message)}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 transition-colors hover:border-gold-200 hover:bg-gold-50"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gold-50 group-hover:bg-white">
                  <Icon className="h-5 w-5 text-gold-700" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-900">{title}</p>
                  <p className="text-sm text-gray-500">{text}</p>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" />
              </a>
            ))}
          </div>
        </section>

        <section className="mx-auto mt-12 max-w-3xl rounded-xl border border-gray-200 bg-gray-50 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-3">You might find these helpful</h2>
          <ul className="space-y-2 text-sm">
            <li><Link href="/auth/forgot-password" className="text-gold-700 hover:text-gold-800 font-medium">Reset your password</Link></li>
            <li><Link href="/upload" className="text-gold-700 hover:text-gold-800 font-medium">List your car for sale</Link></li>
            <li><Link href="/about" className="text-gold-700 hover:text-gold-800 font-medium">How Kampala Cars works</Link></li>
            <li><Link href="/privacy" className="text-gold-700 hover:text-gold-800 font-medium">Privacy policy</Link></li>
          </ul>
        </section>
      </div>
    </Layout>
  )
}
