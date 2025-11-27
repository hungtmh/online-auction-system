import React, { useMemo } from 'react'

const PLACEHOLDER_IMAGE = 'https://via.placeholder.com/800x600?text=No+Image'

function normalizeImages(images) {
  if (!images) return [PLACEHOLDER_IMAGE]

  if (Array.isArray(images)) {
    const cleaned = images.filter(Boolean)
    return cleaned.length ? cleaned : [PLACEHOLDER_IMAGE]
  }

  if (typeof images === 'string') {
    try {
      const parsed = JSON.parse(images)
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.filter(Boolean)
      }
    } catch (error) {
      // Not JSON, fall through to treat as single URL string
    }
    return [images]
  }

  return [PLACEHOLDER_IMAGE]
}

export default function ProductMediaGallery({ images, selectedIndex = 0, onSelect, title }) {
  const normalizedImages = useMemo(() => normalizeImages(images), [images])
  const safeIndex = Math.min(Math.max(selectedIndex, 0), normalizedImages.length - 1)
  const activeImage = normalizedImages[safeIndex] || PLACEHOLDER_IMAGE

  const handleSelect = (idx) => {
    if (typeof onSelect === 'function') {
      onSelect(idx)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      <div className="aspect-w-16 aspect-h-12">
        <img src={activeImage} alt={title || 'Product'} className="w-full h-[500px] object-cover" />
      </div>
      <div className="p-4 flex gap-3 overflow-x-auto">
        {normalizedImages.map((img, idx) => (
          <button
            key={`${img}-${idx}`}
            onClick={() => handleSelect(idx)}
            className={`flex-shrink-0 w-20 h-20 border-2 rounded-lg overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
              safeIndex === idx ? 'border-blue-600 ring-2 ring-blue-100' : 'border-gray-200'
            }`}
            aria-label={`Xem ảnh ${idx + 1}`}
          >
            <img src={img} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
          </button>
        ))}
      </div>
    </div>
  )
}
