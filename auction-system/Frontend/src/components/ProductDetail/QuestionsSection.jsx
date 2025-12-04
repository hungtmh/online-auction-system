import React from 'react'

const formatDate = (value) => {
  if (!value) return '—'
  return new Date(value).toLocaleString('vi-VN')
}

export default function QuestionsSection({ questions = [], currentUserId, canAnswer = false, onAnswerQuestion }) {
  const [drafts, setDrafts] = React.useState({})
  const [errors, setErrors] = React.useState({})
  const [submittingId, setSubmittingId] = React.useState(null)

  const handleDraftChange = (questionId, value) => {
    setDrafts((prev) => ({ ...prev, [questionId]: value }))
    setErrors((prev) => ({ ...prev, [questionId]: null }))
  }

  const handleAnswerSubmit = async (questionId) => {
    if (!canAnswer || !onAnswerQuestion) return
    const content = (drafts[questionId] || '').trim()
    if (content.length < 3) {
      setErrors((prev) => ({ ...prev, [questionId]: 'Câu trả lời cần ít nhất 3 ký tự.' }))
      return
    }

    setSubmittingId(questionId)
    setErrors((prev) => ({ ...prev, [questionId]: null }))

    try {
      const result = await onAnswerQuestion(questionId, content)
      if (!result?.success) {
        setErrors((prev) => ({ ...prev, [questionId]: result?.message || 'Không thể gửi trả lời.' }))
      } else {
        setDrafts((prev) => ({ ...prev, [questionId]: '' }))
      }
    } catch (err) {
      setErrors((prev) => ({ ...prev, [questionId]: 'Không thể gửi trả lời. Vui lòng thử lại.' }))
    } finally {
      setSubmittingId(null)
    }
  }

  const handleCancel = (questionId) => {
    setDrafts((prev) => ({ ...prev, [questionId]: '' }))
    setErrors((prev) => ({ ...prev, [questionId]: null }))
  }

  return (
    <section className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Hỏi người bán</h3>
        <span className="text-sm text-gray-500">{questions.length} câu hỏi</span>
      </div>

      {questions.length === 0 ? (
        <p className="text-sm text-gray-500">Chưa có câu hỏi nào. Hãy là người đầu tiên đặt câu hỏi!</p>
      ) : (
        <ul className="space-y-4 max-h-96 overflow-y-auto pr-2">
          {questions.map((question) => {
            const isCurrentUser = currentUserId && question.asker_id === currentUserId
            const askerProfile = question.asker || question.profiles || {}
            const draftValue = drafts[question.id] ?? ''
            const errorMessage = errors[question.id]
            const isSubmitting = submittingId === question.id
            const showAnswerForm = canAnswer && !question.answer

            return (
              <li key={question.id} className="border border-gray-100 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span className={isCurrentUser ? 'text-blue-600 font-medium bg-blue-50 px-2 py-0.5 rounded' : ''}>
                    {isCurrentUser ? 'Bạn' : askerProfile.full_name || 'Người dùng'}
                  </span>
                  <span>{formatDate(question.created_at)}</span>
                </div>
                <p className="font-medium text-gray-900">{question.question}</p>

                {question.answer && (
                  <div className="bg-green-50 text-green-800 text-sm rounded-lg px-4 py-2">
                    <div className="flex items-center justify-between text-xs mb-1 text-green-700">
                      <span className="font-semibold">Phản hồi của người bán</span>
                      <span>{formatDate(question.answered_at)}</span>
                    </div>
                    <p>{question.answer}</p>
                  </div>
                )}

                {!question.answer && !showAnswerForm && (
                  <p className="text-sm italic text-gray-500">Đang chờ người bán phản hồi...</p>
                )}

                {showAnswerForm && (
                  <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                    <p className="text-sm font-semibold text-gray-700">Trả lời câu hỏi này</p>
                    <textarea
                      className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                      rows={3}
                      value={draftValue}
                      onChange={(e) => handleDraftChange(question.id, e.target.value)}
                      placeholder="Nhập nội dung phản hồi cho bidder"
                    />
                    {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}
                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => handleAnswerSubmit(question.id)}
                        disabled={isSubmitting}
                        className="flex-1 min-w-[120px] bg-blue-600 text-white rounded-xl py-2 text-sm font-semibold hover:bg-blue-700 disabled:opacity-60"
                      >
                        {isSubmitting ? 'Đang gửi...' : 'Gửi trả lời'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCancel(question.id)}
                        disabled={isSubmitting}
                        className="flex-1 min-w-[120px] border border-gray-300 text-gray-600 rounded-xl py-2 text-sm font-semibold hover:bg-white disabled:opacity-60"
                      >
                        Hủy
                      </button>
                    </div>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
