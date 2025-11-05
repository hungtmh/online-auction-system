import { useState, useEffect } from 'react'
import { authAPI } from '../services/api'
import { clearAccessToken } from '../services/api'

function AdminDashboard() {
  const [user, setUser] = useState(null)
  const [activeTab, setActiveTab] = useState('users')

  useEffect(() => {
    fetchUserProfile()
  }, [])

  const fetchUserProfile = async () => {
    try {
      const userData = await authAPI.getProfile()
      setUser(userData)
    } catch (error) {
      console.error('Error fetching profile:', error)
    }
  }

  const handleLogout = async () => {
    try {
      await authAPI.logout()
      clearAccessToken()
      window.location.href = '/'
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navbar */}
      <nav className="bg-red-600 text-white shadow-lg">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold">🔐 Admin Panel</h1>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-red-700 rounded-full flex items-center justify-center">
                <span className="text-lg font-bold">
                  {user?.full_name?.charAt(0) || 'A'}
                </span>
              </div>
              <div>
                <p className="font-medium">{user?.full_name || 'Admin'}</p>
                <p className="text-xs text-red-200">{user?.role?.toUpperCase()}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="bg-red-700 hover:bg-red-800 px-4 py-2 rounded-lg transition"
            >
              Đăng xuất
            </button>
          </div>
        </div>
      </nav>

      {/* Tabs */}
      <div className="container mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow-md">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-4 px-6">
              {['users', 'products', 'bids', 'settings'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-4 px-6 font-medium transition ${
                    activeTab === tab
                      ? 'border-b-2 border-red-600 text-red-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab === 'users' && '👥 Quản lý Users'}
                  {tab === 'products' && '📦 Quản lý Sản phẩm'}
                  {tab === 'bids' && '💰 Quản lý Đấu giá'}
                  {tab === 'settings' && '⚙️ Cài đặt'}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'users' && <UsersManagement />}
            {activeTab === 'products' && <ProductsManagement />}
            {activeTab === 'bids' && <BidsManagement />}
            {activeTab === 'settings' && <Settings />}
          </div>
        </div>
      </div>
    </div>
  )
}

function UsersManagement() {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">👥 Quản lý Users</h2>
      <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4">
        <p className="text-yellow-700">
          <strong>🚧 Phần của Thắng:</strong> Quản lý users, xóa, ban, thay đổi role
        </p>
        <ul className="mt-2 ml-4 list-disc text-sm text-yellow-600">
          <li>Danh sách users (bảng + phân trang)</li>
          <li>Tìm kiếm user theo email/tên</li>
          <li>Xóa user</li>
          <li>Ban/Unban user</li>
          <li>Thay đổi role (bidder ↔ seller ↔ admin)</li>
        </ul>
      </div>
    </div>
  )
}

function ProductsManagement() {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">📦 Quản lý Sản phẩm</h2>
      <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4">
        <p className="text-yellow-700">
          <strong>🚧 Phần của Thắng:</strong> Duyệt sản phẩm, xóa sản phẩm vi phạm
        </p>
        <ul className="mt-2 ml-4 list-disc text-sm text-yellow-600">
          <li>Danh sách sản phẩm chờ duyệt</li>
          <li>Duyệt/Từ chối sản phẩm</li>
          <li>Xóa sản phẩm vi phạm</li>
          <li>Thống kê sản phẩm</li>
        </ul>
      </div>
    </div>
  )
}

function BidsManagement() {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">💰 Quản lý Đấu giá</h2>
      <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4">
        <p className="text-yellow-700">
          <strong>🚧 Phần của Thắng:</strong> Xem lịch sử đấu giá, xử lý tranh chấp
        </p>
        <ul className="mt-2 ml-4 list-disc text-sm text-yellow-600">
          <li>Lịch sử đấu giá</li>
          <li>Xử lý tranh chấp</li>
          <li>Hủy đấu giá gian lận</li>
          <li>Thống kê doanh thu</li>
        </ul>
      </div>
    </div>
  )
}

function Settings() {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">⚙️ Cài đặt hệ thống</h2>
      <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4">
        <p className="text-yellow-700">
          <strong>🚧 Phần của Thắng:</strong> Cấu hình hệ thống
        </p>
        <ul className="mt-2 ml-4 list-disc text-sm text-yellow-600">
          <li>Phí hệ thống (%)</li>
          <li>Thời gian đấu giá mặc định</li>
          <li>Email template</li>
          <li>Backup database</li>
        </ul>
      </div>
    </div>
  )
}

export default AdminDashboard
