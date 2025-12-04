import React, { useState } from 'react'

const formatCurrency = (value) => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '—'
  return `${Number(value).toLocaleString('vi-VN')} đ`
}

const formatDateTime = (value) => {
  if (!value) return '—'
  return new Date(value).toLocaleString('vi-VN')
}

export default function SellerBidManagement({
  bids = [],
  onRejectBid,
  rejectingBidId,
  errorMessage,
  successMessage,
  canModerate = true
}) {
  const [expandedBidderId, setExpandedBidderId] = useState(null)

  const handleToggleBidder = (bidderId) => {
    setExpandedBidderId((prev) => (prev === bidderId ? null : bidderId))
  }

  return (
    <section className="bg-white rounded-2xl shadow-sm p-6">
      <div className="flex flex-col gap-2 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-500">Quản lý lượt đấu giá</p>
            <h3 className="text-xl font-bold text-slate-900">{bids.length} lượt đã ghi nhận</h3>
          </div>
        </div>
        <p className="text-sm text-slate-500">
          Người bán có thể xem thông tin đánh giá của bidder và từ chối những lượt đấu giá không đáng tin cậy.
        </p>
        {errorMessage && (
          <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-2">
            {errorMessage}
          </div>
        )}
        {successMessage && (
          <div className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2">
            {successMessage}
          </div>
        )}
      </div>

      {bids.length === 0 ? (
        <p className="text-sm text-slate-500">Chưa có bidder nào đặt giá cho sản phẩm này.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b">
                <th className="py-2 pr-4">Thời điểm</th>
                <th className="py-2 pr-4">Bidder</th>
                <th className="py-2 pr-4 text-right">Giá đặt</th>
                <th className="py-2 pr-4">Trạng thái</th>
                {canModerate && <th className="py-2 text-right">Thao tác</th>}
              </tr>
            </thead>
            <tbody>
              {bids.map((bid) => {
                const bidder = bid.profiles || {}
                const bidderKey = bid.bidder_id || bid.id
                const isExpanded = expandedBidderId === bidderKey
                const statusLabel = bid.is_rejected ? 'Đã từ chối' : 'Hợp lệ'
                const statusClass = bid.is_rejected
                  ? 'bg-red-50 text-red-700 border border-red-200'
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'

                return (
                  <tr key={bid.id} className="border-b last:border-0">
                    <td className="py-3 pr-4 align-top text-slate-600">{formatDateTime(bid.created_at)}</td>
                    <td className="py-3 pr-4 align-top">
                      <button
                        type="button"
                        onClick={() => handleToggleBidder(bidderKey)}
                        className="text-left text-slate-900 font-semibold hover:text-blue-600"
                      >
                        {bidder.full_name || 'Ẩn danh'}
                      </button>
                      {isExpanded && (
                        <div className="mt-2 text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                          <p className="font-semibold">Đánh giá cộng đồng</p>
                          <p className="mt-1">👍 Positive: <span className="font-bold text-emerald-700">+{bidder.rating_positive ?? 0}</span></p>
                          <p>👎 Negative: <span className="font-bold text-rose-700">-{bidder.rating_negative ?? 0}</span></p>
                        </div>
                      )}
                    </td>
                    <td className="py-3 pr-4 align-top text-right font-semibold text-blue-600">
                      {formatCurrency(bid.bid_amount)}
                    </td>
                    <td className="py-3 pr-4 align-top">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${statusClass}`}>
                        {statusLabel}
                      </span>
                    </td>
                    {canModerate && (
                      <td className="py-3 align-top text-right">
                        <button
                          type="button"
                          disabled={bid.is_rejected || rejectingBidId === bid.id}
                          onClick={() => onRejectBid?.(bid.id)}
                          className={`inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold border transition ${
                            bid.is_rejected
                              ? 'border-slate-200 text-slate-400 cursor-not-allowed'
                              : 'border-rose-200 text-rose-600 hover:bg-rose-50 disabled:opacity-60'
                          }`}
                        >
                          {bid.is_rejected ? 'Đã từ chối' : rejectingBidId === bid.id ? 'Đang xử lý...' : 'Từ chối lượt này'}
                        </button>
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
