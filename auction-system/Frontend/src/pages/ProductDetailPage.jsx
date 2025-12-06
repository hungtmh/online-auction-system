import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import guestAPI from '../services/guestAPI'
import bidderAPI from '../services/bidderAPI'
import sellerAPI from '../services/sellerAPI'
import ProductHero from '../components/ProductDetail/ProductHero'
import BidActionPanel from '../components/ProductDetail/BidActionPanel'
import BidHistory from '../components/ProductDetail/BidHistory'
import QuestionsSection from '../components/ProductDetail/QuestionsSection'
import AskSellerForm from '../components/ProductDetail/AskSellerForm'
import UnifiedNavbar from '../components/common/UnifiedNavbar'
import ProductDescriptionCard from '../components/ProductDetailPage/sections/ProductDescriptionCard'
import SellerBidManagement from '../components/ProductDetailPage/sections/SellerBidManagement'
import WinnerSummaryCard from '../components/ProductDetailPage/sections/WinnerSummaryCard'
import RelatedProducts from '../components/ProductDetail/RelatedProducts'
import QuillEditor from '../components/Seller/ProductCreation/QuillEditor'
import { quillModules } from '../components/Seller/ProductCreation/constants'
import 'quill/dist/quill.snow.css'

const MODES = {
  ACTIVE: 'ACTIVE',
  ENDED_OTHER: 'ENDED_OTHER',
  WINNER_PAYMENT: 'WINNER_PAYMENT'
}

export default function ProductDetailPage({ user }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [product, setProduct] = useState(null)
  const [relatedProducts, setRelatedProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [questions, setQuestions] = useState([])
  const [bidSubmitting, setBidSubmitting] = useState(false)
  const [questionSubmitting, setQuestionSubmitting] = useState(false)
  const [actionMessage, setActionMessage] = useState(null)
  const [isInWatchlist, setIsInWatchlist] = useState(false)
  const [watchlistLoading, setWatchlistLoading] = useState(false)
  const [myMaxBid, setMyMaxBid] = useState(null)
  const [isWinning, setIsWinning] = useState(false)
  const [showAppendPanel, setShowAppendPanel] = useState(false)
  const [appendContent, setAppendContent] = useState('')
  const [appendSubmitting, setAppendSubmitting] = useState(false)
  const [appendError, setAppendError] = useState(null)
  const [appendSuccess, setAppendSuccess] = useState(null)
  const [rejectingBidId, setRejectingBidId] = useState(null)
  const [bidModerationError, setBidModerationError] = useState(null)
  const [bidModerationSuccess, setBidModerationSuccess] = useState(null)
  const [winnerSummary, setWinnerSummary] = useState(null)
  const [winnerSummaryLoading, setWinnerSummaryLoading] = useState(false)
  const [winnerSummaryError, setWinnerSummaryError] = useState(null)
  const [winnerActionMessage, setWinnerActionMessage] = useState(null)
  const [ratingSubmitting, setRatingSubmitting] = useState(false)
  const [cancelSubmitting, setCancelSubmitting] = useState(false)
  const [reopenSubmitting, setReopenSubmitting] = useState(false)

  // Reset bid status khi user thay đổi (đổi tài khoản)
  useEffect(() => {
    setMyMaxBid(null)
    setIsWinning(false)
  }, [user?.id])

  const loadProduct = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setError(null)
    // Reset bid status khi load lại (quan trọng khi đổi user)
    setMyMaxBid(null)
    setIsWinning(false)
    
    try {
      const res = await guestAPI.getProductById(id)
      const detail = res?.data || res
      setProduct(detail)
      setQuestions(detail?.questions || [])
      
      // Load related products from same category
      if (detail?.category_id) {
        try {
          const relatedRes = await guestAPI.getProducts({ category: detail.category_id, limit: 6 })
          const relatedData = relatedRes?.data || relatedRes || []
          setRelatedProducts(Array.isArray(relatedData) ? relatedData : [])
        } catch (err) {
          console.error('Load related products error', err)
          setRelatedProducts([])
        }
      }

      // Load my max bid status if user is bidder or seller bidding on another seller's product
      const shouldCheckAutoBid =
        (user?.role === 'bidder' && !!user?.id) ||
        (user?.role === 'seller' && user?.id && user.id !== detail?.seller_id)

      if (shouldCheckAutoBid) {
        try {
          const statusRes = await bidderAPI.getMyAutoBidStatus(id)
          if (statusRes?.data) {
            setMyMaxBid(statusRes.data.your_max_bid)
            setIsWinning(statusRes.data.is_winning)
          }
        } catch (err) {
          // Not a problem if we can't get the status (user might not have bid yet)
          console.log('No previous bid status')
          // Đã reset ở trên rồi nên không cần set lại
        }
      }
    } catch (err) {
      console.error('Load product error', err)
      setError('Không thể tải sản phẩm')
    } finally {
      setLoading(false)
    }
  }, [id, user])

  useEffect(() => {
    loadProduct()
  }, [loadProduct])

  // Check if product is in watchlist
  useEffect(() => {
    const checkWatchlist = async () => {
      // Seller cũng có thể thêm vào watchlist
      if (!user || (user.role !== 'bidder' && user.role !== 'seller') || !id) return
      try {
        const res = await bidderAPI.getWatchlist()
        const watchlistItems = res?.data || []
        const isWatched = watchlistItems.some(item => item.product_id === id || item.products?.id === id)
        setIsInWatchlist(isWatched)
      } catch (err) {
        console.error('Check watchlist error:', err)
      }
    }
    checkWatchlist()
  }, [user, id])

  const isSellerOwner = useMemo(() => user?.role === 'seller' && user?.id === product?.seller_id, [user, product])

  const sellerBids = useMemo(() => {
    if (!product) return []
    const list = product.seller_bids || product.bids || []
    return Array.isArray(list) ? [...list].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)) : []
  }, [product])

  const mode = useMemo(() => {
    // Nếu sản phẩm đã bị hủy, không cho phép đấu giá
    if (product?.status === 'cancelled') {
      return MODES.ENDED_OTHER
    }
    if (!product) return MODES.ACTIVE
    const isWinner = !!(user?.id && product.winner_id && user.id === product.winner_id)
    if (isWinner) return MODES.WINNER_PAYMENT
    const ended = new Date(product.end_time) < new Date() || ['completed', 'cancelled'].includes(product.status)
    if (ended) return MODES.ENDED_OTHER
    return MODES.ACTIVE
  }, [product, user])

  const fetchWinnerSummary = useCallback(
    async (targetProductId) => {
      const productId = targetProductId ?? product?.id
      if (!productId) return
      setWinnerSummaryLoading(true)
      setWinnerSummaryError(null)
      try {
        const res = await sellerAPI.getWinnerSummary(productId)
        setWinnerSummary(res?.data || null)
      } catch (err) {
        const message = err?.response?.data?.message || 'Không thể tải thông tin người thắng.'
        setWinnerSummaryError(message)
        setWinnerSummary(null)
      } finally {
        setWinnerSummaryLoading(false)
      }
    },
    [product?.id]
  )

  const handleRateWinner = useCallback(
    async (ratingType, comment) => {
      if (!product?.id || !ratingType) return
      setRatingSubmitting(true)
      setWinnerSummaryError(null)
      try {
        await sellerAPI.rateWinner(product.id, { rating: ratingType, comment })
        setWinnerActionMessage('Đã gửi đánh giá người thắng cuộc.')
        await fetchWinnerSummary(product.id)
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
      setWinnerActionMessage('Đã hủy giao dịch và ghi nhận đánh giá tiêu cực.')
      await loadProduct()
      await fetchWinnerSummary(product.id)
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
        setWinnerActionMessage('Đã mở lại phiên đấu giá. Sản phẩm đã trở lại trạng thái hoạt động.')
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

  useEffect(() => {
    if (!isSellerOwner) {
      setShowAppendPanel(false)
      setAppendContent('')
      setAppendError(null)
      setAppendSuccess(null)
      setWinnerSummary(null)
      setWinnerSummaryError(null)
      setWinnerActionMessage(null)
    }
  }, [isSellerOwner])

  useEffect(() => {
    setBidModerationError(null)
    setBidModerationSuccess(null)
    setWinnerSummaryError(null)
    setWinnerActionMessage(null)
  }, [product?.id])

  useEffect(() => {
    if (mode === MODES.WINNER_PAYMENT && id) {
      navigate(`/products/${id}/checkout`, { replace: true })
    }
  }, [mode, id, navigate])

  useEffect(() => {
    if (!winnerActionMessage) return
    const timer = setTimeout(() => setWinnerActionMessage(null), 4000)
    return () => clearTimeout(timer)
  }, [winnerActionMessage])

  useEffect(() => {
    if (!isSellerOwner || !product?.winner_id) {
      if (!isSellerOwner) return
      setWinnerSummary(null)
      return
    }
    fetchWinnerSummary(product.id)
  }, [isSellerOwner, product?.winner_id, product?.id, fetchWinnerSummary])

  const handleLoginRedirect = () => {
    navigate(`/login?redirect=${encodeURIComponent(location.pathname)}`)
  }

  const handleToggleWatchlist = async () => {
    if (!user) {
      handleLoginRedirect()
      return
    }
    if (user.role !== 'bidder' && user.role !== 'seller') {
      setActionMessage('Chỉ tài khoản bidder hoặc seller mới có thể thêm vào yêu thích')
      return
    }
    
    // Seller không được thêm sản phẩm của mình vào yêu thích
    if (user.role === 'seller' && user.id === product.seller_id) {
      setActionMessage('Bạn không thể thêm sản phẩm của mình vào yêu thích')
      return
    }
    
    setWatchlistLoading(true)
    try {
      if (isInWatchlist) {
        await bidderAPI.removeFromWatchlist(id)
        setIsInWatchlist(false)
        setActionMessage('Đã xóa khỏi danh sách yêu thích')
      } else {
        await bidderAPI.addToWatchlist(id)
        setIsInWatchlist(true)
        setActionMessage('Đã thêm vào danh sách yêu thích')
      }
    } catch (err) {
      const message = err?.response?.data?.message || 'Không thể cập nhật danh sách yêu thích'
      setActionMessage(message)
    } finally {
      setWatchlistLoading(false)
    }
  }

  const handleNavigateBack = () => {
    // Prefer history back but fall back to auctions list if no history stack
    if (window.history.length > 1) {
      navigate(-1)
    } else {
      navigate('/auctions')
    }
  }

  const handlePlaceBid = async (amount) => {
    if (!product) return
    if (!user) {
      handleLoginRedirect()
      return { success: false, message: 'Vui lòng đăng nhập để đấu giá' }
    }
    // Seller cũng có thể đặt giá như bidder
    if (user.role !== 'bidder' && user.role !== 'seller') {
      setActionMessage('Chỉ bidder hoặc seller mới có thể đặt giá')
      return { success: false, message: 'Chỉ bidder hoặc seller mới có thể đặt giá' }
    }

    setBidSubmitting(true)
    setActionMessage(null)
    try {
      const res = await bidderAPI.placeBid(product.id, amount)
      await loadProduct()
      
      // Update my max bid from response
      if (res?.data) {
        setMyMaxBid(res.data.your_max_bid)
        setIsWinning(res.data.is_winning)
      }
      
      const message = res?.data?.is_winning 
        ? '✅ Đặt giá thành công! Bạn đang giữ giá.'
        : '⚠️ Đặt giá thành công nhưng bạn không phải người giữ giá cao nhất.'
      setActionMessage(message)
      return { success: true }
    } catch (err) {
      const message = err?.response?.data?.message || 'Không thể đặt giá'
      setActionMessage(message)
      return { success: false, message }
    } finally {
      setBidSubmitting(false)
    }
  }

  const handleAskSeller = async (content) => {
    if (!product) return { success: false, message: 'Thiếu thông tin sản phẩm' }
    if (!user) {
      handleLoginRedirect()
      return { success: false, message: 'Vui lòng đăng nhập để hỏi người bán' }
    }
    if (user.role !== 'bidder' && user.role !== 'seller') {
      return { success: false, message: 'Chỉ tài khoản bidder hoặc seller mới có thể đặt câu hỏi' }
    }
    
    // Seller không được hỏi sản phẩm của chính mình
    if (user.role === 'seller' && user.id === product.seller_id) {
      return { success: false, message: 'Bạn không thể đặt câu hỏi cho sản phẩm của mình' }
    }

    setQuestionSubmitting(true)
    try {
      const res = await bidderAPI.askSellerQuestion(product.id, content)
      if (res?.data) {
        setQuestions((prev) => [res.data, ...prev])
      }
      return { success: true }
    } catch (err) {
      const message = err?.response?.data?.message || 'Không thể gửi câu hỏi'
      return { success: false, message }
    } finally {
      setQuestionSubmitting(false)
    }
  }

  const handleRejectBid = useCallback(
    async (bidId) => {
      if (!product || !isSellerOwner || !bidId) return
      const confirmed = window.confirm('Bạn có chắc chắn muốn từ chối lượt đấu giá này?')
      if (!confirmed) return

      setRejectingBidId(bidId)
      setBidModerationError(null)

      try {
        await sellerAPI.rejectBid(product.id, bidId)
        setBidModerationSuccess('Đã từ chối lượt đấu giá không phù hợp.')
        await loadProduct()
      } catch (err) {
        const message = err?.response?.data?.message || 'Không thể từ chối lượt đấu giá'
        setBidModerationError(message)
      } finally {
        setRejectingBidId(null)
        setTimeout(() => setBidModerationSuccess(null), 4000)
      }
    },
    [product, isSellerOwner, loadProduct]
  )

  const handleAnswerQuestion = async (questionId, answerContent) => {
    if (!isSellerOwner) {
      return { success: false, message: 'Chỉ người bán của sản phẩm mới có thể trả lời.' }
    }
    try {
      const res = await sellerAPI.answerQuestion(questionId, answerContent)
      const updated = res?.data || res
      if (updated) {
        setQuestions((prev) => prev.map((q) => (q.id === updated.id ? { ...q, ...updated } : q)))
      }
      return { success: true }
    } catch (err) {
      const message = err?.response?.data?.message || 'Không thể gửi trả lời'
      return { success: false, message }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center text-gray-600">Đang tải dữ liệu sản phẩm...</div>
      </div>
    )
  }

  if (error) {
    return <div className="min-h-screen flex items-center justify-center text-red-500">{error}</div>
  }

  const handleAppendDescription = async () => {
    if (!product) return
    const plainText = appendContent
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .trim()

    if (!plainText || plainText.length < 10) {
      setAppendError('Mô tả bổ sung cần tối thiểu 10 ký tự nội dung thực.')
      setAppendSuccess(null)
      return
    }

    setAppendSubmitting(true)
    setAppendError(null)
    setAppendSuccess(null)

    try {
      await sellerAPI.appendProductDescription(product.id, appendContent)
      setAppendSuccess('Đã bổ sung mô tả mới. Hệ thống sẽ hiển thị ngay bên dưới.')
      setAppendContent('')
      setShowAppendPanel(false)
      await loadProduct()
    } catch (err) {
      const message = err?.response?.data?.message || 'Không thể bổ sung mô tả. Vui lòng thử lại.'
      setAppendError(message)
    } finally {
      setAppendSubmitting(false)
    }
  }

  if (!product) {
    return <div className="min-h-screen flex items-center justify-center">Sản phẩm không tồn tại</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <UnifiedNavbar user={user} />
      <div className="max-w-6xl mx-auto px-4 lg:px-0 py-8">

        <button
          type="button"
          onClick={handleNavigateBack}
          className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900"
        >
          <span aria-hidden="true">←</span>
          Quay lại
        </button>

        {/* Thông báo sản phẩm đã bị hủy */}
        {product?.status === 'cancelled' && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <span className="text-2xl">🚫</span>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-semibold text-red-800">Sản phẩm đã bị hủy</h3>
                <p className="mt-1 text-sm text-red-700">
                  Sản phẩm này đã bị hủy bởi quản trị viên và không còn có thể tham gia đấu giá.
                  {product.rejected_reason && (
                    <span className="block mt-2 font-medium">Lý do: {product.rejected_reason}</span>
                  )}
                </p>
              </div>
            </div>
          </div>
        )}

        <div id="overview">
          <ProductHero product={product} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <section id="description">
              <ProductDescriptionCard
                descriptionHtml={product.description || 'Không có mô tả'}
                descriptionHistory={product.description_history || []}
                productCreatedAt={product.created_at}
              />

              {isSellerOwner && (
                <div className="mt-6 bg-slate-900 text-white rounded-2xl shadow-lg">
                  <div className="p-6 flex flex-col gap-3">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-wide text-slate-200">Bổ sung thông tin</p>
                      <h3 className="text-xl font-bold mt-1">Thêm mô tả mới cho sản phẩm của bạn</h3>
                      <p className="text-sm text-slate-300">
                        Việc bổ sung chỉ thêm nội dung mới và không ghi đè mô tả cũ. Mỗi cập nhật sẽ được đánh dấu thời gian để bidder theo dõi.
                      </p>
                    </div>

                    {!showAppendPanel ? (
                      <button
                        type="button"
                        onClick={() => {
                          setShowAppendPanel(true)
                          setAppendError(null)
                          setAppendSuccess(null)
                        }}
                        className="inline-flex items-center justify-center bg-white text-slate-900 font-semibold rounded-xl px-4 py-2 hover:bg-slate-100 focus:outline-none"
                      >
                        + Thêm mô tả bổ sung
                      </button>
                    ) : (
                      <div className="space-y-4">
                        <div className="bg-white rounded-xl p-4 text-slate-900">
                          <QuillEditor
                            value={appendContent}
                            onChange={setAppendContent}
                            modules={quillModules}
                            placeholder="Nhập nội dung cần bổ sung (ví dụ: cập nhật tình trạng, phụ kiện đi kèm, lưu ý mới...)"
                          />
                        </div>

                        {appendError && (
                          <div className="text-sm text-red-200 bg-red-900/40 border border-red-500 rounded-lg px-3 py-2">
                            {appendError}
                          </div>
                        )}

                        <div className="flex flex-wrap gap-3">
                          <button
                            type="button"
                            onClick={handleAppendDescription}
                            disabled={appendSubmitting}
                            className="flex-1 min-w-[160px] bg-emerald-400 text-emerald-950 font-semibold rounded-xl py-2 hover:bg-emerald-300 disabled:opacity-60"
                          >
                            {appendSubmitting ? 'Đang lưu...' : 'Lưu mô tả mới'}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setShowAppendPanel(false)
                              setAppendContent('')
                              setAppendError(null)
                              setAppendSuccess(null)
                            }}
                            className="flex-1 min-w-[160px] border border-white/40 text-white font-semibold rounded-xl py-2 hover:bg-white/10"
                          >
                            Hủy
                          </button>
                        </div>
                      </div>
                    )}

                    {!showAppendPanel && appendError && (
                      <div className="text-sm text-red-200 bg-red-900/40 border border-red-500 rounded-lg px-3 py-2">
                        {appendError}
                      </div>
                    )}

                    {appendSuccess && (
                      <div className="text-sm text-emerald-200 bg-emerald-900/40 border border-emerald-500 rounded-lg px-3 py-2">
                        {appendSuccess}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </section>

            <section id="history">
              <BidHistory bids={product.bids || []} />
            </section>

            {isSellerOwner && (
              <SellerBidManagement
                bids={sellerBids}
                onRejectBid={handleRejectBid}
                rejectingBidId={rejectingBidId}
                errorMessage={bidModerationError}
                successMessage={bidModerationSuccess}
                canModerate={mode === MODES.ACTIVE}
              />
            )}

            <section id="questions">
              <QuestionsSection
                questions={questions}
                currentUserId={user?.id}
                canAnswer={isSellerOwner}
                onAnswerQuestion={handleAnswerQuestion}
              />
            </section>
          </div>

          <div className="space-y-6">
            {isSellerOwner && product?.winner_id && (
              <WinnerSummaryCard
                summary={winnerSummary}
                loading={winnerSummaryLoading}
                error={winnerSummaryError}
                actionMessage={winnerActionMessage}
                onRate={handleRateWinner}
                ratingSubmitting={ratingSubmitting}
                onCancel={handleCancelTransaction}
                cancelSubmitting={cancelSubmitting}
                onReopen={handleReopenAuction}
                reopenSubmitting={reopenSubmitting}
              />
            )}
            <BidActionPanel
              product={product}
              mode={mode}
              user={user}
              onLoginRedirect={handleLoginRedirect}
              onPlaceBid={handlePlaceBid}
              bidSubmitting={bidSubmitting}
              actionMessage={actionMessage}
              myMaxBid={myMaxBid}
              isWinning={isWinning}
            />

            {(user?.role === 'bidder' || user?.role === 'seller') && (
              <button
                onClick={handleToggleWatchlist}
                disabled={watchlistLoading || isSellerOwner}
                className={`w-full flex items-center justify-center gap-2 py-3 rounded-2xl font-semibold transition ${
                  isSellerOwner
                    ? 'bg-gray-100 text-gray-500 border border-dashed border-gray-300'
                    : isInWatchlist
                        ? 'bg-pink-100 text-pink-600 hover:bg-pink-200'
                        : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                } disabled:opacity-60`}
              >
                <span>{isSellerOwner ? 'ℹ️' : isInWatchlist ? '❤️' : '🤍'}</span>
                {isSellerOwner
                  ? 'Đây là sản phẩm của bạn'
                  : watchlistLoading
                    ? 'Đang xử lý...'
                    : isInWatchlist
                      ? 'Bỏ yêu thích'
                      : 'Thêm vào yêu thích'}
              </button>
            )}

            <section id="ask-seller">
              {/* Bidder can always ask questions */}
              {user?.role === 'bidder' ? (
                <AskSellerForm onSubmit={handleAskSeller} disabled={mode !== MODES.ACTIVE} loading={questionSubmitting} />
              ) : user?.role === 'seller' && user?.id !== product?.seller_id ? (
                /* Seller can ask questions on OTHER sellers' products */
                <AskSellerForm onSubmit={handleAskSeller} disabled={mode !== MODES.ACTIVE} loading={questionSubmitting} />
              ) : user?.role === 'seller' && user?.id === product?.seller_id ? (
                /* Seller viewing own product - will answer questions in QuestionsSection */
                <div className="bg-white rounded-2xl shadow-sm p-6 text-sm text-gray-600">
                  <p className="font-semibold text-gray-900 mb-2">Quản lý câu hỏi</p>
                  <p>Bạn có thể trả lời các câu hỏi của bidder ở phần "Hỏi người bán" bên dưới.</p>
                </div>
              ) : (
                <div className="bg-white rounded-2xl shadow-sm p-6 text-sm text-gray-600">
                  <p className="font-semibold text-gray-900 mb-2">Hỏi người bán về sản phẩm</p>
                  <p>
                    {user
                      ? 'Chỉ tài khoản bidder hoặc seller mới có thể đặt câu hỏi.'
                      : 'Đăng nhập để gửi câu hỏi cho người bán và nhận phản hồi nhanh chóng.'}
                  </p>
                  {!user && (
                    <button
                      className="mt-4 w-full bg-slate-900 text-white rounded-2xl py-2 font-semibold"
                      onClick={handleLoginRedirect}
                    >
                      Đăng nhập
                    </button>
                  )}
                </div>
              )}
            </section>
          </div>
        </div>

        {/* Related Products */}
        <RelatedProducts products={relatedProducts} currentProductId={id} />
      </div>
    </div>
  )
}

