import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import guestAPI from '../../services/guestAPI'
import sellerAPI from '../../services/sellerAPI'
import AppHeader from '../common/AppHeader'
import GuestTopBar from './sections/GuestTopBar'
import ProductMediaGallery from './sections/ProductMediaGallery'
import ProductDescriptionCard from './sections/ProductDescriptionCard'
import ProductQACard from './sections/ProductQACard'
import WinnerCheckoutSidebar from './sections/WinnerCheckoutSidebar'
import AuctionSidebar from './sections/AuctionSidebar'
import RelatedProductsGrid from './sections/RelatedProductsGrid'
import WinnerSummaryCard from './sections/WinnerSummaryCard'

const ORDER_STATUS_META = {
  pending_payment: { label: 'Chờ thanh toán', chip: 'bg-amber-100 text-amber-700 border border-amber-200' },
  payment_confirmed: { label: 'Đã xác nhận thanh toán', chip: 'bg-emerald-100 text-emerald-700 border border-emerald-200' },
  shipped: { label: 'Đã gửi hàng', chip: 'bg-blue-100 text-blue-700 border border-blue-200' },
  delivered: { label: 'Đã giao hàng', chip: 'bg-purple-100 text-purple-700 border border-purple-200' },
  completed: { label: 'Hoàn tất', chip: 'bg-slate-100 text-slate-700 border border-slate-200' },
  cancelled: { label: 'Đã hủy', chip: 'bg-rose-100 text-rose-700 border border-rose-200' }
}

const ORDER_STATUS_FLOW = [
  { key: 'pending_payment', label: 'Chờ thanh toán', description: 'Hoàn tất thanh toán trong 24 giờ', timestampKey: 'created_at' },
  { key: 'payment_confirmed', label: 'Đã xác nhận thanh toán', description: 'Người bán xác nhận đã nhận tiền', timestampKey: 'payment_confirmed_at' },
  { key: 'shipped', label: 'Đã gửi hàng', description: 'Người bán đã bàn giao cho đơn vị vận chuyển', timestampKey: 'shipped_at' },
  { key: 'delivered', label: 'Đã giao hàng', description: 'Đơn vị vận chuyển đã giao cho bạn', timestampKey: 'delivered_at' },
  { key: 'completed', label: 'Hoàn tất', description: 'Giao dịch hoàn tất, cùng đánh giá người bán', timestampKey: 'updated_at' }
]

export default function ProductDetailPageContent({ user = null }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const [product, setProduct] = useState(null)
  const [relatedProducts, setRelatedProducts] = useState([])
  const [selectedImage, setSelectedImage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentUser, setCurrentUser] = useState(user)
  const [shippingAddress, setShippingAddress] = useState('')
  const [checkoutNotice, setCheckoutNotice] = useState(null)
  const [winnerSummary, setWinnerSummary] = useState(null)
  const [winnerSummaryLoading, setWinnerSummaryLoading] = useState(false)
  const [winnerSummaryError, setWinnerSummaryError] = useState(null)
  const [actionMessage, setActionMessage] = useState(null)
  const [ratingSubmitting, setRatingSubmitting] = useState(false)
  const [cancelSubmitting, setCancelSubmitting] = useState(false)
  const [reopenSubmitting, setReopenSubmitting] = useState(false)

  const loadProduct = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await guestAPI.getProductById(id)
      const productData = res?.data || res
      setProduct(productData)

      if (productData?.category_id) {
        const relatedRes = await guestAPI.getProducts({ category: productData.category_id, limit: 5 })
        setRelatedProducts(relatedRes?.data?.filter((p) => p.id !== id) || [])
      }
    } catch (err) {
      console.error('Load product error', err)
      setError('Không thể tải sản phẩm')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    if (!id) return
    loadProduct()
  }, [id, loadProduct])

  useEffect(() => {
    setCurrentUser(user || null)
  }, [user])

  useEffect(() => {
    if (!product) return
    setShippingAddress(product.order?.shipping_address || currentUser?.address || '')
  }, [product, currentUser])

  useEffect(() => {
    if (!actionMessage) return
    const timer = setTimeout(() => setActionMessage(null), 4000)
    return () => clearTimeout(timer)
  }, [actionMessage])

  const fetchSellerProfile = useCallback(async (sellerId) => {
    if (!sellerId) return null
    try {
      const res = await guestAPI.getSellerProfile(sellerId)
      return res?.data || res
    } catch (error) {
      console.error('Failed to fetch seller profile:', error)
      return null
    }
  }, [])

  useEffect(() => {
    if (!product || product.seller_name || !product.seller_id) return
    let active = true
    fetchSellerProfile(product.seller_id).then((profile) => {
      if (!active || !profile) return
      setProduct((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          seller_name: profile.full_name,
          seller_rating_positive: profile.rating_positive,
          seller_rating_negative: profile.rating_negative,
          seller_phone: profile.phone,
          seller_address: profile.address
        }
      })
    })
    return () => {
      active = false
    }
  }, [product, fetchSellerProfile])

  const fetchWinnerSummary = useCallback(async () => {
    if (!product?.id) return
    setWinnerSummaryLoading(true)
    setWinnerSummaryError(null)
    try {
      const res = await sellerAPI.getWinnerSummary(product.id)
      setWinnerSummary(res?.data || null)
    } catch (err) {
      const message = err?.response?.data?.message || 'Không thể tải thông tin người thắng.'
      setWinnerSummaryError(message)
      setWinnerSummary(null)
    } finally {
      setWinnerSummaryLoading(false)
    }
  }, [product?.id])

  const handleRateWinner = useCallback(
    async (ratingType, comment) => {
      if (!product?.id || !ratingType) return
      setRatingSubmitting(true)
      setWinnerSummaryError(null)
      try {
        await sellerAPI.rateWinner(product.id, { rating: ratingType, comment })
        setActionMessage('Đã gửi đánh giá người thắng cuộc.')
        await fetchWinnerSummary()
      } catch (err) {
        const message = err?.response?.data?.message || 'Không thể gửi đánh giá.'
        setWinnerSummaryError(message)
      } finally {
        setRatingSubmitting(false)
      }
    },
    [product?.id, fetchWinnerSummary]
  )

  const handleCancelTransaction = useCallback(async () => {
    if (!product?.id) return
    const confirmed = window.confirm('Bạn có chắc chắn muốn hủy giao dịch này?')
    if (!confirmed) return
    setCancelSubmitting(true)
    setWinnerSummaryError(null)
    try {
      await sellerAPI.cancelWinnerTransaction(product.id)
      setActionMessage('Đã hủy giao dịch và ghi nhận đánh giá tiêu cực.')
      await loadProduct()
      await fetchWinnerSummary()
    } catch (err) {
      const message = err?.response?.data?.message || 'Không thể hủy giao dịch.'
      setWinnerSummaryError(message)
    } finally {
      setCancelSubmitting(false)
    }
  }, [product?.id, fetchWinnerSummary, loadProduct])

  const handleReopenAuction = useCallback(
    async (newEndTime) => {
      if (!product?.id) return
      if (!newEndTime) {
        setWinnerSummaryError('Vui lòng chọn thời điểm kết thúc mới.')
        return
      }
      const parsed = new Date(newEndTime)
      if (Number.isNaN(parsed.getTime())) {
        setWinnerSummaryError('Thời điểm kết thúc mới không hợp lệ.')
        return
      }
      const confirmed = window.confirm('Mở lại phiên đấu giá sẽ xóa toàn bộ lượt đấu và đơn hàng hiện tại. Tiếp tục?')
      if (!confirmed) return
      setReopenSubmitting(true)
      setWinnerSummaryError(null)
      try {
        await sellerAPI.reopenAuction(product.id, { new_end_time: parsed.toISOString() })
        setActionMessage('Đã mở lại phiên đấu giá. Sản phẩm đã trở lại trạng thái hoạt động.')
        setWinnerSummary(null)
        await loadProduct()
      } catch (err) {
        const message = err?.response?.data?.message || 'Không thể mở lại đấu giá.'
        setWinnerSummaryError(message)
      } finally {
        setReopenSubmitting(false)
      }
    },
    [product?.id, loadProduct]
  )

  const handleShippingAddressChange = (event) => {
    setShippingAddress(event.target.value)
  }

  const handleShippingAddressSave = () => {
    setCheckoutNotice('Địa chỉ nhận hàng đã được lưu tạm thời cho phiên làm việc này.')
    setTimeout(() => setCheckoutNotice(null), 4000)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải chi tiết sản phẩm...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <p className="text-red-600 text-xl">{error}</p>
          <button onClick={() => navigate('/')} className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg">
            Về trang chủ
          </button>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-6xl mb-4">📦</div>
          <p className="text-gray-600 text-xl">Sản phẩm không tồn tại</p>
          <button onClick={() => navigate('/')} className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg">
            Về trang chủ
          </button>
        </div>
      </div>
    )
  }

  const isWinner = useMemo(() => {
    if (!currentUser || !product?.winner_id) return false
    return currentUser.id === product.winner_id
  }, [currentUser, product])

  const isSellerOwner = useMemo(() => {
    if (!currentUser || !product) return false
    return currentUser.id === product.seller_id
  }, [currentUser, product])

  useEffect(() => {
    if (!isSellerOwner || !product?.winner_id) {
      setWinnerSummary(null)
      return
    }
    fetchWinnerSummary()
  }, [isSellerOwner, product?.winner_id, fetchWinnerSummary])

  const orderFromProduct = product.order || null

  const checkoutOrder = useMemo(() => {
    return {
      id: orderFromProduct?.id || null,
      product_id: orderFromProduct?.product_id || product.id,
      seller_id: orderFromProduct?.seller_id || product.seller_id,
      buyer_id: orderFromProduct?.buyer_id || currentUser?.id || null,
      final_price: orderFromProduct?.final_price || product.current_price || product.starting_price || 0,
      shipping_address: shippingAddress,
      shipping_tracking_number: orderFromProduct?.shipping_tracking_number || '',
      payment_proof_url: orderFromProduct?.payment_proof_url || '',
      payment_confirmed_at: orderFromProduct?.payment_confirmed_at || null,
      status: orderFromProduct?.status || 'pending_payment',
      shipped_at: orderFromProduct?.shipped_at || null,
      delivered_at: orderFromProduct?.delivered_at || null,
      cancelled_by: orderFromProduct?.cancelled_by || null,
      cancelled_at: orderFromProduct?.cancelled_at || null,
      cancellation_reason: orderFromProduct?.cancellation_reason || '',
      created_at: orderFromProduct?.created_at || product.end_time || product.updated_at || product.created_at || null,
      updated_at: orderFromProduct?.updated_at || product.updated_at || null
    }
  }, [orderFromProduct, product, currentUser, shippingAddress])

  const currentStatusMeta = ORDER_STATUS_META[checkoutOrder.status] || ORDER_STATUS_META.pending_payment
  const statusIndex = ORDER_STATUS_FLOW.findIndex((step) => step.key === checkoutOrder.status)

  const timeline = ORDER_STATUS_FLOW.map((step, idx) => ({
    ...step,
    reached: statusIndex === -1 ? false : idx <= statusIndex,
    timestamp: checkoutOrder[step.timestampKey]
  }))

  const images = [product.image_url || 'https://via.placeholder.com/800x600?text=Product', ...(product.additional_images || [])]
  while (images.length < 3) {
    images.push('https://via.placeholder.com/800x600?text=No+Image')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {currentUser ? (
        <AppHeader user={currentUser} showSearch={true} />
      ) : (
        <GuestTopBar
          onBack={() => navigate('/')}
          onLogin={() => navigate('/login')}
          onRegister={() => navigate('/register')}
        />
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <ProductMediaGallery
              images={images}
              selectedIndex={selectedImage}
              onSelect={setSelectedImage}
              title={product.title}
            />
            <ProductDescriptionCard
              descriptionHtml={product.description || 'Không có mô tả'}
              descriptionHistory={product.description_history || []}
              productCreatedAt={product.created_at}
            />
            <ProductQACard questions={product.questions || []} currentUserId={currentUser?.id} />
          </div>

          <div className="lg:col-span-1 space-y-4">
            {isWinner ? (
              <WinnerCheckoutSidebar
                product={product}
                order={checkoutOrder}
                statusMeta={currentStatusMeta}
                timeline={timeline}
                shippingAddress={shippingAddress}
                onShippingChange={handleShippingAddressChange}
                onShippingSave={handleShippingAddressSave}
                notice={checkoutNotice}
              />
            ) : isSellerOwner && product.winner_id ? (
              <WinnerSummaryCard
                summary={winnerSummary}
                loading={winnerSummaryLoading}
                error={winnerSummaryError}
                actionMessage={actionMessage}
                onRate={handleRateWinner}
                ratingSubmitting={ratingSubmitting}
                onCancel={handleCancelTransaction}
                cancelSubmitting={cancelSubmitting}
                onReopen={handleReopenAuction}
                reopenSubmitting={reopenSubmitting}
              />
            ) : (
              <AuctionSidebar
                product={product}
                onCategoryClick={() => navigate(`/auctions?category=${product.category_id}`)}
                onLogin={() => navigate('/login')}
              />
            )}
          </div>
        </div>

        <RelatedProductsGrid
          products={relatedProducts}
          onSelect={(productId) => navigate(`/products/${productId}`)}
        />
      </div>
    </div>
  )
}
