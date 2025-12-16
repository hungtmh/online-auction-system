/**
 * ============================================
 * ORDER COMPLETION PAGE - Hoàn tất đơn hàng 3 bước
 * ============================================
 * BIDDER: Thanh toán → Nhận hàng → Đánh giá
 * SELLER: Xác nhận → Gửi hàng → Đánh giá
 */

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import UnifiedNavbar from "../components/common/UnifiedNavbar";
import orderAPI from "../services/orderAPI";

// ============================================
// CONSTANTS
// ============================================

const ORDER_STATUS = {
  PENDING_PAYMENT: "pending_payment",
  PAYMENT_CONFIRMED: "payment_confirmed",
  SHIPPED: "shipped",
  DELIVERED: "delivered",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
};

// Steps riêng cho từng role
const BIDDER_STEPS = [
  { id: 1, title: "Thanh toán", description: "Nhập thông tin thanh toán + địa chỉ" },
  { id: 2, title: "Nhận hàng", description: "Xác nhận đã nhận hàng" },
  { id: 3, title: "Đánh giá", description: "Đánh giá người bán" },
];

const SELLER_STEPS = [
  { id: 1, title: "Xác nhận", description: "Xác nhận thanh toán" },
  { id: 2, title: "Gửi hàng", description: "Nhập thông tin vận chuyển" },
  { id: 3, title: "Đánh giá", description: "Đánh giá người mua" },
];

// ============================================
// HELPER FUNCTIONS
// ============================================

const formatCurrency = (value) => {
  if (!value && value !== 0) return "—";
  return `${Number(value).toLocaleString("vi-VN")} đ`;
};

const formatDateTime = (value) => {
  if (!value) return "Chưa cập nhật";
  return new Date(value).toLocaleString("vi-VN");
};

// Tính step hiện tại cho BIDDER
const getBidderStep = (order) => {
  if (!order) return 1;
  // Bước 1: Thanh toán - chưa có payment_proof_url
  if (!order.payment_proof_url) return 1;
  // Bước 2: Nhận hàng - đã thanh toán, chờ nhận hàng
  if (!order.buyer_confirmed_at && order.status !== ORDER_STATUS.DELIVERED && order.status !== ORDER_STATUS.COMPLETED) return 2;
  // Bước 3: Đánh giá
  return 3;
};

// Tính step hiện tại cho SELLER
const getSellerStep = (order) => {
  if (!order) return 1;
  // Bước 1: Xác nhận - chờ buyer thanh toán hoặc cần xác nhận
  if (!order.payment_proof_url || !order.payment_confirmed_at) return 1;
  // Bước 2: Gửi hàng - đã xác nhận, chưa gửi hàng
  if (!order.shipped_at) return 2;
  // Bước 3: Đánh giá
  return 3;
};

// ============================================
// COMPONENTS
// ============================================

// Step Indicator - Hiển thị theo role
const StepIndicator = ({ currentStep, isCancelled, userRole }) => {
  if (isCancelled) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
            <span className="text-2xl">❌</span>
          </div>
          <div>
            <h3 className="text-lg font-bold text-red-800">Đơn hàng đã bị huỷ</h3>
            <p className="text-red-600 text-sm">Giao dịch này đã bị huỷ bởi người bán</p>
          </div>
        </div>
      </div>
    );
  }

  // Chọn steps theo role
  const STEPS = userRole === "seller" ? SELLER_STEPS : BIDDER_STEPS;

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
      <div className="flex items-center justify-between">
        {STEPS.map((step, index) => (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm
                ${currentStep >= step.id ? "bg-emerald-500 text-white" : "bg-gray-200 text-gray-500"}`}>
                {currentStep > step.id ? "✓" : step.id}
              </div>
              <p
                className={`mt-2 text-xs font-medium text-center max-w-[80px]
                ${currentStep >= step.id ? "text-emerald-600" : "text-gray-400"}`}>
                {step.title}
              </p>
            </div>
            {index < STEPS.length - 1 && <div className={`flex-1 h-1 mx-2 rounded ${currentStep > step.id ? "bg-emerald-500" : "bg-gray-200"}`} />}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

// Product Info Card
const ProductInfoCard = ({ product, finalPrice }) => (
  <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
    <h3 className="text-lg font-bold text-gray-900 mb-4">Thông tin sản phẩm</h3>
    <div className="flex gap-4">
      <img src={product?.thumbnail_url || "/placeholder.png"} alt={product?.name} className="w-24 h-24 object-cover rounded-xl" />
      <div className="flex-1">
        <h4 className="font-semibold text-gray-900">{product?.name}</h4>
        <p className="text-2xl font-bold text-blue-600 mt-2">{formatCurrency(finalPrice)}</p>
      </div>
    </div>
  </div>
);

// User Info Card
const UserInfoCard = ({ title, user, isCurrentUser }) => (
  <div className={`bg-white rounded-2xl shadow-sm p-6 ${isCurrentUser ? "ring-2 ring-blue-500" : ""}`}>
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-lg font-bold text-gray-900">{title}</h3>
      {isCurrentUser && <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">Bạn</span>}
    </div>
    <div className="space-y-2 text-sm">
      <p>
        <span className="text-gray-500">Tên:</span> <span className="font-medium">{user?.full_name || "—"}</span>
      </p>
      <p>
        <span className="text-gray-500">Email:</span> <span className="font-medium">{user?.email || "—"}</span>
      </p>
      <p>
        <span className="text-gray-500">SĐT:</span> <span className="font-medium">{user?.phone || "Chưa cập nhật"}</span>
      </p>
      <p>
        <span className="text-gray-500">Địa chỉ:</span> <span className="font-medium">{user?.address || "Chưa cập nhật"}</span>
      </p>
      <div className="flex items-center gap-4 mt-3 pt-3 border-t">
        <span className="text-emerald-600 font-medium">👍 {user?.rating_positive || 0}</span>
        <span className="text-red-600 font-medium">👎 {user?.rating_negative || 0}</span>
      </div>
    </div>
  </div>
);

// Step 1: Buyer Payment Form
const Step1BuyerForm = ({ order, onSubmit, loading }) => {
  const [address, setAddress] = useState(order?.shipping_address || "");
  const [proofUrl, setProofUrl] = useState(order?.payment_proof_url || "");
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await orderAPI.uploadPaymentProof(file);
      setProofUrl(res?.data?.url || res?.url || "");
    } catch (err) {
      console.error("Upload error:", err);
      alert("Không thể upload ảnh");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!address.trim()) return alert("Vui lòng nhập địa chỉ giao hàng");
    if (!proofUrl) return alert("Vui lòng upload hoá đơn thanh toán");
    onSubmit({ shipping_address: address, payment_proof_url: proofUrl });
  };

  const alreadySubmitted = !!order?.payment_proof_url;

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4">{alreadySubmitted ? "✅ Đã gửi thông tin thanh toán" : "Bước 1: Gửi thông tin thanh toán"}</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ giao hàng *</label>
          <textarea value={address} onChange={(e) => setAddress(e.target.value)} className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent" rows={3} placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành phố" disabled={alreadySubmitted} />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Hoá đơn thanh toán *</label>
          {proofUrl ? (
            <div className="relative">
              <img src={proofUrl} alt="Payment proof" className="w-full max-h-64 object-contain rounded-xl border" />
              {!alreadySubmitted && (
                <button type="button" onClick={() => setProofUrl("")} className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center">
                  ×
                </button>
              )}
            </div>
          ) : (
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center">
              <input type="file" accept="image/*" onChange={handleUpload} className="hidden" id="payment-proof-upload" disabled={uploading} />
              <label htmlFor="payment-proof-upload" className="cursor-pointer text-blue-600 hover:text-blue-700 font-medium">
                {uploading ? "Đang upload..." : "📷 Nhấn để upload ảnh hoá đơn"}
              </label>
            </div>
          )}
        </div>

        {!alreadySubmitted && (
          <button type="submit" disabled={loading || uploading} className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 disabled:opacity-50">
            {loading ? "Đang gửi..." : "Gửi thông tin thanh toán"}
          </button>
        )}
      </form>
    </div>
  );
};

// Step 2: Seller Shipping Form (Gửi hàng)
const Step2SellerForm = ({ order, onSubmit, loading }) => {
  const [trackingNumber, setTrackingNumber] = useState(order?.shipping_tracking_number || "");
  const [shippingProofUrl, setShippingProofUrl] = useState(order?.shipping_proof_url || "");
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await orderAPI.uploadPaymentProof(file);
      setShippingProofUrl(res?.data?.url || res?.url || "");
    } catch (err) {
      console.error("Upload error:", err);
      alert("Không thể upload ảnh");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ shipping_tracking_number: trackingNumber, shipping_proof_url: shippingProofUrl });
  };

  const alreadyShipped = order?.shipped_at;

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4">{alreadyShipped ? "✅ Đã gửi hàng" : "Nhập thông tin gửi hàng"}</h3>

      {/* Hiển thị địa chỉ giao hàng */}
      <div className="mb-4 p-4 bg-blue-50 rounded-xl">
        <p className="text-sm font-medium text-blue-700 mb-1">📍 Địa chỉ giao hàng:</p>
        <p className="text-blue-900">{order?.shipping_address || "Chưa có"}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Mã vận đơn *</label>
          <input type="text" value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500" placeholder="Nhập mã vận đơn từ đơn vị vận chuyển" disabled={alreadyShipped} required />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Ảnh hoá đơn vận chuyển (tuỳ chọn)</label>
          {shippingProofUrl ? (
            <div className="relative">
              <img src={shippingProofUrl} alt="Shipping proof" className="w-full max-h-48 object-contain rounded-xl border" />
              {!alreadyShipped && (
                <button type="button" onClick={() => setShippingProofUrl("")} className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8">
                  ×
                </button>
              )}
            </div>
          ) : (
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center">
              <input type="file" accept="image/*" onChange={handleUpload} className="hidden" id="shipping-proof-upload" disabled={uploading || alreadyShipped} />
              <label htmlFor="shipping-proof-upload" className="cursor-pointer text-blue-600 font-medium">
                {uploading ? "Đang upload..." : "📷 Upload ảnh hoá đơn vận chuyển"}
              </label>
            </div>
          )}
        </div>

        {!alreadyShipped && (
          <button type="submit" disabled={loading || uploading || !trackingNumber.trim()} className="w-full bg-emerald-600 text-white font-bold py-3 rounded-xl hover:bg-emerald-700 disabled:opacity-50">
            {loading ? "Đang xử lý..." : "📦 Xác nhận đã gửi hàng"}
          </button>
        )}
      </form>
    </div>
  );
};

// Step 3: Buyer Confirm Delivery
const Step3BuyerConfirm = ({ order, onConfirm, loading }) => {
  const alreadyConfirmed = order?.status === ORDER_STATUS.DELIVERED || order?.buyer_confirmed_at;

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4">{alreadyConfirmed ? "✅ Đã xác nhận nhận hàng" : "Xác nhận nhận hàng"}</h3>

      {/* Hiển thị thông tin vận chuyển */}
      {order?.shipping_tracking_number && (
        <p className="mb-2 text-sm">
          <span className="text-gray-500">Mã vận đơn:</span> <span className="font-mono font-medium">{order.shipping_tracking_number}</span>
        </p>
      )}
      {order?.shipping_proof_url && (
        <div className="mb-4">
          <p className="text-sm text-gray-500 mb-2">Hoá đơn vận chuyển:</p>
          <img src={order.shipping_proof_url} alt="Shipping proof" className="max-h-48 object-contain rounded-lg" />
        </div>
      )}

      {!alreadyConfirmed && (
        <button onClick={onConfirm} disabled={loading} className="w-full bg-emerald-600 text-white font-bold py-3 rounded-xl hover:bg-emerald-700 disabled:opacity-50">
          {loading ? "Đang xử lý..." : "✓ Xác nhận đã nhận được hàng"}
        </button>
      )}
    </div>
  );
};

// Step 4: Rating Form
const RatingForm = ({ existingRating, userRole, onSubmit, loading }) => {
  const [rating, setRating] = useState(existingRating?.rating || "");
  const [comment, setComment] = useState(existingRating?.comment || "");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!rating) return alert("Vui lòng chọn đánh giá");
    onSubmit({ rating, comment });
  };

  const targetLabel = userRole === "seller" ? "người mua" : "người bán";

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4">{existingRating ? `✅ Đã đánh giá ${targetLabel}` : `Đánh giá ${targetLabel}`}</h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex gap-4">
          <button type="button" onClick={() => setRating("positive")} className={`flex-1 py-4 rounded-xl border-2 font-bold text-lg transition ${rating === "positive" ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-gray-200 text-gray-500 hover:border-emerald-300"}`}>
            👍 Tích cực
          </button>
          <button type="button" onClick={() => setRating("negative")} className={`flex-1 py-4 rounded-xl border-2 font-bold text-lg transition ${rating === "negative" ? "border-red-500 bg-red-50 text-red-700" : "border-gray-200 text-gray-500 hover:border-red-300"}`}>
            👎 Tiêu cực
          </button>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nhận xét (tuỳ chọn)</label>
          <textarea value={comment} onChange={(e) => setComment(e.target.value)} className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500" rows={3} placeholder="Chia sẻ trải nghiệm của bạn..." />
        </div>

        <button type="submit" disabled={loading || !rating} className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 disabled:opacity-50">
          {loading ? "Đang gửi..." : existingRating ? "Cập nhật đánh giá" : "Gửi đánh giá"}
        </button>

        {existingRating && <p className="text-xs text-gray-500 text-center">Bạn có thể thay đổi đánh giá bất cứ lúc nào</p>}
      </form>
    </div>
  );
};

// Chat Component
const ChatBox = ({ productId, currentUserId }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  const loadMessages = useCallback(async () => {
    if (!productId) return;
    setLoading(true);
    try {
      const res = await orderAPI.getChatMessages(productId);
      setMessages(res?.data || []);
    } catch (err) {
      console.error("Load messages error:", err);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    loadMessages();
    // Poll mỗi 5 giây
    const interval = setInterval(loadMessages, 5000);
    return () => clearInterval(interval);
  }, [loadMessages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;
    setSending(true);
    try {
      const res = await orderAPI.sendChatMessage(productId, { message: newMessage.trim() });
      if (res?.data) {
        setMessages((prev) => [...prev, res.data]);
        setNewMessage("");
      }
    } catch (err) {
      console.error("Send message error:", err);
      alert("Không thể gửi tin nhắn");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm flex flex-col h-[400px]">
      <div className="p-4 border-b">
        <h3 className="font-bold text-gray-900">💬 Chat với đối tác</h3>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading && messages.length === 0 ? (
          <p className="text-center text-gray-500">Đang tải...</p>
        ) : messages.length === 0 ? (
          <p className="text-center text-gray-400 text-sm">Chưa có tin nhắn. Hãy bắt đầu cuộc trò chuyện!</p>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender_id === currentUserId;
            return (
              <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[70%] rounded-2xl px-4 py-2 ${isMe ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-900"}`}>
                  {!isMe && <p className="text-xs font-medium mb-1 opacity-70">{msg.profiles?.full_name || "Người dùng"}</p>}
                  <p className="text-sm">{msg.message}</p>
                  <p className={`text-xs mt-1 ${isMe ? "text-blue-200" : "text-gray-400"}`}>{new Date(msg.created_at).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}</p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-4 border-t flex gap-2">
        <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} className="flex-1 px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500" placeholder="Nhập tin nhắn..." disabled={sending} />
        <button type="submit" disabled={sending || !newMessage.trim()} className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50">
          {sending ? "..." : "➤"}
        </button>
      </form>
    </div>
  );
};

// Cancel Button
const CancelOrderButton = ({ onCancel, loading }) => {
  const [reason, setReason] = useState("");
  const [showModal, setShowModal] = useState(false);

  const handleCancel = () => {
    if (!window.confirm("Bạn có chắc chắn muốn huỷ giao dịch? Người mua sẽ bị đánh giá tiêu cực.")) return;
    onCancel(reason);
    setShowModal(false);
  };

  return (
    <>
      <button onClick={() => setShowModal(true)} className="w-full mt-4 py-3 border-2 border-red-500 text-red-600 font-bold rounded-xl hover:bg-red-50">
        ❌ Huỷ giao dịch
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-red-600 mb-4">Huỷ giao dịch</h3>
            <p className="text-sm text-gray-600 mb-4">Việc huỷ giao dịch sẽ tự động đánh giá tiêu cực cho người mua. Vui lòng nhập lý do:</p>
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} className="w-full px-4 py-3 border rounded-xl mb-4" rows={3} placeholder="VD: Người mua không thanh toán sau 24h" />
            <div className="flex gap-3">
              <button onClick={() => setShowModal(false)} className="flex-1 py-2 border rounded-xl">
                Đóng
              </button>
              <button onClick={handleCancel} disabled={loading} className="flex-1 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-50">
                {loading ? "Đang huỷ..." : "Xác nhận huỷ"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// ============================================
// MAIN PAGE COMPONENT
// ============================================

export default function OrderCompletionPage({ user }) {
  const { id: productId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const loadOrder = useCallback(async () => {
    if (!productId || !user) return;
    setLoading(true);
    setError(null);
    try {
      const res = await orderAPI.getOrder(productId);
      setData(res?.data || null);
    } catch (err) {
      const message = err?.response?.data?.message || "Không thể tải thông tin đơn hàng";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [productId, user]);

  useEffect(() => {
    loadOrder();
  }, [loadOrder]);

  // Handlers
  const handleStep1 = async (payload) => {
    setActionLoading(true);
    setFeedback(null);
    try {
      await orderAPI.submitPaymentProof(productId, payload);
      setFeedback({ type: "success", text: "Đã gửi thông tin thanh toán!" });
      await loadOrder();
    } catch (err) {
      setFeedback({ type: "error", text: err?.response?.data?.message || "Lỗi khi gửi thông tin" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleStep2 = async (payload) => {
    setActionLoading(true);
    setFeedback(null);
    try {
      await orderAPI.confirmPaymentAndShip(productId, payload);
      setFeedback({ type: "success", text: "Đã xác nhận và gửi hàng!" });
      await loadOrder();
    } catch (err) {
      setFeedback({ type: "error", text: err?.response?.data?.message || "Lỗi khi xác nhận" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleStep3 = async () => {
    setActionLoading(true);
    setFeedback(null);
    try {
      await orderAPI.confirmDelivery(productId);
      setFeedback({ type: "success", text: "Đã xác nhận nhận hàng!" });
      await loadOrder();
    } catch (err) {
      setFeedback({ type: "error", text: err?.response?.data?.message || "Lỗi khi xác nhận" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRating = async (payload) => {
    setActionLoading(true);
    setFeedback(null);
    try {
      await orderAPI.submitRating(productId, payload);
      setFeedback({ type: "success", text: "Đã gửi đánh giá!" });
      await loadOrder();
    } catch (err) {
      setFeedback({ type: "error", text: err?.response?.data?.message || "Lỗi khi đánh giá" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async (reason) => {
    setActionLoading(true);
    setFeedback(null);
    try {
      await orderAPI.cancelOrder(productId, reason);
      setFeedback({ type: "success", text: "Đã huỷ giao dịch" });
      await loadOrder();
    } catch (err) {
      setFeedback({ type: "error", text: err?.response?.data?.message || "Lỗi khi huỷ" });
    } finally {
      setActionLoading(false);
    }
  };

  // ============================================
  // RENDER
  // ============================================

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <UnifiedNavbar user={null} />
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold text-gray-900">Yêu cầu đăng nhập</h1>
          <p className="mt-4 text-gray-600">Vui lòng đăng nhập để xem đơn hàng.</p>
          <button onClick={() => navigate(`/login?redirect=/orders/${productId}`)} className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold">
            Đăng nhập
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <UnifiedNavbar user={user} />
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <UnifiedNavbar user={user} />
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900">{error}</h1>
          <button onClick={() => navigate(-1)} className="mt-6 px-6 py-3 bg-gray-200 text-gray-800 rounded-xl font-medium">
            ← Quay lại
          </button>
        </div>
      </div>
    );
  }

  const { product, order, seller, buyer, ratings, userRole } = data || {};
  const isSeller = userRole === "seller";
  const isBuyer = userRole === "buyer";
  const isCancelled = order?.status === ORDER_STATUS.CANCELLED;
  const isCompleted = order?.status === ORDER_STATUS.COMPLETED;
  const myRating = isSeller ? ratings?.sellerRating : ratings?.buyerRating;

  // Tính currentStep theo role
  const currentStep = isSeller ? getSellerStep(order) : getBidderStep(order);

  return (
    <div className="min-h-screen bg-gray-50">
      <UnifiedNavbar user={user} />

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-gray-700 text-sm mb-2">
              ← Quay lại
            </button>
            <h1 className="text-3xl font-bold text-gray-900">Hoàn tất đơn hàng</h1>
          </div>
          {order && <span className={`px-4 py-2 rounded-full text-sm font-medium ${isCancelled ? "bg-red-100 text-red-700" : isCompleted ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"}`}>{isCancelled ? "❌ Đã huỷ" : isCompleted ? "✅ Hoàn tất" : `Bước ${currentStep}/3`}</span>}
        </div>

        {/* Feedback */}
        {feedback && <div className={`mb-6 p-4 rounded-xl ${feedback.type === "success" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"}`}>{feedback.text}</div>}

        {/* Step Indicator */}
        <StepIndicator currentStep={currentStep} isCancelled={isCancelled} userRole={userRole} />

        {/* Product Info */}
        <ProductInfoCard product={product} finalPrice={order?.final_price} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Steps */}
          <div className="lg:col-span-2 space-y-6">
            {/* ========== BIDDER VIEW ========== */}
            {isBuyer && !isCancelled && (
              <>
                {/* Bước 1: Thanh toán */}
                {currentStep === 1 && <Step1BuyerForm order={order} onSubmit={handleStep1} loading={actionLoading} />}

                {/* Bước 2: Nhận hàng */}
                {currentStep === 2 && (
                  <>
                    {/* Đã thanh toán - hiện thông tin */}
                    <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6">
                      <h3 className="font-bold text-emerald-800">✅ Đã gửi thông tin thanh toán</h3>
                      <p className="text-emerald-700 text-sm mt-2">Địa chỉ: {order?.shipping_address}</p>
                      {order?.payment_proof_url && (
                        <a href={order.payment_proof_url} target="_blank" rel="noreferrer" className="text-blue-600 text-sm underline mt-2 inline-block">
                          Xem hoá đơn thanh toán
                        </a>
                      )}
                    </div>

                    {/* Chờ giao hàng hoặc xác nhận nhận hàng */}
                    {!order?.shipped_at ? (
                      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
                        <h3 className="font-bold text-amber-800">⏳ Đang chờ người bán giao hàng</h3>
                        <p className="text-amber-700 text-sm mt-2">Vui lòng chờ người bán xác nhận thanh toán và gửi hàng cho bạn.</p>
                      </div>
                    ) : (
                      <Step3BuyerConfirm order={order} onConfirm={handleStep3} loading={actionLoading} />
                    )}
                  </>
                )}

                {/* Bước 3: Đánh giá */}
                {currentStep === 3 && (
                  <>
                    <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6">
                      <h3 className="font-bold text-emerald-800">✅ Đã nhận hàng thành công</h3>
                      <p className="text-emerald-700 text-sm mt-2">Cảm ơn bạn đã xác nhận nhận hàng. Hãy đánh giá người bán!</p>
                    </div>
                    <RatingForm existingRating={myRating} userRole={userRole} onSubmit={handleRating} loading={actionLoading} />
                  </>
                )}
              </>
            )}

            {/* ========== SELLER VIEW ========== */}
            {isSeller && !isCancelled && (
              <>
                {/* Bước 1: Xác nhận */}
                {currentStep === 1 && (
                  <>
                    {!order?.payment_proof_url ? (
                      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
                        <h3 className="font-bold text-amber-800">⏳ Đang chờ người mua thanh toán</h3>
                        <p className="text-amber-700 text-sm mt-2">Vui lòng chờ người mua gửi hoá đơn thanh toán và địa chỉ giao hàng.</p>
                      </div>
                    ) : (
                      <div className="bg-white rounded-2xl shadow-sm p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Xác nhận thanh toán từ người mua</h3>
                        <div className="space-y-3 mb-4">
                          <p className="text-sm">
                            <span className="text-gray-500">Địa chỉ giao hàng:</span> <span className="font-medium">{order?.shipping_address}</span>
                          </p>
                          {order?.payment_proof_url && (
                            <div>
                              <p className="text-sm text-gray-500 mb-2">Hoá đơn thanh toán:</p>
                              <img src={order.payment_proof_url} alt="Payment proof" className="max-h-48 object-contain rounded-lg border" />
                            </div>
                          )}
                        </div>
                        <button onClick={() => handleStep2({ confirm_payment: true })} disabled={actionLoading} className="w-full bg-emerald-600 text-white font-bold py-3 rounded-xl hover:bg-emerald-700 disabled:opacity-50">
                          {actionLoading ? "Đang xử lý..." : "✓ Xác nhận đã nhận thanh toán"}
                        </button>
                      </div>
                    )}
                  </>
                )}

                {/* Bước 2: Gửi hàng */}
                {currentStep === 2 && <Step2SellerForm order={order} onSubmit={handleStep2} loading={actionLoading} />}

                {/* Bước 3: Đánh giá */}
                {currentStep === 3 && (
                  <>
                    {!order?.buyer_confirmed_at ? (
                      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
                        <h3 className="font-bold text-amber-800">⏳ Đang chờ người mua xác nhận nhận hàng</h3>
                        <p className="text-amber-700 text-sm mt-2">Hàng đã được gửi đi. Vui lòng chờ người mua xác nhận.</p>
                      </div>
                    ) : (
                      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6">
                        <h3 className="font-bold text-emerald-800">✅ Người mua đã nhận hàng</h3>
                        <p className="text-emerald-700 text-sm mt-2">Giao dịch thành công! Hãy đánh giá người mua.</p>
                      </div>
                    )}
                    <RatingForm existingRating={myRating} userRole={userRole} onSubmit={handleRating} loading={actionLoading} />
                  </>
                )}
              </>
            )}

            {/* Đánh giá từ đối tác (hiển thị cho cả 2) */}
            {currentStep === 3 && !isCancelled && (
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h3 className="font-bold text-gray-900 mb-3">Đánh giá từ {isSeller ? "người mua" : "người bán"}</h3>
                {(isSeller ? ratings?.buyerRating : ratings?.sellerRating) ? (
                  <div className="flex items-center gap-3">
                    <span className={`text-3xl ${(isSeller ? ratings?.buyerRating : ratings?.sellerRating)?.rating === "positive" ? "text-emerald-500" : "text-red-500"}`}>{(isSeller ? ratings?.buyerRating : ratings?.sellerRating)?.rating === "positive" ? "👍" : "👎"}</span>
                    <div>
                      <p className="font-medium">{(isSeller ? ratings?.buyerRating : ratings?.sellerRating)?.rating === "positive" ? "Tích cực" : "Tiêu cực"}</p>
                      {(isSeller ? ratings?.buyerRating : ratings?.sellerRating)?.comment && <p className="text-sm text-gray-600">"{(isSeller ? ratings?.buyerRating : ratings?.sellerRating)?.comment}"</p>}
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">Chưa có đánh giá</p>
                )}
              </div>
            )}

            {/* Cancel Button - Seller only, chỉ khi buyer chưa thanh toán */}
            {isSeller && !isCancelled && !isCompleted && !order?.payment_proof_url && <CancelOrderButton onCancel={handleCancel} loading={actionLoading} />}
          </div>

          {/* Right Column - User Info & Chat */}
          <div className="space-y-6">
            <UserInfoCard title="Người bán" user={seller} isCurrentUser={isSeller} />
            <UserInfoCard title="Người mua" user={buyer} isCurrentUser={isBuyer} />

            {/* Chat */}
            {!isCancelled && <ChatBox productId={productId} currentUserId={user?.id} />}
          </div>
        </div>
      </div>
    </div>
  );
}
