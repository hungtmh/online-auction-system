/**
 * ============================================
 * EMAIL TEMPLATES
 * ============================================
 * Templates HTML cho các loại email thông báo
 */

const APP_NAME = 'AuctionHub'
const APP_URL = process.env.FRONTEND_URL || 'http://localhost:5173'

// Format tiền VND
const formatCurrency = (value) => {
  if (!value && value !== 0) return '—'
  return `${Number(value).toLocaleString('vi-VN')} đ`
}

// Format datetime
const formatDateTime = (value) => {
  if (!value) return 'Chưa cập nhật'
  return new Date(value).toLocaleString('vi-VN')
}

// Base template wrapper
const baseTemplate = (content, title = 'Thông báo từ AuctionHub') => `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
    .header { background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: white; padding: 30px; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; }
    .content { padding: 30px; color: #333; line-height: 1.6; }
    .product-card { background: #f8fafc; border-radius: 12px; padding: 20px; margin: 20px 0; border: 1px solid #e2e8f0; }
    .product-card img { width: 100%; max-height: 200px; object-fit: cover; border-radius: 8px; }
    .product-card h3 { margin: 15px 0 10px; color: #1e293b; }
    .price { font-size: 24px; font-weight: bold; color: #2563eb; }
    .price-old { font-size: 16px; color: #94a3b8; text-decoration: line-through; }
    .btn { display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 10px 5px 10px 0; }
    .btn-success { background: #10b981; }
    .btn-warning { background: #f59e0b; }
    .btn-danger { background: #ef4444; }
    .info-box { background: #eff6ff; border-left: 4px solid #2563eb; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0; }
    .info-box.success { background: #ecfdf5; border-color: #10b981; }
    .info-box.warning { background: #fffbeb; border-color: #f59e0b; }
    .info-box.danger { background: #fef2f2; border-color: #ef4444; }
    .footer { background: #f8fafc; padding: 20px; text-align: center; color: #64748b; font-size: 12px; border-top: 1px solid #e2e8f0; }
    .footer a { color: #2563eb; text-decoration: none; }
    .highlight { color: #2563eb; font-weight: 600; }
    .question-box { background: #f1f5f9; padding: 15px; border-radius: 8px; margin: 15px 0; font-style: italic; }
    .answer-box { background: #ecfdf5; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #10b981; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🏷️ ${APP_NAME}</h1>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p>Email này được gửi tự động từ ${APP_NAME}. Vui lòng không reply.</p>
      <p><a href="${APP_URL}">Truy cập ${APP_NAME}</a></p>
    </div>
  </div>
</body>
</html>
`

// ============================================
// 1. RA GIÁ THÀNH CÔNG - GỬI CHO NGƯỜI BÁN
// ============================================
export const newBidToSeller = (data) => {
  const { sellerName, bidderName, productName, productImage, oldPrice, newPrice, productId } = data

  const content = `
    <h2>🔔 Có người đặt giá mới!</h2>
    <p>Xin chào <strong>${sellerName}</strong>,</p>
    <p>Sản phẩm của bạn vừa nhận được một lượt đặt giá mới:</p>
    
    <div class="product-card">
      ${productImage ? `<img src="${productImage}" alt="${productName}">` : ''}
      <h3>${productName}</h3>
      <p class="price-old">Giá trước: ${formatCurrency(oldPrice)}</p>
      <p class="price">Giá mới: ${formatCurrency(newPrice)}</p>
      <p>Người đặt: <strong>${bidderName}</strong></p>
    </div>
    
    <div class="info-box success">
      <strong>🎉 Tin tốt!</strong> Giá sản phẩm của bạn đã tăng lên ${formatCurrency(newPrice)}.
    </div>
    
    <a href="${APP_URL}/products/${productId}" class="btn">Xem chi tiết sản phẩm</a>
  `

  return {
    subject: `[${APP_NAME}] Có người đặt giá mới cho "${productName}"`,
    html: baseTemplate(content, 'Có người đặt giá mới')
  }
}

// ============================================
// 2. RA GIÁ THÀNH CÔNG - GỬI CHO NGƯỜI ĐẶT GIÁ
// ============================================
export const newBidToBidder = (data) => {
  const { bidderName, productName, productImage, bidAmount, productId, endTime, isWinning = true } = data

  // Nội dung khác nhau tùy vào trạng thái thắng/thua
  const winningContent = `
    <div class="info-box success">
      <strong>🎯 Bạn đang giữ giá cao nhất!</strong> Theo dõi sản phẩm để không bỏ lỡ khi có người đặt giá cao hơn.
    </div>
  `

  const losingContent = `
    <div class="info-box warning">
      <strong>⚠️ Có người đang giữ giá cao hơn bạn!</strong> Giá tối đa của bạn thấp hơn người khác. Hãy đặt giá cao hơn nếu muốn thắng!
    </div>
  `

  const content = `
    <h2>✅ Đặt giá thành công!</h2>
    <p>Xin chào <strong>${bidderName}</strong>,</p>
    <p>Bạn đã đặt giá thành công cho sản phẩm:</p>
    
    <div class="product-card">
      ${productImage ? `<img src="${productImage}" alt="${productName}">` : ''}
      <h3>${productName}</h3>
      <p class="price">Giá hiện tại: ${formatCurrency(bidAmount)}</p>
      <p>Kết thúc: <strong>${formatDateTime(endTime)}</strong></p>
    </div>
    
    ${isWinning ? winningContent : losingContent}
    
    <a href="${APP_URL}/products/${productId}" class="btn ${isWinning ? 'btn-success' : 'btn-warning'}">Theo dõi đấu giá</a>
  `

  return {
    subject: `[${APP_NAME}] Đặt giá thành công - "${productName}"`,
    html: baseTemplate(content, 'Đặt giá thành công')
  }
}

// ============================================
// 3. GỬI CHO NGƯỜI GIỮ GIÁ TRƯỚC ĐÓ (BỊ VƯỢT)
// ============================================
export const outbidNotification = (data) => {
  const { previousBidderName, productName, productImage, previousPrice, newPrice, newBidderName, productId, endTime } = data

  const content = `
    <h2>⚠️ Có người đặt giá cao hơn bạn!</h2>
    <p>Xin chào <strong>${previousBidderName}</strong>,</p>
    <p>Giá của bạn đã bị vượt qua:</p>
    
    <div class="product-card">
      ${productImage ? `<img src="${productImage}" alt="${productName}">` : ''}
      <h3>${productName}</h3>
      <p class="price-old">Giá của bạn: ${formatCurrency(previousPrice)}</p>
      <p class="price">Giá mới: ${formatCurrency(newPrice)}</p>
    </div>
    
    <div class="info-box warning">
      <strong>⏰ Đừng bỏ lỡ!</strong> Phiên đấu giá sẽ kết thúc vào ${formatDateTime(endTime)}. Hãy đặt giá cao hơn nếu bạn vẫn muốn sở hữu sản phẩm này!
    </div>
    
    <a href="${APP_URL}/products/${productId}" class="btn btn-warning">Đặt giá ngay</a>
  `

  return {
    subject: `[${APP_NAME}] Có người đặt giá cao hơn bạn - "${productName}"`,
    html: baseTemplate(content, 'Giá của bạn bị vượt')
  }
}

// ============================================
// 3.5. CẬP NHẬT GIÁ SẢN PHẨM (GỬI BROADCAST)
// ============================================
export const auctionUpdateNotification = (data) => {
  const { recipientName, productName, productImage, newPrice, productId, endTime } = data

  const content = `
    <h2>🔔 Cập nhật giá đấu giá!</h2>
    <p>Xin chào <strong>${recipientName}</strong>,</p>
    <p>Sản phẩm bạn đang quan tâm đã có người đặt giá mới:</p>
    
    <div class="product-card">
      ${productImage ? `<img src="${productImage}" alt="${productName}">` : ''}
      <h3>${productName}</h3>
      <p class="price">Giá hiện tại: ${formatCurrency(newPrice)}</p>
      <p>Kết thúc: <strong>${formatDateTime(endTime)}</strong></p>
    </div>
    
    <div class="info-box">
      <strong>👀 Đừng rời mắt!</strong> Phiên đấu giá đang diễn ra sôi nổi. Hãy kiểm tra ngay để đảm bảo cơ hội chiến thắng của bạn.
    </div>
    
    <a href="${APP_URL}/products/${productId}" class="btn">Xem chi tiết</a>
  `

  return {
    subject: `[${APP_NAME}] Cập nhật giá mới: ${formatCurrency(newPrice)} - "${productName}"`,
    html: baseTemplate(content, 'Cập nhật giá sản phẩm')
  }
}

// ============================================
// 4. NGƯỜI MUA BỊ TỪ CHỐI RA GIÁ
// ============================================
export const bidRejectedToBidder = (data) => {
  const { bidderName, productName, productImage, reason, productId } = data

  const content = `
    <h2>❌ Bạn đã bị từ chối tham gia đấu giá</h2>
    <p>Xin chào <strong>${bidderName}</strong>,</p>
    <p>Người bán đã từ chối quyền đấu giá của bạn cho sản phẩm:</p>
    
    <div class="product-card">
      ${productImage ? `<img src="${productImage}" alt="${productName}">` : ''}
      <h3>${productName}</h3>
    </div>
    
    ${reason ? `
    <div class="info-box danger">
      <strong>Lý do:</strong> ${reason}
    </div>
    ` : ''}
    
    <p>Bạn sẽ không thể đặt giá cho sản phẩm này nữa. Nếu có thắc mắc, vui lòng liên hệ bộ phận hỗ trợ.</p>
    
    <a href="${APP_URL}/auctions" class="btn">Xem các sản phẩm khác</a>
  `

  return {
    subject: `[${APP_NAME}] Bạn đã bị từ chối đấu giá - "${productName}"`,
    html: baseTemplate(content, 'Bị từ chối đấu giá')
  }
}

// ============================================
// NEW: YÊU CẦU QUYỀN ĐẤU GIÁ - GỬI CHO SELLER
// ============================================
export const bidPermissionRequestToSeller = (data) => {
  const { sellerName, bidderName, bidderEmail, bidderRating, productName, productImage, productId, requestId } = data

  const content = `
    <h2>🔔 Yêu cầu quyền đấu giá mới</h2>
    <p>Xin chào <strong>${sellerName}</strong>,</p>
    <p>Một người mua có điểm đánh giá thấp muốn tham gia đấu giá sản phẩm của bạn:</p>
    
    <div class="product-card">
      ${productImage ? `<img src="${productImage}" alt="${productName}">` : ''}
      <h3>${productName}</h3>
    </div>
    
    <div class="info-box warning">
      <strong>Thông tin người mua:</strong><br>
      📧 Email: ${bidderEmail}<br>
      👤 Tên: ${bidderName}<br>
      ⭐ Điểm đánh giá: ${bidderRating}%
    </div>
    
    <p>Bạn có muốn cho phép người này đấu giá sản phẩm không?</p>
    
    <a href="${APP_URL}/seller/products/${productId}/requests" class="btn">Duyệt yêu cầu</a>
  `

  return {
    subject: `[${APP_NAME}] Yêu cầu quyền đấu giá - "${productName}"`,
    html: baseTemplate(content, 'Yêu cầu quyền đấu giá')
  }
}

// ============================================
// NEW: PHÊDUYỆT QUYỀN ĐẤU GIÁ - GỬI CHO BIDDER
// ============================================
export const bidPermissionApprovedToBidder = (data) => {
  const { bidderName, productName, productImage, productId } = data

  const content = `
    <h2>✅ Yêu cầu đấu giá đã được phê duyệt!</h2>
    <p>Xin chào <strong>${bidderName}</strong>,</p>
    <p>Người bán đã phê duyệt yêu cầu của bạn. Bạn có thể đặt giá cho sản phẩm:</p>
    
    <div class="product-card">
      ${productImage ? `<img src="${productImage}" alt="${productName}">` : ''}
      <h3>${productName}</h3>
    </div>
    
    <div class="info-box success">
      <strong>✨ Hãy đặt giá ngay!</strong><br>
      Bạn giờ đây có thể tham gia đấu giá sản phẩm này. Đừng bỏ lỡ cơ hội!
    </div>
    
    <a href="${APP_URL}/products/${productId}" class="btn">Đặt giá ngay</a>
  `

  return {
    subject: `[${APP_NAME}] Được phép đấu giá - "${productName}"`,
    html: baseTemplate(content, 'Được phép đấu giá')
  }
}

// ============================================
// NEW: TỪ CHỐI QUYỀN ĐẤU GIÁ - GỬI CHO BIDDER
// ============================================
export const bidPermissionRejectedToBidder = (data) => {
  const { bidderName, productName, productImage, productId } = data

  const content = `
    <h2>❌ Yêu cầu đấu giá bị từ chối</h2>
    <p>Xin chào <strong>${bidderName}</strong>,</p>
    <p>Rất tiếc, người bán đã từ chối yêu cầu tham gia đấu giá của bạn cho sản phẩm:</p>
    
    <div class="product-card">
      ${productImage ? `<img src="${productImage}" alt="${productName}">` : ''}
      <h3>${productName}</h3>
    </div>
    
    <div class="info-box danger">
      <strong>Lưu ý:</strong> Bạn sẽ không thể đặt giá cho sản phẩm này.
    </div>
    
    <p>Để cải thiện cơ hội được chấp nhận trong tương lai, hãy tăng điểm đánh giá của bạn bằng cách hoàn thành các giao dịch thành công.</p>
    
    <a href="${APP_URL}/auctions" class="btn">Xem các sản phẩm khác</a>
  `

  return {
    subject: `[${APP_NAME}] Yêu cầu đấu giá bị từ chối - "${productName}"`,
    html: baseTemplate(content, 'Yêu cầu bị từ chối')
  }
}

// ============================================
// 5. ĐẤU GIÁ KẾT THÚC - KHÔNG CÓ NGƯỜI MUA (GỬI SELLER)
// ============================================
export const auctionEndedNoWinner = (data) => {
  const { sellerName, productName, productImage, startingPrice, productId } = data

  const content = `
    <h2>📢 Đấu giá kết thúc - Không có người thắng</h2>
    <p>Xin chào <strong>${sellerName}</strong>,</p>
    <p>Phiên đấu giá cho sản phẩm của bạn đã kết thúc nhưng không có người đặt giá:</p>
    
    <div class="product-card">
      ${productImage ? `<img src="${productImage}" alt="${productName}">` : ''}
      <h3>${productName}</h3>
      <p>Giá khởi điểm: <strong>${formatCurrency(startingPrice)}</strong></p>
    </div>
    
    <div class="info-box warning">
      <strong>💡 Gợi ý:</strong> Bạn có thể đăng lại sản phẩm với giá khởi điểm thấp hơn hoặc mô tả hấp dẫn hơn để thu hút người mua.
    </div>
    
    <a href="${APP_URL}/seller/add-product" class="btn">Đăng lại sản phẩm</a>
  `

  return {
    subject: `[${APP_NAME}] Đấu giá kết thúc - Không có người mua - "${productName}"`,
    html: baseTemplate(content, 'Đấu giá kết thúc')
  }
}

// ============================================
// 6. ĐẤU GIÁ KẾT THÚC - GỬI CHO NGƯỜI BÁN (CÓ NGƯỜI THẮNG)
// ============================================
export const auctionEndedToSeller = (data) => {
  const { sellerName, productName, productImage, finalPrice, winnerName, winnerEmail, productId } = data

  const content = `
    <h2>🎉 Đấu giá kết thúc - Có người thắng!</h2>
    <p>Xin chào <strong>${sellerName}</strong>,</p>
    <p>Phiên đấu giá cho sản phẩm của bạn đã kết thúc thành công:</p>
    
    <div class="product-card">
      ${productImage ? `<img src="${productImage}" alt="${productName}">` : ''}
      <h3>${productName}</h3>
      <p class="price">Giá thắng: ${formatCurrency(finalPrice)}</p>
    </div>
    
    <div class="info-box success">
      <strong>🏆 Người thắng:</strong><br>
      Tên: ${winnerName}<br>
      Email: ${winnerEmail}
    </div>
    
    <p>Vui lòng truy cập trang hoàn tất đơn hàng để xác nhận thanh toán và gửi hàng cho người thắng.</p>
    
    <a href="${APP_URL}/orders/${productId}" class="btn btn-success">Hoàn tất đơn hàng</a>
  `

  return {
    subject: `[${APP_NAME}] 🎉 Sản phẩm đã bán thành công - "${productName}"`,
    html: baseTemplate(content, 'Đấu giá thành công')
  }
}

// ============================================
// 7. ĐẤU GIÁ KẾT THÚC - GỬI CHO NGƯỜI THẮNG
// ============================================
export const auctionEndedToWinner = (data) => {
  const { winnerName, productName, productImage, finalPrice, sellerName, sellerEmail, productId } = data

  const content = `
    <h2>🏆 Chúc mừng! Bạn đã thắng đấu giá!</h2>
    <p>Xin chào <strong>${winnerName}</strong>,</p>
    <p>Bạn đã chiến thắng phiên đấu giá cho sản phẩm:</p>
    
    <div class="product-card">
      ${productImage ? `<img src="${productImage}" alt="${productName}">` : ''}
      <h3>${productName}</h3>
      <p class="price">Giá thắng: ${formatCurrency(finalPrice)}</p>
    </div>
    
    <div class="info-box success">
      <strong>📦 Người bán:</strong><br>
      Tên: ${sellerName}<br>
      Email: ${sellerEmail}
    </div>
    
    <p>Vui lòng truy cập trang hoàn tất đơn hàng để cung cấp thông tin thanh toán và địa chỉ giao hàng.</p>
    
    <a href="${APP_URL}/orders/${productId}" class="btn btn-success">Thanh toán ngay</a>
  `

  return {
    subject: `[${APP_NAME}] 🏆 Chúc mừng! Bạn đã thắng đấu giá - "${productName}"`,
    html: baseTemplate(content, 'Bạn đã thắng đấu giá')
  }
}

// ============================================
// 8. NGƯỜI MUA ĐẶT CÂU HỎI - GỬI CHO NGƯỜI BÁN
// ============================================
export const newQuestionToSeller = (data) => {
  const { sellerName, askerName, productName, productImage, question, productId, questionId } = data

  const content = `
    <h2>❓ Có câu hỏi mới về sản phẩm của bạn</h2>
    <p>Xin chào <strong>${sellerName}</strong>,</p>
    <p>Có người đặt câu hỏi về sản phẩm:</p>
    
    <div class="product-card">
      ${productImage ? `<img src="${productImage}" alt="${productName}">` : ''}
      <h3>${productName}</h3>
    </div>
    
    <div class="question-box">
      <strong>${askerName} hỏi:</strong><br>
      "${question}"
    </div>
    
    <div class="info-box">
      <strong>💡 Lưu ý:</strong> Trả lời nhanh chóng và chi tiết sẽ giúp tăng độ tin cậy và cơ hội bán được sản phẩm.
    </div>
    
    <a href="${APP_URL}/products/${productId}" class="btn">Trả lời ngay</a>
  `

  return {
    subject: `[${APP_NAME}] Câu hỏi mới về "${productName}"`,
    html: baseTemplate(content, 'Câu hỏi mới')
  }
}

// ============================================
// 9. NGƯỜI BÁN TRẢ LỜI - GỬI CHO NGƯỜI HỎI VÀ NGƯỜI THAM GIA
// ============================================
export const questionAnsweredNotification = (data) => {
  const { recipientName, sellerName, productName, productImage, question, answer, productId } = data

  const content = `
    <h2>💬 Người bán đã trả lời câu hỏi</h2>
    <p>Xin chào <strong>${recipientName}</strong>,</p>
    <p>Người bán đã trả lời câu hỏi về sản phẩm bạn quan tâm:</p>
    
    <div class="product-card">
      ${productImage ? `<img src="${productImage}" alt="${productName}">` : ''}
      <h3>${productName}</h3>
    </div>
    
    <div class="question-box">
      <strong>Câu hỏi:</strong><br>
      "${question}"
    </div>
    
    <div class="answer-box">
      <strong>${sellerName} trả lời:</strong><br>
      "${answer}"
    </div>
    
    <a href="${APP_URL}/products/${productId}" class="btn">Xem chi tiết sản phẩm</a>
  `

  return {
    subject: `[${APP_NAME}] Câu hỏi về "${productName}" đã được trả lời`,
    html: baseTemplate(content, 'Câu hỏi đã được trả lời')
  }
}

// ============================================
// NEW: BỔ SUNG MÔ TẢ SẢN PHẨM - GỬI CHO BIDDERS
// ============================================
export const productDescriptionUpdatedToBidders = (data) => {
  const { bidderName, productName, productImage, productId, newDescription } = data

  const content = `
    <h2>📝 Mô tả sản phẩm đã được cập nhật</h2>
    <p>Xin chào <strong>${bidderName}</strong>,</p>
    <p>Người bán đã bổ sung thông tin mô tả cho sản phẩm bạn đang theo dõi:</p>
    
    <div class="product-card">
      ${productImage ? `<img src="${productImage}" alt="${productName}">` : ''}
      <h3>${productName}</h3>
    </div>
    
    <div class="info-box info">
      <strong>📌 Nội dung bổ sung:</strong>
      <div style="margin-top: 8px; padding: 12px; background: white; border-radius: 8px;">
        ${newDescription}
      </div>
    </div>
    
    <p>Hãy xem chi tiết để cập nhật thông tin mới nhất về sản phẩm.</p>
    
    <a href="${APP_URL}/products/${productId}" class="btn">Xem chi tiết sản phẩm</a>
  `

  return {
    subject: `[${APP_NAME}] Cập nhật mô tả: "${productName}"`,
    html: baseTemplate(content, 'Cập nhật mô tả sản phẩm')
  }
}

export default {
  newBidToSeller,
  newBidToBidder,
  outbidNotification,
  auctionUpdateNotification,
  bidRejectedToBidder,
  bidPermissionRequestToSeller,
  bidPermissionApprovedToBidder,
  bidPermissionRejectedToBidder,
  productDescriptionUpdatedToBidders,
  auctionEndedNoWinner,
  auctionEndedToSeller,
  auctionEndedToWinner,
  newQuestionToSeller,
  questionAnsweredNotification
}
