import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import guestAPI from '../services/guestAPI'
import bidderAPI from '../services/bidderAPI'
import ProductHero from '../components/ProductDetail/ProductHero'
import BidActionPanel from '../components/ProductDetail/BidActionPanel'
import BidHistory from '../components/ProductDetail/BidHistory'
import QuestionsSection from '../components/ProductDetail/QuestionsSection'
import AskSellerForm from '../components/ProductDetail/AskSellerForm'
import AppHeader from '../components/common/AppHeader'
import 'quill/dist/quill.snow.css'

const MODES = {
  ACTIVE: 'ACTIVE',
  ENDED_OTHER: 'ENDED_OTHER',
  WINNER_PAYMENT: 'WINNER_PAYMENT',
  SELLER_PLACEHOLDER: 'SELLER_PLACEHOLDER'
}

export default function ProductDetailPage({ user }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [questions, setQuestions] = useState([])
  const [bidSubmitting, setBidSubmitting] = useState(false)
  const [questionSubmitting, setQuestionSubmitting] = useState(false)
  const [actionMessage, setActionMessage] = useState(null)

  const loadProduct = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setError(null)
    try {
      const res = await guestAPI.getProductById(id)
      const detail = res?.data || res
      setProduct(detail)
      setQuestions(detail?.questions || [])
    } catch (err) {
      console.error('Load product error', err)
      setError('Không thể tải sản phẩm')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    loadProduct()
  }, [loadProduct])

  const mode = useMemo(() => {
    if (!product) return MODES.ACTIVE
    const isSeller = user?.role === 'seller' && user?.id === product.seller_id
    if (isSeller) return MODES.SELLER_PLACEHOLDER
    const isWinner = !!(user?.id && product.winner_id && user.id === product.winner_id)
    if (isWinner) return MODES.WINNER_PAYMENT
    const ended = new Date(product.end_time) < new Date() || ['completed', 'cancelled'].includes(product.status)
    if (ended) return MODES.ENDED_OTHER
    return MODES.ACTIVE
  }, [product, user])

  useEffect(() => {
    if (mode === MODES.WINNER_PAYMENT && id) {
      navigate(`/products/${id}/checkout`, { replace: true })
    }
  }, [mode, id, navigate])

  const handleLoginRedirect = () => {
    navigate(`/login?redirect=${encodeURIComponent(location.pathname)}`)
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
    if (user.role !== 'bidder') {
      setActionMessage('Chỉ bidder mới có thể đặt giá')
      return { success: false, message: 'Chỉ bidder mới có thể đặt giá' }
    }

    setBidSubmitting(true)
    setActionMessage(null)
    try {
      await bidderAPI.placeBid(product.id, amount)
      await loadProduct()
      setActionMessage('Đặt giá thành công')
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
    if (user.role !== 'bidder') {
      return { success: false, message: 'Chỉ tài khoản bidder mới có thể đặt câu hỏi' }
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

  if (!product) {
    return <div className="min-h-screen flex items-center justify-center">Sản phẩm không tồn tại</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader user={user} showSearch={true} />
      <div className="max-w-6xl mx-auto px-4 lg:px-0 py-8">

        <button
          type="button"
          onClick={handleNavigateBack}
          className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900"
        >
          <span aria-hidden="true">←</span>
          Quay lại
        </button>

        <div id="overview">
          <ProductHero product={product} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <section id="history">
              <BidHistory bids={product.bids || []} />
            </section>

            <section id="description" className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Chi tiết sản phẩm</h3>
              <div className="ql-editor ql-snow" style={{ padding: 0, border: 'none' }}>
                <div 
                  className="text-gray-600 leading-relaxed"
                  dangerouslySetInnerHTML={{ 
                    __html: product.description || '<p>Người bán chưa cung cấp thêm thông tin.</p>' 
                  }}
                />
              </div>
              {product.product_descriptions?.length > 0 && (
                <div className="text-sm text-gray-500 space-y-2 mt-4 pt-4 border-t">
                  {product.product_descriptions.map((desc, idx) => (
                    <div 
                      key={idx}
                      className="ql-editor"
                      style={{ padding: 0, border: 'none' }}
                      dangerouslySetInnerHTML={{ __html: desc.description || '' }}
                    />
                  ))}
                </div>
              )}
            </section>

            <section id="questions">
              <QuestionsSection questions={questions} />
            </section>
          </div>

          <div className="space-y-6">
            <BidActionPanel
              product={product}
              mode={mode}
              user={user}
              onLoginRedirect={handleLoginRedirect}
              onPlaceBid={handlePlaceBid}
              bidSubmitting={bidSubmitting}
              actionMessage={actionMessage}
            />

            <section id="ask-seller">
              {user?.role === 'bidder' ? (
                <AskSellerForm onSubmit={handleAskSeller} disabled={mode !== MODES.ACTIVE} loading={questionSubmitting} />
              ) : (
                <div className="bg-white rounded-2xl shadow-sm p-6 text-sm text-gray-600">
                  <p className="font-semibold text-gray-900 mb-2">Hỏi người bán về sản phẩm</p>
                  <p>
                    {user
                      ? 'Chỉ tài khoản bidder mới có thể đặt câu hỏi.'
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
      </div>
    </div>
  )
}

