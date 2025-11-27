import React from 'react'

const formatDate = (value) => {
  if (!value) return '—'
  return new Date(value).toLocaleString('vi-VN')
}

export default function QuestionsSection({ questions = [] }) {
  return (
    <section className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Hỏi người bán</h3>
        <span className="text-sm text-gray-500">{questions.length} câu hỏi</span>
      </div>

      {questions.length === 0 ? (
        <p className="text-sm text-gray-500">Chưa có câu hỏi nào. Hãy là người đầu tiên đặt câu hỏi!</p>
      ) : (
        <ul className="space-y-4">
          {questions.map((question) => (
            <li key={question.id} className="border border-gray-100 rounded-xl p-4">
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>{question.asker?.full_name || 'Ẩn danh'}</span>
                <span>{formatDate(question.created_at)}</span>
              </div>
              <p className="mt-2 font-medium text-gray-900">{question.question}</p>
              {question.answer ? (
                <div className="mt-3 bg-green-50 text-green-800 text-sm rounded-lg px-4 py-2">
                  <span className="font-semibold">Trả lời:</span> {question.answer}
                </div>
              ) : (
                <p className="mt-3 text-sm italic text-gray-500">Đang chờ người bán phản hồi...</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
