import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import SearchBar from '../../components/GuestHomePage/SearchBar'
import CategoryMenu from '../Nav/CategoryMenu'
import MobileMenu from '../Nav/MobileMenu'

export default function PublicLayout({ children }) {
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      <header className="bg-white shadow sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button onClick={() => navigate('/')} className="flex items-center gap-2">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-2xl font-bold text-gray-800">AuctionHub</span>
              </button>

              <nav className="hidden lg:flex items-center text-sm">
                <CategoryMenu />
              </nav>
            </div>

            <div className="flex-1 px-4 hidden md:block">
              <SearchBar />
            </div>

            <div className="flex items-center gap-3">
              <div className="lg:hidden">
                <button aria-label="Open menu" onClick={() => setMobileOpen(true)} className="p-2 rounded-md hover:bg-gray-100">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </div>

              <button onClick={() => navigate('/login')} className="px-4 py-2 text-sm text-blue-600">Đăng nhập</button>
              <button onClick={() => navigate('/register')} className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-md">Đăng ký</button>
            </div>
          </div>
        </div>
      </header>

      <MobileMenu open={mobileOpen} onClose={() => setMobileOpen(false)} />

      <main>{children}</main>

      <footer className="bg-gray-800 text-gray-300 py-12 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm">
          <div className="mb-4">
            <span className="font-bold text-white">AuctionHub</span>
          </div>
          <p>© 2025 TayDuKy. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
