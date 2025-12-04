import React, { useState } from 'react'

const formatCurrency = (value) => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '—'
  return `${Number(value).toLocaleString('vi-VN')} đ`
}

const formatDateTime = (value) => {
  if (!value) return '—'
  return new Date(value).toLocaleString('vi-VN')
}

export default function WinnerSummaryCard({
  summary,
  loading,
  error,
  actionMessage,
  onRate,
  ratingSubmitting,
  onCancel,
  cancelSubmitting,
  onReopen,
  reopenSubmitting
}) {
  const [comment, setComment] = useState('')
  const [newEndTime, setNewEndTime] = useState('')

  const product = summary?.product
  const winner = summary?.winner
  const order = summary?.order
  const ratingHistory = summary?.rating_history || []
  const latestRating = summary?.rating || ratingHistory[0] || null

  const hasWinner = Boolean(winner)
  const canRate = hasWinner && ['completed', 'cancelled'].includes(product?.status)
  const canCancel = product?.status === 'completed'
  const reopenAllowedByHistory =
    ratingHistory.length === 1 &&
    ratingHistory[0].rating === 'negative' &&
    (ratingHistory[0].comment || '').trim().toLowerCase() === 'người thắng không thanh toán'

  const canReopen = ['completed', 'cancelled'].includes(product?.status) && reopenAllowedByHistory

  const handleRate = (type) => {
    if (!onRate || !canRate) return
    onRate(type, comment)
  }

  const handleReopen = () => {
    if (!onReopen || !canReopen) return
    onReopen(newEndTime)
  }

  return (
    <section className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
      <div>
        <p className="text-sm font-semibold text-slate-500 uppercase">Người thắng cuộc</p>
        <h3 className="text-xl font-bold text-slate-900">Thông tin giao dịch</h3>
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">Đang tải thông tin người thắng...</p>
      ) : error ? (
        <p className="text-sm text-rose-600">{error}</p>
      ) : !summary ? (
        <p className="text-sm text-slate-500">Không tìm thấy dữ liệu người thắng.</p>
      ) : (
        <>
          <div className="rounded-2xl border border-slate-100 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Người thắng</p>
                <p className="text-lg font-semibold text-slate-900">{winner?.full_name || '—'}</p>
                <p className="text-xs text-slate-500">{winner?.email}</p>
              </div>
              <div className="text-right text-sm">
                <p className="text-emerald-600 font-semibold">+{winner?.rating_positive ?? 0} tích cực</p>
                <p className="text-rose-600 font-semibold">-{winner?.rating_negative ?? 0} tiêu cực</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm text-slate-600">
              <div>
                <p className="text-xs text-slate-500 uppercase">Giá thắng</p>
                <p className="text-lg font-bold text-blue-600">{formatCurrency(product?.final_price || product?.current_price)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase">Thời điểm kết thúc</p>
                <p className="text-sm font-semibold text-slate-900">{formatDateTime(product?.end_time)}</p>
              </div>
            </div>
            {order?.payment_proof_url && (
              <a
                href={order.payment_proof_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 font-semibold"
              >
                🔍 Xem minh chứng thanh toán
              </a>
            )}
          </div>

          {actionMessage && (
            <div className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2">
              {actionMessage}
            </div>
          )}

          {ratingHistory.length > 0 && (
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-700 space-y-3">
              <div>
                <p className="font-semibold mb-1">Các đánh giá bạn đã gửi</p>
                <p className="text-xs text-slate-500">Mỗi lần mở lại phiên sẽ tạo thêm một đánh giá mới, đánh giá cũ vẫn được lưu.</p>
              </div>
              <ul className="space-y-2 max-h-40 overflow-auto pr-1">
                {ratingHistory.map((entry) => (
                  <li key={entry.id} className="border border-slate-200 rounded-xl px-3 py-2 bg-white">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>{formatDateTime(entry.created_at)}</span>
                      <span className={`font-semibold ${entry.rating === 'positive' ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {entry.rating === 'positive' ? 'Tích cực' : 'Tiêu cực'}
                      </span>
                    </div>
                    {entry.comment && <p className="mt-1 text-sm text-slate-700">{entry.comment}</p>}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="rounded-2xl border border-slate-100 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-900">Gửi đánh giá mới</p>
              {latestRating && (
                <span className="text-xs text-slate-500">Lần gần nhất: {formatDateTime(latestRating.created_at)}</span>
              )}
            </div>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
              rows={3}
              placeholder="Nhập nhận xét của bạn (tùy chọn)"
              disabled={!canRate}
            />
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => handleRate('positive')}
                disabled={!canRate || ratingSubmitting}
                className="flex-1 rounded-xl bg-emerald-500 text-white font-semibold py-2 hover:bg-emerald-600 disabled:opacity-60"
              >
                {ratingSubmitting ? 'Đang gửi...' : 'Đánh giá tích cực'}
              </button>
              <button
                type="button"
                onClick={() => handleRate('negative')}
                disabled={!canRate || ratingSubmitting}
                className="flex-1 rounded-xl bg-rose-500 text-white font-semibold py-2 hover:bg-rose-600 disabled:opacity-60"
              >
                {ratingSubmitting ? 'Đang gửi...' : 'Đánh giá tiêu cực'}
              </button>
            </div>
            {!canRate && (
              <p className="text-xs text-slate-500">Bạn chỉ có thể đánh giá sau khi phiên đấu giá kết thúc hoặc bị hủy.</p>
            )}
          </div>

          <div className="space-y-3">
            <button
              type="button"
              onClick={onCancel}
              disabled={!canCancel || cancelSubmitting}
              className="w-full rounded-xl border border-rose-200 text-rose-600 font-semibold py-2 hover:bg-rose-50 disabled:opacity-60"
            >
              {cancelSubmitting ? 'Đang xử lý...' : 'Hủy giao dịch'}
            </button>

            {canReopen && (
              <div className="rounded-2xl border border-slate-100 p-4 space-y-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Mở lại đấu giá</p>
                  <p className="text-xs text-slate-500">Chọn thời điểm kết thúc mới để bắt đầu lại phiên.</p>
                </div>
                <input
                  type="datetime-local"
                  value={newEndTime}
                  min={new Date().toISOString().slice(0, 16)}
                  onChange={(e) => setNewEndTime(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
                <button
                  type="button"
                  onClick={handleReopen}
                  disabled={reopenSubmitting}
                  className="w-full rounded-xl bg-slate-900 text-white font-semibold py-2 hover:bg-slate-800 disabled:opacity-60"
                >
                  {reopenSubmitting ? 'Đang mở lại...' : 'Mở lại đấu giá sản phẩm'}
                </button>
              </div>
            )}
            {!canReopen && ['completed', 'cancelled'].includes(product?.status) && (
              <p className="text-xs text-slate-400">
                Bạn chỉ có thể mở lại phiên nếu đánh giá duy nhất của sản phẩm là tiêu cực với nội dung "Người thắng không thanh toán".
              </p>
            )}
          </div>
        </>
      )}
    </section>
  )
}
