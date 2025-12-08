import { createContext, useContext, useState, useEffect } from 'react'
import { authAPI, setAccessToken, getAccessToken, clearAccessToken } from '../services/api'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Kiểm tra auth khi app load
  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const token = getAccessToken()
      
      if (!token) {
        // Thử refresh token từ cookie
        try {
          const refreshData = await authAPI.refreshToken()
          setAccessToken(refreshData.accessToken)
        } catch (err) {
          console.log('No valid token found')
          setLoading(false)
          return
        }
      }
      
      // Fetch user profile
      const userData = await authAPI.getProfile()
      setUser(userData)
    } catch (error) {
      console.log('Auth check failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const login = async (email, password, recaptchaToken) => {
    const data = await authAPI.login(email, password, recaptchaToken)
    
    if (data.success) {
      setAccessToken(data.accessToken)
      setUser(data.user)
      return data
    }
    throw new Error(data.message || 'Login failed')
  }

  const logout = async () => {
    try {
      await authAPI.logout()
    } finally {
      clearAccessToken()
      setUser(null)
    }
  }

  const value = {
    user,
    loading,
    login,
    logout,
    checkAuth
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
