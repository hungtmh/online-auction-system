import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import guestAPI from '../../services/guestAPI'
import { authAPI, clearAccessToken } from '../../services/api'
import UnifiedNavbar from '../common/UnifiedNavbar'
import EmptySection from './components/EmptySection'
import MyProductsSection from './components/MyProductsSection'
import ProductCreation from './ProductCreation/ProductCreation'
import SellerProfileSection from './components/SellerProfileSection'
import SalesOverviewSection from './components/SalesOverviewSection'
import { DEFAULT_ACTIVE_TAB, TAB_PLACEHOLDERS } from './constants'

const TAB_TITLES = {
  profile: 'Hồ sơ cá nhân',
  'my-products': 'Sản phẩm của tôi',
  'add-product': 'Đăng sản phẩm mới',
  sales: 'Thống kê doanh thu'
}

const SellerDashboard = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [user, setUser] = useState(null)
  const [profileError, setProfileError] = useState(null)
  
  // Get activeTab from URL path
  const getActiveTabFromPath = () => {
    const path = location.pathname;
    if (path.includes('/profile')) return 'profile';
    if (path.includes('/my-products')) return 'my-products';
    if (path.includes('/add-product')) return 'add-product';
    if (path.includes('/sales')) return 'sales';
    return DEFAULT_ACTIVE_TAB;
  };
  
  const [activeTab, setActiveTab] = useState(getActiveTabFromPath())
  const [categories, setCategories] = useState([])
  const [loadingCategories, setLoadingCategories] = useState(true)
  const currentTabTitle = useMemo(() => TAB_TITLES[activeTab] || 'Khu vực quản lý', [activeTab])
  
  useEffect(() => {
    setActiveTab(getActiveTabFromPath());
  }, [location.pathname]);

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

  const handleProfileSync = (profile) => {
    setUser((prev) => ({
      ...prev,
      full_name: profile?.full_name ?? prev?.full_name,
      avatar_url: profile?.avatar_url ?? prev?.avatar_url
    }))
  }

  const renderTabContent = () => {
    if (activeTab === 'profile') {
      return <SellerProfileSection onProfileChange={handleProfileSync} />
    }

    if (activeTab === 'my-products') {
      return <MyProductsSection />
    }

    if (activeTab === 'add-product') {
      return <ProductCreation categories={categories} loadingCategories={loadingCategories} />
    }

    if (activeTab === 'sales') {
      return <SalesOverviewSection />
    }

    return <EmptySection message={TAB_PLACEHOLDERS[activeTab] || TAB_PLACEHOLDERS.default} />
  }
  
  const goToMarketplace = () => {
    navigate('/auctions')
  }
  
  const handleSelectTab = (tab) => {
    navigate(`/seller/${tab}`);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <UnifiedNavbar user={user} />

      <main className="container mx-auto px-6 py-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-slate-400">KHU VỰC</p>
            <h2 className="text-2xl font-semibold text-slate-800">{currentTabTitle}</h2>
          </div>
          <button
            type="button"
            onClick={goToMarketplace}
            className="flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white shadow hover:bg-slate-700"
          >
            <span role="img" aria-hidden="true">
              🚀
            </span>
            Khám phá
          </button>
        </div>

        <section className="rounded-xl bg-white p-6 shadow-md">{renderTabContent()}</section>
      </main>
    </div>
  )
}

export default SellerDashboard
