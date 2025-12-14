/**
 * ============================================
 * AUCTION SCHEDULER
 * ============================================
 * Scheduled tasks để xử lý các sự kiện tự động:
 * - Kiểm tra và kết thúc phiên đấu giá
 * - Gửi email thông báo khi đấu giá kết thúc
 */

import { supabase } from '../config/supabase.js'
import mailService from '../services/mailService.js'

const ORDER_STATUS = {
  PENDING_PAYMENT: 'pending_payment'
}

/**
 * Kiểm tra và xử lý các phiên đấu giá đã kết thúc
 */
export const processEndedAuctions = async () => {
  try {
    const now = new Date().toISOString()

    // Lấy các sản phẩm active đã hết thời gian nhưng chưa được xử lý
    const { data: endedProducts, error } = await supabase
      .from('products')
      .select(`
        id,
        name,
        thumbnail_url,
        starting_price,
        current_price,
        final_price,
        seller_id,
        winner_id,
        bid_count,
        end_time,
        status
      `)
      .eq('status', 'active')
      .lt('end_time', now)
      .limit(50)

    if (error) {
      console.error('❌ Error fetching ended auctions:', error)
      return
    }

    if (!endedProducts || endedProducts.length === 0) {
      return
    }

    console.log(`🔄 Processing ${endedProducts.length} ended auctions...`)

    for (const product of endedProducts) {
      try {
        console.log(`\n📦 [DEBUG] Processing product ${product.id}: "${product.name}"`)
        console.log(`   - current_price: ${product.current_price}`)
        console.log(`   - end_time: ${product.end_time}`)
        
        // Lấy TẤT CẢ bids không bị reject để tìm người có max_bid_amount cao nhất
        const { data: allBids, error: bidsError } = await supabase
          .from('bids')
          .select('bidder_id, max_bid_amount, bid_amount, created_at')
          .eq('product_id', product.id)
          .eq('is_rejected', false)

        if (bidsError) {
          console.error(`   ❌ Error fetching bids:`, bidsError)
          continue
        }

        console.log(`   📊 Total bids found: ${allBids?.length || 0}`)
        
        // Log chi tiết từng bid
        if (allBids && allBids.length > 0) {
          console.log(`   📋 All bids:`)
          allBids.forEach((bid, idx) => {
            console.log(`      ${idx + 1}. bidder_id: ${bid.bidder_id.substring(0, 8)}..., max_bid: ${bid.max_bid_amount}, bid_amount: ${bid.bid_amount}, created_at: ${bid.created_at}`)
          })
        }

        if (!allBids || allBids.length === 0) {
          // KHÔNG CÓ NGƯỜI THẮNG
          await supabase
            .from('products')
            .update({
              status: 'completed',
              updated_at: now
            })
            .eq('id', product.id)

          // Lấy thông tin seller để gửi email
          const { data: seller } = await supabase
            .from('profiles')
            .select('id, email, full_name')
            .eq('id', product.seller_id)
            .single()

          if (seller) {
            await mailService.notifyAuctionEndedNoWinner({
              product,
              seller
            })
          }

          console.log(`✅ Auction ended without winner for product ${product.id}`)
          continue
        }

        // Tìm max_bid_amount cao nhất của MỖI bidder
        const bidderMaxMap = new Map() // bidder_id -> { max_bid_amount, first_created_at }
        
        for (const bid of allBids) {
          const bidderId = bid.bidder_id
          const maxBid = Number(bid.max_bid_amount)
          const createdAt = new Date(bid.created_at)
          
          if (!bidderMaxMap.has(bidderId)) {
            bidderMaxMap.set(bidderId, {
              max_bid_amount: maxBid,
              first_created_at: createdAt
            })
          } else {
            const current = bidderMaxMap.get(bidderId)
            // Cập nhật nếu max cao hơn
            if (maxBid > current.max_bid_amount) {
              current.max_bid_amount = maxBid
              current.first_created_at = createdAt
            }
            // Nếu cùng max, giữ thời gian sớm nhất
            else if (maxBid === current.max_bid_amount && createdAt < current.first_created_at) {
              current.first_created_at = createdAt
            }
          }
        }

        // Chuyển thành array và sắp xếp để tìm winner
        const bidderList = Array.from(bidderMaxMap.entries()).map(([bidderId, data]) => ({
          bidder_id: bidderId,
          ...data
        }))

        console.log(`   🔢 Bidder summary (before sort):`)
        bidderList.forEach((b, idx) => {
          console.log(`      ${idx + 1}. bidder_id: ${b.bidder_id.substring(0, 8)}..., max_bid: ${b.max_bid_amount}, first_at: ${b.first_created_at.toISOString()}`)
        })

        // Sort: max_bid_amount DESC, nếu bằng nhau thì first_created_at ASC (ai đặt trước thắng)
        bidderList.sort((a, b) => {
          if (b.max_bid_amount !== a.max_bid_amount) {
            return b.max_bid_amount - a.max_bid_amount
          }
          return a.first_created_at - b.first_created_at
        })

        console.log(`   🔢 Bidder summary (after sort):`)
        bidderList.forEach((b, idx) => {
          console.log(`      ${idx + 1}. bidder_id: ${b.bidder_id.substring(0, 8)}..., max_bid: ${b.max_bid_amount}`)
        })

        // Người đầu tiên là winner (max_bid cao nhất, hoặc đặt trước nếu cùng max)
        const winnerId = bidderList[0].bidder_id
        const finalPrice = product.current_price || product.starting_price

        console.log(`   🏆 WINNER: ${winnerId}`)
        console.log(`   💰 Final price: ${finalPrice}`)

        // CÓ NGƯỜI THẮNG - Cập nhật product
        const { error: updateError } = await supabase
          .from('products')
          .update({
            status: 'completed',
            winner_id: winnerId,
            final_price: finalPrice,
            updated_at: now
          })
          .eq('id', product.id)

        if (updateError) {
          console.error(`   ❌ Error updating product:`, updateError)
        } else {
          console.log(`   ✅ Product updated successfully`)
        }

        // Tạo order
        const { data: existingOrder } = await supabase
          .from('orders')
          .select('id')
          .eq('product_id', product.id)
          .maybeSingle()

        if (!existingOrder) {
          await supabase
            .from('orders')
            .insert({
              product_id: product.id,
              seller_id: product.seller_id,
              buyer_id: winnerId,
              final_price: finalPrice,
              status: ORDER_STATUS.PENDING_PAYMENT
            })
        }

        // Lấy thông tin seller và winner để gửi email
        const [sellerRes, winnerRes] = await Promise.all([
          supabase.from('profiles').select('id, email, full_name').eq('id', product.seller_id).single(),
          supabase.from('profiles').select('id, email, full_name').eq('id', winnerId).single()
        ])

        const seller = sellerRes.data
        const winner = winnerRes.data

        // Gửi email thông báo
        if (seller && winner) {
          await mailService.notifyAuctionEnded({
            product: { ...product, final_price: finalPrice },
            seller,
            winner
          })
        }

        console.log(`✅ Auction ended with winner for product ${product.id}`)
      } catch (productError) {
        console.error(`❌ Error processing auction for product ${product.id}:`, productError)
      }
    }
  } catch (error) {
    console.error('❌ Error in processEndedAuctions:', error)
  }
}

/**
 * Bắt đầu scheduler
 * Chạy mỗi phút để kiểm tra các phiên đấu giá kết thúc
 */
export const startAuctionScheduler = () => {
  console.log('🕐 Starting auction scheduler...')
  
  // Chạy ngay lần đầu
  processEndedAuctions()
  
  // Chạy mỗi 60 giây
  const intervalId = setInterval(processEndedAuctions, 60 * 1000)
  
  return intervalId
}

export default {
  processEndedAuctions,
  startAuctionScheduler
}
