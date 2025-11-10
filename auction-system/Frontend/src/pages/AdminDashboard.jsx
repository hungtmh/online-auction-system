import { useState, useEffect } from 'react'
import { authAPI } from '../services/api'
import { clearAccessToken } from '../services/api'
import adminAPI from '../services/adminAPI'
import UserManagement from '../components/Admin/UserManagement'
import ProductManagement from '../components/Admin/ProductManagement'
import CategoryManagement from '../components/Admin/CategoryManagement'
import UpgradeRequests from '../components/Admin/UpgradeRequests'
import BidManagement from '../components/Admin/BidManagement'
import SystemSettings from '../components/Admin/SystemSettings'

function AdminDashboard() {
  const [user, setUser] = useState(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [stats, setStats] = useState(null)

  useEffect(() => {
    fetchUserProfile()
    fetchStats()
  }, [])

  const fetchUserProfile = async () => {
    try {
      const userData = await authAPI.getProfile()
      setUser(userData)
    } catch (error) {
      console.error('Error fetching profile:', error)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await adminAPI.getSystemStats()
      setStats(response.data)
    } catch (error) {
      console.error('Error fetching stats:', error)
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
            <nav className="flex space-x-2 px-6 overflow-x-auto">
              {['overview', 'users', 'categories', 'products', 'upgrades', 'bids', 'settings'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-4 px-4 font-medium transition whitespace-nowrap ${
                    activeTab === tab
                      ? 'border-b-2 border-red-600 text-red-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab === 'overview' && '📊 Tổng quan'}
                  {tab === 'users' && '👥 Quản lý Users'}
                  {tab === 'categories' && '📁 Danh mục'}
                  {tab === 'products' && '📦 Quản lý Sản phẩm'}
                  {tab === 'upgrades' && '⬆️ Yêu cầu nâng cấp'}
                  {tab === 'bids' && '💰 Quản lý Đấu giá'}
                  {tab === 'settings' && '⚙️ Cài đặt'}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-800">📊 Thống kê hệ thống</h2>
                {stats ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                      <div className="text-blue-600 text-3xl mb-2">👥</div>
                      <div className="text-2xl font-bold text-gray-800">{stats.totalUsers}</div>
                      <div className="text-sm text-gray-600">Tổng Users</div>
                    </div>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                      <div className="text-green-600 text-3xl mb-2">📦</div>
                      <div className="text-2xl font-bold text-gray-800">{stats.totalProducts}</div>
                      <div className="text-sm text-gray-600">Tổng Sản phẩm</div>
                    </div>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                      <div className="text-yellow-600 text-3xl mb-2">✅</div>
                      <div className="text-2xl font-bold text-gray-800">{stats.activeProducts}</div>
                      <div className="text-sm text-gray-600">Sản phẩm Active</div>
                    </div>
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                      <div className="text-purple-600 text-3xl mb-2">💰</div>
                      <div className="text-2xl font-bold text-gray-800">{stats.totalBids}</div>
                      <div className="text-sm text-gray-600">Tổng Bids</div>
                    </div>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                      <div className="text-red-600 text-3xl mb-2">⏳</div>
                      <div className="text-2xl font-bold text-gray-800">{stats.pendingUpgrades || 0}</div>
                      <div className="text-sm text-gray-600">Yêu cầu chờ duyệt</div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">Đang tải thống kê...</div>
                )}
              </div>
            )}
            {activeTab === 'users' && <UserManagement />}
            {activeTab === 'categories' && <CategoryManagement />}
            {activeTab === 'products' && <ProductManagement />}
            {activeTab === 'upgrades' && <UpgradeRequests />}
            {activeTab === 'bids' && <BidManagement />}
            {activeTab === 'settings' && <SystemSettings />}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard
