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
    if (minutes > 0) return `${minutes} phút nữa`
    return 'Dưới 1 phút nữa'
  }
  
  // Otherwise show full date
  return targetDate.toLocaleString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
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
      
      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)
      
      if (days >= 3) {
        setLabel(`${days} ngày nữa`)
      } else {
        if (days > 0) {
          setLabel(`${days} ngày ${hours} giờ ${minutes} phút ${seconds} giây`)
        } else {
          setLabel(`${hours} giờ ${minutes} phút ${seconds} giây`)
        }
      }
    }
    update()
    const timer = setInterval(update, 1000)
    return () => clearInterval(timer)
  }, [targetDate])

  return label
}

const maskName = (name) => {
  if (!name) return 'Ẩn danh'
  const words = name.trim().split(/\s+/)
  
  if (words.length > 1) {
    // Nhiều từ: hiển thị ****[từ cuối]
    const lastName = words[words.length - 1]
    return `****${lastName}`
  } else {
    // 1 từ: hiển thị n*d*h*a (xen kẽ ký tự và dấu *)
    const singleWord = words[0]
    return singleWord.split('').join('*')
  }
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
  const [showConfirm, setShowConfirm] = useState(false)
  const countdown = useCountdown(product?.end_time)
  const isActive = mode === 'ACTIVE'
  const isGuest = !user
  // Check if seller is viewing their own product
  const isOwnProduct = user?.role === 'seller' && user?.id === product?.seller_id
  // Seller can bid on OTHER products, not their own
  const canBid = (user?.role === 'bidder' || user?.role === 'seller') && !isOwnProduct
  const nextMinimumBid = useMemo(() => calcNextBid(product), [product])
  
  // Kiểm tra rating của user
  const userRatingPositive = user?.rating_positive || 0
  const userRatingNegative = user?.rating_negative || 0
  const totalRatings = userRatingPositive + userRatingNegative
  const ratingScore = totalRatings > 0 ? (userRatingPositive / totalRatings) * 100 : 0
  const hasHighRating = totalRatings > 0 && ratingScore >= 80

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
    
    // Hiển thị dialog xác nhận
    setShowConfirm(true)
  }
  
  const handleConfirmBid = async () => {
    setShowConfirm(false)
    const numericMaxBid = Number(maxBid)
    const result = await onPlaceBid(numericMaxBid)
    
    // Nếu đặt giá thành công, clear input
    if (result?.success) {
      setMaxBid('')
    }
  }
  
  const handleCancelBid = () => {
    setShowConfirm(false)
  }

  if (mode !== 'ACTIVE') {
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
          {/* Thông báo về rating nếu < 80% */}
          {!hasHighRating && totalRatings > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
              <div className="flex items-start gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-yellow-800">Điểm đánh giá của bạn: {ratingScore.toFixed(1)}%</p>
                  <p className="text-xs text-yellow-700 mt-1">
                    Điểm đánh giá dưới 80% cần được người bán phê duyệt mới có thể đấu giá. 
                    Hệ thống sẽ tự động gửi yêu cầu xin phép.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {totalRatings === 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-start gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                </svg>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-blue-800">Tài khoản mới</p>
                  <p className="text-xs text-blue-700 mt-1">
                    Bạn chưa có đánh giá. Người bán có quyền chấp nhận hoặc từ chối yêu cầu đấu giá của bạn.
                  </p>
                </div>
              </div>
            </div>
          )}
          
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
      
      {/* Confirmation Dialog */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-blue-600">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900">Xác nhận đặt giá</h3>
            </div>
            
            <div className="space-y-3 mb-6">
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-sm text-gray-600 mb-1">Sản phẩm</p>
                <p className="font-semibold text-gray-900">{product?.name}</p>
              </div>
              
              <div className="bg-blue-50 rounded-xl p-4">
                <p className="text-sm text-blue-600 mb-1">Giá tối đa của bạn</p>
                <p className="text-2xl font-bold text-blue-700">{formatCurrency(Number(maxBid))}</p>
              </div>
              
              <div className="bg-gray-50 rounded-xl p-3 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Giá hiện tại:</span>
                  <span className="font-medium text-gray-900">{formatCurrency(product?.current_price || product?.starting_price)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Bước giá:</span>
                  <span className="font-medium text-gray-900">{formatCurrency(product?.step_price)}</span>
                </div>
              </div>
              
              {!hasHighRating && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3">
                  <p className="text-xs text-yellow-800">
                    ⚠️ {totalRatings === 0 
                      ? 'Bạn chưa có đánh giá. Yêu cầu đấu giá cần được người bán chấp nhận.'
                      : `Điểm đánh giá của bạn (${ratingScore.toFixed(1)}%) dưới 80%. Yêu cầu đấu giá cần được người bán phê duyệt.`
                    }
                  </p>
                </div>
              )}
              
              <p className="text-xs text-gray-500 italic">
                💡 Hệ thống sẽ tự động đấu giá cho bạn với giá vừa đủ để thắng, không vượt quá giá tối đa này.
              </p>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={handleCancelBid}
                disabled={bidSubmitting}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition disabled:opacity-60"
              >
                Hủy
              </button>
              <button
                onClick={handleConfirmBid}
                disabled={bidSubmitting}
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {bidSubmitting ? '⏳ Đang xử lý...' : 'Xác nhận đặt giá'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
