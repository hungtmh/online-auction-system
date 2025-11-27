import React from 'react'
import { formatCurrency } from '../utils'

export default function RelatedProductsGrid({ products = [], onSelect }) {
  if (!products.length) return null

  return (
    <div className="mt-12">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">📦 Sản phẩm cùng chuyên mục</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
        {products.slice(0, 5).map((p) => (
          <div
            key={p.id}
            onClick={() => onSelect(p.id)}
            className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-xl transition"
          >
            <img src={p.image_url || 'https://via.placeholder.com/300x200'} alt={p.title} className="w-full h-40 object-cover" />
            <div className="p-4">
              <h3 className="font-semibold text-sm text-gray-900 line-clamp-2 mb-2">{p.title}</h3>
              <div className="text-lg font-bold text-blue-600">{formatCurrency(p.current_price || 0)}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
