import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import bidderAPI from '../../../services/bidderAPI'

function MyBidsSection() {
  const navigate = useNavigate()
  const [bids, setBids] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    loadMyBids()
  }, [])

  const loadMyBids = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await bidderAPI.getMyBids()
      setBids(res?.data || [])
    } catch (err) {
      console.error('Failed to load bids:', err)
      setError('Không thể tải lịch sử đấu giá')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-500">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4"></div>
        <p>Đang tải lịch sử đấu giá...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12 text-red-500">
        <div className="text-5xl mb-4">⚠️</div>
        <p className="mb-4">{error}</p>
        <button onClick={loadMyBids} className="px-6 py-2 bg-blue-600 text-white rounded-lg">
          Thử lại
        </button>
      </div>
    )
  }

  if (!bids.length) {
    return (
      <div className="text-center py-12 text-gray-500">
        <div className="text-6xl mb-4">📋</div>
        <p className="text-lg font-semibold text-gray-800 mb-2">Bạn chưa tham gia đấu giá nào</p>
        <p className="mb-4">Hãy khám phá thêm sản phẩm và đặt giá ngay.</p>
        <button onClick={() => navigate('/auctions')} className="px-6 py-2 bg-blue-600 text-white rounded-lg">
          Xem sản phẩm
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <p className="text-gray-600">Tổng cộng: {bids.length} lần đấu giá</p>
        <div className="flex items-center gap-3">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="text-sm border border-gray-300 rounded-lg px-3 py-1 text-gray-700"
          >
            <option value="all">Tất cả</option>
            <option value="ongoing">Chưa kết thúc</option>
            <option value="won">Đã thắng</option>
            <option value="lost">Không chiến thắng</option>
            <option value="rejected">Bị từ chối</option>
          </select>
          <button onClick={loadMyBids} className="text-sm text-blue-600 hover:text-blue-700">
            Tải lại
          </button>
        </div>
      </div>
      <ul className="space-y-4">
        {bids
          .filter((bid) => {
            const statusKey = getBidStatusKey(bid)
            if (filter === 'all') return true
            return statusKey === filter
          })
          .map((bid) => (
            <BidHistoryCard
              key={bid.id}
              bid={bid}
              onView={() => navigate(`/products/${bid.product_id || bid.products?.id}`)}
            />
          ))}
      </ul>
    </div>
  )
}

function getBidStatusKey(bid) {
  const product = bid.products || {}
  const endTime = product.end_time ? new Date(product.end_time) : null
  const isEnded = endTime && endTime < new Date()
  const isCompleted = product.status === 'completed' || product.status === 'cancelled'

  if (bid.is_rejected) return 'rejected'
  if (isCompleted || isEnded) {
    if (product.winner_id && product.winner_id === bid.bidder_id) return 'won'
    return 'lost'
  }
  return 'ongoing'
}

function BidHistoryCard({ bid, onView }) {
  const product = bid.products || {}
  const amount = bid.bid_amount || bid.current_price
  
  // Check if auction has ended (by time or status)
  const endTime = product.end_time ? new Date(product.end_time) : null
  const isEnded = endTime && endTime < new Date()
  const isCompleted = product.status === 'completed' || product.status === 'cancelled'

  const statusKey = getBidStatusKey(bid)

    const getStatusBadge = () => {
      const base = 'inline-flex items-center h-9 px-3 text-xs font-medium rounded-full'
      if (statusKey === 'rejected') {
        return <span className={`${base} bg-red-100 text-red-700`}>Bị từ chối</span>
      }
      if (statusKey === 'won') {
        return <span className={`${base} bg-green-100 text-green-700`}>Đã thắng</span>
      }
      if (statusKey === 'lost') {
        return <span className={`${base} bg-gray-200 text-gray-700`}>Không chiến thắng</span>
      }
      if (statusKey === 'ongoing') {
        return <span className={`${base} bg-blue-100 text-blue-700`}>Chưa kết thúc</span>
      }
      return <span className={`${base} bg-gray-100 text-gray-700`}>{product.status || 'Không rõ'}</span>
    }

  return (
    <div className="border border-gray-200 rounded-xl p-4 hover:border-blue-300 transition">
      <div className="flex flex-col md:flex-row gap-4 items-center">
        {product.thumbnail_url && (
          <img
            src={product.thumbnail_url}
            alt={product.name}
            className="w-full md:w-24 h-24 object-cover rounded-lg flex-shrink-0"
          />
        )}
        <div className="flex-1 min-w-0">
          <h4 className="text-lg font-semibold text-gray-900 line-clamp-1">{product.name || 'Sản phẩm'}</h4>
          <p className="text-sm text-gray-500 mt-1">
            Giá cao nhất của bạn: <span className="font-medium text-blue-600">{(amount || 0).toLocaleString('vi-VN')} đ</span>
          </p>
          <p className="text-sm text-gray-500">
            Thời gian đặt: {bid.created_at ? new Date(bid.created_at).toLocaleString('vi-VN') : '—'}
          </p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          {getStatusBadge()}
          <button
            onClick={onView}
            className="h-10 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition inline-flex items-center"
          >
            Xem chi tiết
          </button>
        </div>
      </div>
    </div>
  )
}

export default MyBidsSection
