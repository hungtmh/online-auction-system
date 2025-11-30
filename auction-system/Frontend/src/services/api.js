import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api'

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true // Gửi cookies (refresh token)
})

// Access token (lưu trong memory, không lưu localStorage)
let accessToken = null

export const setAccessToken = (token) => {
  accessToken = token
}

export const getAccessToken = () => {
  return accessToken
}

export const clearAccessToken = () => {
  accessToken = null
}

// Request interceptor - tự động attach access token
api.interceptors.request.use(
  (config) => {
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor - tự động refresh token khi hết hạn
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // Nếu lỗi 401, chưa retry, và không phải request refresh
    if (
      error.response?.status === 401 && 
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/refresh') &&
      !originalRequest.url?.includes('/auth/login')
    ) {
      originalRequest._retry = true

      try {
        console.log('🔄 Access token hết hạn, đang refresh...')
        
        // Gọi API refresh token (cookie tự động gửi)
        const { data } = await axios.post(
          `${API_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        )

        if (data.success && data.accessToken) {
          // Lưu access token mới
          setAccessToken(data.accessToken)
          console.log('✅ Đã refresh access token thành công')

          // Retry request ban đầu với token mới
          originalRequest.headers.Authorization = `Bearer ${data.accessToken}`
          return api(originalRequest)
        }
      } catch (refreshError) {
        // Refresh token hết hạn → Đăng xuất
        console.error('❌ Refresh token hết hạn, vui lòng đăng nhập lại')
        clearAccessToken()
        window.location.href = '/'
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

// Auth API
export const authAPI = {
  register: async (email, password, full_name, address = '') => {
    const { data } = await api.post('/auth/register', { email, password, full_name, address })
    // Không set token vì cần verify OTP trước
    return data
  },

  verifyOTP: async (email, otp_code) => {
    const { data } = await api.post('/auth/verify-otp', { email, otp_code })
    return data
  },

  resendOTP: async (email) => {
    const { data } = await api.post('/auth/resend-otp', { email })
    return data
  },

  login: async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password })
    if (data.success) {
      setAccessToken(data.accessToken)
    }
    return data
  },

  refreshToken: async () => {
    const { data } = await api.post('/auth/refresh')
    if (data.success) {
      setAccessToken(data.accessToken)
    }
    return data
  },

  logout: async () => {
    await api.post('/auth/logout')
    clearAccessToken()
  },

  getProfile: async () => {
    const { data } = await api.get('/auth/profile')
    return data.user
  },

  // ═══════════════════════════════════════════════════════════
  // PASSWORD MANAGEMENT
  // ═══════════════════════════════════════════════════════════
  
  // Lấy loại tài khoản: 'google_only' | 'local' | 'hybrid'
  getAccountType: async () => {
    const { data } = await api.get('/auth/account-type')
    return data.data
  },

  // Đổi mật khẩu (TH2, TH3 - tài khoản đã có mật khẩu)
  changePassword: async (old_password, new_password, confirm_password) => {
    const { data } = await api.post('/auth/change-password', { 
      old_password, 
      new_password, 
      confirm_password 
    })
    return data
  },

  // Tạo mật khẩu cho tài khoản Google (TH1 - chưa có mật khẩu)
  createPassword: async (new_password, confirm_password) => {
    const { data } = await api.post('/auth/create-password', { 
      new_password, 
      confirm_password 
    })
    return data
  },

  // ═══════════════════════════════════════════════════════════
  // FORGOT PASSWORD
  // ═══════════════════════════════════════════════════════════
  
  // Gửi OTP đặt lại mật khẩu
  forgotPassword: async (email) => {
    const { data } = await api.post('/auth/forgot-password', { email })
    return data
  },

  // Xác thực OTP reset password
  verifyResetOTP: async (email, otp_code) => {
    const { data } = await api.post('/auth/verify-reset-otp', { email, otp_code })
    return data
  },

  // Đặt mật khẩu mới (sau khi verify OTP)
  resetPassword: async (reset_token, new_password, confirm_password) => {
    const { data } = await api.post('/auth/reset-password', { 
      reset_token, 
      new_password, 
      confirm_password 
    })
    return data
  },

  // Backward compatibility
  resendVerification: async (email) => {
    return authAPI.resendOTP(email)
  }
}

export default api
