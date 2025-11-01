import { useState, useEffect } from 'react'
import { authAPI } from '../services/api'
import { useNavigate } from 'react-router-dom'

function DashboardPage({ user: propUser }) {
  const navigate = useNavigate()
  const [profile, setProfile] = useState(propUser)
  const [loading, setLoading] = useState(!propUser)

  useEffect(() => {
    if (!propUser) {
      loadProfile()
    }
  }, [propUser])

  async function loadProfile() {
    try {
      const userData = await authAPI.getProfile()
      setProfile(userData)
    } catch (err) {
      console.log('Error loading profile:', err)
      navigate('/')
    } finally {
      setLoading(false)
    }
  }

  async function handleLogout() {
    try {
      await authAPI.logout()
      window.location.href = '/'
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                Xin chào, {profile?.full_name || propUser.email}!
              </h1>
              <p className="text-sm text-gray-600">
                {profile?.role === 'admin' && '👑 Admin'}
                {profile?.role === 'seller' && '🏪 Người bán'}
                {profile?.role === 'bidder' && '💰 Người đấu giá'}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
            >
              Đăng xuất
            </button>
          </div>
        </div>
      </nav>
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-gray-500 text-sm mb-2">Email</h3>
            <p className="text-xl font-semibold">{propUser.email}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-gray-500 text-sm mb-2">Đánh giá</h3>
            <p className="text-xl font-semibold text-green-600">
              👍 {profile?.rating_positive || 0} / 👎 {profile?.rating_negative || 0}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-gray-500 text-sm mb-2">Vai trò</h3>
            <p className="text-xl font-semibold capitalize">{profile?.role || 'bidder'}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-3xl font-bold mb-4">🎉 Dashboard</h2>
          <p className="text-gray-600 mb-4">
            Chào mừng bạn đến với hệ thống đấu giá! Bạn đã đăng nhập thành công.
          </p>
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
            <p className="text-blue-700">
              <strong>🚀 Tính năng đang phát triển:</strong><br/>
              - Xem danh sách sản phẩm đấu giá<br/>
              - Đặt giá đấu<br/>
              - Quản lý sản phẩm của bạn<br/>
              - Lịch sử đấu giá
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardPage
