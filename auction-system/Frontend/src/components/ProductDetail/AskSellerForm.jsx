import React, { useState } from 'react'

export default function AskSellerForm({ onSubmit, disabled, loading }) {
  const [value, setValue] = useState('')
  const [feedback, setFeedback] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!value.trim() || !onSubmit) return
    setFeedback(null)
    const result = await onSubmit(value.trim())
    if (result?.success) {
      setValue('')
      setFeedback({ type: 'success', message: 'Đã gửi câu hỏi cho người bán.' })
    } else if (result?.message) {
      setFeedback({ type: 'error', message: result.message })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
      <div>
        <label className="text-sm text-gray-600">Nội dung câu hỏi</label>
        <textarea
          className="mt-2 w-full rounded-2xl border border-gray-200 px-4 py-3 focus:border-blue-500 focus:outline-none"
          rows="3"
          placeholder="Hãy hỏi người bán về tình trạng sản phẩm, phụ kiện đi kèm, chính sách bảo hành..."
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={disabled || loading}
          required
        />
      </div>
      <button
        type="submit"
        disabled={disabled || loading}
        className="w-full bg-slate-900 text-white rounded-2xl py-3 font-semibold hover:bg-slate-800 transition disabled:opacity-60"
      >
        {loading ? 'Đang gửi...' : 'Gửi câu hỏi'}
      </button>
      {feedback && (
        <p className={`text-sm ${feedback.type === 'success' ? 'text-green-600' : 'text-red-500'}`}>{feedback.message}</p>
      )}
    </form>
  )
}
