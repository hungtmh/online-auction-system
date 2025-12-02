import React from 'react'
import 'quill/dist/quill.snow.css'

function formatDateTime(dateString) {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export default function ProductDescriptionCard({
  descriptionHtml,
  descriptionHistory = [],
  productCreatedAt
}) {
  // Build full history: original description + appended descriptions
  const fullHistory = React.useMemo(() => {
    const history = []

    if (descriptionHtml) {
      history.push({
        id: 'original',
        description: descriptionHtml,
        added_at: productCreatedAt,
        isOriginal: true
      })
    }

    const appended = Array.isArray(descriptionHistory) ? [...descriptionHistory] : []
    appended.sort((a, b) => new Date(a.added_at) - new Date(b.added_at))

    appended.forEach((item) => {
      history.push({
        ...item,
        isOriginal: false
      })
    })

    return history
  }, [descriptionHtml, descriptionHistory, productCreatedAt])

  let appendCounter = 0

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Mô tả chi tiết sản phẩm</h2>
      
      {/* Full description history */}
      <div className="space-y-4">
        {fullHistory.length === 0 && (
          <div className="text-sm text-gray-500">Không có mô tả cho sản phẩm này.</div>
        )}

        {fullHistory.map((item, index) => {
          const label = item.isOriginal ? 'Mô tả gốc' : `Cập nhật lần ${++appendCounter}`
          return (
          <div 
            key={item.id || index} 
            className={`border-l-4 pl-4 py-2 rounded-r-lg ${
              item.isOriginal 
                ? 'border-green-500 bg-green-50' 
                : 'border-blue-500 bg-blue-50'
            }`}
          >
            <div className="text-xs text-gray-500 mb-2">
              <span className="font-medium">
                {label}
              </span>
              <span className="mx-2">•</span>
              <span>{formatDateTime(item.added_at)}</span>
            </div>
            <div className="ql-editor ql-snow text-sm" style={{ padding: 0, border: 'none' }}>
              <div dangerouslySetInnerHTML={{ __html: item.description }} />
            </div>
          </div>
        )})}
      </div>
    </div>
  )
}
