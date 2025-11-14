import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import guestAPI from '../services/guestAPI'

export default function ProductDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!id) return
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const res = await guestAPI.getProductById(id)
      setProduct(res?.data || res)
    } catch (err) {
      console.error('Load product error', err)
      setError('Không thể tải sản phẩm')
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center">Đang tải...</div>
  if (error) return <div className="min-h-screen flex items-center justify-center">{error}</div>
  if (!product) return <div className="min-h-screen flex items-center justify-center">Sản phẩm không tồn tại</div>

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex gap-8">
          <div className="w-2/3 bg-white rounded-lg p-6">
            <div className="mb-4">
              <img src={product.image_url || 'https://via.placeholder.com/800x500'} alt={product.title} className="w-full object-cover rounded" />
            </div>
            <h1 className="text-2xl font-bold mb-2">{product.title}</h1>
            <div className="text-gray-600 mb-4">{product.short_description || product.description}</div>
            <div className="prose max-w-none">
              <h3>Mô tả chi tiết</h3>
              <div dangerouslySetInnerHTML={{ __html: product.long_description || product.description || '' }} />
            </div>
          </div>

          <aside className="w-1/3">
            <div className="bg-white rounded-lg p-6 mb-4">
              <div className="text-sm text-gray-500">Giá hiện tại</div>
              <div className="text-2xl font-bold text-blue-600 mb-3">{(product.current_price || 0).toLocaleString('vi-VN')} đ</div>
              {product.buy_now_price && (
                <div className="text-sm text-gray-500">Giá mua ngay</div>
              )}
              <button onClick={() => navigate('/login')} className="w-full mt-4 bg-blue-600 text-white py-2 rounded-lg">Đặt giá</button>
            </div>

            <div className="bg-white rounded-lg p-6">
              <h4 className="font-medium mb-2">Thông tin người bán</h4>
              <div className="text-sm text-gray-700">{product.seller_name || product.seller?.full_name || 'Người bán ẩn danh'}</div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
