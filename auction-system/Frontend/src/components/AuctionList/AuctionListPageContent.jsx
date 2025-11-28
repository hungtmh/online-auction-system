import { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import guestAPI from "../../services/guestAPI";
import ProductCard from "../GuestHomePage/ProductCard";
import CategoryMenu from "../GuestHomePage/CategoryMenu";
import SearchBar from "../GuestHomePage/SearchBar";

function AuctionListPageContent({ user }) {
  const [auctions, setAuctions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const menuRef = useRef(null);

  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "12", 10);
  const q = searchParams.get("q") || "";
  const category = searchParams.get("category") || "";
  const sort = searchParams.get("sort") || "";

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    loadAuctions();
  }, [page, limit, q, category, sort]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function loadCategories() {
    try {
      const res = await guestAPI.getCategories();
      setCategories(res?.data || []);
    } catch (err) {
      console.error("Error loading categories:", err);
    }
  }

  async function loadAuctions() {
    setLoading(true);
    try {
      const params = { page, limit };
      if (category) params.category = category;
      if (sort) params.sort = sort;
      if (q) params.q = q;
      if (!q && !category && !sort) params.status = "active";

      console.log("🔍 Loading auctions with params:", params);

      let res;
      if (q) {
        res = await guestAPI.searchProducts(q, params);
      } else {
        res = await guestAPI.getProducts(params);
      }

      console.log("📦 Auctions response:", res);
      
      setAuctions(res?.data || []);
      setTotal(res?.meta?.total || 0);
    } catch (err) {
      console.error("❌ Error loading auctions:", err);
      console.error("📊 Response data:", err.response?.data);
      console.error("📊 Response status:", err.response?.status);
      console.error("📊 Request params:", params);
    } finally {
      setLoading(false);
    }
  }

  const updateParams = (newParams) => {
    const current = Object.fromEntries(searchParams);
    setSearchParams({ ...current, ...newParams, page: 1 });
  };

  const handleMenuSelect = (action) => {
    if (user?.role === 'seller') {
      navigate(`/seller/${action}`);
    } else if (user?.role === 'bidder') {
      navigate('/dashboard');
    }
    setMenuOpen(false);
  };

  const getMenuItems = () => {
    if (user?.role === 'seller') {
      return [
        { label: '👤 Hồ sơ cá nhân', action: 'profile' },
        { label: '📦 Sản phẩm của tôi', action: 'my-products' },
        { label: '➕ Đăng sản phẩm', action: 'add-product' },
        { label: '💰 Doanh thu', action: 'sales' }
      ];
    }
    return [];
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button onClick={() => navigate("/")} className="flex items-center gap-2">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-xl font-bold text-gray-900">AuctionHub</span>
            </button>
            
            {/* Search Bar */}
            <div className="flex-1 max-w-2xl px-8 hidden md:block">
              <SearchBar initial={q} />
            </div>

            <div className="flex items-center gap-4">
              {user ? (
                <>
                  <div className="relative" ref={menuRef}>
                    <button
                      type="button"
                      onClick={() => setMenuOpen((prev) => !prev)}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                    >
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold overflow-hidden">
                        {user.avatar_url ? (
                          <img src={user.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          user.full_name?.charAt(0)?.toUpperCase() || 'U'
                        )}
                      </div>
                      <div className="hidden sm:block text-left">
                        <div className="text-sm font-medium text-gray-800">{user.full_name || user.email}</div>
                        <div className="text-xs text-gray-500 capitalize">{user.role === 'seller' ? 'Seller' : 'Bidder'}</div>
                      </div>
                      <svg 
                        className={`w-4 h-4 text-gray-600 transition-transform ${menuOpen ? 'rotate-180' : ''}`}
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    
                    {menuOpen && user.role === 'seller' && (
                      <div className="absolute right-0 z-10 mt-2 w-56 rounded-xl border border-gray-200 bg-white text-sm text-slate-700 shadow-lg">
                        {getMenuItems().map((item) => (
                          <button
                            key={item.label}
                            type="button"
                            onClick={() => handleMenuSelect(item.action)}
                            className="block w-full px-4 py-2 text-left hover:bg-blue-50 first:rounded-t-xl last:rounded-b-xl transition"
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {user.role === 'bidder' && (
                    <button
                      onClick={() => navigate('/dashboard')}
                      className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition"
                    >
                      Quay về bảng điều khiển
                    </button>
                  )}
                </>
              ) : (
                <>
                  <button onClick={() => navigate("/login")} className="px-4 py-2 text-sm font-medium text-blue-600">
                    Đăng nhập
                  </button>
                  <button onClick={() => navigate("/register")} className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg">
                    Đăng ký
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Category Menu */}
      <CategoryMenu categories={categories} />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Danh sách sản phẩm đấu giá</h1>
          {q && (
            <p className="text-gray-600">
              Kết quả tìm kiếm cho: <span className="font-semibold text-blue-600">"{q}"</span>
            </p>
          )}
          <p className="text-sm text-gray-500 mt-1">Tìm thấy {total} sản phẩm</p>
        </div>

        {/* Filter & Sort Controls */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            {/* Sort Options */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Sắp xếp:</label>
              <select
                value={sort}
                onChange={(e) => updateParams({ sort: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Mặc định</option>
                <option value="ending_soon">Thời gian kết thúc (giảm dần)</option>
                <option value="price_asc">Giá (tăng dần)</option>
                <option value="price_desc">Giá (giảm dần)</option>
                <option value="most_bids">Nhiều lượt đấu nhất</option>
                <option value="newest">Mới đăng nhất</option>
              </select>
            </div>

            {/* Items per page */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Hiển thị:</label>
              <select
                value={limit}
                onChange={(e) => updateParams({ limit: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="12">12 sản phẩm</option>
                <option value="24">24 sản phẩm</option>
                <option value="48">48 sản phẩm</option>
              </select>
            </div>

            {/* Clear Filters */}
            {(q || category || sort !== "") && (
              <button
                onClick={() => setSearchParams({})}
                className="ml-auto px-4 py-2 text-sm text-red-600 border border-red-600 rounded-lg hover:bg-red-50 transition"
              >
                Xóa bộ lọc
              </button>
            )}
          </div>
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array.from({ length: limit }).map((_, i) => (
              <div key={i} className="animate-pulse bg-white rounded-lg h-96 shadow-sm" />
            ))}
          </div>
        ) : auctions.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {auctions.map((auction) => (
              <ProductCard key={auction.id} product={auction} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="text-gray-400 text-8xl mb-4">📦</div>
            <p className="text-gray-600 text-xl font-medium mb-2">Không tìm thấy sản phẩm nào</p>
            <p className="text-gray-500 mb-6">Thử điều chỉnh bộ lọc hoặc tìm kiếm khác</p>
            <button onClick={() => setSearchParams({})} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Xem tất cả sản phẩm
            </button>
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="mt-10 flex items-center justify-center gap-2">
            {/* Previous Button */}
            <button
              onClick={() => setSearchParams({ ...Object.fromEntries(searchParams), page: Math.max(1, page - 1) })}
              disabled={page <= 1}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition"
            >
              ← Trước
            </button>

            {/* Page Numbers */}
            {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 7) {
                pageNum = i + 1;
              } else if (page <= 4) {
                pageNum = i + 1;
              } else if (page >= totalPages - 3) {
                pageNum = totalPages - 6 + i;
              } else {
                pageNum = page - 3 + i;
              }

              return (
                <button
                  key={pageNum}
                  onClick={() => setSearchParams({ ...Object.fromEntries(searchParams), page: pageNum })}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    page === pageNum ? "bg-blue-600 text-white" : "bg-white border border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}

            {/* Next Button */}
            <button
              onClick={() => setSearchParams({ ...Object.fromEntries(searchParams), page: Math.min(totalPages, page + 1) })}
              disabled={page >= totalPages}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition"
            >
              Sau →
            </button>
          </div>
        )}

        {/* Page Info */}
        {!loading && total > 0 && (
          <div className="mt-6 text-center text-sm text-gray-600">
            Trang {page} / {totalPages} - Hiển thị {(page - 1) * limit + 1} đến {Math.min(page * limit, total)} trong tổng số {total} sản phẩm
          </div>
        )}
      </div>
    </div>
  );
}

export default AuctionListPageContent;
