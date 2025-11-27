import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { authAPI, clearAccessToken } from "../../services/api";

function SellerMarketplaceNavbar({ user }) {
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

  const handleMenuSelect = (action) => {
    navigate(`/seller/${action}`);
    setMenuOpen(false);
  };

  const handleLogout = async () => {
    try {
      await authAPI.logout();
      clearAccessToken();
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const menuItems = [
    { label: '👤 Hồ sơ cá nhân', action: 'profile' },
    { label: '📦 Sản phẩm của tôi', action: 'my-products' },
    { label: '➕ Đăng sản phẩm', action: 'add-product' },
    { label: '💰 Doanh thu', action: 'sales' }
  ];

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
              placeholder="Tìm kiếm sản phẩm..."
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.target.value.trim()) {
                  navigate(`/auctions?q=${encodeURIComponent(e.target.value.trim())}`);
                }
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>

          {/* User Menu */}
          <div className="flex items-center gap-4">
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((prev) => !prev)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
              >
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold overflow-hidden">
                  {user?.avatar_url ? (
                    <img src={user.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    user?.full_name?.charAt(0)?.toUpperCase() || 'S'
                  )}
                </div>
                <div className="hidden sm:block text-left">
                  <div className="text-sm font-medium text-gray-800">{user?.full_name || user?.email}</div>
                  <div className="text-xs text-gray-500 capitalize">Seller</div>
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
                  {menuItems.map((item) => (
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
            
            <button
              type="button"
              onClick={handleLogout}
              className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition"
            >
              Đăng xuất
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

export default SellerMarketplaceNavbar;
