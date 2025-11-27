import React from "react";
import { useNavigate } from "react-router-dom";

// Helper functions
function formatCurrency(v) {
  try {
    return v.toLocaleString("vi-VN") + " đ";
  } catch (e) {
    return (v || 0) + " đ";
  }
  return `${amount.toLocaleString("vi-VN")} đ`;
}

function timeLeftLabel(endAt) {
  if (!endAt) return "";
  const end = new Date(endAt);
  const now = new Date();
  const diff = end - now;
  if (diff <= 0) return "Đã kết thúc";
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes} phút nữa`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ nữa`;
  const days = Math.floor(hours / 24);
  return `${days} ngày nữa`;
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleDateString("vi-VN");
}

function maskBidderName(name) {
  if (!name) return "Ẩn danh";
  // Lấy ký tự cuối cùng, mask phần đầu bằng ****
  const lastChar = name.slice(-1);
  return `****${lastChar}`;
}

export default function ProductCard({ product }) {
  const navigate = useNavigate();

  // Kiểm tra sản phẩm mới (trong vòng N phút - đặt N = 60 phút)
  const createdAt = product.created_at ? new Date(product.created_at) : null;
  const isNew = createdAt ? (Date.now() - createdAt.getTime()) / 60000 < 60 : false;

  const productUrl = `/products/${product.id}`;
  const displayName = product.title || product.name || "Sản phẩm";
  const description = product.short_description || product.description || "";
  const endingLabel = timeLeftLabel(product.end_time);

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-2xl transition-all duration-300 group">
      {/* Image */}
      <div className="relative aspect-w-16 aspect-h-9 bg-gray-100 overflow-hidden">
        <img
          src={product.image_url || `https://placehold.co/400x300/e5e7eb/6b7280?text=${encodeURIComponent(product.title || 'Product')}`}
          alt={product.title}
          className="w-full h-56 object-cover group-hover:scale-110 transition-transform duration-300"
          onError={(e) => {
            e.target.src = `https://placehold.co/400x300/e5e7eb/6b7280?text=No+Image`;
          }}
        />
        {/* Badge NEW nếu sản phẩm mới đăng */}
        {isNew && (
          <div className="absolute top-3 left-3">
            <span className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg animate-pulse">
              ✨ MỚI
            </span>
          </div>
        )}
        {/* Thời gian kết thúc */}
        <div className="absolute bottom-3 right-3 bg-black/70 text-white text-xs px-3 py-1 rounded-full">
          ⏰ {timeLeftLabel(product.end_time)}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Title */}
        <h3 className="font-bold text-lg text-gray-900 line-clamp-2 mb-2 group-hover:text-blue-600 transition">
          {product.title}
        </h3>

        {/* Category - Click để xem danh mục */}
        {product.category_name && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/auctions?category=${product.category_id}`);
            }}
            className="inline-block text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded mb-3 hover:bg-blue-100 transition"
          >
            📁 {product.category_name}
          </button>
        )}

        {/* Giá hiện tại & Giá mua ngay */}
        <div className="mb-3 space-y-2">
          <div>
            <div className="text-xs text-gray-500">Giá hiện tại</div>
            <div className="text-xl font-bold text-blue-600">{formatCurrency(product.current_price || 0)}</div>
          </div>
          {product.buy_now_price && (
            <div>
              <div className="text-xs text-gray-500">Giá mua ngay</div>
              <div className="text-sm font-semibold text-green-600">{formatCurrency(product.buy_now_price)}</div>
            </div>
          )}
        </div>

        {/* Thông tin người bán & bidder */}
        <div className="mb-3 space-y-1 text-xs text-gray-600">
          <div className="flex items-center justify-between">
            <span>👤 Người bán:</span>
            <span className="font-medium">{product.seller_name || "Ẩn danh"}</span>
          </div>
          {product.highest_bidder_name && (
            <div className="flex items-center justify-between">
              <span>🏆 Đấu giá cao nhất:</span>
              <span className="font-medium text-orange-600">{maskBidderName(product.highest_bidder_name)}</span>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between mb-4 text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <span>🔨</span>
            <span className="font-medium">{product.bid_count || 0} lượt đấu</span>
          </div>
          <div className="text-xs text-gray-500">
            📅 {formatDate(product.created_at)}
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={() => navigate(productUrl)}
          className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 transition"
        >
          Xem chi tiết
        </button>
      </div>
    </div>
  );
}
