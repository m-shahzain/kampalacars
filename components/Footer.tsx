import Link from 'next/link'
import { Car, Heart } from 'lucide-react'

export function Footer() {
  return (
    <footer className="bg-gray-50 border-t border-gray-200 py-12 mt-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo and Description */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Car className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">Kampala Cars</span>
            </div>
            <p className="text-gray-600 mb-6 max-w-md">
              Your trusted marketplace for buying and selling cars in Kampala. 
              Find your perfect vehicle or sell your car with confidence and ease.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Quick Links</h3>
            <ul className="space-y-3 text-gray-600">
              <li>
                <Link href="/" className="hover:text-blue-600 transition-colors">
                  Browse Cars
                </Link>
              </li>
              <li>
                <Link href="/upload" className="hover:text-blue-600 transition-colors">
                  Sell Your Car
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-blue-600 transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-blue-600 transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Account */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Account</h3>
            <ul className="space-y-3 text-gray-600">
              <li>
                <Link href="/auth/login" className="hover:text-blue-600 transition-colors">
                  Login
                </Link>
              </li>
              <li>
                <Link href="/auth/register" className="hover:text-blue-600 transition-colors">
                  Register
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-blue-600 transition-colors">
                  Dashboard
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-200 mt-8 pt-8 text-center">
          <p className="flex items-center justify-center text-gray-600 mb-2">
            Made with <Heart className="h-4 w-4 mx-1 text-red-500" /> for car enthusiasts in Kampala
          </p>
          <p className="text-sm text-gray-500">
            © 2024 Kampala Cars. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
} 