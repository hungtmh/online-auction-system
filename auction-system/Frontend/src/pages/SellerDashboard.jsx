import { useState, useEffect } from 'react'
import { authAPI } from '../services/api'
import { clearAccessToken } from '../services/api'

function SellerDashboard() {
  const [user, setUser] = useState(null)
  const [activeTab, setActiveTab] = useState('my-products')

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
      <nav className="bg-green-600 text-white shadow-lg">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold">🏪 Seller Dashboard</h1>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-green-700 rounded-full flex items-center justify-center">
                <span className="text-lg font-bold">
                  {user?.full_name?.charAt(0) || 'S'}
                </span>
              </div>
              <div>
                <p className="font-medium">{user?.full_name || 'Seller'}</p>
                <p className="text-xs text-green-200">{user?.role?.toUpperCase()}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="bg-green-700 hover:bg-green-800 px-4 py-2 rounded-lg transition"
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
              {['my-products', 'add-product', 'sales', 'profile'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-4 px-6 font-medium transition ${
                    activeTab === tab
                      ? 'border-b-2 border-green-600 text-green-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab === 'my-products' && '📦 Sản phẩm của tôi'}
                  {tab === 'add-product' && '➕ Đăng sản phẩm'}
                  {tab === 'sales' && '💰 Doanh thu'}
                  {tab === 'profile' && '👤 Hồ sơ'}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'my-products' && <MyProducts />}
            {activeTab === 'add-product' && <AddProduct />}
            {activeTab === 'sales' && <Sales />}
            {activeTab === 'profile' && <Profile user={user} />}
          </div>
        </div>
      </div>
    </div>
  )
}

function MyProducts() {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">📦 Sản phẩm của tôi</h2>
      <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4">
        <p className="text-yellow-700">
          <strong>🚧 Phần của Cường:</strong> Quản lý sản phẩm đang bán
        </p>
        <ul className="mt-2 ml-4 list-disc text-sm text-yellow-600">
          <li>Danh sách sản phẩm đang đấu giá</li>
          <li>Sản phẩm chờ duyệt</li>
          <li>Sản phẩm đã bán</li>
          <li>Sửa/Xóa sản phẩm</li>
          <li>Kéo dài thời gian đấu giá</li>
        </ul>
      </div>
    </div>
  )
}

function AddProduct() {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">➕ Đăng sản phẩm mới</h2>
      <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4">
        <p className="text-yellow-700">
          <strong>🚧 Phần của Cường:</strong> Form đăng sản phẩm
        </p>
        <ul className="mt-2 ml-4 list-disc text-sm text-yellow-600">
          <li>Upload ảnh sản phẩm (nhiều ảnh)</li>
          <li>Tên, mô tả, danh mục</li>
          <li>Giá khởi điểm, bước giá</li>
          <li>Thời gian đấu giá (ngày bắt đầu + kết thúc)</li>
          <li>Phương thức giao hàng</li>
        </ul>
      </div>
    </div>
  )
}

function Sales() {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">💰 Doanh thu</h2>
      <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4">
        <p className="text-yellow-700">
          <strong>🚧 Phần của Cường:</strong> Thống kê doanh thu
        </p>
        <ul className="mt-2 ml-4 list-disc text-sm text-yellow-600">
          <li>Tổng doanh thu</li>
          <li>Doanh thu theo tháng/năm</li>
          <li>Sản phẩm bán chạy nhất</li>
          <li>Biểu đồ doanh thu</li>
        </ul>
      </div>
    </div>
  )
}

function Profile({ user }) {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">👤 Hồ sơ người bán</h2>
      <div className="bg-white border rounded-lg p-6">
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-600">Họ tên</label>
            <p className="text-lg font-medium">{user?.full_name}</p>
          </div>
          <div>
            <label className="text-sm text-gray-600">Email</label>
            <p className="text-lg font-medium">{user?.email}</p>
          </div>
          <div>
            <label className="text-sm text-gray-600">Vai trò</label>
            <p className="text-lg font-medium">{user?.role}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-600">Đánh giá tích cực</label>
              <p className="text-2xl font-bold text-green-600">
                👍 {user?.rating_positive || 0}
              </p>
            </div>
            <div>
              <label className="text-sm text-gray-600">Đánh giá tiêu cực</label>
              <p className="text-2xl font-bold text-red-600">
                👎 {user?.rating_negative || 0}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SellerDashboard
