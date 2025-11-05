import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { setAccessToken } from '../services/api'

function AuthCallback() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  useEffect(() => {
    const token = searchParams.get('token')
    const error = searchParams.get('error')

    if (error) {
      alert(`❌ Đăng nhập thất bại: ${error}`)
      navigate('/')
      return
    }

    if (token) {
      // Lưu access token vào memory
      setAccessToken(token)
      console.log('✅ OAuth login successful')
      
      // Redirect về dashboard
      setTimeout(() => {
        window.location.href = '/dashboard'
      }, 500)
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
