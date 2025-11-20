import React from "react";
import { useNavigate } from "react-router-dom";

// === CHUẨN: Hàm helper đặt sau import, trước component ===
function formatCurrency(value) {
  const amount = Number(value);
  if (Number.isNaN(amount)) {
    return "0 đ";
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

export default function ProductCard({ product }) {
  const navigate = useNavigate();

  const createdAt = product.created_at ? new Date(product.created_at) : null;
  const isNew = createdAt ? (Date.now() - createdAt.getTime()) / 60000 < 60 : false; // new if within 60 minutes
  const productUrl = `/products/${product.id}`;
  const displayName = product.title || product.name || "Sản phẩm";
  const description = product.short_description || product.description || "";
  const endingLabel = timeLeftLabel(product.end_time);

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-xl transition group flex flex-col h-full">
      <div className="aspect-w-16 aspect-h-9 bg-gray-200 overflow-hidden">
        <img src={product.image_url || "https://via.placeholder.com/400x300?text=Product"} alt={product.title} className="w-full h-48 object-cover group-hover:scale-110 transition duration-300" />
      </div>
      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-4">
          <h3 className="font-semibold text-lg text-gray-800" title={displayName}>
            <span className="block line-clamp-2 min-h-[3.25rem]">{displayName}</span>
          </h3>
          {isNew && <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">MỚI</span>}
        </div>

        <p className="text-sm text-gray-500 mt-2 line-clamp-2 min-h-[3rem]">{description}</p>

        <div className="mt-3 flex items-center justify-between text-sm">
          <div>
            <div className="text-xs text-gray-500">Giá hiện tại</div>
            <div className="text-lg font-bold text-blue-600">{formatCurrency(product.current_price || 0)}</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-500">Lượt đấu</div>
            <div className="text-sm font-medium text-gray-700">{product.bid_count || 0}</div>
          </div>
        </div>

        {endingLabel && (
          <div className="mt-2 text-xs text-gray-500">Thời gian còn lại: {endingLabel}</div>
        )}

        <div className="mt-4 flex gap-2">
          <button type="button" onClick={() => navigate(productUrl)} className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition">
            Xem
          </button>

          {/* === CẢI THIỆN UX: Nút này cũng nên trỏ đến trang sản phẩm === */}
          <button type="button" onClick={() => navigate(productUrl)} className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition">
            Đấu giá ngay
          </button>
        </div>
      </div>
    </div>
  );
}
