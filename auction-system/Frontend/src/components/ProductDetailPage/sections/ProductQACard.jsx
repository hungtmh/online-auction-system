import React from 'react'
import { formatDateTime } from '../utils'

export default function ProductQACard({ questions = [] }) {
  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">💬 Câu hỏi & Trả lời</h2>
      {questions.length > 0 ? (
        <div className="space-y-4">
          {questions.map((item) => (
            <div key={item.id} className="border-b pb-4 last:border-0">
              <div className="flex items-start gap-3 mb-2">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-600 font-semibold text-sm">Q</span>
                </div>
                <div className="flex-1">
                  <div className="text-sm text-gray-500 mb-1">
                    {item.profiles?.full_name || 'Người dùng'} - {formatDateTime(item.created_at)}
                  </div>
                  <p className="text-gray-900">{item.question}</p>
                </div>
              </div>
              {item.answer && (
                <div className="flex items-start gap-3 ml-11">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-green-600 font-semibold text-sm">A</span>
                  </div>
                  <div className="flex-1">
                    <div className="text-sm text-gray-500 mb-1">
                      Người bán - {formatDateTime(item.answered_at)}
                    </div>
                    <p className="text-gray-700">{item.answer}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500">Chưa có câu hỏi nào.</p>
      )}
    </div>
  )
}
