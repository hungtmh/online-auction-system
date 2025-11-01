import { useState } from 'react'
import { authAPI, setAccessToken } from '../../services/api'

function Login({ onClose, onSwitchToRegister }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [needsVerification, setNeedsVerification] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)

  const handleResendVerification = async () => {
    setResendLoading(true)
    try {
      await authAPI.resendVerification(email)
      alert('✅ Email xác nhận đã được gửi lại! Vui lòng kiểm tra hộp thư.')
    } catch (err) {
      alert('❌ Không thể gửi email. Vui lòng thử lại.')
    } finally {
      setResendLoading(false)
    }
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setNeedsVerification(false)

    try {
      // Gọi Backend API
      const data = await authAPI.login(email, password)
      
      if (data.success) {
        // Lưu access token vào memory
        setAccessToken(data.accessToken)
        
        // Redirect sang Dashboard
        window.location.href = '/dashboard'
      }
    } catch (err) {
      const errorData = err.response?.data
      setError(errorData?.message || 'Đăng nhập thất bại')
      
      // Nếu cần email verification
      if (errorData?.requireEmailVerification) {
        setNeedsVerification(true)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl"
        >
          ×
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Đăng nhập</h2>
          <p className="text-gray-600">Chào mừng bạn quay lại!</p>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
            <p className="text-red-700 text-sm">{error}</p>
            {needsVerification && (
              <button
                onClick={handleResendVerification}
                disabled={resendLoading}
                className="mt-2 text-sm text-blue-600 hover:text-blue-700 font-medium underline disabled:opacity-50"
              >
                {resendLoading ? 'Đang gửi...' : '📧 Gửi lại email xác nhận'}
              </button>
            )}
          </div>
        )}

        {/* Login form */}
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              placeholder="your@email.com"
            />
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Mật khẩu
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              placeholder="••••••••"
            />
          </div>

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center">
              <input type="checkbox" className="mr-2" />
              <span className="text-gray-600">Ghi nhớ đăng nhập</span>
            </label>
            <a href="#" className="text-blue-600 hover:text-blue-700 font-medium">
              Quên mật khẩu?
            </a>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold py-3 rounded-lg hover:from-blue-600 hover:to-blue-700 transition duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-white text-gray-500">hoặc</span>
          </div>
        </div>

        {/* Social login */}
        <button className="w-full border-2 border-gray-300 text-gray-700 font-medium py-3 rounded-lg hover:bg-gray-50 transition duration-200 flex items-center justify-center gap-2">
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Đăng nhập với Google
        </button>

        {/* Switch to register */}
        <p className="text-center mt-6 text-gray-600">
          Chưa có tài khoản?{' '}
          <button
            onClick={onSwitchToRegister}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Đăng ký ngay
          </button>
        </p>
      </div>
    </div>
  )
}

export default Login
