import { useState, useEffect } from 'react'
import { authAPI } from '../services/api'

// Placeholder image khi không có ảnh (SVG inline)
const DEFAULT_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect fill='%23e5e7eb' width='400' height='300'/%3E%3Ctext fill='%239ca3af' font-family='Arial' font-size='16' x='50%25' y='50%25' text-anchor='middle' dy='.3em'%3EKhông có ảnh%3C/text%3E%3C/svg%3E";

function BidderDashboard() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('browse') // browse, my-bids, watchlist, profile

  useEffect(() => {
    fetchUserProfile()
  }, [])

  const fetchUserProfile = async () => {
    try {
      const userData = await authAPI.getProfile()
      setUser(userData)
    } catch (error) {
      console.error('Failed to fetch profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await authAPI.logout()
      window.location.href = '/'
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header / Navbar */}
      <nav className="bg-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="ml-2 text-2xl font-bold text-gray-800">AuctionHub</span>
            </div>

            {/* Search bar */}
            <div className="hidden md:flex flex-1 max-w-lg mx-8">
              <div className="w-full relative">
                <input
                  type="text"
                  placeholder="Tìm kiếm sản phẩm..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
                <button className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </div>
            </div>

            {/* User menu */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                  {user?.full_name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="hidden sm:block">
                  <div className="text-sm font-medium text-gray-800">{user?.full_name}</div>
                  <div className="text-xs text-gray-500 capitalize">{user?.role || 'Bidder'}</div>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition"
              >
                Đăng xuất
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-md mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('browse')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition ${
                  activeTab === 'browse'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                🔍 Khám phá đấu giá
              </button>
              <button
                onClick={() => setActiveTab('my-bids')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition ${
                  activeTab === 'my-bids'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                💰 Đấu giá của tôi
              </button>
              <button
                onClick={() => setActiveTab('watchlist')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition ${
                  activeTab === 'watchlist'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                ⭐ Theo dõi
              </button>
              <button
                onClick={() => setActiveTab('profile')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition ${
                  activeTab === 'profile'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                👤 Hồ sơ
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'browse' && <BrowseAuctions />}
            {activeTab === 'my-bids' && <MyBids />}
            {activeTab === 'watchlist' && <Watchlist />}
            {activeTab === 'profile' && <Profile user={user} />}
          </div>
        </div>
      </div>
    </div>
  )
}

// Tab: Khám phá đấu giá
function BrowseAuctions() {
  // TODO: Fetch từ Backend API /api/products
  const mockProducts = [
    {
      id: 1,
      title: 'iPhone 15 Pro Max 256GB',
      description: 'Máy mới 99%, fullbox, chưa qua sử dụng',
      current_price: 25000000,
      buy_now_price: 30000000,
      end_time: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2h
      image_url: null,
      bid_count: 15
    },
    {
      id: 2,
      title: 'MacBook Pro M3 16inch',
      description: 'Nguyên seal, chưa kích hoạt bảo hành',
      current_price: 45000000,
      buy_now_price: 52000000,
      end_time: new Date(Date.now() + 5 * 60 * 60 * 1000), // 5h
      image_url: null,
      bid_count: 23
    },
    {
      id: 3,
      title: 'Sony A7 IV Camera',
      description: 'Body only, đã qua sử dụng 6 tháng',
      current_price: 38000000,
      buy_now_price: 42000000,
      end_time: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 ngày
      image_url: null,
      bid_count: 8
    }
  ]

  const getTimeRemaining = (endTime) => {
    const diff = endTime - new Date()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    
    if (hours > 24) {
      return `${Math.floor(hours / 24)} ngày`
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`
    } else {
      return `${minutes} phút`
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Sản phẩm đang đấu giá</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockProducts.map((product) => (
          <div key={product.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-xl transition group">
            <div className="relative h-48 bg-gray-200 overflow-hidden">
              <img
                src={product.image_url || DEFAULT_IMAGE}
                alt={product.title}
                className="w-full h-full object-cover group-hover:scale-110 transition duration-300"
                onError={(e) => { e.target.src = DEFAULT_IMAGE; }}
              />
              <div className="absolute top-2 right-2 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                ⏰ {getTimeRemaining(product.end_time)}
              </div>
            </div>
            
            <div className="p-5">
              <h3 className="font-bold text-lg text-gray-800 mb-2 line-clamp-1">
                {product.title}
              </h3>
              <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                {product.description}
              </p>
              
              <div className="flex justify-between items-center mb-3">
                <div>
                  <div className="text-xs text-gray-500">Giá hiện tại</div>
                  <div className="text-xl font-bold text-blue-600">
                    {product.current_price.toLocaleString('vi-VN')} đ
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-500">Lượt đấu</div>
                  <div className="text-lg font-medium text-gray-700">
                    {product.bid_count}
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2">
                <button className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition font-medium">
                  Đấu giá ngay
                </button>
                <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition">
                  ⭐
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Tab: Đấu giá của tôi
function MyBids() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Lịch sử đấu giá của tôi</h2>
      <div className="text-center py-12 text-gray-500">
        <div className="text-6xl mb-4">📋</div>
        <p className="text-lg">Bạn chưa tham gia đấu giá nào</p>
        <button 
          onClick={() => window.location.href = '#browse'}
          className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          Khám phá ngay
        </button>
      </div>
    </div>
  )
}

// Tab: Danh sách theo dõi
function Watchlist() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Sản phẩm theo dõi</h2>
      <div className="text-center py-12 text-gray-500">
        <div className="text-6xl mb-4">⭐</div>
        <p className="text-lg">Chưa có sản phẩm nào trong danh sách theo dõi</p>
      </div>
    </div>
  )
}

// Tab: Hồ sơ
function Profile({ user }) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Thông tin cá nhân</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-50 p-6 rounded-lg">
          <div className="text-sm text-gray-500 mb-1">Họ và tên</div>
          <div className="text-lg font-medium text-gray-800">{user?.full_name}</div>
        </div>
        
        <div className="bg-gray-50 p-6 rounded-lg">
          <div className="text-sm text-gray-500 mb-1">Email</div>
          <div className="text-lg font-medium text-gray-800">{user?.email}</div>
        </div>
        
        <div className="bg-gray-50 p-6 rounded-lg">
          <div className="text-sm text-gray-500 mb-1">Vai trò</div>
          <div className="text-lg font-medium text-gray-800 capitalize">{user?.role}</div>
        </div>
        
        <div className="bg-gray-50 p-6 rounded-lg">
          <div className="text-sm text-gray-500 mb-1">Đánh giá</div>
          <div className="flex items-center gap-2">
            <span className="text-green-600 font-medium">👍 {user?.rating_positive || 0}</span>
            <span className="text-gray-400">|</span>
            <span className="text-red-600 font-medium">👎 {user?.rating_negative || 0}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BidderDashboard
