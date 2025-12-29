/**
 * ============================================
 * MAIL SERVICE
 * ============================================
 * Service xử lý gửi email cho các sự kiện trong hệ thống
 */

import transporter from '../config/mail.js'
import * as templates from '../utils/emailTemplates.js'
import { supabase } from '../config/supabase.js'

const FROM_EMAIL = process.env.MAIL_FROM || process.env.MAIL_USER || 'noreply@auctionhub.com'
const FROM_NAME = process.env.MAIL_FROM_NAME || 'AuctionHub'

/**
 * Gửi email
 */
const sendMail = async (to, subject, html) => {
  try {
    if (!to) {
      console.log('⚠️ No recipient email provided')
      return false
    }

    const info = await transporter.sendMail({
      from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
      to,
      subject,
      html
    })

    console.log(`✅ Email sent to ${to}: ${info.messageId}`)
    return true
  } catch (error) {
    console.error(`❌ Failed to send email to ${to}:`, error.message)
    return false
  }
}

/**
 * Gửi email cho nhiều người
 */
const sendMailToMany = async (recipients, subject, htmlGenerator) => {
  const results = await Promise.allSettled(
    recipients.map(async (recipient) => {
      const html = typeof htmlGenerator === 'function'
        ? htmlGenerator(recipient)
        : htmlGenerator
      return sendMail(recipient.email, subject, html)
    })
  )
  return results
}

// ============================================
// 1. RA GIÁ THÀNH CÔNG
// ============================================
/**
 * Gửi thông báo khi có người đặt giá mới
 * - Gửi cho seller (luôn gửi)
 * - Gửi cho bidder mới (luôn gửi - với thông tin họ có đang thắng hay không)
 * - Gửi cho người giữ giá trước đó NẾU họ BỊ VƯỢT (isWinning = true)
 */
export const notifyNewBid = async ({ product, bidder, bidAmount, previousHighestBidder, isWinning = true }) => {
  try {
    // 1. Gửi cho seller (luôn gửi khi có bid mới)
    const { data: seller } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', product.seller_id)
      .single()

    if (seller?.email) {
      const { subject, html } = templates.newBidToSeller({
        sellerName: seller.full_name,
        bidderName: bidder.full_name,
        productName: product.name,
        productImage: product.thumbnail_url,
        oldPrice: product.current_price,
        newPrice: bidAmount,
        productId: product.id
      })
      await sendMail(seller.email, subject, html)
    }

    // 2. Gửi cho bidder mới (LUÔN GỬI)
    // Nội dung email sẽ khác nhau tùy vào isWinning
    if (bidder?.email) {
      const { subject, html } = templates.newBidToBidder({
        bidderName: bidder.full_name,
        productName: product.name,
        productImage: product.thumbnail_url,
        bidAmount,
        productId: product.id,
        endTime: product.end_time,
        isWinning // Truyền để template hiển thị đúng
      })
      await sendMail(bidder.email, subject, html)
    }

    // 3. Gửi cho người giữ giá trước CHỈ KHI HỌ BỊ VƯỢT (isWinning = true nghĩa là bidder mới thắng)
    if (isWinning && previousHighestBidder && previousHighestBidder.id !== bidder.id) {
      const { subject, html } = templates.outbidNotification({
        previousBidderName: previousHighestBidder.full_name,
        productName: product.name,
        productImage: product.thumbnail_url,
        previousPrice: previousHighestBidder.bid_amount,
        newPrice: bidAmount,
        newBidderName: bidder.full_name,
        productId: product.id,
        endTime: product.end_time
      })
      await sendMail(previousHighestBidder.email, subject, html)
    }

    console.log(`✅ New bid notifications sent for product ${product.id}`)
  } catch (error) {
    console.error('❌ Error sending new bid notifications:', error)
  }
}

// ============================================
// 2. NGƯỜI MUA BỊ TỪ CHỐI RA GIÁ
// ============================================
export const notifyBidRejected = async ({ product, bidder, reason }) => {
  try {
    if (!bidder?.email) return

    const { subject, html } = templates.bidRejectedToBidder({
      bidderName: bidder.full_name,
      productName: product.name,
      productImage: product.thumbnail_url,
      reason,
      productId: product.id
    })

    await sendMail(bidder.email, subject, html)
    console.log(`✅ Bid rejected notification sent to ${bidder.email}`)
  } catch (error) {
    console.error('❌ Error sending bid rejected notification:', error)
  }
}

// ============================================
// 3. ĐẤU GIÁ KẾT THÚC - KHÔNG CÓ NGƯỜI MUA
// ============================================
export const notifyAuctionEndedNoWinner = async ({ product, seller }) => {
  try {
    if (!seller?.email) return

    const { subject, html } = templates.auctionEndedNoWinner({
      sellerName: seller.full_name,
      productName: product.name,
      productImage: product.thumbnail_url,
      startingPrice: product.starting_price,
      productId: product.id
    })

    await sendMail(seller.email, subject, html)
    console.log(`✅ Auction ended (no winner) notification sent to ${seller.email}`)
  } catch (error) {
    console.error('❌ Error sending auction ended notification:', error)
  }
}

// ============================================
// 4. ĐẤU GIÁ KẾT THÚC - CÓ NGƯỜI THẮNG
// ============================================
export const notifyAuctionEnded = async ({ product, seller, winner }) => {
  try {
    // Gửi cho seller
    if (seller?.email) {
      const { subject, html } = templates.auctionEndedToSeller({
        sellerName: seller.full_name,
        productName: product.name,
        productImage: product.thumbnail_url,
        finalPrice: product.final_price || product.current_price,
        winnerName: winner.full_name,
        winnerEmail: winner.email,
        productId: product.id
      })
      await sendMail(seller.email, subject, html)
    }

    // Gửi cho winner
    if (winner?.email) {
      const { subject, html } = templates.auctionEndedToWinner({
        winnerName: winner.full_name,
        productName: product.name,
        productImage: product.thumbnail_url,
        finalPrice: product.final_price || product.current_price,
        sellerName: seller.full_name,
        sellerEmail: seller.email,
        productId: product.id
      })
      await sendMail(winner.email, subject, html)
    }

    console.log(`✅ Auction ended notifications sent for product ${product.id}`)
  } catch (error) {
    console.error('❌ Error sending auction ended notifications:', error)
  }
}

// ============================================
// 5. NGƯỜI MUA ĐẶT CÂU HỎI
// ============================================
export const notifyNewQuestion = async ({ product, seller, asker, question }) => {
  try {
    if (!seller?.email) return

    const { subject, html } = templates.newQuestionToSeller({
      sellerName: seller.full_name,
      askerName: asker.full_name,
      productName: product.name,
      productImage: product.thumbnail_url,
      question: question.question,
      productId: product.id,
      questionId: question.id
    })

    await sendMail(seller.email, subject, html)
    console.log(`✅ New question notification sent to ${seller.email}`)
  } catch (error) {
    console.error('❌ Error sending new question notification:', error)
  }
}

// ============================================
// 6. NGƯỜI BÁN TRẢ LỜI CÂU HỎI
// ============================================
/**
 * Gửi thông báo khi seller trả lời câu hỏi
 * - Gửi cho người đặt câu hỏi
 * - Gửi cho tất cả bidders đã đặt giá
 * - Gửi cho người đã đặt câu hỏi khác
 */
export const notifyQuestionAnswered = async ({ product, seller, question, answer }) => {
  try {
    // Lấy danh sách người cần thông báo:
    // 1. Người đặt câu hỏi này
    // 2. Tất cả bidders đã đặt giá cho sản phẩm
    // 3. Tất cả người đã đặt câu hỏi khác

    const [askersRes, biddersRes] = await Promise.all([
      // Lấy tất cả người đã hỏi
      supabase
        .from('questions')
        .select('asker_id, profiles!inner(id, email, full_name)')
        .eq('product_id', product.id),
      // Lấy tất cả bidders
      supabase
        .from('bids')
        .select('bidder_id, profiles!inner(id, email, full_name)')
        .eq('product_id', product.id)
        .eq('is_rejected', false)
    ])

    // Tạo danh sách unique recipients (Intersection: Askers AND Bidders)
    // Yêu cầu: "email về những người đã đặt đấu giá ít nhất 1 lần và gửi câu hỏi"
    const recipientMap = new Map()

    // Tạo Set các bidder_id để tra cứu nhanh
    const bidderIds = new Set(biddersRes.data?.map(b => b.bidder_id) || [])

    // Chỉ gửi cho những người đã hỏi (Askers) MÀ CŨNG LÀ Bidders
    askersRes.data?.forEach(item => {
      const userId = item.asker_id
      if (bidderIds.has(userId)) {
        if (item.profiles && item.profiles.id !== seller.id) {
          recipientMap.set(item.profiles.id, item.profiles)
        }
      }
    })

    // Gửi email cho từng người
    for (const [userId, recipient] of recipientMap) {
      if (!recipient.email) continue

      const { subject, html } = templates.questionAnsweredNotification({
        recipientName: recipient.full_name,
        sellerName: seller.full_name,
        productName: product.name,
        productImage: product.thumbnail_url,
        question: question.question,
        answer,
        productId: product.id
      })

      await sendMail(recipient.email, subject, html)
    }

    console.log(`✅ Question answered notifications sent to ${recipientMap.size} recipients`)
  } catch (error) {
    console.error('❌ Error sending question answered notifications:', error)
  }
}

export default {
  sendMail,
  notifyNewBid,
  notifyBidRejected,
  notifyAuctionEndedNoWinner,
  notifyAuctionEnded,
  notifyNewQuestion,
  notifyQuestionAnswered
}
