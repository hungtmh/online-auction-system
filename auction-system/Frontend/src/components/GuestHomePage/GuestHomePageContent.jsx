import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import guestAPI from "../../services/guestAPI";

function GuestHomePageContent() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]); // Khởi tạo products là mảng rỗng
  // TODO: Fetch products từ Backend API /api/products

  const [categories, setCategories] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  useEffect(() => {
    loadInitial();
  }, []);


  async function loadInitial() {
    setLoading(true);
    setError(null);

    try {
      const [prodRes, catRes, featRes] = await Promise.all([
        guestAPI.getProducts({ page: 1, limit: 9, status: "active" }),
        guestAPI.getCategories(),
        guestAPI.getFeaturedProducts(),
      ]);

      setProducts(prodRes?.data || []);
      setCategories(catRes?.data || []);
      setFeatured(featRes?.data || []);
    } catch (err) {
      console.error("Load data error:", err);
      setError("Không thể tải dữ liệu. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header / Navbar */}
      <nav className="bg-white shadow-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="ml-2 text-2xl font-bold text-gray-800">AuctionHub</span>
            </div>

            {/* Search bar */}
            <div className="hidden md:flex flex-1 max-w-lg mx-8">
              <div className="w-full relative">
                <input type="text" placeholder="Tìm kiếm sản phẩm..." className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" />
                <button className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Auth buttons */}
            <div className="flex items-center gap-3">
              <button onClick={() => navigate("/login")} className="px-6 py-2 text-blue-600 font-medium hover:text-blue-700 transition">
                Đăng nhập
              </button>
              <button onClick={() => navigate("/register")} className="px-6 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium rounded-lg hover:from-blue-600 hover:to-blue-700 transition shadow-md hover:shadow-lg">
                Đăng ký
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-purple-700 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">Đấu giá trực tuyến</h1>
          <p className="text-xl md:text-2xl mb-8 text-blue-100">Hàng ngàn sản phẩm chất lượng đang chờ bạn khám phá</p>
          <div className="flex justify-center gap-4">
            <button onClick={() => navigate("/register")} className="px-8 py-4 bg-white text-blue-600 font-bold rounded-lg hover:bg-gray-100 transition shadow-xl hover:shadow-2xl transform hover:-translate-y-1">
              Bắt đầu ngay
            </button>
            <button className="px-8 py-4 border-2 border-white text-white font-bold rounded-lg hover:bg-white hover:text-blue-600 transition">Tìm hiểu thêm</button>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-white py-12 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">10K+</div>
              <div className="text-gray-600">Sản phẩm</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">5K+</div>
              <div className="text-gray-600">Người dùng</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">98%</div>
              <div className="text-gray-600">Hài lòng</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">24/7</div>
              <div className="text-gray-600">Hỗ trợ</div>
            </div>
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">Danh mục nổi bật</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {[
              { name: "Điện tử", icon: "📱", color: "blue" },
              { name: "Thời trang", icon: "👗", color: "pink" },
              { name: "Gia dụng", icon: "🏠", color: "green" },
              { name: "Thể thao", icon: "⚽", color: "orange" },
              { name: "Sách", icon: "📚", color: "purple" },
              { name: "Khác", icon: "🎁", color: "gray" },
            ].map((cat) => (
              <button key={cat.name} className={`bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition transform hover:-translate-y-1 text-center group`}>
                <div className="text-4xl mb-3">{cat.icon}</div>
                <div className="font-medium text-gray-700 group-hover:text-blue-600">{cat.name}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Featured Products */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-gray-800">Đấu giá hot</h2>
            <button className="text-blue-600 hover:text-blue-700 font-medium">Xem tất cả →</button>
          </div>

          {products.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {products.map((product) => (
                <div key={product.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-xl transition group">
                  <div className="aspect-w-16 aspect-h-9 bg-gray-200 overflow-hidden">
                    <img src={product.image_url || "https://via.placeholder.com/400x300?text=Product"} alt={product.title} className="w-full h-48 object-cover group-hover:scale-110 transition duration-300" />
                  </div>
                  <div className="p-5">
                    <h3 className="font-bold text-lg text-gray-800 mb-2 line-clamp-1">{product.title}</h3>
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">{product.description}</p>
                    <div className="flex justify-between items-center mb-3">
                      <div>
                        <div className="text-xs text-gray-500">Giá hiện tại</div>
                        <div className="text-xl font-bold text-blue-600">{(product.current_price || 0).toLocaleString("vi-VN")} đ</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-gray-500">Lượt đấu</div>
                        <div className="text-lg font-medium text-gray-700">{product.bid_count || 0}</div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => navigate('/login')} className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition font-medium">Đấu giá ngay</button>
                      <button onClick={() => navigate(`/products/${product.id}`)} className="px-4 py-2 border rounded-lg">Xem</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-xl transition">
                  <div className="bg-gradient-to-br from-gray-100 to-gray-200 h-48 flex items-center justify-center">
                    <span className="text-gray-400 text-6xl">🎁</span>
                  </div>
                  <div className="p-5">
                    <div className="h-4 bg-gray-200 rounded mb-3 w-3/4"></div>
                    <div className="h-3 bg-gray-100 rounded mb-2"></div>
                    <div className="h-3 bg-gray-100 rounded mb-4 w-2/3"></div>
                    <div className="flex justify-between mb-3">
                      <div>
                        <div className="h-3 bg-gray-100 rounded w-16 mb-1"></div>
                        <div className="h-6 bg-blue-100 rounded w-24"></div>
                      </div>
                      <div>
                        <div className="h-3 bg-gray-100 rounded w-12 mb-1"></div>
                        <div className="h-5 bg-gray-200 rounded w-8"></div>
                      </div>
                    </div>
                    <button onClick={() => navigate("/login")} className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition">
                      Đăng nhập để đấu giá
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white py-20">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-4xl font-bold mb-6">Sẵn sàng bắt đầu?</h2>
          <p className="text-xl mb-8 text-blue-100">Tham gia ngay hôm nay để trải nghiệm đấu giá trực tuyến tuyệt vời nhất!</p>
          <button onClick={() => navigate("/register")} className="px-10 py-4 bg-white text-blue-600 font-bold text-lg rounded-lg hover:bg-gray-100 transition shadow-xl hover:shadow-2xl transform hover:-translate-y-1">
            Đăng ký miễn phí
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-800 text-gray-300 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-white font-bold text-lg mb-4">AuctionHub</h3>
              <p className="text-sm">Nền tảng đấu giá trực tuyến hàng đầu Việt Nam</p>
            </div>
            <div>
              <h4 className="text-white font-medium mb-4">Về chúng tôi</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="hover:text-white">
                    Giới thiệu
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Liên hệ
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Tuyển dụng
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-medium mb-4">Hỗ trợ</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="hover:text-white">
                    Trung tâm trợ giúp
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Điều khoản
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Bảo mật
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-medium mb-4">Theo dõi</h4>
              <div className="flex gap-4">
                <a href="#" className="hover:text-white">
                  📘
                </a>
                <a href="#" className="hover:text-white">
                  📷
                </a>
                <a href="#" className="hover:text-white">
                  🐦
                </a>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-sm">
            <p>&copy; 2025 AuctionHub. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default GuestHomePageContent;
