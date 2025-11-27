import React from 'react'
import { useNavigate } from 'react-router-dom'

const formatCurrency = (value) => {
  if (value === null || value === undefined) return '—'
  return `${Number(value).toLocaleString('vi-VN')} đ`
}

const STATUS_TAG = {
  pending_payment: { label: 'Chờ thanh toán', color: 'bg-amber-100 text-amber-700' },
  payment_confirmed: { label: 'Đã xác nhận thanh toán', color: 'bg-green-100 text-green-700' },
  shipped: { label: 'Đã gửi hàng', color: 'bg-blue-100 text-blue-700' },
  delivered: { label: 'Đã giao hàng', color: 'bg-purple-100 text-purple-700' },
  completed: { label: 'Hoàn tất', color: 'bg-emerald-100 text-emerald-700' },
  cancelled: { label: 'Đã hủy', color: 'bg-gray-100 text-gray-600' }
}

export default function WinnerPaymentCard({ product, order }) {
  const navigate = useNavigate()
  const finalPrice = order?.final_price || product?.final_price || product?.current_price
  const status = order?.status || 'pending_payment'
  const tag = STATUS_TAG[status] || STATUS_TAG.pending_payment

  const handleCheckoutClick = () => {
    if (!product?.id) return
    navigate(`/products/${product.id}/checkout`)
  }

  return (
    <div className="bg-slate-900 text-white rounded-2xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Thanh toán đơn hàng</h3>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${tag.color}`}>{tag.label}</span>
      </div>

      <div className="space-y-2 text-sm text-slate-200">
        <div className="flex justify-between">
          <span>Mã sản phẩm</span>
          <span className="font-semibold">#{product?.id?.slice(0, 8)}</span>
        </div>
        <div className="flex justify-between">
          <span>Giá thắng cuộc</span>
          <span className="font-semibold">{formatCurrency(finalPrice)}</span>
        </div>
        <div className="flex justify-between">
          <span>Hạn thanh toán</span>
          <span className="font-semibold">{order?.created_at ? new Date(order.created_at).toLocaleString('vi-VN') : 'Liên hệ seller'}</span>
        </div>
      </div>

      <button
        type="button"
        onClick={handleCheckoutClick}
        className="w-full bg-white text-slate-900 rounded-xl py-3 font-semibold hover:bg-slate-100 transition"
      >
        Đi tới trang thanh toán
      </button>
      <p className="text-xs text-slate-300">
        Sau khi thanh toán, hãy tải lên chứng từ để người bán xác nhận và bàn giao sản phẩm.
      </p>
    </div>
  )
}
