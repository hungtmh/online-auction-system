export function formatCurrency(value) {
  try {
    return `${Number(value || 0).toLocaleString('vi-VN')} đ`
  } catch (error) {
    return `${value || 0} đ`
  }
}

export function timeLeftLabel(endAt) {
  if (!endAt) return ''
  const end = new Date(endAt)
  const now = new Date()
  const diff = end - now
  if (diff <= 0) return 'Đã kết thúc'

  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (days < 3) {
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

    if (days > 0) return `${days} ngày ${hours} giờ nữa`
    if (hours > 0) return `${hours} giờ ${minutes} phút nữa`
    return `${minutes} phút nữa`
  }

  return `${days} ngày nữa`
}

export function formatDateTime(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleString('vi-VN')
}
