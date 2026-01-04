import React, { useMemo } from 'react'

const formatCurrency = (value) => {
  if (value === null || value === undefined) return '—'
  return `${Number(value).toLocaleString('vi-VN')} đ`
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

const formatDate = (value) => {
  if (!value) return '—'
  return new Date(value).toLocaleString('vi-VN')
}

export default function BidHistory({ bids = [] }) {
  // Tính toán người giữ giá TẠI MỖI THỜI ĐIỂM
  const bidsWithWinner = useMemo(() => {
    if (!bids || bids.length === 0) return []
    
    // Sắp xếp bids theo thời gian từ CŨ đến MỚI để tính toán tuần tự
    const sortedByTime = [...bids].sort((a, b) => 
      new Date(a.created_at) - new Date(b.created_at)
    )
    
    // Tính người giữ giá tại mỗi thời điểm
    const result = []
    const bidderMaxMap = new Map() // Lưu max_bid của mỗi bidder tính đến thời điểm đó
    
    for (const bid of sortedByTime) {
      const bidderId = bid.bidder_id
      const maxBid = Number(bid.max_bid_amount) || Number(bid.bid_amount) || 0
      
      // Cập nhật max của bidder này
      const existing = bidderMaxMap.get(bidderId)
      if (!existing || maxBid > existing.max) {
        bidderMaxMap.set(bidderId, {
          max: maxBid,
          // Giữ lại created_at của lần đầu tiên đặt max này (để xác định ai đặt trước khi cùng max)
          created_at: existing && maxBid === existing.max ? existing.created_at : bid.created_at,
          profile: bid.profiles
        })
      }
      
      // Tìm người giữ giá TẠI THỜI ĐIỂM NÀY (sau khi bid này được đặt)
      let winner = null
      for (const [id, data] of bidderMaxMap.entries()) {
        if (!winner || data.max > winner.max ||
            (data.max === winner.max && new Date(data.created_at) < new Date(winner.created_at))) {
          winner = { bidderId: id, ...data }
        }
      }
      
      result.push({
        ...bid,
        winnerAtThisPoint: winner
      })
    }
    
    // Đảo ngược để hiển thị mới nhất lên đầu
    return result.reverse()
  }, [bids])

  return (
    <section className="bg-white rounded-2xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Lịch sử đấu giá</h3>
        <span className="text-sm text-gray-500">{bids.length} lượt</span>
      </div>

      {bids.length === 0 ? (
        <p className="text-sm text-gray-500">Chưa có lượt đấu giá nào.</p>
      ) : (
        <div className="overflow-x-auto max-h-96 overflow-y-auto">
          <table className="min-w-full text-sm">
            <thead className="sticky top-0 bg-white z-10">
              <tr className="text-left text-gray-500 border-b">
                <th className="py-2 pr-4">Thời điểm</th>
                <th className="py-2 pr-4">Người giữ giá</th>
                <th className="py-2 text-right">Giá</th>
              </tr>
            </thead>
            <tbody>
              {bidsWithWinner.map((bid) => (
                <tr key={bid.id} className="border-b last:border-0">
                  <td className="py-3 pr-4 text-gray-700">{formatDate(bid.created_at)}</td>
                  <td className="py-3 pr-4 font-medium text-gray-900">
                    {/* Hiển thị tên người giữ giá TẠI THỜI ĐIỂM ĐÓ */}
                    {bid.winnerAtThisPoint ? maskName(bid.winnerAtThisPoint.profile?.full_name) : 'Ẩn danh'}
                  </td>
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
