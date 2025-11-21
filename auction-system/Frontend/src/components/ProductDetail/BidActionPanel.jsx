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
  SELLER_PLACEHOLDER: {
    title: 'Đang xem với tư cách người bán',
    body: 'Trang quản trị dành riêng cho người bán sẽ được bổ sung trong sprint kế tiếp.'
  },
  ENDED_OTHER: {
    title: 'Phiên đấu giá đã kết thúc',
    body: 'Bạn không phải người thắng cuộc trong phiên đấu giá này. Hãy theo dõi các sản phẩm khác nhé!'
  },
  WINNER_PAYMENT: {
    title: 'Bạn đã thắng phiên đấu giá',
    body: 'Vui lòng tiếp tục bước thanh toán ở bên dưới.'
  }
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

export default function BidActionPanel({
  product,
  mode,
  user,
  onLoginRedirect,
  onPlaceBid,
  bidSubmitting,
  actionMessage
}) {
  const [bidAmount, setBidAmount] = useState(calcNextBid(product))
  const [inputError, setInputError] = useState(null)
  const countdown = useCountdown(product?.end_time)
  const isActive = mode === 'ACTIVE'
  const isGuest = !user
  const isBidder = user?.role === 'bidder'
  const nextMinimumBid = useMemo(() => calcNextBid(product), [product])
  const highestBidderId = useMemo(() => {
    if (!product?.bids || product.bids.length === 0) return null
    const topBid = product.bids.reduce((best, bid) => {
      if (!best) return bid
      return Number(bid.bid_amount || 0) > Number(best.bid_amount || 0) ? bid : best
    }, null)
    return topBid?.bidder_id || null
  }, [product])
  const isHighestBidder = isBidder && highestBidderId && user?.id === highestBidderId

  useEffect(() => {
    setBidAmount(nextMinimumBid)
    setInputError(null)
  }, [nextMinimumBid])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!onPlaceBid || !isActive || bidSubmitting) return

    if (isHighestBidder) {
      setInputError('Bạn đang là người trả giá cao nhất hiện tại. Vui lòng chờ kết quả hoặc sản phẩm có người khác trả giá.')
      return
    }

    const numericAmount = Number(bidAmount)
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setInputError('Vui lòng nhập giá đấu hợp lệ')
      return
    }

    if (numericAmount < nextMinimumBid) {
      setInputError(`Giá đấu tối thiểu là ${formatCurrency(nextMinimumBid)}`)
      return
    }

    setInputError(null)
    await onPlaceBid(numericAmount)
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

      <div className="flex items-center justify-between text-sm text-gray-500">
        <span>Kết thúc sau</span>
        <span className="font-semibold text-gray-900">{countdown}</span>
      </div>

      {isGuest && (
        <button
          onClick={onLoginRedirect}
          className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition"
        >
          Đăng nhập để đấu giá
        </button>
      )}

      {!isGuest && !isBidder && (
        <div className="text-sm text-orange-600 bg-orange-50 border border-orange-100 rounded-xl px-4 py-3">
          Chỉ tài khoản bidder mới có thể đặt giá.
        </div>
      )}

      {isBidder && (
        <form onSubmit={handleSubmit} className="space-y-4">
          {isHighestBidder && (
            <div className="text-sm text-blue-600 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
              Bạn đang là người trả giá cao nhất hiện tại.
            </div>
          )}
          <div>
            <label className="text-sm text-gray-600">Nhập giá đấu</label>
            <input
              type="number"
              className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-2 focus:border-blue-500 focus:outline-none"
              min={nextMinimumBid}
              step={product?.step_price || 1}
              value={bidAmount}
              onChange={(e) => {
                setBidAmount(e.target.value)
                if (inputError) setInputError(null)
              }}
              required
            />
            <p className="mt-1 text-xs text-gray-500">
              Tối thiểu: {formatCurrency(nextMinimumBid)} (bao gồm bước giá {formatCurrency(product?.step_price)})
            </p>
            {inputError && <p className="mt-1 text-xs text-red-500">{inputError}</p>}
          </div>
          <button
            type="submit"
            disabled={bidSubmitting || isHighestBidder}
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition disabled:opacity-60"
          >
            {bidSubmitting ? 'Đang gửi...' : 'Đặt giá ngay'}
          </button>
          {actionMessage && <p className="text-sm text-center text-gray-500">{actionMessage}</p>}
        </form>
      )}
    </div>
  )
}
