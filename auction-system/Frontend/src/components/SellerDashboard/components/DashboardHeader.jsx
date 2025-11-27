import { useEffect, useRef, useState } from 'react'

const DashboardHeader = ({ user, profileError, onLogout, onGoToMarketplace, onSelectTab }) => {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (action) => {
    if (action === 'marketplace') {
      onGoToMarketplace?.()
    } else if (action) {
      onSelectTab?.(action)
    }
    setMenuOpen(false)
  }

  const avatarContent = user?.avatar_url ? (
    <img src={user.avatar_url} alt={user.full_name} className="h-12 w-12 rounded-full object-cover ring-2 ring-white/40" />
  ) : (
    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500 text-xl font-bold">
      {(user?.full_name || 'S').charAt(0).toUpperCase()}
    </div>
  )

  const menuItems = [
    { label: '👤 Hồ sơ cá nhân', action: 'profile' },
    { label: '📦 Sản phẩm của tôi', action: 'my-products' },
    { label: '➕ Đăng sản phẩm', action: 'add-product' },
    { label: '💰 Doanh thu', action: 'sales' },
    { separator: true },
    { label: '🌐 Xem sàn đấu giá', action: 'marketplace' }
  ]

  return (
    <header className="bg-emerald-600 text-white shadow">
      <div className="container mx-auto flex flex-wrap items-center justify-between gap-4 px-6 py-4">
        <div>
          <p className="text-sm uppercase tracking-wide text-emerald-200">Seller workspace</p>
          <h1 className="text-2xl font-semibold">Bảng điều khiển người bán</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="font-semibold">{user?.full_name || 'Seller'}</p>
            <p className="text-sm text-emerald-200">{profileError || user?.email}</p>
          </div>
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((prev) => !prev)}
              className="rounded-full border border-white/30 p-1 hover:border-white/60"
            >
              {avatarContent}
            </button>
            {menuOpen && (
              <div className="absolute right-0 z-10 mt-2 w-56 rounded-xl border border-emerald-100 bg-white text-sm text-slate-700 shadow-lg">
                {menuItems.map((item, index) =>
                  item.separator ? (
                    <div key={`sep-${index}`} className="my-1 border-t border-slate-100" />
                  ) : (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => handleSelect(item.action)}
                      className="block w-full px-4 py-2 text-left hover:bg-emerald-50"
                    >
                      {item.label}
                    </button>
                  )
                )}
              </div>
            )}
          </div>
          <button
            onClick={onLogout}
            className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold hover:bg-emerald-400"
          >
            Đăng xuất
          </button>
        </div>
      </div>
    </header>
  )
}

export default DashboardHeader
