import { useEffect, useState } from 'react'
import guestAPI from '../../services/guestAPI'
import { authAPI, clearAccessToken } from '../../services/api'
import DashboardHeader from './components/DashboardHeader'
import DashboardTabs from './components/DashboardTabs'
import EmptySection from './components/EmptySection'
import MyProductsSection from './components/MyProductsSection'
import ProductCreation from './ProductCreation/ProductCreation'
import { DEFAULT_ACTIVE_TAB, TAB_CONFIG, TAB_PLACEHOLDERS } from './constants'

const SellerDashboard = () => {
  const [user, setUser] = useState(null)
  const [profileError, setProfileError] = useState(null)
  const [activeTab, setActiveTab] = useState(DEFAULT_ACTIVE_TAB)
  const [categories, setCategories] = useState([])
  const [loadingCategories, setLoadingCategories] = useState(true)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const profile = await authAPI.getProfile()
        setUser(profile)
      } catch (error) {
        console.error('Error fetching profile:', error)
        setProfileError('Không thể tải thông tin người dùng')
      }
    }

    const fetchCategories = async () => {
      try {
        setLoadingCategories(true)
        const response = await guestAPI.getCategories()
        const payload = response?.data || response?.categories || []
        setCategories(Array.isArray(payload) ? payload : [])
      } catch (error) {
        console.error('Error fetching categories:', error)
        setCategories([])
      } finally {
        setLoadingCategories(false)
      }
    }

    fetchProfile()
    fetchCategories()
  }, [])

  const handleLogout = async () => {
    try {
      await authAPI.logout()
      clearAccessToken()
      window.location.href = '/'
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const renderTabContent = () => {
    if (activeTab === 'add-product') {
      return <ProductCreation categories={categories} loadingCategories={loadingCategories} />
    }

    if (activeTab === 'my-products') {
      return <MyProductsSection />
    }

    return <EmptySection message={TAB_PLACEHOLDERS[activeTab]} />
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <DashboardHeader user={user} profileError={profileError} onLogout={handleLogout} />

      <main className="container mx-auto px-6 py-8">
        <DashboardTabs tabs={TAB_CONFIG} activeTab={activeTab} onChange={setActiveTab} />

        <section className="rounded-xl bg-white p-6 shadow-md">{renderTabContent()}</section>
      </main>
    </div>
  )
}

export default SellerDashboard
