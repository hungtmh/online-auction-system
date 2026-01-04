import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import bidderAPI from "../../services/bidderAPI";

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

export default function ProductCard({ product, user, isInWatchlist: initialWatchlist = false, onWatchlistChange }) {
  const navigate = useNavigate();
  const [isInWatchlist, setIsInWatchlist] = useState(initialWatchlist);
  const [watchlistLoading, setWatchlistLoading] = useState(false);

  const handleToggleWatchlist = async (e) => {
    e.stopPropagation();
    if (!user) {
      navigate(`/login?redirect=${encodeURIComponent(`/products/${product.id}`)}`);
      return;
    }
    if (user.role !== 'bidder') return;

    setWatchlistLoading(true);
    try {
      if (isInWatchlist) {
        await bidderAPI.removeFromWatchlist(product.id);
        setIsInWatchlist(false);
      } else {
        await bidderAPI.addToWatchlist(product.id);
        setIsInWatchlist(true);
      }
      onWatchlistChange?.();
    } catch (err) {
      console.error('Watchlist toggle error:', err);
    } finally {
      setWatchlistLoading(false);
    }
  };

  // Kiểm tra sản phẩm mới (trong vòng N phút - đặt N = 60 phút)
  const createdAt = product.created_at ? new Date(product.created_at) : null;
  const isNew = createdAt ? (Date.now() - createdAt.getTime()) / 60000 < 60 : false;

  const productUrl = `/products/${product.id}`;
  const displayName = product.title || product.name || "Sản phẩm";
  const description = product.short_description || product.description || "";
  const endingLabel = timeLeftLabel(product.end_time);
  const thumbnailUrl =
    product.thumbnail_url ||
    product.image_url ||
    `https://placehold.co/400x300/e5e7eb/6b7280?text=${encodeURIComponent(product.title || 'Product')}`;

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-2xl transition-all duration-300 group flex flex-col h-full">
      {/* Image */}
      <div className="relative aspect-w-16 aspect-h-9 bg-gray-100 overflow-hidden flex-shrink-0">
        <img
          src={thumbnailUrl}
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
              MỚI
            </span>
          </div>
        )}
        {/* Watchlist Button */}
        {user?.role === 'bidder' && (
          <button
            onClick={handleToggleWatchlist}
            disabled={watchlistLoading}
            className={`absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full shadow-lg transition ${
              isInWatchlist
                ? 'bg-pink-500 text-white'
                : 'bg-white/90 text-gray-500 hover:bg-white hover:text-pink-500'
            } disabled:opacity-60`}
            title={isInWatchlist ? 'Bỏ yêu thích' : 'Thêm vào yêu thích'}
          >
            {watchlistLoading ? (
              <span className="animate-spin text-xs">⏳</span>
            ) : (
              <span>{isInWatchlist ? '❤️' : '🤍'}</span>
            )}
          </button>
        )}
        {/* Thời gian còn lại - hiển thị nổi bật */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm font-semibold">{timeLeftLabel(product.end_time)}</span>
            </div>
            {product.bid_count > 0 && (
              <div className="flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                </svg>
                <span className="text-xs font-medium">{product.bid_count}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-grow">
        {/* Product Name */}
        <div className="text-sm text-gray-600 mb-1 h-5">{displayName}</div>
        
        {/* Title - Fixed height */}
        <h3 className="font-bold text-lg text-gray-900 line-clamp-2 mb-2 group-hover:text-blue-600 transition h-14">
          {product.title}
        </h3>

        {/* Category - Fixed height area */}
        <div className="h-7 mb-3">
          {product.category_name ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/auctions?category=${product.category_id}`);
              }}
              className="inline-block text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded hover:bg-blue-100 transition"
            >
              {product.category_name}
            </button>
          ) : (
            <span className="inline-block text-xs text-gray-400 px-2 py-1">Chưa có danh mục</span>
          )}
        </div>

        {/* Giá hiện tại & Giá mua ngay - Fixed height */}
        <div className="mb-3 space-y-2">
          <div>
            <div className="text-xs text-gray-500">Giá hiện tại</div>
            <div className="text-xl font-bold text-blue-600">{formatCurrency(product.current_price || 0)}</div>
          </div>
          <div className="h-10">
            <div>
              <div className="text-xs text-gray-500">Giá mua ngay</div>
              <div className={`text-sm font-semibold ${product.buy_now_price ? 'text-green-600' : 'text-gray-400'}`}>
                {product.buy_now_price ? formatCurrency(product.buy_now_price) : 'Chưa có'}
              </div>
            </div>
          </div>
        </div>

        {/* Thông tin người đấu giá cao nhất - Fixed height */}
        <div className="mb-3 h-10">
          {product.highest_bidder_name ? (
            <div className="p-2 bg-orange-50 border border-orange-200 rounded-lg h-full">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-orange-600">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span className="text-xs text-gray-600">Giá cao nhất:</span>
                </div>
                <span className="text-xs font-bold text-orange-600">{maskBidderName(product.highest_bidder_name)}</span>
              </div>
            </div>
          ) : (
            <div className="p-2 bg-gray-50 border border-gray-200 rounded-lg h-full">
              <div className="flex items-center justify-center h-full">
                <span className="text-xs text-gray-400">Chưa có người đấu giá</span>
              </div>
            </div>
          )}
        </div>

        {/* Thông tin người bán & số lượt đấu */}
        <div className="mb-3 space-y-2 flex-grow">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-600">Người bán:</span>
            <span className="font-medium text-gray-900">{product.seller_name || "Ẩn danh"}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-xs text-gray-600">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
              </svg>
              <span className="font-semibold text-gray-900">{product.bid_count || 0}</span>
              <span>lượt đấu giá</span>
            </div>
            <div className="text-xs text-gray-500">
              {formatDate(product.created_at)}
            </div>
          </div>
        </div>

        {/* Action Button - Always at bottom */}
        <button
          onClick={() => navigate(productUrl)}
          className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 transition mt-auto"
        >
          Xem chi tiết
        </button>
      </div>
    </div>
  );
}
