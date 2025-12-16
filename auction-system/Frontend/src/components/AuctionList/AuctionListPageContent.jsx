import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import guestAPI from "../../services/guestAPI";
import bidderAPI from "../../services/bidderAPI";
import ProductCard from "../GuestHomePage/ProductCard";
import CategoryMenu from "../GuestHomePage/CategoryMenu";
import SearchBar from "../GuestHomePage/SearchBar";

function AuctionListPageContent({ user }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [watchlistIds, setWatchlistIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // params
  const q = searchParams.get("q") || "";
  const category = searchParams.get("category") || "";
  const sort = searchParams.get("sort") || "";
  const page = parseInt(searchParams.get("page")) || 1;
  const limit = parseInt(searchParams.get("limit")) || 12;

  const priceMin = searchParams.get("price_min") || "";
  const priceMax = searchParams.get("price_max") || "";
  const timeRemaining = searchParams.get("time_remaining") || "";

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    if (user?.role === "bidder" || user?.role === "seller") {
      fetchWatchlist();
    }
  }, [searchParams, user]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = {
        q,
        category,
        sort,
        page,
        limit,
        price_min: priceMin,
        price_max: priceMax,
        time_remaining: timeRemaining,
      };

      const cleanParams = Object.fromEntries(Object.entries(params).filter(([_, v]) => v != null && v !== ""));

      console.log("Sending params:", cleanParams);

      const response = await guestAPI.searchProducts(cleanParams);
      //console.log("Fetched products:", response);
      setProducts(response.data || []);
      setTotal(response.meta?.total || 0);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await guestAPI.getCategories();
      setCategories(response.data || []);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchWatchlist = async () => {
    try {
      const response = await bidderAPI.getWatchlist();
      const ids = new Set((response.data || []).map((item) => item.product_id));
      setWatchlistIds(ids);
    } catch (error) {
      console.error("Error fetching watchlist:", error);
    }
  };

  const updateParams = (newParams) => {
    const current = Object.fromEntries(searchParams);
    setSearchParams({ ...current, ...newParams, page: 1 });
  };

  const totalPages = Math.ceil(total / limit);
  //console.log("Rendered with products:", products);
  return (
    <div className="min-h-screen bg-gray-50">
      <CategoryMenu categories={categories} />

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
              <select value={sort} onChange={(e) => updateParams({ sort: e.target.value })} className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
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
              <select value={limit} onChange={(e) => updateParams({ limit: e.target.value })} className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="12">12 sản phẩm</option>
                <option value="24">24 sản phẩm</option>
                <option value="48">48 sản phẩm</option>
              </select>
            </div>

            {/* TOGGLE ADVANCED FILTERS */}
            <button onClick={() => setShowAdvancedFilters(!showAdvancedFilters)} className="ml-auto px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
              {showAdvancedFilters ? "Ẩn bộ lọc" : "Lọc nâng cao"}
            </button>

            {/* Clear Filters */}
            {(q || category || sort !== "" || priceMin || priceMax || timeRemaining) && (
              <button onClick={() => setSearchParams({})} className="px-4 py-2 text-sm text-red-600 border border-red-600 rounded-lg hover:bg-red-50 transition">
                Xóa bộ lọc
              </button>
            )}
          </div>

          {/* ADVANCED FILTERS PANEL */}
          {showAdvancedFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Price Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Khoảng giá (VNĐ)</label>
                <div className="flex items-center gap-2">
                  <input type="number" placeholder="Từ" value={priceMin} onChange={(e) => updateParams({ price_min: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <span className="text-gray-500">-</span>
                  <input type="number" placeholder="Đến" value={priceMax} onChange={(e) => updateParams({ price_max: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>

              {/* Time Remaining */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Thời gian còn lại</label>
                <select value={timeRemaining} onChange={(e) => updateParams({ time_remaining: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Tất cả</option>
                  <option value="1">Dưới 1 giờ</option>
                  <option value="6">Dưới 6 giờ</option>
                  <option value="24">Dưới 24 giờ</option>
                  <option value="72">Dưới 3 ngày</option>
                  <option value="168">Dưới 7 ngày</option>
                </select>
              </div>

              {/* Category Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Danh mục</label>
                <select value={category} onChange={(e) => updateParams({ category: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Tất cả danh mục</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="animate-pulse bg-gray-100 rounded-lg h-96" />
            ))}
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} user={user} isInWatchlist={watchlistIds.has(product.id)} onWatchlistChange={fetchWatchlist} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">Không tìm thấy sản phẩm</h3>
            <p className="text-gray-500 mb-6">Thử điều chỉnh bộ lọc hoặc tìm kiếm khác</p>
            <button onClick={() => setSearchParams({})} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Xem tất cả sản phẩm
            </button>
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="mt-10 flex items-center justify-center gap-2">
            <button onClick={() => setSearchParams({ ...Object.fromEntries(searchParams), page: Math.max(1, page - 1) })} disabled={page <= 1} className="px-4 py-2 bg-white border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition">
              ← Trước
            </button>

            {/* Page Numbers */}
            <div className="flex gap-1">
              {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (page <= 3) {
                  pageNum = i + 1;
                } else if (page >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = page - 2 + i;
                }

                return (
                  <button key={pageNum} onClick={() => setSearchParams({ ...Object.fromEntries(searchParams), page: pageNum })} className={`px-4 py-2 rounded-lg transition ${page === pageNum ? "bg-blue-600 text-white" : "bg-white border border-gray-300 hover:bg-gray-50"}`}>
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button onClick={() => setSearchParams({ ...Object.fromEntries(searchParams), page: Math.min(totalPages, page + 1) })} disabled={page >= totalPages} className="px-4 py-2 bg-white border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition">
              Sau →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default AuctionListPageContent;
