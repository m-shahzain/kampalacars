'use client'

import Link from 'next/link'
import { Car } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'

export function Footer() {
  const { user } = useAuth()

  return (
    <footer className="bg-gray-50 border-t border-gray-200 mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center space-x-2 mb-3">
              <div className="bg-blue-600 p-1.5 rounded-lg">
                <Car className="h-4 w-4 text-white" />
              </div>
              <span className="text-sm font-bold text-gray-900">Kampala Cars</span>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed max-w-[200px]">
              Your trusted marketplace for buying and selling cars in Kampala.
            </p>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wider mb-3">Browse</h3>
            <ul className="space-y-2 text-sm text-gray-500">
              <li><Link href="/" className="hover:text-blue-600 transition-colors">All Cars</Link></li>
              {user && user.user_type !== 'admin' && (
                <li><Link href="/upload" className="hover:text-blue-600 transition-colors">Sell Your Car</Link></li>
              )}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wider mb-3">Account</h3>
            <ul className="space-y-2 text-sm text-gray-500">
              <li><Link href="/auth/login" className="hover:text-blue-600 transition-colors">Login</Link></li>
              <li><Link href="/auth/register" className="hover:text-blue-600 transition-colors">Register</Link></li>
              <li><Link href="/dashboard" className="hover:text-blue-600 transition-colors">Dashboard</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wider mb-3">Company</h3>
            <ul className="space-y-2 text-sm text-gray-500">
              <li><Link href="/about" className="hover:text-blue-600 transition-colors">About</Link></li>
              <li><Link href="/contact" className="hover:text-blue-600 transition-colors">Contact</Link></li>
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
