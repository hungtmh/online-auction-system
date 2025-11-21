import React from 'react'

const formatCurrency = (value) => {
  if (value === null || value === undefined) return '—'
  return `${Number(value).toLocaleString('vi-VN')} đ`
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

const formatDate = (value) => {
  if (!value) return '—'
  return new Date(value).toLocaleString('vi-VN')
}

export default function BidHistory({ bids = [] }) {
  return (
    <section className="bg-white rounded-2xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Lịch sử đấu giá</h3>
        <span className="text-sm text-gray-500">{bids.length} lượt</span>
      </div>

      {bids.length === 0 ? (
        <p className="text-sm text-gray-500">Chưa có lượt đấu giá nào.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="py-2 pr-4">Thời điểm</th>
                <th className="py-2 pr-4">Người mua</th>
                <th className="py-2 text-right">Giá</th>
              </tr>
            </thead>
            <tbody>
              {bids.map((bid) => (
                <tr key={bid.id} className="border-b last:border-0">
                  <td className="py-3 pr-4 text-gray-700">{formatDate(bid.created_at)}</td>
                  <td className="py-3 pr-4 font-medium text-gray-900">{maskName(bid.profiles?.full_name)}</td>
                  <td className="py-3 text-right font-semibold text-blue-600">{formatCurrency(bid.bid_amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
