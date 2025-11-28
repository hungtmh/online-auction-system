import React from 'react'
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
  const gallery = resolveImages(product)
  const category = product?.categories?.name
  const sellerName = product?.seller?.full_name || product?.seller_name || 'Ẩn danh'
  const sellerPositive =
    product?.seller?.rating_positive ?? product?.seller_rating_positive ?? product?.seller_rating ?? 0
  const sellerNegative =
    product?.seller?.rating_negative ?? product?.seller_rating_negative ?? product?.seller_rating_bad ?? 0

  return (
    <section className="bg-white rounded-2xl shadow-sm p-6 mb-6">
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-2/3">
          <div className="rounded-2xl overflow-hidden bg-gray-100">
            <img
              src={gallery[0] || FALLBACK_IMAGE}
              alt={product?.title}
              className="w-full h-[420px] object-cover"
            />
          </div>
          {gallery.length > 1 && (
            <div className="grid grid-cols-4 gap-3 mt-3">
              {gallery.slice(1, 5).map((image, index) => (
                <img
                  key={`${image}-${index}`}
                  src={image}
                  alt={`Ảnh phụ ${index + 1}`}
                  className="w-full h-24 object-cover rounded-lg border border-gray-100"
                />
              ))}
            </div>
          )}
        </div>

        <div className="lg:w-1/3 space-y-4">
          {category && (
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-sm font-medium">
              {category}
            </span>
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
            <p className="text-sm text-gray-500">
              Điểm đánh giá: +{sellerPositive} / -{sellerNegative}
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
