import React from 'react'
import ProductCard from './ProductCard'

export default function FeaturedProducts({ title = 'Nổi bật', products = [], viewAllHref = '/auctions', user, watchlistIds = new Set() }) {
  return (
    <section className="py-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-bold text-gray-800">{title}</h3>
        <a className="text-blue-600 hover:text-blue-700" href={viewAllHref}>Xem tất cả →</a>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} user={user} isInWatchlist={watchlistIds.has(p.id)} />
        ))}
      </div>
    </section>
  )
}
