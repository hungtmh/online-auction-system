import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { authAPI, getAccessToken } from './services/api'
import GuestHomePage from './pages/GuestHomePage'
import BidderDashboard from './pages/BidderDashboard'
import SellerDashboard from './pages/SellerDashboard'
import AdminDashboard from './pages/AdminDashboard'
import AuctionListPage from './pages/AuctionListPage'
import ProductDetailPage from './pages/ProductDetailPage'
import AuthCallback from './pages/AuthCallback'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      // Nếu có access token trong memory, fetch user profile
      let token = getAccessToken()
      
      // Nếu không có access token, thử refresh từ cookie
      if (!token) {
        try {
          const refreshData = await authAPI.refreshToken()
          token = refreshData.accessToken
        } catch (refreshError) {
          console.log('No valid refresh token')
          setLoading(false)
          return
        }
      }
      
      // Fetch user profile
      const userData = await authAPI.getProfile()
      setUser(userData)
    } catch (error) {
      console.log('Not authenticated:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải...</p>
        </div>
      </div>
    )
  }

  // ═══════════════════════════════════════════════════════════
  // ROUTING THEO ROLE - MỖI NGƯỜI 1 PHÂN HỆ
  // ═══════════════════════════════════════════════════════════
  const getDashboardByRole = () => {
    if (!user) return <GuestHomePage />
    
    switch (user.role) {
      case 'admin':
        return <AdminDashboard />      // Thắng phụ trách
      case 'seller':
        return <SellerDashboard />     // Cường phụ trách
      case 'bidder':
        return <BidderDashboard />     // Khoa phụ trách
      default:
        return <GuestHomePage />       // Khải phụ trách
    }
  }

  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Auth routes - Trang đăng nhập/đăng ký riêng */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* OAuth callback route */}
          <Route path="/auth/callback" element={<AuthCallback />} />

          {/* Route chính - redirect theo role */}
          <Route path="/" element={getDashboardByRole()} />
          
          {/* Dashboard route - redirect theo role */}
          <Route path="/dashboard" element={getDashboardByRole()} />

          {/* Route riêng cho từng role (nếu muốn truy cập trực tiếp) */}
          <Route 
            path="/admin" 
            element={user?.role === 'admin' ? <AdminDashboard /> : <Navigate to="/" />} 
          />
          <Route 
            path="/seller" 
            element={user?.role === 'seller' ? <SellerDashboard /> : <Navigate to="/" />} 
          />
          <Route 
            path="/bidder" 
            element={user?.role === 'bidder' ? <BidderDashboard /> : <Navigate to="/" />} 
          />

          {/* Route for auction list - Tất cả user đều xem được */}
          <Route path="/auctions" element={<AuctionListPage user={user} />} />
          <Route path="/products/:id" element={<ProductDetailPage user={user} />} />

          {/* 404 Route */}
          <Route path="*" element={
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
              <div className="text-center">
                <h1 className="text-6xl font-bold text-gray-300">404</h1>
                <p className="text-2xl font-semibold text-gray-600 mt-4">Page Not Found</p>
                <button
                  onClick={() => window.location.href = '/'}
                  className="mt-6 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
                >
                  Về trang chủ
                </button>
              </div>
            </div>
          } />
        </Routes>
      </div>
    </Router>
  )
}

export default App

