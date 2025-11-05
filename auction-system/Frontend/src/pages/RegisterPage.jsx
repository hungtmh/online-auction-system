import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authAPI } from '../services/api'

function RegisterPage() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    full_name: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [showSuccessModal, setShowSuccessModal] = useState(false)

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Validate
    if (formData.password !== formData.confirmPassword) {
      setError('Mật khẩu xác nhận không khớp')
      setLoading(false)
      return
    }

    if (formData.password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự')
      setLoading(false)
      return
    }

    try {
      const data = await authAPI.register(
        formData.email,
        formData.password,
        formData.full_name
      )

      if (data.success) {
        if (data.requireEmailVerification) {
          setShowSuccessModal(true)
          // Redirect sang login sau 5 giây
          setTimeout(() => {
            navigate('/login')
          }, 5000)
        }
      }
    } catch (err) {
      const errorData = err.response?.data
      setError(errorData?.message || 'Đăng ký thất bại')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Auction System</h1>
          <p className="text-gray-600">Tạo tài khoản mới</p>
        </div>

        {/* Register Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {/* Google OAuth */}
          <button
            onClick={() => window.location.href = `${import.meta.env.VITE_API_URL}/auth/google`}
            className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-300 hover:border-gray-400 text-gray-700 font-medium py-3 px-4 rounded-lg transition mb-6"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Đăng ký với Google
          </button>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">Hoặc đăng ký bằng email</span>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Register Form */}
          <form onSubmit={handleRegister} className="space-y-5">
            <div>
              <label className="block text-gray-700 font-medium mb-2">Họ và tên</label>
              <input
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
                placeholder="Nguyễn Văn A"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2">Mật khẩu</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
                placeholder="••••••••"
              />
              <p className="text-xs text-gray-500 mt-1">Tối thiểu 6 ký tự</p>
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2">Xác nhận mật khẩu</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-500 to-purple-600 text-white font-bold py-3 rounded-lg hover:from-purple-600 hover:to-purple-700 transition duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Đang đăng ký...' : 'Đăng ký'}
            </button>
          </form>

          {/* Switch to Login */}
          <p className="text-center mt-6 text-gray-600">
            Đã có tài khoản?{' '}
            <button
              onClick={() => navigate('/login')}
              className="text-purple-600 hover:text-purple-700 font-medium"
            >
              Đăng nhập ngay
            </button>
          </p>
        </div>

        {/* Back to Home */}
        <div className="text-center mt-6">
          <button
            onClick={() => navigate('/')}
            className="text-gray-600 hover:text-gray-800 text-sm"
          >
            ← Về trang chủ
          </button>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center">
            <div className="mb-6">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">Đăng ký thành công!</h3>
              <p className="text-gray-600 mb-4">
                📧 Chúng tôi đã gửi email xác nhận đến <strong>{formData.email}</strong>
              </p>
              <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 text-left">
                <p className="text-sm text-yellow-700">
                  <strong>Lưu ý:</strong> Vui lòng kiểm tra hộp thư (kể cả thư mục Spam) và click vào link xác nhận để kích hoạt tài khoản.
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/login')}
              className="bg-gradient-to-r from-purple-500 to-purple-600 text-white font-bold py-3 px-6 rounded-lg hover:from-purple-600 hover:to-purple-700 transition"
            >
              Đến trang đăng nhập
            </button>
            <p className="text-xs text-gray-500 mt-4">Tự động chuyển sau 5 giây...</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default RegisterPage
