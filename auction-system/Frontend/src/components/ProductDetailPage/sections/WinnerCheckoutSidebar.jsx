import React from 'react'
import { formatCurrency, formatDateTime } from '../utils'

export default function WinnerCheckoutSidebar({
  product,
  order,
  statusMeta,
  timeline,
  shippingAddress,
  onShippingChange,
  onShippingSave,
  notice
}) {
  return (
    <>
      <div className="bg-white rounded-xl shadow-md p-6 space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-gray-500">Xin chúc mừng</p>
            <h2 className="text-2xl font-bold text-gray-900 leading-snug">Bạn đã thắng phiên đấu giá này</h2>
            <p className="text-sm text-gray-500 mt-1">Hoàn tất thanh toán để tạo đơn hàng với người bán.</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusMeta.chip}`}>
            {statusMeta.label}
          </span>
        </div>
        <div className="space-y-3 text-sm text-gray-600">
          <div className="flex items-center justify-between">
            <span>Mã đơn hàng</span>
            <span className="font-semibold">{order.id ? `#${order.id.slice(0, 8)}` : 'Sẽ tạo sau'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Giá thắng cuộc</span>
            <span className="font-semibold text-blue-600">{formatCurrency(order.final_price)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Hạn thanh toán</span>
            <span className="font-medium">{formatDateTime(order.created_at)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Người bán</span>
            <span className="font-medium">{product.seller_name || 'Ẩn danh'}</span>
          </div>
        </div>
        <button className="w-full bg-slate-900 text-white py-3 rounded-lg font-semibold hover:bg-slate-800 transition">
          Thanh toán ngay
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6 space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Thông tin giao hàng</h3>
          <p className="text-sm text-gray-500">Địa chỉ sẽ được dùng khi người bán gửi hàng.</p>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-semibold text-gray-500" htmlFor="shipping-address-textarea">Địa chỉ nhận hàng</label>
          <textarea
            id="shipping-address-textarea"
            className="w-full border border-gray-200 rounded-lg p-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
            value={shippingAddress}
            onChange={onShippingChange}
            placeholder="Nhập địa chỉ nhận hàng của bạn"
          />
          <button
            type="button"
            onClick={onShippingSave}
            className="inline-flex items-center justify-center px-4 py-2 text-sm font-semibold text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50"
          >
            Lưu địa chỉ
          </button>
          {notice && <p className="text-xs text-emerald-600">{notice}</p>}
        </div>
        <div className="pt-4 border-t text-sm text-gray-600 space-y-2">
          <div className="flex items-center justify-between">
            <span>Mã vận đơn</span>
            <span className="font-medium">{order.shipping_tracking_number || 'Chưa cập nhật'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Chứng từ thanh toán</span>
            {order.payment_proof_url ? (
              <a
                href={order.payment_proof_url}
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-blue-600 hover:underline"
              >
                Xem chứng từ
              </a>
            ) : (
              <span className="text-gray-500">Chưa tải lên</span>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Tiến trình đơn hàng</h3>
        <div className="space-y-4">
          {timeline.map((step, idx) => (
            <div key={step.key} className="flex gap-4">
              <div className="flex flex-col items-center">
                <span className={`w-3 h-3 rounded-full ${step.reached ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                {idx < timeline.length - 1 && (
                  <span className={`w-px flex-1 ${step.reached ? 'bg-green-400' : 'bg-gray-200'}`}></span>
                )}
              </div>
              <div className="pb-6 flex-1">
                <p className={`text-sm font-semibold ${step.reached ? 'text-gray-900' : 'text-gray-400'}`}>
                  {step.label}
                </p>
                <p className="text-xs text-gray-500">{step.description}</p>
                <p className="text-xs text-gray-400 mt-1">{step.timestamp ? formatDateTime(step.timestamp) : 'Chưa cập nhật'}</p>
              </div>
            </div>
          ))}
        </div>
        {order.status === 'cancelled' && (
          <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
            Đơn hàng đã bị hủy {order.cancellation_reason ? `: ${order.cancellation_reason}` : ''}
          </div>
        )}
      </div>
    </>
  )
}
