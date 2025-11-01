import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { authAPI, getAccessToken } from './services/api'
import GuestHomePage from './pages/GuestHomePage'
import DashboardPage from './pages/DashboardPage'
import AuctionListPage from './pages/AuctionListPage'

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      // Nếu có access token trong memory, fetch user profile
      if (getAccessToken()) {
        const userData = await authAPI.getProfile()
        setUser(userData)
      }
    } catch (error) {
      console.log('Not authenticated')
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

  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Route for the home page */}
          <Route path="/" element={user ? <DashboardPage user={user} /> : <GuestHomePage />} />

          {/* Route for dashboard */}
          <Route path="/dashboard" element={user ? <DashboardPage user={user} /> : <GuestHomePage />} />

          {/* Route for auction list */}
          <Route path="/auctions" element={<AuctionListPage user={user} />} />

          {/* 404 Route for unmatched paths */}
          <Route path="*" element={
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
              <h1 className="text-2xl font-semibold text-gray-600">404 - Page Not Found</h1>
            </div>
          } />
        </Routes>
      </div>
    </Router>
  )
}

export default App

