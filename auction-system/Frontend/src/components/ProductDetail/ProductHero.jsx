import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import 'quill/dist/quill.snow.css'

const FALLBACK_IMAGE = 'https://via.placeholder.com/800x500?text=Auction+Item'

function formatCurrency(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '—'
  try {
    return `${Number(value).toLocaleString('vi-VN')} đ`
  } catch (error) {
    return `${value} đ`
  }
}

function resolveImages(product) {
  if (!product) return [FALLBACK_IMAGE]
  const fromJson = (() => {
    if (!product.images) return []
    if (Array.isArray(product.images)) return product.images
    try {
      const parsed = JSON.parse(product.images)
      return Array.isArray(parsed) ? parsed : []
    } catch (error) {
      return []
    }
  })()
  const primary = product.image_url || product.thumbnail_url || FALLBACK_IMAGE
  return [primary, ...fromJson.filter((url) => url && url !== primary)]
}

function InfoTag({ label, value }) {
  return (
    <div className="flex flex-col text-sm text-gray-500">
      <span>{label}</span>
      <span className="text-base font-semibold text-gray-900">{value}</span>
    </div>
  )
}

export default function ProductHero({ product }) {
  const navigate = useNavigate()
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const gallery = resolveImages(product)
  const category = product?.categories?.name
  const categoryId = product?.category_id
  const sellerId = product?.seller_id
  const sellerName = product?.seller?.full_name || product?.seller_name || 'Ẩn danh'
  const sellerPositive =
    product?.seller?.rating_positive ?? product?.seller_rating_positive ?? product?.seller_rating ?? 0
  const sellerNegative =
    product?.seller?.rating_negative ?? product?.seller_rating_negative ?? product?.seller_rating_bad ?? 0

  const handlePrev = (e) => {
    e.stopPropagation()
    if (isTransitioning) return
    setIsTransitioning(true)
    setActiveImageIndex((prev) => (prev === 0 ? gallery.length - 1 : prev - 1))
    setTimeout(() => setIsTransitioning(false), 500)
  }

  const handleNext = (e) => {
    e.stopPropagation()
    if (isTransitioning) return
    setIsTransitioning(true)
    setActiveImageIndex((prev) => (prev === gallery.length - 1 ? 0 : prev + 1))
    setTimeout(() => setIsTransitioning(false), 500)
  }

  const handleThumbnailClick = (index) => {
    if (isTransitioning || index === activeImageIndex) return
    setIsTransitioning(true)
    setActiveImageIndex(index)
    setTimeout(() => setIsTransitioning(false), 500)
  }

  const handleCategoryClick = () => {
    if (categoryId) {
      navigate(`/auctions?category=${categoryId}`)
    }
  }

  const handleSellerRatingClick = () => {
    if (sellerId) {
      navigate(`/users/${sellerId}/ratings`)
    }
  }

  return (
    <section className="bg-white rounded-2xl shadow-sm p-6 mb-6">
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-2/3">
          <div className="relative rounded-2xl overflow-hidden bg-gray-100 group">
            <img
              key={activeImageIndex}
              src={gallery[activeImageIndex] || FALLBACK_IMAGE}
              alt={product?.title}
              className="w-full h-[420px] object-contain bg-gray-50 transition-opacity duration-500 ease-in-out"
              style={{ opacity: isTransitioning ? 0 : 1 }}
            />
            
            {gallery.length > 1 && (
              <>
                <button
                  onClick={handlePrev}
                  disabled={isTransitioning}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 p-2 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                  </svg>
                </button>
                <button
                  onClick={handleNext}
                  disabled={isTransitioning}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 p-2 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </button>
              </>
            )}
          </div>
          
          {gallery.length > 1 && (
            <div className="flex gap-3 mt-3 overflow-x-auto pb-2">
              {gallery.map((image, index) => (
                <button
                  key={`${image}-${index}`}
                  onClick={() => handleThumbnailClick(index)}
                  disabled={isTransitioning}
                  className={`flex-shrink-0 relative rounded-lg overflow-hidden border-2 transition-all duration-300 ${
                    activeImageIndex === index 
                      ? 'border-blue-600 ring-2 ring-blue-100 scale-105 shadow-md' 
                      : 'border-transparent hover:border-gray-300 hover:scale-105 hover:shadow-sm'
                  } ${isTransitioning ? 'cursor-not-allowed opacity-70' : ''}`}
                >
                  <img
                    src={image}
                    alt={`Ảnh phụ ${index + 1}`}
                    className="w-20 h-20 object-cover transition-transform duration-300"
                  />
                  {activeImageIndex === index && (
                    <div className="absolute inset-0 bg-blue-600/10 pointer-events-none"></div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="lg:w-1/3 space-y-4">
          {category && (
            <button
              onClick={handleCategoryClick}
              className="inline-flex items-center px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-sm font-medium hover:bg-blue-100 transition-colors cursor-pointer"
            >
              {category}
            </button>
          )}
          <h1 className="text-2xl font-bold text-gray-900">{product?.name}</h1>
          <div className="max-h-32 overflow-y-auto">
            <div className="ql-editor ql-snow" style={{ padding: 0, border: 'none' }}>
              <div 
                className="text-gray-600 leading-relaxed text-sm"
                dangerouslySetInnerHTML={{ 
                  __html: product?.description || '<p>Sản phẩm chưa có mô tả chi tiết.</p>' 
                }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-4">
            <InfoTag label="Bắt đầu" value={formatCurrency(product?.starting_price)} />
            <InfoTag label="Bước giá" value={formatCurrency(product?.step_price)} />
            <InfoTag label="Lượt đấu" value={product?.bid_count || 0} />
            <InfoTag label="Lượt xem" value={product?.view_count || 0} />
          </div>

          <div className="border-t pt-4 mt-4">
            <p className="text-sm text-gray-500">Người bán</p>
            <p className="font-semibold text-gray-900">{sellerName}</p>
            <button
              onClick={handleSellerRatingClick}
              className="text-sm text-blue-600 hover:text-blue-700 hover:underline transition-colors cursor-pointer font-medium"
            >
              Điểm đánh giá: <span className="text-green-600">+{sellerPositive}</span> / <span className="text-red-600">-{sellerNegative}</span>
              <span className="ml-1">→</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
