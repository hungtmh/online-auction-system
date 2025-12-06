import React, { useEffect, useMemo, useState } from 'react'

const formatCurrency = (value) => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '—'
  return `${Number(value).toLocaleString('vi-VN')} đ`
}

const calcNextBid = (product) => {
  const current = Number(product?.current_price) || Number(product?.starting_price) || 0
  const step = Number(product?.step_price) || 0
  return step ? current + step : current
}

const STATUS_COPY = {
  ENDED_OTHER: {
    title: 'Phiên đấu giá đã kết thúc',
    body: 'Bạn không phải người thắng cuộc trong phiên đấu giá này. Hãy theo dõi các sản phẩm khác nhé!'
  },
  WINNER_PAYMENT: {
    title: 'Bạn đã thắng phiên đấu giá',
    body: 'Vui lòng tiếp tục bước thanh toán ở bên dưới.'
  }
}

const formatRelativeTime = (target) => {
  if (!target) return '—'
  const targetDate = new Date(target)
  const now = new Date()
  const diff = targetDate - now
  
  if (diff <= 0) return 'Đã kết thúc'
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  
  // If less than 3 days, show relative time
  if (days < 3) {
    if (days > 0) return `${days} ngày ${hours} giờ nữa`
    if (hours > 0) return `${hours} giờ ${minutes} phút nữa`
    return `${minutes} phút nữa`
  }
  
  // Otherwise show full date
  return targetDate.toLocaleString('vi-VN')
}

const formatDateTime = (date) => {
  if (!date) return '—'
  return new Date(date).toLocaleString('vi-VN')
}

const useCountdown = (target) => {
  const targetDate = useMemo(() => (target ? new Date(target) : null), [target])
  const [label, setLabel] = useState('')

  useEffect(() => {
    if (!targetDate) {
      setLabel('—')
      return
    }
    const update = () => {
      const diff = targetDate - new Date()
      if (diff <= 0) {
        setLabel('Đã kết thúc')
        return
      }
      const hours = Math.floor(diff / 36e5)
      const minutes = Math.floor((diff % 36e5) / 6e4)
      const seconds = Math.floor((diff % 6e4) / 1e3)
      setLabel(`${hours}h ${minutes}m ${seconds}s`)
    }
    update()
    const timer = setInterval(update, 1000)
    return () => clearInterval(timer)
  }, [targetDate])

  return label
}

const maskName = (name) => {
  if (!name) return 'Ẩn danh'
  const cleaned = name.trim().replace(/\s+/g, ' ')
  if (!cleaned) return 'Ẩn danh'

  const lettersOnly = cleaned.replace(/\s/g, '')
  if (!lettersOnly) return 'Ẩn danh'

  const visibleChars = Math.min(2, lettersOnly.length)
  const suffix = lettersOnly.slice(-visibleChars)
  return `****${suffix}`
}

export default function BidActionPanel({
  product,
  mode,
  user,
  onLoginRedirect,
  onPlaceBid,
  bidSubmitting,
  actionMessage,
  myMaxBid,
  isWinning
}) {
  const [maxBid, setMaxBid] = useState('')
  const [inputError, setInputError] = useState(null)
  const countdown = useCountdown(product?.end_time)
  const isActive = mode === 'ACTIVE'
  const isGuest = !user
  // Check if seller is viewing their own product
  const isOwnProduct = user?.role === 'seller' && user?.id === product?.seller_id
  // Seller can bid on OTHER products, not their own
  const canBid = (user?.role === 'bidder' || user?.role === 'seller') && !isOwnProduct
  const nextMinimumBid = useMemo(() => calcNextBid(product), [product])

  useEffect(() => {
    setInputError(null)
  }, [product])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!onPlaceBid || !isActive || bidSubmitting) return

    const numericMaxBid = Number(maxBid)
    if (!Number.isFinite(numericMaxBid) || numericMaxBid <= 0) {
      setInputError('Vui lòng nhập giá tối đa hợp lệ')
      return
    }

    if (numericMaxBid < (product?.starting_price || 0)) {
      setInputError(`Giá tối đa phải >= giá khởi điểm (${formatCurrency(product?.starting_price)})`)
      return
    }

    setInputError(null)
    const result = await onPlaceBid(numericMaxBid)
    
    // Nếu đặt giá thành công, clear input
    if (result?.success) {
      setMaxBid('')
    }
  }

  if (mode !== 'ACTIVE') {
    // Hiển thị thông báo đặc biệt cho sản phẩm đã bị hủy
    if (product?.status === 'cancelled') {
      return (
        <div className="bg-white rounded-2xl shadow-sm p-6 space-y-2 border-l-4 border-red-500">
          <div className="flex items-start">
            <span className="text-2xl mr-3">🚫</span>
            <div>
              <h3 className="text-lg font-semibold text-red-800">Sản phẩm đã bị hủy</h3>
              <p className="text-sm text-red-700 mt-1">
                Sản phẩm này đã bị hủy bởi quản trị viên và không còn có thể tham gia đấu giá.
              </p>
              {product.rejected_reason && (
                <p className="text-sm text-red-600 mt-2 font-medium">
                  Lý do: {product.rejected_reason}
                </p>
              )}
            </div>
          </div>
        </div>
      )
    }
    
    const copy = STATUS_COPY[mode]
    if (!copy) return null
    return (
      <div className="bg-white rounded-2xl shadow-sm p-6 space-y-2">
        <h3 className="text-lg font-semibold text-gray-900">{copy.title}</h3>
        <p className="text-gray-600 text-sm leading-relaxed">{copy.body}</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 space-y-5">
      <div>
        <p className="text-sm text-gray-500">Giá hiện tại</p>
        <p className="text-3xl font-bold text-blue-600">{formatCurrency(product?.current_price || product?.starting_price)}</p>
      </div>

      {product?.buy_now_price && (
        <div className="flex items-center justify-between rounded-xl bg-blue-50 px-4 py-3">
          <div>
            <p className="text-sm text-blue-600">Giá mua ngay</p>
            <p className="text-xl font-semibold text-blue-700">{formatCurrency(product?.buy_now_price)}</p>
          </div>
          <span className="text-xs text-blue-500">Liên hệ seller để xác nhận</span>
        </div>
      )}

      {/* My max bid status (only visible to the user themselves) */}
      {canBid && myMaxBid && (
        <div className={`rounded-xl px-4 py-3 border ${
          isWinning 
            ? 'bg-emerald-50 border-emerald-200' 
            : 'bg-amber-50 border-amber-200'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${isWinning ? 'text-emerald-600' : 'text-amber-600'}`}>
                Giá tối đa của bạn
              </p>
              <p className={`text-xl font-bold ${isWinning ? 'text-emerald-700' : 'text-amber-700'}`}>
                {formatCurrency(myMaxBid)}
              </p>
            </div>
            <div className={`text-right`}>
              {isWinning ? (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium">
                  ✓ Đang giữ giá
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-medium">
                  ⚠ Bị vượt qua
                </span>
              )}
            </div>
          </div>
          <p className="mt-2 text-xs text-gray-500">
            💡 Thông tin này chỉ hiển thị với bạn
          </p>
        </div>
      )}

      {/* Highest bidder info - Người đang giữ giá cao nhất */}
      {product?.bids?.length > 0 && (() => {
        // Tìm người có max_bid_amount cao nhất, nếu bằng thì người đặt trước thắng
        const bidderMaxMap = new Map()
        for (const bid of product.bids) {
          const bidderId = bid.bidder_id
          const maxBid = Number(bid.max_bid_amount) || Number(bid.bid_amount) || 0
          const existing = bidderMaxMap.get(bidderId)
          
          if (!existing || maxBid > existing.max || 
              (maxBid === existing.max && new Date(bid.created_at) < new Date(existing.created_at))) {
            bidderMaxMap.set(bidderId, {
              max: maxBid,
              created_at: bid.created_at,
              profile: bid.profiles
            })
          }
        }
        
        // Tìm người có max cao nhất
        let winner = null
        for (const [bidderId, data] of bidderMaxMap.entries()) {
          if (!winner || data.max > winner.max ||
              (data.max === winner.max && new Date(data.created_at) < new Date(winner.created_at))) {
            winner = { bidderId, ...data }
          }
        }
        
        if (!winner) return null
        const bidderProfile = winner.profile || {}
        const bidderName = bidderProfile.full_name || 'Ẩn danh'
        const bidderPositive = bidderProfile.rating_positive ?? 0
        const bidderNegative = bidderProfile.rating_negative ?? 0
        return (
          <div className="rounded-xl bg-green-50 px-4 py-3 border border-green-100">
            <p className="text-sm text-green-600">Người giữ giá cao nhất</p>
            <p className="font-semibold text-green-700">{maskName(bidderName)}</p>
            <p className="text-xs text-green-600">Đánh giá: +{bidderPositive} / -{bidderNegative}</p>
          </div>
        )
      })()}

      {/* Time info */}
      <div className="space-y-2 text-sm">
        <div className="flex items-center justify-between text-gray-500">
          <span>Thời điểm đăng</span>
          <span className="font-medium text-gray-700">{formatDateTime(product?.created_at)}</span>
        </div>
        <div className="flex items-center justify-between text-gray-500">
          <span>Thời điểm kết thúc</span>
          <span className="font-medium text-gray-700">{formatRelativeTime(product?.end_time)}</span>
        </div>
        <div className="flex items-center justify-between text-gray-500">
          <span>Còn lại</span>
          <span className="font-semibold text-orange-600">{countdown}</span>
        </div>
      </div>

      {isGuest && (
        <button
          onClick={onLoginRedirect}
          className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition"
        >
          Đăng nhập để đấu giá
        </button>
      )}

      {!isGuest && !canBid && isOwnProduct && (
        <div className="text-sm text-blue-600 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
          <p className="font-semibold mb-1">Đây là sản phẩm của bạn</p>
          <p className="text-xs">Bạn có thể theo dõi tiến trình đấu giá và trả lời câu hỏi của bidder.</p>
        </div>
      )}
      
      {!isGuest && !canBid && !isOwnProduct && (
        <div className="text-sm text-orange-600 bg-orange-50 border border-orange-100 rounded-xl px-4 py-3">
          Chỉ tài khoản bidder hoặc seller mới có thể đặt giá.
        </div>
      )}

      {canBid && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Nhập giá tối đa bạn sẵn sàng trả
            </label>
            <input
              type="number"
              className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-3 text-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              min={product?.starting_price || 0}
              step={product?.step_price || 1}
              value={maxBid}
              onChange={(e) => {
                setMaxBid(e.target.value)
                if (inputError) setInputError(null)
              }}
              placeholder={formatCurrency(product?.starting_price || 0)}
              required
            />
            <div className="mt-2 space-y-1">
              <p className="text-xs text-gray-500">
                💡 <strong>Đấu giá tự động:</strong> Bạn chỉ cần nhập giá tối đa 1 lần
              </p>
              <p className="text-xs text-gray-500">
                • Hệ thống sẽ tự động đấu giá thay bạn với giá vừa đủ thắng
              </p>
              <p className="text-xs text-gray-500">
                • Giá khởi điểm: {formatCurrency(product?.starting_price)}
              </p>
              <p className="text-xs text-gray-500">
                • Bước giá: {formatCurrency(product?.step_price)}
              </p>
            </div>
            {inputError && <p className="mt-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{inputError}</p>}
          </div>
          <button
            type="submit"
            disabled={bidSubmitting}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-blue-200"
          >
            {bidSubmitting ? '⏳ Đang xử lý...' : '🚀 Đặt giá tự động'}
          </button>
          {actionMessage && (
            <div className="text-sm text-center px-4 py-3 rounded-xl bg-blue-50 text-blue-700 border border-blue-100">
              {actionMessage}
            </div>
          )}
        </form>
      )}
    </div>
  )
}
