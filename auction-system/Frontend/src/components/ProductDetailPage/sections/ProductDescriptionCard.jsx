import React from 'react'

export default function ProductDescriptionCard({ descriptionHtml }) {
  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Mô tả chi tiết sản phẩm</h2>
      <div className="prose max-w-none text-gray-700">
        <div dangerouslySetInnerHTML={{ __html: descriptionHtml }} />
      </div>
    </div>
  )
}
