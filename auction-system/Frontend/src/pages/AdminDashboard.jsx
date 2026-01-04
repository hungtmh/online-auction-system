import { useState, useEffect } from 'react'
import { authAPI } from '../services/api'
import { clearAccessToken } from '../services/api'
import adminAPI from '../services/adminAPI'
import UserManagement from '../components/Admin/UserManagement'
import ProductManagement from '../components/Admin/ProductManagement'
import CategoryManagement from '../components/Admin/CategoryManagement'
import UpgradeRequests from '../components/Admin/UpgradeRequests'
import SystemSettings from '../components/Admin/SystemSettings'
import SpamManagement from '../components/Admin/SpamManagement'

function AdminDashboard() {
  const [user, setUser] = useState(null)
  const [activeView, setActiveView] = useState('home') // 'home' hoặc tên chức năng
  const [stats, setStats] = useState(null)
  const [chartData, setChartData] = useState(null)
  const [showProfileModal, setShowProfileModal] = useState(false)

  useEffect(() => {
    fetchUserProfile()
    fetchStats()
    fetchChartData()
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

  const fetchChartData = async () => {
    try {
      const response = await adminAPI.getChartData()
      setChartData(response.data)
    } catch (error) {
      console.error('Error fetching chart data:', error)
      // Fallback to empty data if API fails
      setChartData({
        newUsers: [0, 0, 0, 0, 0, 0, 0],
        newBids: [0, 0, 0, 0, 0, 0, 0],
        spamReports: [0, 0, 0, 0, 0, 0, 0],
        labels: ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']
      })
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

  const getCurrentDateTime = () => {
    const now = new Date()
    return now.toLocaleString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  // Helper function để render line chart với thông số
  const renderLineChart = (data, color, showValues = false) => {
    const max = Math.max(...data)
    const min = Math.min(...data)
    const range = max - min || 1
    const width = 200
    const height = 64
    const padding = 7

    const points = data.map((value, i) => {
      const x = (i * width) / 6
      const y = height - ((value - min) / range) * (height - padding * 2) - padding
      return `${x},${y}`
    }).join(' ')

    const circles = data.map((value, i) => {
      const x = (i * width) / 6
      const y = height - ((value - min) / range) * (height - padding * 2) - padding
      return { x, y, value }
    })

    return (
      <svg width="100%" height="64" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="overflow-visible">
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {circles.map((point, i) => (
          <g key={i}>
            <circle
              cx={point.x}
              cy={point.y}
              r="3"
              fill={color}
              className="hover:r-4 transition-all"
            />
            {showValues && (
              <text
                x={point.x}
                y={point.y - 8}
                textAnchor="middle"
                fontSize="8"
                fill={color}
                fontWeight="600"
              >
                {point.value}
              </text>
            )}
          </g>
        ))}
      </svg>
    )
  }

  // Danh sách các chức năng quản trị
  const adminFeatures = [
    {
      id: 'users',
      icon: '👤',
      title: 'Quản lý danh sách người dùng',
      description: 'Xem, sửa, xóa thông tin người dùng',
      color: 'blue'
    },
    {
      id: 'products',
      icon: '📦',
      title: 'Quản lý sản phẩm đấu giá',
      description: 'Duyệt, từ chối, xóa sản phẩm',
      color: 'amber'
    },
    {
      id: 'categories',
      icon: '📁',
      title: 'Quản lý danh mục sản phẩm',
      description: 'Thêm, sửa, xóa danh mục',
      color: 'green'
    },
    {
      id: 'spam',
      icon: '🔔',
      title: 'Xem danh sách báo cáo spam',
      description: 'Xử lý các báo cáo vi phạm',
      color: 'yellow'
    },
    {
      id: 'upgrades',
      icon: '⬆️',
      title: 'Yêu cầu nâng cấp tài khoản',
      description: 'Duyệt yêu cầu lên Seller',
      color: 'purple'
    },
    {
      id: 'settings',
      icon: '⚙️',
      title: 'Cài đặt hệ thống',
      description: 'Cấu hình tự động gia hạn, đấu giá',
      color: 'slate'
    }
  ]

  const getColorClasses = (color) => {
    const colors = {
      blue: 'border-blue-400 hover:bg-blue-50 hover:border-blue-500',
      amber: 'border-amber-400 hover:bg-amber-50 hover:border-amber-500',
      green: 'border-green-400 hover:bg-green-50 hover:border-green-500',
      yellow: 'border-yellow-400 hover:bg-yellow-50 hover:border-yellow-500',
      purple: 'border-purple-400 hover:bg-purple-50 hover:border-purple-500',
      slate: 'border-slate-400 hover:bg-slate-50 hover:border-slate-500',
    }
    return colors[color] || colors.blue
  }

  // Render component theo activeView
  const renderActiveComponent = () => {
    switch (activeView) {
      case 'users':
        return <UserManagement />
      case 'products':
        return <ProductManagement />
      case 'categories':
        return <CategoryManagement />
      case 'upgrades':
        return <UpgradeRequests />
      case 'spam':
        return <SpamManagement />
      case 'settings':
        return <SystemSettings />
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-red-50">
      {/* Top Menu Bar - Gradient Header */}
      <div className="bg-gradient-to-r from-red-600 via-red-500 to-orange-500 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <span className="text-2xl">🔐</span>
              </div>
              <div>
                <h1 className="text-white font-bold text-lg">Admin Panel</h1>
                <p className="text-red-100 text-xs">Auction System</p>
              </div>
            </div>

            {/* Center Title */}
            <div className="hidden md:block">
              <span className="text-white/90 font-medium">HỆ THỐNG QUẢN TRỊ</span>
            </div>

            {/* User Info */}
            <div className="flex items-center space-x-4">
              <div
                onClick={() => setShowProfileModal(true)}
                className="flex items-center space-x-3 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2 cursor-pointer hover:bg-white/20 transition-colors"
              >
                <div className="w-9 h-9 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center text-white font-bold shadow-md">
                  {user?.full_name?.charAt(0)?.toUpperCase() || 'A'}
                </div>
                <div className="hidden sm:block">
                  <p className="text-white font-medium text-sm">{user?.full_name || 'Admin'}</p>
                  <p className="text-red-100 text-xs">{user?.role?.toUpperCase() || 'ADMIN'}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-xl transition-all duration-200 flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span className="hidden sm:inline text-sm">Đăng xuất</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        {/* Admin Profile Modal */}
        {showProfileModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowProfileModal(false)}>
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4" onClick={(e) => e.stopPropagation()}>
              {/* Header */}
              <div className="p-6 border-b flex justify-between items-center bg-slate-50 rounded-t-xl">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">👤</span>
                  <h2 className="text-xl font-bold text-slate-700">Admin Profile</h2>
                </div>
                <button
                  onClick={() => setShowProfileModal(false)}
                  className="text-slate-500 hover:text-slate-700 text-2xl w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-200 transition-colors"
                >
                  ×
                </button>
              </div>

              {/* Content */}
              <div className="p-6">
                {/* User Identification */}
                <div className="flex items-start space-x-4 mb-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                    {user?.full_name?.charAt(0)?.toUpperCase() || 'A'}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-slate-800 mb-1">
                      {user?.full_name || 'Administrator'}
                    </h3>
                    <p className="text-slate-600 mb-2">{user?.email || 'admin@example.com'}</p>
                    <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                      Administrator
                    </span>
                  </div>
                </div>

                {/* Account Information */}
                <div className="bg-slate-50 rounded-lg p-5">
                  <h4 className="text-lg font-semibold text-slate-800 mb-4">Account Information</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-slate-600 mb-1">Username:</p>
                      <p className="text-base font-medium text-slate-800">
                        {user?.username || user?.full_name?.toUpperCase() || 'ADMIN'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600 mb-1">Role:</p>
                      <p className="text-base font-medium text-slate-800">
                        {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1) || 'Admin'}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-sm text-slate-600 mb-1">User ID:</p>
                      <p className="text-sm font-mono text-slate-700 break-all">
                        {user?.id || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600 mb-1">Balance:</p>
                      <p className="text-base font-medium text-slate-800">
                        ${(user?.balance || 0).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 border-t bg-slate-50 rounded-b-xl flex justify-end">
                <button
                  onClick={() => setShowProfileModal(false)}
                  className="px-6 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Active View or Home */}
        {activeView !== 'home' ? (
          <div className="bg-white rounded-xl border-2 border-blue-400 shadow-lg">
            {/* Header */}
            <div className="p-4 border-b border-slate-200 flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setActiveView('home')}
                  className="text-blue-600 hover:text-blue-800 font-medium flex items-center space-x-1"
                >
                  <span>←</span>
                  <span>Quay lại</span>
                </button>
                <span className="text-slate-400">|</span>
                <h2 className="text-xl font-bold text-slate-700">
                  {adminFeatures.find(f => f.id === activeView)?.title || 'Chi tiết'}
                </h2>
              </div>
              <span className="text-slate-500 text-sm">🕐 {getCurrentDateTime()}</span>
            </div>

            {/* Content */}
            <div className="p-6">
              {renderActiveComponent()}
            </div>
          </div>
        ) : (
          /* Home View */
          <div className="bg-white rounded-xl border-2 border-blue-400 shadow-lg">
            {/* Header */}
            <div className="p-4 border-b border-slate-200 flex justify-between items-center">
              <h1 className="text-2xl font-bold text-slate-700 flex items-center space-x-2">
                <span>🏠</span>
                <span>Trang chủ quản trị</span>
              </h1>
              <div className="flex items-center space-x-4">
                <span className="text-slate-500 text-sm">🕐 {getCurrentDateTime()}</span>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="p-6 border-b border-slate-200">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Người dùng */}
                <div className="bg-white border-2 border-blue-400 rounded-xl p-4 text-center hover:shadow-lg transition">
                  <div className="text-4xl mb-2">👥</div>
                  <div className="text-slate-600 text-sm">Người dùng</div>
                  <div className="text-3xl font-bold text-blue-600">
                    {stats?.totalUsers?.toLocaleString() || '0'}
                  </div>
                </div>

                {/* Báo cáo spam đã xử lý */}
                <div className="bg-white border-2 border-blue-400 rounded-xl p-4 text-center hover:shadow-lg transition">
                  <div className="text-4xl mb-2">✅</div>
                  <div className="text-slate-600 text-sm">Spam đã xử lý</div>
                  <div className="text-3xl font-bold text-green-600">
                    {stats?.totalSpamReports || '0'}
                  </div>
                </div>

                {/* Sản phẩm đấu giá */}
                <div className="bg-white border-2 border-blue-400 rounded-xl p-4 text-center hover:shadow-lg transition">
                  <div className="text-4xl mb-2">📦</div>
                  <div className="text-slate-600 text-sm">Sản phẩm</div>
                  <div className="text-3xl font-bold text-amber-600">
                    {stats?.totalProducts?.toLocaleString() || '0'}
                  </div>
                </div>

                {/* Tổng danh mục sản phẩm */}
                <div className="bg-white border-2 border-blue-400 rounded-xl p-4 text-center hover:shadow-lg transition">
                  <div className="text-4xl mb-2">📁</div>
                  <div className="text-slate-600 text-sm">Tổng danh mục sản phẩm</div>
                  <div className="text-3xl font-bold text-purple-600">
                    {stats?.totalCategories?.toLocaleString() || '0'}
                  </div>
                </div>
              </div>
            </div>

            {/* Line Charts Section */}
            <div className="p-6 border-b border-slate-200 bg-slate-50">
              <h3 className="text-lg font-semibold text-slate-700 mb-1">📈 Biểu đồ đường</h3>
              <p className="text-xs text-slate-500 mb-4">Chỉ hiển thị dữ liệu trong 7 ngày gần nhất</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Chart 1 - Users */}
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="text-sm font-semibold text-slate-800">Người dùng mới</h4>
                      <p className="text-xs text-slate-500 mt-0.5">Phân tích đăng ký hàng ngày</p>
                    </div>
                    <div className="flex items-center gap-1 text-green-600 text-xs">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                      <span>Dữ liệu thực</span>
                    </div>
                  </div>
                  <div className="h-20 relative mb-2">
                    {chartData ? renderLineChart(chartData.newUsers, '#60a5fa', true) : <div className="text-xs text-slate-400">Đang tải...</div>}
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex justify-between text-xs text-slate-400 flex-1">
                      {(chartData?.labels || ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']).map((label, i) => (
                        <span key={i}>{label}</span>
                      ))}
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-xs">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                      <span className="text-slate-600">Tổng: {chartData ? chartData.newUsers.reduce((a, b) => a + b, 0) : 0}</span>
                    </div>
                    <span className="text-slate-400">|</span>
                    <span className="text-slate-600">Cao nhất: {chartData ? Math.max(...chartData.newUsers) : 0}</span>
                  </div>
                </div>

                {/* Chart 2 - Bids */}
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="text-sm font-semibold text-slate-800">Số bid mới</h4>
                      <p className="text-xs text-slate-500 mt-0.5">Phân tích đấu giá hàng ngày</p>
                    </div>
                    <div className="flex items-center gap-1 text-green-600 text-xs">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                      <span>Dữ liệu thực</span>
                    </div>
                  </div>
                  <div className="h-20 relative mb-2">
                    {chartData ? renderLineChart(chartData.newBids, '#34d399', true) : <div className="text-xs text-slate-400">Đang tải...</div>}
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex justify-between text-xs text-slate-400 flex-1">
                      {(chartData?.labels || ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']).map((label, i) => (
                        <span key={i}>{label}</span>
                      ))}
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-xs">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-green-400"></div>
                      <span className="text-slate-600">Tổng: {chartData ? chartData.newBids.reduce((a, b) => a + b, 0) : 0}</span>
                    </div>
                    <span className="text-slate-400">|</span>
                    <span className="text-slate-600">Cao nhất: {chartData ? Math.max(...chartData.newBids) : 0}</span>
                  </div>
                </div>

                {/* Chart 3 - Spam Reports */}
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="text-sm font-semibold text-slate-800">Báo cáo spam</h4>
                      <p className="text-xs text-slate-500 mt-0.5">Số lượng báo cáo vi phạm</p>
                    </div>
                    <div className="flex items-center gap-1 text-green-600 text-xs">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                      <span>Dữ liệu thực</span>
                    </div>
                  </div>
                  <div className="h-20 relative mb-2">
                    {chartData ? renderLineChart(chartData.spamReports, '#a78bfa', true) : <div className="text-xs text-slate-400">Đang tải...</div>}
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex justify-between text-xs text-slate-400 flex-1">
                      {(chartData?.labels || ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']).map((label, i) => (
                        <span key={i}>{label}</span>
                      ))}
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-xs">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-purple-400"></div>
                      <span className="text-slate-600">Tổng: {chartData ? chartData.spamReports.reduce((a, b) => a + b, 0) : 0}</span>
                    </div>
                    <span className="text-slate-400">|</span>
                    <span className="text-slate-600">Cao nhất: {chartData ? Math.max(...chartData.spamReports) : 0}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="p-6">
              <h3 className="text-lg font-semibold text-slate-700 mb-4 flex items-center space-x-2">
                <span className="text-blue-600">&gt;&gt;</span>
                <span>Thao tác nhanh</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {adminFeatures.map((feature) => (
                  <button
                    key={feature.id}
                    onClick={() => setActiveView(feature.id)}
                    className={`bg-white border-2 rounded-xl p-5 text-left transition-all hover:shadow-md ${getColorClasses(feature.color)}`}
                  >
                    <div className="text-3xl mb-3">{feature.icon}</div>
                    <div className="font-medium text-slate-700">{feature.title}</div>
                    <div className="text-sm text-slate-500 mt-1">{feature.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Footer Status */}
            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 rounded-b-xl">
              <div className="flex items-center justify-end text-sm">
                <div className="text-slate-500">
                  Phiên bản: 1.0.0 | Server: Online
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminDashboard
