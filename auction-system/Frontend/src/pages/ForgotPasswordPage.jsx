import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authAPI } from '../services/api'

function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState('email') // 'email' | 'verify-otp' | 'reset-password'
  const [email, setEmail] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [resetToken, setResetToken] = useState('')
  const [passwords, setPasswords] = useState({
    new_password: '',
    confirm_password: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  // Step 1: Gửi OTP đến email
  const handleSendOTP = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const data = await authAPI.forgotPassword(email)
      
      if (data.success) {
        setStep('verify-otp')
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể gửi OTP. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  // Step 2: Xác thực OTP
  const handleVerifyOTP = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (otpCode.length !== 6) {
      setError('Mã OTP phải có 6 chữ số')
      setLoading(false)
      return
    }

    try {
      const data = await authAPI.verifyResetOTP(email, otpCode)

      if (data.success) {
        setResetToken(data.resetToken)
        setStep('reset-password')
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Mã OTP không hợp lệ')
    } finally {
      setLoading(false)
    }
  }

  // Step 3: Đặt mật khẩu mới
  const handleResetPassword = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (passwords.new_password !== passwords.confirm_password) {
      setError('Mật khẩu xác nhận không khớp')
      setLoading(false)
      return
    }

    if (passwords.new_password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự')
      setLoading(false)
      return
    }

    try {
      const data = await authAPI.resetPassword(
        resetToken,
        passwords.new_password,
        passwords.confirm_password
      )

      if (data.success) {
        setSuccess(true)
        setTimeout(() => {
          navigate('/login')
        }, 2000)
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể đặt lại mật khẩu')
    } finally {
      setLoading(false)
    }
  }

  // Gửi lại OTP
  const handleResendOTP = async () => {
    setLoading(true)
    setError(null)

    try {
      await authAPI.forgotPassword(email)
      alert('✅ Mã OTP mới đã được gửi! Vui lòng kiểm tra email.')
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể gửi lại OTP')
    } finally {
      setLoading(false)
    }
  }

  // Success screen
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-2">Đặt lại mật khẩu thành công!</h3>
          <p className="text-gray-600 mb-4">
            Bạn có thể đăng nhập bằng mật khẩu mới.
          </p>
          <p className="text-sm text-gray-500">
            Đang chuyển đến trang đăng nhập...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative">
        {/* Close button */}
        <button
          onClick={() => navigate('/login')}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl"
        >
          ×
        </button>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* Step 1: Nhập email */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {step === 'email' && (
          <>
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-gray-800 mb-2">Quên mật khẩu?</h2>
              <p className="text-gray-600">
                Nhập email của bạn để nhận mã OTP đặt lại mật khẩu
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleSendOTP} className="space-y-6">
              <div>
                <label className="block text-gray-700 font-medium mb-2">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  placeholder="your@email.com"
                  autoFocus
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold py-3 rounded-lg hover:from-blue-600 hover:to-blue-700 transition duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Đang gửi...' : 'Gửi mã OTP'}
              </button>
            </form>

            <p className="text-center mt-6 text-gray-600">
              Nhớ mật khẩu?{' '}
              <button
                onClick={() => navigate('/login')}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Đăng nhập
              </button>
            </p>
          </>
        )}

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* Step 2: Xác thực OTP */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {step === 'verify-otp' && (
          <>
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-gray-800 mb-2">Xác thực OTP</h2>
              <p className="text-gray-600">
                Nhập mã OTP đã gửi đến<br />
                <strong className="text-blue-600">{email}</strong>
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleVerifyOTP} className="space-y-6">
              <div>
                <label className="block text-gray-700 font-medium mb-2 text-center">
                  Mã OTP (6 chữ số)
                </label>
                <input
                  type="text"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength={6}
                  required
                  className="w-full px-4 py-4 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-center text-2xl font-bold tracking-widest"
                  placeholder="000000"
                  autoFocus
                />
                <p className="text-xs text-gray-500 mt-2 text-center">
                  ⏰ Mã OTP có hiệu lực trong 10 phút
                </p>
              </div>

              <button
                type="submit"
                disabled={loading || otpCode.length !== 6}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold py-3 rounded-lg hover:from-blue-600 hover:to-blue-700 transition duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Đang xác thực...' : 'Xác thực OTP'}
              </button>

              <div className="text-center">
                <p className="text-gray-600 text-sm mb-2">Không nhận được mã?</p>
                <button
                  type="button"
                  onClick={handleResendOTP}
                  disabled={loading}
                  className="text-blue-600 hover:text-blue-700 font-medium text-sm underline disabled:opacity-50"
                >
                  Gửi lại mã OTP
                </button>
              </div>
            </form>

            <button
              onClick={() => setStep('email')}
              className="w-full mt-4 text-gray-600 hover:text-gray-800 text-sm"
            >
              ← Quay lại nhập email
            </button>
          </>
        )}

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* Step 3: Đặt mật khẩu mới */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {step === 'reset-password' && (
          <>
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-gray-800 mb-2">Đặt mật khẩu mới</h2>
              <p className="text-gray-600">
                Nhập mật khẩu mới cho tài khoản<br />
                <strong className="text-blue-600">{email}</strong>
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleResetPassword} className="space-y-6">
              <div>
                <label className="block text-gray-700 font-medium mb-2">Mật khẩu mới</label>
                <input
                  type="password"
                  value={passwords.new_password}
                  onChange={(e) => setPasswords({ ...passwords, new_password: e.target.value })}
                  required
                  minLength={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  placeholder="••••••••"
                  autoFocus
                />
                <p className="text-xs text-gray-500 mt-1">Tối thiểu 6 ký tự</p>
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">Xác nhận mật khẩu</label>
                <input
                  type="password"
                  value={passwords.confirm_password}
                  onChange={(e) => setPasswords({ ...passwords, confirm_password: e.target.value })}
                  required
                  minLength={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white font-bold py-3 rounded-lg hover:from-green-600 hover:to-green-700 transition duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Đang xử lý...' : 'Đặt lại mật khẩu'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}

export default ForgotPasswordPage
