import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { authAPI, clearAccessToken } from "../../services/api";

/**
 * UnifiedNavbar - Navbar thống nhất cho tất cả role (guest, bidder, seller)
 * 
 * Props:
 * - user: Object chứa thông tin user (role, full_name, email, avatar_url)
 *   - Nếu null/undefined: Hiển thị Đăng nhập/Đăng ký
 *   - Nếu có user: Hiển thị menu dropdown theo role
 */
function UnifiedNavbar({ user }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await authAPI.logout();
      clearAccessToken();
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleMenuSelect = (action) => {
    // Các action của bidder (seller kế thừa bidder)
    const bidderActions = ['profile', 'watchlist', 'my-bids', 'password'];
    
    // Nếu là action của bidder, luôn navigate đến /bidder
    // Nếu là action riêng của seller, navigate đến /seller
    if (bidderActions.includes(action)) {
      navigate(`/bidder/${action}`);
    } else {
      // Các action riêng của seller: my-products, add-product, sales
      navigate(`/seller/${action}`);
    }
    
    setMenuOpen(false);
  };

  // Menu items dựa trên role
  const getMenuItems = () => {
    // Base items cho cả bidder và seller
    const baseItems = [
      { label: '👤 Hồ sơ cá nhân', action: 'profile' },
      { label: '🔐 Đổi mật khẩu', action: 'password' },
      { label: '⭐ Danh mục yêu thích', action: 'watchlist' },
      { label: '📜 Lịch sử đấu giá', action: 'my-bids' }
    ];

    // Seller có thêm các menu riêng
    if (user?.role === 'seller') {
      return [
        ...baseItems,
        { label: '📦 Sản phẩm của tôi', action: 'my-products' },
        { label: '➕ Đăng sản phẩm', action: 'add-product' }
      ];
    }

    // Bidder chỉ có base items
    return baseItems;
  };

  const userInitial = user?.full_name?.charAt(0)?.toUpperCase() || 
                      user?.email?.charAt(0)?.toUpperCase() || 
                      (user?.role === 'seller' ? 'S' : 'B');

  return (
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

          {/* Search Bar - Hidden on mobile */}
          <div className="flex-1 max-w-2xl px-8 hidden md:block">
            <input
              type="text"
              placeholder="Tìm kiếm sản phẩm đấu giá..."
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.target.value.trim()) {
                  navigate(`/auctions?q=${encodeURIComponent(e.target.value.trim())}`);
                }
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>

          {/* Right Side - Conditional rendering based on user state */}
          <div className="flex items-center gap-4">
            {user ? (
              <>
                {/* User Avatar Menu with Name & Role */}
                <div className="relative" ref={menuRef}>
                  <button
                    type="button"
                    onClick={() => setMenuOpen((prev) => !prev)}
                    className="flex items-center gap-3 px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                  >
                    {user.avatar_url ? (
                      <img
                        src={user.avatar_url}
                        alt={user.full_name || 'Avatar'}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                        {userInitial}
                      </div>
                    )}
                    <div className="text-left hidden sm:block">
                      <div className="text-sm font-semibold text-gray-900">
                        {user.full_name || user.email}
                      </div>
                      <div className="text-xs text-gray-500 capitalize">
                        {user.role === 'seller' ? 'Seller' : 'Bidder'}
                      </div>
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
                  
                  {menuOpen && (
                    <div className="absolute right-0 z-10 mt-2 w-56 rounded-xl border border-gray-200 bg-white text-sm text-slate-700 shadow-lg">
                      {getMenuItems().map((item) => (
                        <button
                          key={item.action}
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
                
                {/* Logout Button */}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                >
                  Đăng xuất
                </button>
              </>
            ) : (
              <>
                {/* Guest: Login & Register Buttons */}
                <button 
                  onClick={() => navigate("/login")} 
                  className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 transition"
                >
                  Đăng nhập
                </button>
                <button 
                  onClick={() => navigate("/register")} 
                  className="px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg shadow-sm hover:bg-blue-700 transition"
                >
                  Đăng ký
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export default UnifiedNavbar;
