import React from 'react'

const FALLBACK_IMAGE = 'https://via.placeholder.com/300x200?text=No+Image'

const formatCurrency = (value) => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '—'
  return `${Number(value).toLocaleString('vi-VN')} đ`
}

export default function RelatedProductsGrid({ products = [], onSelect }) {
  const list = (Array.isArray(products) ? products : []).slice(0, 5)

  return (
    <section className="mt-10">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Sản phẩm liên quan</h3>
      {list.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-4 text-sm text-gray-600">Chưa có sản phẩm liên quan để hiển thị.</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {list.map((product) => (
            <div
              key={product.id}
              onClick={() => onSelect && onSelect(product.id)}
              className="bg-white rounded-xl shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
            >
              <div className="aspect-[4/3] overflow-hidden">
                <img
                  src={product.image_url || product.thumbnail_url || FALLBACK_IMAGE}
                  alt={product.name || product.title || 'Sản phẩm'}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-3">
                <h4 className="text-sm font-medium text-gray-900 line-clamp-2 mb-1">
                  {product.name || product.title || 'Sản phẩm'}
                </h4>
                <p className="text-sm font-semibold text-blue-600">
                  {formatCurrency(product.current_price || product.starting_price)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {(product.bid_count || 0)} lượt đấu
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
