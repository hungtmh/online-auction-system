import React from 'react'
import 'quill/dist/quill.snow.css'

function formatDateTime(dateString) {
  if (!dateString) return ''
  const date = new Date(dateString)
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  return `${day}/${month}/${year}`
}

export default function ProductDescriptionCard({
  descriptionHtml,
  descriptionHistory = [],
  productCreatedAt
}) {
  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Mô tả chi tiết sản phẩm</h2>
      
      {/* Original description without label */}
      {descriptionHtml && (
        <div className="prose max-w-none mb-4">
          <div dangerouslySetInnerHTML={{ __html: descriptionHtml }} />
        </div>
      )}

      {/* Appended descriptions with timestamp and bullet format */}
      {descriptionHistory.length > 0 && (
        <div className="space-y-3 mt-6">
          {descriptionHistory.map((item, index) => (
            <div key={item.id || index}>
              <p className="text-sm font-semibold text-gray-700 mb-1">
                ✏️ {formatDateTime(item.added_at)}
              </p>
              <ul className="list-disc text-sm text-gray-600 ml-6">
                <li dangerouslySetInnerHTML={{ __html: item.description }} />
              </ul>
            </div>
          ))}
        </div>
      )}

      {!descriptionHtml && descriptionHistory.length === 0 && (
        <div className="text-sm text-gray-500">Không có mô tả cho sản phẩm này.</div>
      )}
    </div>
  )
}
