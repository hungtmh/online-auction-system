import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import guestAPI from "../../services/guestAPI";
import CategoryList from "./CategoryList";
import FeaturedProducts from "./FeaturedProducts";
import SearchBar from "./SearchBar";
import ProductCard from "./ProductCard";
import heroImg from "../../assets/image/hero-auction.png";

function GuestHomePageContent() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [featured, setFeatured] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadInitial();
  }, []);

  async function loadInitial() {
    setLoading(true);
    setError(null);
    try {
      const [prodRes, catRes, featRes] = await Promise.all([guestAPI.getProducts({ page: 1, limit: 9, status: "active" }), guestAPI.getCategories(), guestAPI.getFeaturedProducts()]);

      setProducts(prodRes?.data || []);
      setCategories(catRes?.data || []);
      setFeatured(featRes?.data || {});

      // Helpful quick debugging logs
      console.log("Products response:", prodRes?.data || []);
      console.log("Featured response:", featRes?.data || {});
      console.log("Sắp kết thúc (ending_soon):", featRes?.data?.ending_soon || []);
      console.log("Nhiều lượt đấu (most_bids):", featRes?.data?.most_bids || []);
      console.log("Giá cao nhất (highest_price):", featRes?.data?.highest_price || []);
    } catch (err) {
      console.error("Load data error:", err);
      setError("Không thể tải dữ liệu. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      {/* Top nav */}
      <header className="bg-white shadow sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button onClick={() => navigate("/")} className="flex items-center gap-2">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-xl font-bold">AuctionHub</span>
              </button>
              <nav className="hidden md:flex items-center space-x-4 text-sm">
                <button className="hover:text-blue-600" onClick={() => navigate("/auctions")}>
                  Auctions
                </button>
                <button className="hover:text-blue-600" onClick={() => navigate("/about")}>
                  About
                </button>
                <button className="hover:text-blue-600" onClick={() => navigate("/help")}>
                  Help
                </button>
              </nav>
            </div>

            <div className="flex-1 px-4 hidden md:block">
              {/* === SỬA LỖI: Đã xóa props value, onChange, onSearch === */}
              <SearchBar />
            </div>

            <div className="flex items-center gap-3">
              <button onClick={() => navigate("/login")} className="px-4 py-2 text-sm text-blue-600 hover:text-blue-700">
                Đăng nhập
              </button>
              <button onClick={() => navigate("/register")} className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md shadow">
                Đăng ký
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white py-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          {/* Left content */}
          <div data-aos="fade-right">
            <h1 className="text-5xl font-extrabold leading-tight mb-6">
              Khám phá hàng ngàn <span className="text-yellow-300">sản phẩm đấu giá</span>
            </h1>
            <p className="text-lg text-blue-100 mb-8">Tham gia đấu giá, theo dõi sản phẩm yêu thích và chiến thắng những món đồ giá trị nhất.</p>
            <div className="flex gap-4">
              <button onClick={() => navigate("/register")} className="px-8 py-3 bg-yellow-400 text-blue-900 font-semibold rounded-lg shadow-lg hover:bg-yellow-300 transition-all duration-300">
                Bắt đầu ngay
              </button>
              <button onClick={() => navigate("/auctions")} className="px-8 py-3 border border-white/40 text-white rounded-lg hover:bg-white/10 transition-all duration-300">
                Xem sản phẩm
              </button>
            </div>
          </div>

          {/* Right image */}
          <div data-aos="fade-left" className="flex justify-center">
            <img src={heroImg} alt="Auction Illustration" className="w-full max-w-md rounded-2xl shadow-2xl" />
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold mb-6">Danh mục nổi bật</h2>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <CategoryList categories={categories} onSelect={(id) => navigate(`/auctions?category=${id}`)} />
          </div>
        </div>
      </section>

      {/* Featured */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <FeaturedProducts title="Sắp kết thúc" products={featured.ending_soon || []} viewAllHref="/auctions?sort=ending_soon" />
          <FeaturedProducts title="Nhiều lượt đấu" products={featured.most_bids || []} viewAllHref="/auctions?sort=most_bids" />
          <FeaturedProducts title="Giá cao nhất" products={featured.highest_price || []} viewAllHref="/auctions?sort=highest_price" />
        </div>
      </section>

      {/* Latest auctions grid */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Sản phẩm mới</h2>
            <button onClick={() => navigate("/auctions")} className="text-sm text-blue-600 hover:underline">
              Xem tất cả
            </button>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="animate-pulse bg-white rounded-lg p-4 h-64 shadow-sm" />
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-12 text-red-600">{error}</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} onClick={() => navigate(`/auctions/${p.id}`)} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-r from-indigo-700 to-purple-700 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h3 className="text-3xl font-bold mb-4">Sẵn sàng tham gia đấu giá?</h3>
          <p className="mb-6 text-blue-100">Tạo tài khoản nhanh chóng và bắt đầu đấu giá cho món đồ bạn yêu thích.</p>
          <div className="flex justify-center gap-4">
            <button onClick={() => navigate("/register")} className="px-8 py-3 bg-white text-indigo-700 rounded-md font-semibold">
              Đăng ký miễn phí
            </button>
            <button onClick={() => navigate("/auctions")} className="px-8 py-3 border border-white/40 rounded-md">
              Khám phá
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h4 className="text-white font-bold mb-2">AuctionHub</h4>
              <p className="text-sm">Nền tảng đấu giá trực tuyến hàng đầu.</p>
            </div>
            <div>
              <h5 className="text-white font-medium mb-2">Về</h5>
              <ul className="space-y-2 text-sm">
                <li>
                  <a className="hover:text-white" href="#">
                    Giới thiệu
                  </a>
                </li>
                <li>
                  <a className="hover:text-white" href="#">
                    Liên hệ
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h5 className="text-white font-medium mb-2">Hỗ trợ</h5>
              <ul className="space-y-2 text-sm">
                <li>
                  <a className="hover:text-white" href="#">
                    Trợ giúp
                  </a>
                </li>
                <li>
                  <a className="hover:text-white" href="#">
                    Điều khoản
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h5 className="text-white font-medium mb-2">Theo dõi</h5>
              <div className="flex gap-3 text-xl">
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
          <div className="border-t border-gray-800 mt-8 pt-6 text-center text-sm">
            <p>&copy; 2025 TayDuKy. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default GuestHomePageContent;
