import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import UnifiedNavbar from '../components/common/UnifiedNavbar'
import bidderAPI from '../services/bidderAPI'
import guestAPI from '../services/guestAPI'

const formatCurrency = (value) => {
  if (!value && value !== 0) return '—'
  return `${Number(value).toLocaleString('vi-VN')} đ`
}

const formatDateTime = (value) => {
  if (!value) return 'Chưa cập nhật'
  return new Date(value).toLocaleString('vi-VN')
}

const parseAddressFields = (value = '') => {
  if (!value) {
    return { street: '', ward: '', city: '' }
  }

  const segments = value
    .split(',')
    .map((segment) => segment.trim())
    .filter(Boolean)

  return {
    street: segments[0] || '',
    ward: segments[1] || '',
    city: segments.slice(2).join(', ') || ''
  }
}

const formatAddressFields = ({ street, ward, city }) =>
  [street, ward, city]
    .map((part) => part?.trim())
    .filter((part) => part && part.length > 0)
    .join(', ')

export default function WinnerCheckoutPage({ user }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [product, setProduct] = useState(null)
  const [order, setOrder] = useState(null)
  const [addressFields, setAddressFields] = useState({ street: '', ward: '', city: '' })
  const [paymentProofUrl, setPaymentProofUrl] = useState('')
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState(null)
  const [proofUploading, setProofUploading] = useState(false)
  const [proofUploadError, setProofUploadError] = useState(null)

  const enrichProductWithSeller = useCallback(async (productData) => {
    if (!productData || productData.seller_name || !productData.seller_id) return productData
    try {
      const res = await guestAPI.getSellerProfile(productData.seller_id)
      const profile = res?.data || res
      if (!profile) return productData
      return {
        ...productData,
        seller_name: profile.full_name,
        seller_rating_positive: profile.rating_positive,
        seller_rating_negative: profile.rating_negative,
        seller_phone: profile.phone,
        seller_address: profile.address
      }
    } catch (error) {
      console.error('Failed to fetch seller profile:', error)
      return productData
    }
  }, [])

  const loadCheckout = useCallback(async () => {
    if (!id || !user) return
    setLoading(true)
    setError(null)
    try {
      const res = await bidderAPI.getCheckoutOrder(id)
      const payload = res?.data || res
      const enrichedProduct = await enrichProductWithSeller(payload.product)
      setProduct(enrichedProduct)
      setOrder(payload.order)
      const existingAddress = payload.order?.shipping_address || user?.address || ''
      setAddressFields(parseAddressFields(existingAddress))
      setPaymentProofUrl(payload.order?.payment_proof_url || '')
    } catch (err) {
      const message = err?.response?.data?.message || 'Không thể tải thông tin thanh toán'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [id, user, enrichProductWithSeller])

  useEffect(() => {
    loadCheckout()
  }, [loadCheckout])

  const updateAddressField = (field, value) => {
    setAddressFields((prev) => ({ ...prev, [field]: value }))
  }

  const handleProofUpload = async (event) => {
    const input = event.target
    const file = input.files?.[0]
    if (!file) return

    setProofUploadError(null)
    setFeedback(null)
    setProofUploading(true)

    try {
      const res = await bidderAPI.uploadPaymentProof(file)
      const uploadedUrl = res?.data?.url || res?.url
      if (uploadedUrl) {
        setPaymentProofUrl(uploadedUrl)
        setFeedback({ type: 'success', text: 'Đã tải lên chứng từ thanh toán.' })
      }
    } catch (uploadError) {
      console.error('Upload payment proof error:', uploadError)
      setProofUploadError('Không thể upload chứng từ, vui lòng thử lại.')
    } finally {
      setProofUploading(false)
      if (input) {
        input.value = ''
      }
    }
  }

  const handleRemoveProof = () => {
    setPaymentProofUrl('')
    setProofUploadError(null)
  }

  const handleSave = async () => {
    const requiredFields = [
      { key: 'street', label: 'Số nhà, đường' },
      { key: 'ward', label: 'Xã/Phường' },
      { key: 'city', label: 'Tỉnh/Thành Phố' }
    ]

    const missingField = requiredFields.find(({ key }) => !addressFields[key]?.trim())
    if (missingField) {
      setFeedback({ type: 'error', text: `Vui lòng nhập ${missingField.label}.` })
      return
    }

    const shippingAddress = formatAddressFields(addressFields)

    setSaving(true)
    setFeedback(null)
    try {
      const payload = {
        product_id: id,
        shipping_address: shippingAddress,
        payment_proof_url: paymentProofUrl || undefined
      }
      const res = await bidderAPI.submitCheckoutOrder(payload)
      const savedOrder = res?.data || res?.order || res
      setOrder(savedOrder)
      setPaymentProofUrl(savedOrder?.payment_proof_url || paymentProofUrl || '')
      setFeedback({ type: 'success', text: res?.message || 'Đã lưu thông tin thanh toán.' })
    } catch (err) {
      const message = err?.response?.data?.message || 'Không thể lưu thông tin thanh toán'
      setFeedback({ type: 'error', text: message })
    } finally {
      setSaving(false)
    }
  }

  const handleBackToProduct = () => {
    navigate(`/products/${id}`)
  }

  const handleLoginRedirect = () => {
    navigate(`/login?redirect=${encodeURIComponent(`/products/${id}/checkout`)}`)
  }

  const finalPrice = useMemo(() => {
    return order?.final_price || product?.final_price || product?.current_price || 0
  }, [order, product])

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <UnifiedNavbar user={null} />
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-semibold text-gray-900">Yêu cầu đăng nhập</h1>
          <p className="mt-4 text-gray-600">Bạn cần đăng nhập để tiếp tục quy trình thanh toán.</p>
          <div className="mt-6 flex justify-center gap-3">
            <button
              className="px-5 py-2 rounded-xl border border-gray-300 text-gray-700"
              onClick={handleBackToProduct}
            >
              Quay lại sản phẩm
            </button>
            <button
              className="px-5 py-2 rounded-xl bg-slate-900 text-white"
              onClick={handleLoginRedirect}
            >
              Đăng nhập ngay
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <UnifiedNavbar user={user} />
        <div className="flex items-center justify-center py-24">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 mx-auto"></div>
            <p className="mt-4 text-gray-600">Đang tải thông tin thanh toán...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <UnifiedNavbar user={user} />
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-semibold text-gray-900">Không thể truy cập trang thanh toán</h1>
          <p className="mt-4 text-gray-600">{error}</p>
          <div className="mt-6 flex justify-center gap-3">
            <button
              className="px-5 py-2 rounded-xl border border-gray-300 text-gray-700"
              onClick={handleBackToProduct}
            >
              Quay lại sản phẩm
            </button>
            <button
              className="px-5 py-2 rounded-xl bg-slate-900 text-white"
              onClick={() => navigate('/')}
            >
              Về trang chủ
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!product) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <UnifiedNavbar user={user} />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <button
          type="button"
          onClick={handleBackToProduct}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900"
        >
          <span aria-hidden="true">←</span>
          Quay lại sản phẩm
        </button>

        <div className="mt-6 bg-white rounded-2xl shadow-sm p-6">
          <p className="text-sm text-emerald-600 font-semibold">Xin chúc mừng</p>
          <h1 className="mt-2 text-3xl font-bold text-gray-900">Hoàn tất thanh toán cho sản phẩm bạn đã thắng</h1>
          <p className="mt-3 text-gray-600">Hãy cung cấp địa chỉ giao hàng chính xác và chứng từ thanh toán để người bán có thể xử lý đơn hàng sớm nhất.</p>
        </div>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <img
                src={product.thumbnail_url || 'https://via.placeholder.com/600x400?text=Product'}
                alt={product.name}
                className="w-full h-60 object-cover"
              />
              <div className="p-6 space-y-4">
                <div>
                  <p className="text-xs uppercase text-gray-500 tracking-wide">Sản phẩm</p>
                  <h2 className="text-xl font-semibold text-gray-900 mt-1">{product.name}</h2>
                </div>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>Giá thắng cuộc</span>
                    <span className="font-semibold text-slate-900">{formatCurrency(finalPrice)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Ngày kết thúc</span>
                    <span className="font-medium">{formatDateTime(product.end_time)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Người bán</span>
                    <span className="font-medium">{product.seller_name || 'Ẩn danh'}</span>
                  </div>
                  {product.seller_phone && (
                    <div className="flex justify-between">
                      <span>Liên hệ</span>
                      <span className="font-medium">{product.seller_phone}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Trạng thái đơn hàng</p>
                  <p className="text-xl font-semibold text-gray-900">{order?.status ? order.status.replaceAll('_', ' ') : 'Chưa tạo'}</p>
                </div>
                {order?.updated_at && (
                  <span className="text-xs text-gray-500">Cập nhật {formatDateTime(order.updated_at)}</span>
                )}
              </div>
                {paymentProofUrl ? (
                <a
                  href={paymentProofUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center text-sm font-semibold text-blue-600 hover:underline"
                >
                  Xem chứng từ đã tải lên
                </a>
              ) : (
                <p className="text-sm text-gray-500">Chưa có chứng từ thanh toán.</p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-6 flex flex-col space-y-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Thông tin giao hàng</h2>
              <p className="text-sm text-gray-500 mt-1">Địa chỉ này sẽ được gửi cho người bán để giao sản phẩm.</p>
            </div>
            <div className="grid gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-500" htmlFor="address-street">Số nhà, đường *</label>
                <input
                  id="address-street"
                  type="text"
                  className="mt-1 w-full rounded-xl border border-gray-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                  value={addressFields.street}
                  onChange={(event) => updateAddressField('street', event.target.value)}
                  placeholder="VD: 123 Nguyễn Huệ"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500" htmlFor="address-ward">Xã/Phường *</label>
                <input
                  id="address-ward"
                  type="text"
                  className="mt-1 w-full rounded-xl border border-gray-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                  value={addressFields.ward}
                  onChange={(event) => updateAddressField('ward', event.target.value)}
                  placeholder="VD: Phường Bến Nghé"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500" htmlFor="address-city">Tỉnh/Thành Phố *</label>
                <input
                  id="address-city"
                  type="text"
                  className="mt-1 w-full rounded-xl border border-gray-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                  value={addressFields.city}
                  onChange={(event) => updateAddressField('city', event.target.value)}
                  placeholder="VD: TP. Hồ Chí Minh"
                />
              </div>
            </div>

            <div className="pt-2">
              <label className="text-xs font-semibold text-gray-500" htmlFor="payment-proof-input">Ảnh chứng từ thanh toán</label>
              <input
                id="payment-proof-input"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleProofUpload}
                disabled={proofUploading}
                className="mt-1 block w-full cursor-pointer rounded-xl border border-dashed border-gray-300 bg-gray-50 p-3 text-sm focus:outline-none"
              />
              <p className="mt-1 text-xs text-gray-500">Hỗ trợ PNG, JPG, WEBP (tối đa 5MB).</p>
              {proofUploading && <p className="text-xs text-gray-500">Đang upload chứng từ...</p>}
              {proofUploadError && <p className="text-xs text-rose-600">{proofUploadError}</p>}

              {paymentProofUrl ? (
                <div className="mt-4 relative rounded-xl border border-gray-200 p-3">
                  <img src={paymentProofUrl} alt="Chứng từ thanh toán" className="h-40 w-full rounded-lg object-cover" />
                  <button
                    type="button"
                    onClick={handleRemoveProof}
                    className="absolute right-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-gray-700 shadow"
                  >
                    Gỡ ảnh
                  </button>
                </div>
              ) : (
                <p className="mt-3 text-sm text-gray-500">Chưa có chứng từ nào được tải lên.</p>
              )}
            </div>

            {feedback && (
              <div
                className={`rounded-xl p-3 text-sm ${feedback.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}
              >
                {feedback.text}
              </div>
            )}

            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="mt-auto w-full bg-slate-900 text-white rounded-xl py-3 font-semibold hover:bg-slate-800 disabled:opacity-60"
            >
              {saving ? 'Đang lưu...' : 'Lưu thông tin checkout'}
            </button>

            <p className="text-xs text-gray-500 text-center">
              Sau khi lưu, người bán sẽ nhận được thông tin để xác nhận và gửi hàng cho bạn.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
