import React from 'react'
import { useNavigate } from 'react-router-dom'

const FALLBACK_IMAGE = 'https://via.placeholder.com/300x200?text=No+Image'

const formatCurrency = (value) => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '—'
  return `${Number(value).toLocaleString('vi-VN')} đ`
}

export default function RelatedProducts({ products = [], currentProductId }) {
  const navigate = useNavigate()
  
  // Filter out current product and limit to 5
  const filteredProducts = products
    .filter((p) => String(p.id) !== String(currentProductId))
    .slice(0, 5)

  if (filteredProducts.length === 0) {
    return (
      <section className="mt-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Sản phẩm cùng chuyên mục</h3>
        <div className="text-sm text-gray-500 bg-white rounded-xl shadow-sm p-4">Chưa có sản phẩm liên quan để hiển thị.</div>
      </section>
    )
  }

  return (
    <section className="mt-8">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Sản phẩm cùng chuyên mục</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {filteredProducts.map((product) => (
          <div
            key={product.id}
            onClick={() => navigate(`/products/${product.id}`)}
            className="bg-white rounded-xl shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
          >
            <div className="aspect-[4/3] overflow-hidden">
              <img
                src={product.image_url || product.thumbnail_url || FALLBACK_IMAGE}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-3">
              <h4 className="text-sm font-medium text-gray-900 line-clamp-2 mb-1">
                {product.name}
              </h4>
              <p className="text-sm font-semibold text-blue-600">
                {formatCurrency(product.current_price || product.starting_price)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {product.bid_count || 0} lượt đấu
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
