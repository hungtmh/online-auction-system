import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { setAccessToken } from '../services/api'
import { useDialog } from '../context/DialogContext.jsx'

function AuthCallback() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { alert } = useDialog()

  useEffect(() => {
    const token = searchParams.get('token')
    const error = searchParams.get('error')

    if (error) {
      alert({
        icon: '⚠️',
        title: 'Đăng nhập thất bại',
        message: error,
      }).finally(() => navigate('/'))
      return
    }

    if (token) {
      // Lưu access token vào memory trước
      setAccessToken(token)
      console.log('✅ OAuth login successful, token saved')

      // Force reload trang chủ - App.jsx sẽ dùng refresh token cookie để lấy lại access token
      // Đợi 1 chút để cookie được set từ backend
      setTimeout(() => {
        window.location.href = '/'
      }, 300)
    } else {
      navigate('/')
    }
  }, [searchParams, navigate])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-4 text-gray-600">Đang xử lý đăng nhập...</p>
      </div>
    </div>
  )
}

export default AuthCallback
