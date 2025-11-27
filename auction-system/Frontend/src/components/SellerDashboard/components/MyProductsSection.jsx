import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import sellerAPI from '../../../services/sellerAPI'

const STATUS_TABS = [
  { id: 'all', label: 'Tất cả' },
  { id: 'pending', label: 'Chờ duyệt' },
  { id: 'active', label: 'Đang đấu' },
  { id: 'completed', label: 'Đã kết thúc' },
  { id: 'cancelled', label: 'Đã hủy' }
]

const statusColors = {
  pending: 'bg-amber-100 text-amber-700',
  active: 'bg-emerald-100 text-emerald-700',
  completed: 'bg-slate-200 text-slate-700',
  cancelled: 'bg-rose-100 text-rose-700'
}

const formatCurrency = (value) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value)

const formatDateTime = (value) =>
  new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'short',
    timeStyle: 'short'
  }).format(new Date(value))

const MyProductsSection = () => {
  const navigate = useNavigate()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [statusFilter, setStatusFilter] = useState('all')

  const filteredEmptyMessage = useMemo(() => {
    switch (statusFilter) {
      case 'pending':
        return 'Không có sản phẩm nào đang chờ duyệt.'
      case 'active':
        return 'Bạn chưa có sản phẩm nào đang đấu giá.'
      case 'completed':
        return 'Chưa có sản phẩm nào kết thúc phiên đấu.'
      case 'cancelled':
        return 'Không có sản phẩm nào bị hủy.'
      default:
        return 'Bạn chưa đăng sản phẩm nào.'
    }
  }, [statusFilter])

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true)
        setError(null)
        const params = {}
        if (statusFilter !== 'all') params.status = statusFilter
        const response = await sellerAPI.getMyProducts(params)
        if (!response?.success) {
          throw new Error(response?.message || 'Không thể tải dữ liệu.')
        }
        setProducts(Array.isArray(response.data) ? response.data : [])
      } catch (err) {
        console.error('Error fetching my products:', err)
        setError(err.message || 'Đã có lỗi xảy ra khi tải dữ liệu.')
        setProducts([])
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [statusFilter])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setStatusFilter(tab.id)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
              statusFilter === tab.id ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading && <p className="text-sm text-slate-500">Đang tải danh sách sản phẩm...</p>}
      {error && !loading && <p className="text-sm text-red-500">{error}</p>}

      {!loading && !products.length && (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
          {filteredEmptyMessage}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {products.map((product) => (
          <article
            key={product.id}
            role="button"
            tabIndex={0}
            onClick={() => navigate(`/products/${product.id}`)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                navigate(`/products/${product.id}`)
              }
            }}
            className="flex gap-4 rounded-xl border border-slate-100 p-4 shadow-sm transition hover:border-emerald-200 hover:shadow-md focus:border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-200 cursor-pointer"
          >
            <img
              src={product.thumbnail_url || product.images?.[0]}
              alt={product.name}
              className="h-28 w-28 rounded-lg object-cover"
            />

            <div className="flex-1 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-500">
                    {product.categories?.name || 'Danh mục khác'}
                  </p>
                  <h3 className="text-lg font-bold text-slate-800">{product.name}</h3>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusColors[product.status] || 'bg-slate-200'}`}>
                  {statusLabel(product.status)}
                </span>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <InfoRow label="Giá hiện tại" value={formatCurrency(product.current_price || product.starting_price)} />
                <InfoRow label="Giá mua ngay" value={product.buy_now_price ? formatCurrency(product.buy_now_price) : '—'} />
                <InfoRow label="Thời gian kết thúc" value={formatDateTime(product.end_time)} />
                <InfoRow label="Lượt bid" value={product.bids?.[0]?.count || 0} />
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}

const InfoRow = ({ label, value }) => (
  <div>
    <p className="text-xs uppercase tracking-widest text-slate-500">{label}</p>
    <p className="text-base font-semibold text-slate-800">{value}</p>
  </div>
)

const statusLabel = (status) => {
  switch (status) {
    case 'pending':
      return 'Chờ duyệt'
    case 'active':
      return 'Đang đấu'
    case 'completed':
      return 'Đã kết thúc'
    case 'cancelled':
      return 'Đã hủy'
    default:
      return status || 'Không xác định'
  }
}

export default MyProductsSection
