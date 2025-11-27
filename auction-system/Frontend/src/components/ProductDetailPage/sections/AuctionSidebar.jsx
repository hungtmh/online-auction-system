import React from 'react'
import { formatCurrency, formatDateTime, timeLeftLabel } from '../utils'

export default function AuctionSidebar({ product, onCategoryClick, onLogin }) {
  return (
    <>
      <div className="bg-white rounded-xl shadow-md p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-3">{product.title}</h1>
        {product.category_name && (
          <button
            onClick={onCategoryClick}
            className="inline-block text-sm text-blue-600 bg-blue-50 px-3 py-1 rounded-full hover:bg-blue-100 transition"
          >
            📁 {product.category_name}
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="mb-4">
          <div className="text-sm text-gray-500 mb-1">Giá hiện tại</div>
          <div className="text-4xl font-bold text-blue-600">{formatCurrency(product.current_price || 0)}</div>
        </div>

        {product.buy_now_price && (
          <div className="mb-4 pb-4 border-b">
            <div className="text-sm text-gray-500 mb-1">Giá mua ngay</div>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(product.buy_now_price)}</div>
          </div>
        )}

        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Thời điểm đăng:</span>
            <span className="font-medium">{formatDateTime(product.created_at)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Thời điểm kết thúc:</span>
            <span className="font-medium">{formatDateTime(product.end_time)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Thời gian còn lại:</span>
            <span className="text-lg font-bold text-orange-600">⏰ {timeLeftLabel(product.end_time)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Số lượt đấu:</span>
            <span className="font-bold text-blue-600">{product.bid_count || 0} lượt</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">👥 Thông tin</h3>
        <div className="space-y-3">
          <div>
            <div className="text-sm text-gray-500">Người bán</div>
            <div className="font-medium text-gray-900">{product.seller_name || 'Ẩn danh'}</div>
            <div className="text-xs flex items-center gap-2">
              <span className="text-green-600">👍 {product.seller_rating_positive || 0}</span>
              <span className="text-red-600">👎 {product.seller_rating_negative || 0}</span>
            </div>
          </div>
          {product.highest_bidder_name && (
            <div className="pt-3 border-t">
              <div className="text-sm text-gray-500">Người đặt giá cao nhất</div>
              <div className="font-medium text-orange-600">{product.highest_bidder_name}</div>
              <div className="text-xs flex items-center gap-2">
                <span className="text-green-600">👍 {product.highest_bidder_rating_positive || 0}</span>
                <span className="text-red-600">👎 {product.highest_bidder_rating_negative || 0}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6">
        <button
          onClick={onLogin}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold text-lg mb-3 hover:bg-blue-700 transition"
        >
          Đấu giá ngay
        </button>
        {product.buy_now_price && (
          <button
            onClick={onLogin}
            className="w-full bg-green-600 text-white py-3 rounded-lg font-bold text-lg hover:bg-green-700 transition"
          >
            Mua ngay
          </button>
        )}
      </div>
    </>
  )
}
