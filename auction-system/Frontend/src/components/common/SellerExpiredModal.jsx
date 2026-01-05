import { useEffect, useState } from 'react'
import sellerAPI from '../../services/sellerAPI'

/**
 * Modal thông báo seller hết hạn
 */
export default function SellerExpiredModal({ isOpen, onClose, expirationData }) {
  const [showRequestForm, setShowRequestForm] = useState(false)
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      setShowRequestForm(false)
      setReason('')
      setError('')
      setSuccess(false)
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  const handleSubmitRequest = async () => {
    if (!reason.trim()) {
      setError('Vui lòng nhập lý do yêu cầu gia hạn')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      await sellerAPI.requestExtension({ reason: reason.trim() })
      setSuccess(true)
      setReason('')
      setTimeout(() => {
        setShowRequestForm(false)
        setSuccess(false)
      }, 2000)
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể gửi yêu cầu gia hạn')
    } finally {
      setSubmitting(false)
    }
  }

  const handleContactAdmin = () => {
    setShowRequestForm(true)
    setError('')
    setSuccess(false)
  }

  if (!isOpen) return null

  const { seller_expired_at } = expirationData || {}
  const expiredDate = seller_expired_at 
    ? new Date(seller_expired_at).toLocaleString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    : 'Chưa có thông tin'

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md mx-4 bg-white rounded-2xl shadow-2xl animate-scale-in">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-100">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900">Quyền Seller đã hết hạn</h3>
              <p className="text-sm text-gray-500 mt-1">Bạn không thể tạo sản phẩm mới</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-5 space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="space-y-2 text-sm">
                <p className="text-amber-900 font-medium">Thông tin hết hạn:</p>
                <div className="text-amber-800">
                  <p>📅 Thời gian hết hạn: <span className="font-semibold">{expiredDate}</span></p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <div className="space-y-2 text-sm">
                <p className="text-blue-900 font-medium">Cách gia hạn:</p>
                <ul className="text-blue-800 space-y-1 list-disc list-inside">
                  <li>Yêu cầu gia hạn quyền Seller</li>
                  <li>Admin sẽ xử lý trong 24-48 giờ</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="text-xs text-gray-500 text-center pt-2">
            Mọi chức năng seller khác vẫn hoạt động bình thường
          </div>

          {/* Form yêu cầu gia hạn */}
          {showRequestForm && (
            <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-xl">
              <h4 className="text-sm font-semibold text-gray-800 mb-3">Gửi yêu cầu gia hạn</h4>
              
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Nhập lý do yêu cầu gia hạn quyền seller..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm resize-none"
                rows={4}
                disabled={submitting || success}
              />

              {error && (
                <div className="mt-2 text-xs text-red-600 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {error}
                </div>
              )}

              {success && (
                <div className="mt-2 text-xs text-green-600 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Đã gửi yêu cầu thành công!
                </div>
              )}

              <button
                onClick={handleSubmitRequest}
                disabled={submitting || success}
                className="mt-3 w-full px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Đang gửi...' : success ? 'Đã gửi!' : 'Gửi yêu cầu'}
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 rounded-b-2xl flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 bg-white border-2 border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
          >
            Đóng
          </button>
          <button
            onClick={handleContactAdmin}
            disabled={showRequestForm}
            className="flex-1 px-4 py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Liên hệ Admin
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }

        .animate-scale-in {
          animation: scale-in 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}
