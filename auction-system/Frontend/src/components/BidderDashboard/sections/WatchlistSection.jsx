import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import bidderAPI from '../../../services/bidderAPI'

function WatchlistSection() {
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadWatchlist()
  }, [])

  const loadWatchlist = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await bidderAPI.getWatchlist()
      setItems(res?.data || [])
    } catch (err) {
      console.error('Failed to load watchlist:', err)
      setError('Không thể tải danh sách yêu thích')
    } finally {
      setLoading(false)
    }
  }

  const handleRemove = async (productId) => {
    try {
      await bidderAPI.removeFromWatchlist(productId)
      setItems((prev) => prev.filter((item) => (item.product_id || item.products?.id) !== productId))
    } catch (err) {
      console.error('Failed to remove from watchlist:', err)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-500">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4"></div>
        <p>Đang tải danh sách yêu thích...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12 text-red-500">
        <div className="text-5xl mb-4">⚠️</div>
        <p className="mb-4">{error}</p>
        <button onClick={loadWatchlist} className="px-6 py-2 bg-blue-600 text-white rounded-lg">
          Thử lại
        </button>
      </div>
    )
  }

  if (!items.length) {
    return (
      <div className="text-center py-12 text-gray-500">
        <div className="text-6xl mb-4">⭐</div>
        <p className="text-lg font-semibold text-gray-800 mb-2">Chưa có sản phẩm yêu thích</p>
        <p className="mb-4">Thêm sản phẩm bạn yêu thích để theo dõi và nhận thông báo.</p>
        <button onClick={() => navigate('/auctions')} className="px-6 py-2 bg-blue-600 text-white rounded-lg">
          Tìm sản phẩm
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <p className="text-gray-600">Tổng cộng: {items.length} sản phẩm</p>
        <button onClick={loadWatchlist} className="text-sm text-blue-600 hover:text-blue-700">
          Tải lại
        </button>
      </div>
      <div className="grid grid-cols-1 gap-4">
        {items.map((item) => (
          <WatchlistCard
            key={item.id}
            item={item}
            onView={() => navigate(`/products/${item.product_id || item.products?.id}`)}
            onRemove={() => handleRemove(item.product_id || item.products?.id)}
          />
        ))}
      </div>
    </div>
  )
}

function WatchlistCard({ item, onView, onRemove }) {
  const product = item.products || {}
  const endTime = product.end_time ? new Date(product.end_time) : null
  const isEnded = endTime && endTime < new Date()

  return (
    <div className="border border-gray-200 rounded-xl p-4 hover:border-blue-300 transition">
      <div className="flex flex-col md:flex-row gap-4">
        {product.thumbnail_url && (
          <img
            src={product.thumbnail_url}
            alt={product.name}
            className="w-full md:w-24 h-24 object-cover rounded-lg"
          />
        )}
        <div className="flex-1">
          <h4 className="text-lg font-semibold text-gray-900 line-clamp-1">{product.name || 'Sản phẩm'}</h4>
          <p className="text-sm text-gray-500 mt-1">
            Giá hiện tại: <span className="font-medium text-blue-600">{(product.current_price || 0).toLocaleString('vi-VN')} đ</span>
          </p>
          <p className="text-sm text-gray-500">
            {isEnded ? (
              <span className="text-red-600">Đã kết thúc</span>
            ) : (
              <>Kết thúc: {endTime ? endTime.toLocaleString('vi-VN') : '—'}</>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onView}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Xem
          </button>
          <button
            onClick={onRemove}
            className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition"
          >
            Xóa
          </button>
        </div>
      </div>
    </div>
  )
}

export default WatchlistSection
