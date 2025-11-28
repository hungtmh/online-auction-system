import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import guestAPI from "../../services/guestAPI";
import bidderAPI from "../../services/bidderAPI";
import CategoryMenu from "./CategoryMenu";
import FeaturedProducts from "./FeaturedProducts";
import SearchBar from "./SearchBar";
import ProductCard from "./ProductCard";
import SellerMarketplaceNavbar from "../common/SellerMarketplaceNavbar";
import BidderMarketplaceNavbar from "../common/BidderMarketplaceNavbar";
import heroImg from "../../assets/image/hero-auction.png";

function GuestHomePageContent({ user }) {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [endingSoon, setEndingSoon] = useState([]);
  const [mostBids, setMostBids] = useState([]);
  const [highestPrice, setHighestPrice] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [watchlistIds, setWatchlistIds] = useState(new Set());

  useEffect(() => {
    loadInitial();
  }, []);

  // Load watchlist for bidder
  useEffect(() => {
    const loadWatchlist = async () => {
      if (!user || user.role !== 'bidder') return;
      try {
        const res = await bidderAPI.getWatchlist();
        const ids = (res?.data || []).map(item => item.product_id || item.products?.id);
        setWatchlistIds(new Set(ids));
      } catch (err) {
        console.error('Load watchlist error:', err);
      }
    };
    loadWatchlist();
  }, [user]);

  async function loadInitial() {
    setLoading(true);
    setError(null);
    try {
      const [prodRes, catRes, featuredRes] = await Promise.all([
        guestAPI.getProducts({ page: 1, limit: 8, status: "active" }),
        guestAPI.getCategories(),
        guestAPI.getFeaturedProducts(), // Gọi 1 lần duy nhất
      ]);

      setProducts(Array.isArray(prodRes?.data) ? prodRes.data : []);
      setCategories(Array.isArray(catRes?.data) ? catRes.data : []);
      
      // Featured API trả về object { ending_soon: [], most_bids: [], highest_price: [] }
      const featuredData = featuredRes?.data || {};
      setEndingSoon(Array.isArray(featuredData.ending_soon) ? featuredData.ending_soon : []);
      setMostBids(Array.isArray(featuredData.most_bids) ? featuredData.most_bids : []);
      setHighestPrice(Array.isArray(featuredData.highest_price) ? featuredData.highest_price : []);
    } catch (err) {
      console.error("Load data error:", err);
      setError("Không thể tải dữ liệu. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      {/* Top Header - Conditional based on user role */}
      {user?.role === 'seller' ? (
        <SellerMarketplaceNavbar user={user} />
      ) : user ? (
        <BidderMarketplaceNavbar user={user} />
      ) : (
        <header className="bg-white shadow-sm sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* Logo */}
              <div className="flex items-center gap-2">
                <button onClick={() => navigate("/")} className="flex items-center gap-2 group">
                  <svg className="w-8 h-8 text-blue-600 group-hover:text-blue-700 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-xl font-bold text-gray-900">AuctionHub</span>
                </button>
              </div>

              {/* Search Bar */}
              <div className="flex-1 max-w-2xl px-8 hidden md:block">
                <SearchBar />
              </div>

              {/* Auth Buttons */}
              <div className="flex items-center gap-3">
                <button onClick={() => navigate("/login")} className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 transition">
                  Đăng nhập
                </button>
                <button onClick={() => navigate("/register")} className="px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg shadow-sm hover:bg-blue-700 transition">
                  Đăng ký
                </button>
              </div>
            </div>
          </div>
        </header>
      )}

      {/* Category Menu 2 cấp */}
      <CategoryMenu categories={categories} />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-5xl font-extrabold leading-tight mb-4">
              Khám phá hàng ngàn <span className="text-yellow-300">sản phẩm đấu giá</span>
            </h1>
            <p className="text-lg text-blue-100 mb-8">Tham gia đấu giá, theo dõi sản phẩm yêu thích và chiến thắng những món đồ giá trị nhất.</p>
            <div className="flex gap-4">
              <button onClick={() => navigate("/auctions")} className="px-8 py-3 bg-yellow-400 text-blue-900 font-bold rounded-lg shadow-lg hover:bg-yellow-300 transition-all duration-300">
                Xem sản phẩm
              </button>
            </div>
          </div>
          <div className="flex justify-center">
            <img src={heroImg} alt="Auction Illustration" className="w-full max-w-md rounded-2xl shadow-2xl" />
          </div>
        </div>
      </section>

      {/* Top 5 Featured Sections */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          {/* Top 5 Sắp kết thúc */}
          <div>
            <div className="mb-6">
              <h2 className="text-3xl font-bold text-gray-900">⏰ Top 5 Sắp kết thúc</h2>
            </div>
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="animate-pulse bg-gray-100 rounded-lg h-80" />
                ))}
              </div>
            ) : (
              <>
                {/* 3 sản phẩm đầu */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                  {endingSoon.slice(0, 3).map((p) => (
                    <ProductCard key={p.id} product={p} user={user} isInWatchlist={watchlistIds.has(p.id)} />
                  ))}
                </div>
                {/* 2 sản phẩm cuối căn giữa */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                  {endingSoon.slice(3, 5).map((p) => (
                    <ProductCard key={p.id} product={p} user={user} isInWatchlist={watchlistIds.has(p.id)} />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Top 5 Nhiều lượt ra giá */}
          <div>
            <div className="mb-6">
              <h2 className="text-3xl font-bold text-gray-900">🔥 Top 5 Nhiều lượt ra giá</h2>
            </div>
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="animate-pulse bg-gray-100 rounded-lg h-80" />
                ))}
              </div>
            ) : (
              <>
                {/* 3 sản phẩm đầu */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                  {mostBids.slice(0, 3).map((p) => (
                    <ProductCard key={p.id} product={p} user={user} isInWatchlist={watchlistIds.has(p.id)} />
                  ))}
                </div>
                {/* 2 sản phẩm cuối căn giữa */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                  {mostBids.slice(3, 5).map((p) => (
                    <ProductCard key={p.id} product={p} user={user} isInWatchlist={watchlistIds.has(p.id)} />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Top 5 Giá cao nhất */}
          <div>
            <div className="mb-6">
              <h2 className="text-3xl font-bold text-gray-900">💎 Top 5 Giá cao nhất</h2>
            </div>
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="animate-pulse bg-gray-100 rounded-lg h-80" />
                ))}
              </div>
            ) : (
              <>
                {/* 3 sản phẩm đầu */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                  {highestPrice.slice(0, 3).map((p) => (
                    <ProductCard key={p.id} product={p} user={user} isInWatchlist={watchlistIds.has(p.id)} />
                  ))}
                </div>
                {/* 2 sản phẩm cuối căn giữa */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                  {highestPrice.slice(3, 5).map((p) => (
                    <ProductCard key={p.id} product={p} user={user} isInWatchlist={watchlistIds.has(p.id)} />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="text-white font-bold text-lg mb-4">AuctionHub</h4>
              <p className="text-sm text-gray-400">Nền tảng đấu giá trực tuyến hàng đầu Việt Nam.</p>
            </div>
            <div>
              <h5 className="text-white font-semibold mb-4">Về chúng tôi</h5>
              <ul className="space-y-2 text-sm">
                <li>
                  <a className="hover:text-white transition" href="#">
                    Giới thiệu
                  </a>
                </li>
                <li>
                  <a className="hover:text-white transition" href="#">
                    Liên hệ
                  </a>
                </li>
                <li>
                  <a className="hover:text-white transition" href="#">
                    Tin tức
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h5 className="text-white font-semibold mb-4">Hỗ trợ</h5>
              <ul className="space-y-2 text-sm">
                <li>
                  <a className="hover:text-white transition" href="#">
                    Trung tâm trợ giúp
                  </a>
                </li>
                <li>
                  <a className="hover:text-white transition" href="#">
                    Điều khoản sử dụng
                  </a>
                </li>
                <li>
                  <a className="hover:text-white transition" href="#">
                    Chính sách bảo mật
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h5 className="text-white font-semibold mb-4">Theo dõi chúng tôi</h5>
              <div className="flex gap-4 text-2xl">
                <a href="#" className="hover:text-blue-400 transition">
                  📘
                </a>
                <a href="#" className="hover:text-pink-400 transition">
                  📷
                </a>
                <a href="#" className="hover:text-blue-300 transition">
                  🐦
                </a>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-sm">
            <p>&copy; 2025 AuctionHub by TayDuKy Team. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default GuestHomePageContent;
