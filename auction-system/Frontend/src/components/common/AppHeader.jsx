import React from 'react'
import { useNavigate } from 'react-router-dom'

export default function AppHeader({ user, onLogout, showSearch = true }) {
  const userInitial = user?.full_name?.charAt(0)?.toUpperCase() || 'U'
  const roleLabel = user?.role || 'Bidder'
  const navigate = useNavigate()

  const handleLogoClick = () => {
    navigate('/')
  }

  return (
    <header className="bg-white shadow-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <button
            type="button"
            onClick={handleLogoClick}
            className="flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-lg"
          >
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="ml-2 text-2xl font-bold text-gray-800">AuctionHub</span>
          </button>

          {showSearch && (
            <div className="hidden md:flex flex-1 max-w-lg mx-8">
              <input
                type="text"
                placeholder="Tìm kiếm sản phẩm..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
          )}

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                {userInitial}
              </div>
              <div className="hidden sm:block">
                <div className="text-sm font-medium text-gray-800">{user?.full_name || 'Khách'}</div>
                <div className="text-xs text-gray-500 capitalize">{roleLabel}</div>
              </div>
            </div>
            {onLogout && (
              <button onClick={onLogout} className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition">
                Đăng xuất
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
