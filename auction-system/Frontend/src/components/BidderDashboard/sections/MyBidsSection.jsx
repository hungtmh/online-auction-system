import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import bidderAPI from '../../../services/bidderAPI'

function MyBidsSection() {
  const navigate = useNavigate()
  const [bids, setBids] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('ongoing') // 'ongoing' hoặc 'won'

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

  // Lọc bids theo tab
  const ongoingBids = bids.filter(bid => getBidStatusKey(bid) === 'ongoing')
  const wonBids = bids.filter(bid => getBidStatusKey(bid) === 'won')
  
  const displayBids = activeTab === 'ongoing' ? ongoingBids : wonBids

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('ongoing')}
            className={`pb-3 px-4 font-medium transition-all relative ${
              activeTab === 'ongoing'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Đang tham gia
            <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-600 font-semibold">
              {ongoingBids.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('won')}
            className={`pb-3 px-4 font-medium transition-all relative ${
              activeTab === 'won'
                ? 'text-green-600 border-b-2 border-green-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Đã thắng
            <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-600 font-semibold">
              {wonBids.length}
            </span>
          </button>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-gray-600">
          {activeTab === 'ongoing' ? 'Đang tham gia' : 'Đã thắng'}: {displayBids.length} sản phẩm
        </p>
        <button onClick={loadMyBids} className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
          </svg>
          Tải lại
        </button>
      </div>

      {/* Danh sách bids */}
      {displayBids.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <div className="text-5xl mb-4">{activeTab === 'ongoing' ? '🏃' : '🏆'}</div>
          <p className="text-lg font-semibold text-gray-800 mb-2">
            {activeTab === 'ongoing' 
              ? 'Bạn chưa có sản phẩm đang tham gia đấu giá' 
              : 'Bạn chưa thắng sản phẩm nào'}
          </p>
          <p className="mb-4">
            {activeTab === 'ongoing'
              ? 'Hãy khám phá và tham gia đấu giá các sản phẩm mới.'
              : 'Hãy tiếp tục tham gia đấu giá để có cơ hội thắng.'}
          </p>
          <button onClick={() => navigate('/auctions')} className="px-6 py-2 bg-blue-600 text-white rounded-lg">
            Xem sản phẩm
          </button>
        </div>
      ) : (
        <ul className="space-y-4">
          {displayBids.map((bid) => (
            <BidHistoryCard
              key={bid.id}
              bid={bid}
              onView={() => navigate(`/products/${bid.product_id || bid.products?.id}`)}
            />
          ))}
        </ul>
      )}
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
  // Dùng max_bid_amount (giá tối đa) thay vì bid_amount để so sánh
  const myMaxBid = bid.max_bid_amount || bid.bid_amount || 0
  const currentPrice = product.current_price || 0
  const myBidderId = bid.bidder_id
  const highestBidderId = product.highest_bidder_id
  
  // Check if auction has ended (by time or status)
  const endTime = product.end_time ? new Date(product.end_time) : null
  const isEnded = endTime && endTime < new Date()
  const isCompleted = product.status === 'completed' || product.status === 'cancelled'

  const statusKey = getBidStatusKey(bid)
  
  // Kiểm tra xem có đang dẫn đầu không
  // Dẫn đầu khi: highest_bidder_id trùng với mình và không bị rejected
  const isLeading = statusKey === 'ongoing' && highestBidderId === myBidderId && !bid.is_rejected
  
  // Kiểm tra xem có bị vượt giá không
  // Bị vượt khi: không phải người dẫn đầu, hoặc current_price > myMaxBid
  const isOutbid = statusKey === 'ongoing' && (!isLeading || currentPrice > myMaxBid)

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
        if (isOutbid) {
          return <span className={`${base} bg-yellow-100 text-yellow-700`}>Đã bị vượt</span>
        }
        if (isLeading) {
          return <span className={`${base} bg-blue-100 text-blue-700`}>Đang dẫn đầu</span>
        }
      }
      return <span className={`${base} bg-gray-100 text-gray-700`}>{product.status || 'Không rõ'}</span>
    }

  return (
    <div className={`border rounded-xl p-4 hover:border-blue-300 transition ${
      isOutbid ? 'bg-yellow-50 border-yellow-300' : 'border-gray-200 bg-white'
    }`}>
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
          <div className="mt-1 space-y-1">
            <p className="text-sm text-gray-500">
              Giá tối đa của bạn: <span className="font-medium text-blue-600">{(myMaxBid || 0).toLocaleString('vi-VN')} đ</span>
            </p>
            <p className={`text-sm flex items-center gap-1 ${
              isOutbid ? 'text-yellow-700' : 'text-gray-500'
            }`}>
              {isOutbid && (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
              )}
              Giá hiện tại: <span className={`font-semibold ${isOutbid ? 'text-yellow-800' : 'text-gray-700'}`}>
                {(currentPrice || 0).toLocaleString('vi-VN')} đ
              </span>
            </p>
            <p className="text-sm text-gray-500">
              Thời gian đặt: {bid.created_at ? new Date(bid.created_at).toLocaleString('vi-VN') : '—'}
            </p>
          </div>
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
