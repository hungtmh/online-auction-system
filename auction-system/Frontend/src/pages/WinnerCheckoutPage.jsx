/**
 * WINNER CHECKOUT PAGE - DEPRECATED
 * Redirects to OrderCompletionPage for backward compatibility.
 */

import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

export default function WinnerCheckoutPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  useEffect(() => {
    if (id) {
      navigate(`/orders/${id}`, { replace: true })
    } else {
      navigate('/', { replace: true })
    }
  }, [id, navigate])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-4 text-gray-600">Đang chuyển hướng...</p>
      </div>
    </div>
  )
}
