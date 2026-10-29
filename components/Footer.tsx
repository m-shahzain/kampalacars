'use client'

import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'

// The most searched models in Uganda; each opens its model page.
const POPULAR_MODELS = [
  { name: 'Toyota Land Cruiser Prado', href: '/cars/toyota/land-cruiser-prado' },
  { name: 'Toyota Harrier', href: '/cars/toyota/harrier' },
  { name: 'Toyota Noah', href: '/cars/toyota/noah' },
  { name: 'Subaru Forester', href: '/cars/subaru/forester' },
  { name: 'Mazda CX-5', href: '/cars/mazda/cx-5' },
  { name: 'Mazda CX-8', href: '/cars/mazda/cx-8' },
  { name: 'Toyota Hilux Double Cabin', href: '/cars/toyota/hilux-double-cabin' },
]

export function Footer() {
  const { user } = useAuth()

  return (
    <footer className="bg-gray-50 border-t border-gray-200 mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center space-x-2 mb-3">
              <img src="/logo.webp" alt="Kampala Cars logo" width={40} height={40} className="h-10 w-10 rounded-lg" loading="lazy" />
              <span className="text-sm font-bold text-gray-900">Kampala Cars</span>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed max-w-[200px]">
              Your trusted marketplace for buying and selling cars in Kampala.
            </p>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wider mb-3">Browse</h3>
            <ul className="space-y-2 text-sm text-gray-500">
              <li><Link href="/cars" className="hover:text-gold-700 transition-colors">All Cars</Link></li>
              <li><Link href="/cars/toyota" className="hover:text-gold-700 transition-colors">Toyota</Link></li>
              <li><Link href="/cars/subaru" className="hover:text-gold-700 transition-colors">Subaru</Link></li>
              <li><Link href="/cars/mazda" className="hover:text-gold-700 transition-colors">Mazda</Link></li>
              <li><Link href="/cars/mercedes-benz" className="hover:text-gold-700 transition-colors">Mercedes-Benz</Link></li>
              {user && user.user_type !== 'admin' && (
                <li><Link href="/upload" className="hover:text-gold-700 transition-colors">Sell Your Car</Link></li>
              )}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wider mb-3">Popular</h3>
            <ul className="space-y-2 text-sm text-gray-500">
              {POPULAR_MODELS.map((model) => (
                <li key={model.href}><Link href={model.href} className="hover:text-gold-700 transition-colors">{model.name}</Link></li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wider mb-3">Account</h3>
            <ul className="space-y-2 text-sm text-gray-500">
              <li><Link href="/auth/login" className="hover:text-gold-700 transition-colors">Login</Link></li>
              <li><Link href="/auth/register" className="hover:text-gold-700 transition-colors">Register</Link></li>
              <li><Link href="/dashboard" className="hover:text-gold-700 transition-colors">Dashboard</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wider mb-3">Company</h3>
            <ul className="space-y-2 text-sm text-gray-500">
              <li><Link href="/about" className="hover:text-gold-700 transition-colors">About</Link></li>
              <li><Link href="/contact" className="hover:text-gold-700 transition-colors">Contact</Link></li>
              <li><Link href="/privacy" className="hover:text-gold-700 transition-colors">Privacy Policy</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-200 mt-6 pt-4 text-center">
          <p className="text-xs text-gray-400">
            &copy; {new Date().getFullYear()} Kampala Cars. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
