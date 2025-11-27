import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authAPI } from '../services/api'
import bidderAPI from '../services/bidderAPI'
import ProductCard from '../components/GuestHomePage/ProductCard'
import AppHeader from '../components/common/AppHeader'

const TAB_LIST = [
  { id: 'browse', label: '🔍 Khám phá đấu giá' },
  { id: 'my-bids', label: '💰 Đấu giá của tôi' },
  { id: 'watchlist', label: '⭐ Theo dõi' },
  { id: 'profile', label: '👤 Hồ sơ' }
]

const BROWSE_PAGE_SIZE = 9

function BidderDashboard() {
  const [user, setUser] = useState(null)
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [activeTab, setActiveTab] = useState('browse')
  const [browseState, setBrowseState] = useState({ data: [], loading: true, error: null })
  const [browsePagination, setBrowsePagination] = useState({ page: 1, limit: BROWSE_PAGE_SIZE, total: null, totalPages: null, hasMore: false })
  const [myBidsState, setMyBidsState] = useState({ data: [], loading: false, loaded: false, error: null })
  const [watchlistState, setWatchlistState] = useState({ data: [], loading: false, loaded: false, error: null })

  useEffect(() => {
    fetchUserProfile()
    loadBrowseProducts(1)
  }, [])

  useEffect(() => {
    if (activeTab === 'my-bids' && !myBidsState.loaded) {
      loadMyBids()
    }
    if (activeTab === 'watchlist' && !watchlistState.loaded) {
      loadWatchlist()
    }
  }, [activeTab])

  const fetchUserProfile = async () => {
    try {
      const userData = await authAPI.getProfile()
      setUser(userData)
    } catch (error) {
      console.error('Failed to fetch profile:', error)
    } finally {
      setLoadingProfile(false)
    }
  }

  const loadBrowseProducts = async (page = 1) => {
    setBrowseState((prev) => ({ ...prev, loading: true, error: null }))
    try {
      const res = await bidderAPI.getAuctionProducts({ limit: BROWSE_PAGE_SIZE, page, sort: 'ending_soon' })
      const items = res?.data || []
      setBrowseState({ data: items, loading: false, error: null })

      const pagination = res?.pagination || {}
      const totalPages = pagination.totalPages || (pagination.total ? Math.ceil(pagination.total / (pagination.limit || BROWSE_PAGE_SIZE)) : null)
      const hasMore = pagination.hasMore ?? (items.length === (pagination.limit || BROWSE_PAGE_SIZE))

      setBrowsePagination({
        page: pagination.page || page,
        limit: pagination.limit || BROWSE_PAGE_SIZE,
        total: pagination.total ?? null,
        totalPages,
        hasMore
      })
    } catch (error) {
      console.error('Failed to load products:', error)
      setBrowseState({ data: [], loading: false, error: 'Không thể tải danh sách sản phẩm' })
      setBrowsePagination((prev) => ({ ...prev, page }))
    }
  }

  const handleBrowsePageChange = (nextPage) => {
    if (!nextPage || nextPage < 1 || nextPage === browsePagination.page) return
    loadBrowseProducts(nextPage)
  }

  const loadMyBids = async () => {
    setMyBidsState((prev) => ({ ...prev, loading: true, error: null }))
    try {
      const res = await bidderAPI.getMyBids()
      setMyBidsState({ data: res?.data || [], loading: false, loaded: true, error: null })
    } catch (error) {
      console.error('Failed to load bids:', error)
      setMyBidsState({ data: [], loading: false, loaded: true, error: 'Không thể tải lịch sử đấu giá' })
    }
  }

  const loadWatchlist = async () => {
    setWatchlistState((prev) => ({ ...prev, loading: true, error: null }))
    try {
      const res = await bidderAPI.getWatchlist()
      setWatchlistState({ data: res?.data || [], loading: false, loaded: true, error: null })
    } catch (error) {
      console.error('Failed to load watchlist:', error)
      setWatchlistState({ data: [], loading: false, loaded: true, error: 'Không thể tải danh sách theo dõi' })
    }
  }

  const handleLogout = async () => {
    try {
      await authAPI.logout()
      window.location.href = '/'
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  if (loadingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader user={user} onLogout={handleLogout} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-md mb-6">
          <TabNavigation activeTab={activeTab} onChange={setActiveTab} />
          <div className="p-6">
            {activeTab === 'browse' && (
              <BrowseAuctionsTab
                state={browseState}
                onRefresh={() => loadBrowseProducts(browsePagination.page)}
                pagination={browsePagination}
                onPageChange={handleBrowsePageChange}
              />
            )}
            {activeTab === 'my-bids' && (
              <MyBidsTab state={myBidsState} onRefresh={loadMyBids} />
            )}
            {activeTab === 'watchlist' && (
              <WatchlistTab state={watchlistState} onRefresh={loadWatchlist} />
            )}
            {activeTab === 'profile' && <ProfileTab user={user} />}
          </div>
        </div>
      </div>
    </div>
  )
}

function TabNavigation({ activeTab, onChange }) {
  return (
    <div className="border-b border-gray-200">
      <nav className="flex -mb-px overflow-x-auto">
        {TAB_LIST.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`px-6 py-4 text-sm font-medium border-b-2 transition whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  )
}

function BrowseAuctionsTab({ state, onRefresh, pagination, onPageChange }) {
  const page = pagination?.page || 1
  const totalPages = pagination?.totalPages
  const pageSize = pagination?.limit || BROWSE_PAGE_SIZE
  const hasPrev = page > 1
  const hasNext = pagination?.hasMore ?? (state.data.length === pageSize && state.data.length > 0)

  const goToPage = (target) => {
    if (!onPageChange || !target || target < 1 || target === page) return
    if (target > page && !hasNext) return
    onPageChange(target)
  }

  if (state.loading) {
    return <SectionLoading label="Đang tải danh sách đấu giá" />
  }

  if (state.error) {
    return <SectionError message={state.error} onRetry={onRefresh} />
  }

  if (!state.data.length) {
    return <EmptyState icon="📦" title="Chưa có sản phẩm" subtitle="Hãy thử quay lại sau." actionLabel="Tải lại" onAction={onRefresh} />
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Sản phẩm đang đấu giá</h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => goToPage(page - 1)}
            disabled={!hasPrev}
            className="w-9 h-9 border border-gray-200 rounded-full flex items-center justify-center text-gray-600 hover:text-blue-600 hover:border-blue-300 disabled:opacity-40"
          >
            ←
          </button>
          <span className="text-sm font-medium text-gray-700">
            Trang {page}
            {totalPages ? ` / ${totalPages}` : ''}
          </span>
          <button
            type="button"
            onClick={() => goToPage(page + 1)}
            disabled={!hasNext}
            className="w-9 h-9 border border-gray-200 rounded-full flex items-center justify-center text-gray-600 hover:text-blue-600 hover:border-blue-300 disabled:opacity-40"
          >
            →
          </button>
          <button onClick={onRefresh} className="text-sm text-blue-600 hover:text-blue-700">Tải lại</button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {state.data.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  )
}

function MyBidsTab({ state, onRefresh }) {
  const navigate = useNavigate()

  if (state.loading && !state.loaded) {
    return <SectionLoading label="Đang tải lịch sử đấu giá" />
  }

  if (state.error) {
    return <SectionError message={state.error} onRetry={onRefresh} />
  }

  if (!state.data.length) {
    return (
      <EmptyState
        icon="📋"
        title="Bạn chưa tham gia đấu giá nào"
        subtitle="Hãy khám phá thêm sản phẩm và đặt giá ngay."
        actionLabel="Xem sản phẩm"
        onAction={() => navigate('/auctions')}
      />
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Đấu giá của tôi</h2>
        <button onClick={onRefresh} className="text-sm text-blue-600 hover:text-blue-700">Tải lại</button>
      </div>
      <ul className="space-y-4">
        {state.data.map((bid) => (
          <BidHistoryCard key={bid.id} bid={bid} onView={() => navigate(`/products/${bid.product_id || bid.products?.id}`)} />
        ))}
      </ul>
    </div>
  )
}

function WatchlistTab({ state, onRefresh }) {
  const navigate = useNavigate()

  if (state.loading && !state.loaded) {
    return <SectionLoading label="Đang tải danh sách theo dõi" />
  }

  if (state.error) {
    return <SectionError message={state.error} onRetry={onRefresh} />
  }

  if (!state.data.length) {
    return (
      <EmptyState
        icon="⭐"
        title="Chưa có sản phẩm theo dõi"
        subtitle="Thêm sản phẩm bạn yêu thích để nhận thông báo sớm nhất."
        actionLabel="Tìm sản phẩm"
        onAction={() => navigate('/auctions')}
      />
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Danh sách theo dõi</h2>
        <button onClick={onRefresh} className="text-sm text-blue-600 hover:text-blue-700">Tải lại</button>
      </div>
      <div className="grid grid-cols-1 gap-4">
        {state.data.map((item) => (
          <WatchlistCard key={item.id} item={item} onView={() => navigate(`/products/${item.product_id || item.products?.id}`)} />
        ))}
      </div>
    </div>
  )
}

function ProfileTab({ user }) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Thông tin cá nhân</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ProfileField label="Họ và tên" value={user?.full_name} />
        <ProfileField label="Email" value={user?.email} />
        <ProfileField label="Vai trò" value={user?.role} />
        <div className="bg-gray-50 p-6 rounded-lg">
          <div className="text-sm text-gray-500 mb-1">Đánh giá</div>
          <div className="flex items-center gap-2">
            <span className="text-green-600 font-medium">👍 {user?.rating_positive || 0}</span>
            <span className="text-gray-400">|</span>
            <span className="text-red-600 font-medium">👎 {user?.rating_negative || 0}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function ProfileField({ label, value }) {
  return (
    <div className="bg-gray-50 p-6 rounded-lg">
      <div className="text-sm text-gray-500 mb-1">{label}</div>
      <div className="text-lg font-medium text-gray-800">{value || '—'}</div>
    </div>
  )
}

function SectionLoading({ label }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-gray-500">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4"></div>
      <p>{label}</p>
    </div>
  )
}

function SectionError({ message, onRetry }) {
  return (
    <div className="text-center py-12 text-red-500">
      <div className="text-5xl mb-4">⚠️</div>
      <p className="mb-4">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="px-6 py-2 bg-blue-600 text-white rounded-lg">
          Thử lại
        </button>
      )}
    </div>
  )
}

function EmptyState({ icon, title, subtitle, actionLabel, onAction }) {
  return (
    <div className="text-center py-12 text-gray-500">
      <div className="text-6xl mb-4">{icon}</div>
      <p className="text-lg font-semibold text-gray-800 mb-2">{title}</p>
      <p className="mb-4">{subtitle}</p>
      {actionLabel && onAction && (
        <button onClick={onAction} className="px-6 py-2 bg-blue-600 text-white rounded-lg">
          {actionLabel}
        </button>
      )}
    </div>
  )
}

function BidHistoryCard({ bid, onView }) {
  const product = bid.products || {}
  const amount = bid.bid_amount || bid.current_price
  return (
    <div className="border border-gray-100 rounded-2xl p-4 flex flex-col md:flex-row gap-4">
      <div className="flex-1">
        <h4 className="text-lg font-semibold text-gray-900 line-clamp-1">{product.title || 'Sản phẩm'}</h4>
        <p className="text-sm text-gray-500 mt-1">Giá đã đặt: {(amount || 0).toLocaleString('vi-VN')} đ</p>
        <p className="text-sm text-gray-500">Trạng thái: {product.status || 'Đang đấu giá'}</p>
      </div>
      <div className="flex items-center gap-3">
        <button onClick={onView} className="px-4 py-2 bg-blue-600 text-white rounded-lg">
          Xem chi tiết
        </button>
      </div>
    </div>
  )
}

function WatchlistCard({ item, onView }) {
  const product = item.products || {}
  return (
    <div className="border border-gray-100 rounded-2xl p-4 flex items-center justify-between gap-4">
      <div>
        <h4 className="text-lg font-semibold text-gray-900">{product.title || 'Sản phẩm'}</h4>
        <p className="text-sm text-gray-500 mt-1">Giá hiện tại: {(product.current_price || 0).toLocaleString('vi-VN')} đ</p>
        <p className="text-sm text-gray-500">Kết thúc: {product.end_time ? new Date(product.end_time).toLocaleString('vi-VN') : '—'}</p>
      </div>
      <button onClick={onView} className="px-4 py-2 bg-blue-600 text-white rounded-lg">
        Vào trang sản phẩm
      </button>
    </div>
  )
}

export default BidderDashboard
