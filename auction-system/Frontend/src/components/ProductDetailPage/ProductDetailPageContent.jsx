import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import guestAPI from "../../services/guestAPI";

// Helper functions
function formatCurrency(v) {
  try {
    return v.toLocaleString("vi-VN") + " đ";
  } catch (e) {
    return (v || 0) + " đ";
  }
}

function timeLeftLabel(endAt) {
  if (!endAt) return "";
  const end = new Date(endAt);
  const now = new Date();
  const diff = end - now;
  if (diff <= 0) return "Đã kết thúc";
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  // Nếu ít hơn 3 ngày, hiển thị theo định dạng tương đối
  if (days < 3) {
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `${days} ngày ${hours} giờ nữa`;
    if (hours > 0) return `${hours} giờ ${minutes} phút nữa`;
    return `${minutes} phút nữa`;
  }
  
  return `${days} ngày nữa`;
}

function formatDateTime(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleString("vi-VN");
}

export default function ProductDetailPageContent() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [selectedImage, setSelectedImage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;
    loadProduct();
  }, [id]);

  async function loadProduct() {
    setLoading(true);
    setError(null);
    try {
      const res = await guestAPI.getProductById(id);
      const productData = res?.data || res;
      setProduct(productData);

      // Load related products (cùng chuyên mục)
      if (productData?.category_id) {
        const relatedRes = await guestAPI.getProducts({
          category: productData.category_id,
          limit: 5,
        });
        setRelatedProducts(relatedRes?.data?.filter((p) => p.id !== id) || []);
      }
    } catch (err) {
      console.error("Load product error", err);
      setError("Không thể tải sản phẩm");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải chi tiết sản phẩm...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <p className="text-red-600 text-xl">{error}</p>
          <button onClick={() => navigate("/")} className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg">
            Về trang chủ
          </button>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-6xl mb-4">📦</div>
          <p className="text-gray-600 text-xl">Sản phẩm không tồn tại</p>
          <button onClick={() => navigate("/")} className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg">
            Về trang chủ
          </button>
        </div>
      </div>
    );
  }

  // Prepare images (ảnh đại diện + ảnh phụ)
  const images = [
    product.image_url || "https://via.placeholder.com/800x600?text=Product",
    ...(product.additional_images || []),
  ];

  // Đảm bảo có ít nhất 3 ảnh
  while (images.length < 3) {
    images.push("https://via.placeholder.com/800x600?text=No+Image");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button onClick={() => navigate("/")} className="flex items-center gap-2 text-gray-700 hover:text-blue-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span className="font-medium">Quay lại</span>
            </button>
            <div className="flex items-center gap-4">
              <button onClick={() => navigate("/login")} className="px-4 py-2 text-sm font-medium text-blue-600">
                Đăng nhập
              </button>
              <button onClick={() => navigate("/register")} className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg">
                Đăng ký
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Images & Description */}
          <div className="lg:col-span-2 space-y-6">
            {/* Main Image */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="aspect-w-16 aspect-h-12">
                <img
                  src={images[selectedImage]}
                  alt={product.title}
                  className="w-full h-[500px] object-cover"
                />
              </div>
              {/* Thumbnail Images */}
              <div className="p-4 flex gap-3 overflow-x-auto">
                {images.slice(0, 5).map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`flex-shrink-0 w-20 h-20 border-2 rounded-lg overflow-hidden ${
                      selectedImage === idx ? "border-blue-600" : "border-gray-200"
                    }`}
                  >
                    <img src={img} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

            {/* Product Description */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Mô tả chi tiết sản phẩm</h2>
              <div className="prose max-w-none text-gray-700">
                <div dangerouslySetInnerHTML={{ __html: product.long_description || product.description || "Không có mô tả" }} />
              </div>
            </div>

            {/* Q&A Section - Lịch sử câu hỏi và câu trả lời */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">💬 Câu hỏi & Trả lời</h2>
              {product.questions && product.questions.length > 0 ? (
                <div className="space-y-4">
                  {product.questions.map((item) => (
                    <div key={item.id} className="border-b pb-4 last:border-0">
                      <div className="flex items-start gap-3 mb-2">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-blue-600 font-semibold text-sm">Q</span>
                        </div>
                        <div className="flex-1">
                          <div className="text-sm text-gray-500 mb-1">
                            {item.profiles?.full_name || "Người dùng"} - {formatDateTime(item.created_at)}
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
          </div>

          {/* Right: Product Info & Actions */}
          <div className="lg:col-span-1 space-y-4">
            {/* Product Title & Category */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-3">{product.title}</h1>
              {product.category_name && (
                <button
                  onClick={() => navigate(`/auctions?category=${product.category_id}`)}
                  className="inline-block text-sm text-blue-600 bg-blue-50 px-3 py-1 rounded-full hover:bg-blue-100 transition"
                >
                  📁 {product.category_name}
                </button>
              )}
            </div>

            {/* Price & Time Info */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="mb-4">
                <div className="text-sm text-gray-500 mb-1">Giá hiện tại</div>
                <div className="text-4xl font-bold text-blue-600">{formatCurrency(product.current_price || 0)}</div>
              </div>

              {product.buy_now_price && (
                <div className="mb-4 pb-4 border-b">
                  <div className="text-sm text-gray-500 mb-1">Giá mua ngay</div>
                  <div className="text-2xl font-bold text-green-600">{formatCurrency(product.buy_now_price)}</div>
                </div>
              )}

              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Thời điểm đăng:</span>
                  <span className="font-medium">{formatDateTime(product.created_at)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Thời điểm kết thúc:</span>
                  <span className="font-medium">{formatDateTime(product.end_time)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Thời gian còn lại:</span>
                  <span className="text-lg font-bold text-orange-600">⏰ {timeLeftLabel(product.end_time)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Số lượt đấu:</span>
                  <span className="font-bold text-blue-600">{product.bid_count || 0} lượt</span>
                </div>
              </div>
            </div>

            {/* Seller & Bidder Info */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">👥 Thông tin</h3>
              <div className="space-y-3">
                <div>
                  <div className="text-sm text-gray-500">Người bán</div>
                  <div className="font-medium text-gray-900">{product.seller_name || "Ẩn danh"}</div>
                  <div className="text-xs flex items-center gap-2">
                    <span className="text-green-600">👍 {product.seller_rating_positive || 0}</span>
                    <span className="text-red-600">👎 {product.seller_rating_negative || 0}</span>
                  </div>
                </div>
                {product.highest_bidder_name && (
                  <div className="pt-3 border-t">
                    <div className="text-sm text-gray-500">Người đặt giá cao nhất</div>
                    <div className="font-medium text-orange-600">{product.highest_bidder_name}</div>
                    <div className="text-xs flex items-center gap-2">
                      <span className="text-green-600">👍 {product.highest_bidder_rating_positive || 0}</span>
                      <span className="text-red-600">👎 {product.highest_bidder_rating_negative || 0}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <button
                onClick={() => navigate("/login")}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold text-lg mb-3 hover:bg-blue-700 transition"
              >
                Đấu giá ngay
              </button>
              {product.buy_now_price && (
                <button
                  onClick={() => navigate("/login")}
                  className="w-full bg-green-600 text-white py-3 rounded-lg font-bold text-lg hover:bg-green-700 transition"
                >
                  Mua ngay
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Related Products - 5 sản phẩm cùng chuyên mục */}
        {relatedProducts.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">📦 Sản phẩm cùng chuyên mục</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
              {relatedProducts.slice(0, 5).map((p) => (
                <div
                  key={p.id}
                  onClick={() => navigate(`/products/${p.id}`)}
                  className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-xl transition"
                >
                  <img src={p.image_url || "https://via.placeholder.com/300x200"} alt={p.title} className="w-full h-40 object-cover" />
                  <div className="p-4">
                    <h3 className="font-semibold text-sm text-gray-900 line-clamp-2 mb-2">{p.title}</h3>
                    <div className="text-lg font-bold text-blue-600">{formatCurrency(p.current_price || 0)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
