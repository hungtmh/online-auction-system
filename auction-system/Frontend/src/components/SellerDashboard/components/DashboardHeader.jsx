const DashboardHeader = ({ user, profileError, onLogout }) => (
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
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500 text-xl font-bold">
          {(user?.full_name || 'S').charAt(0).toUpperCase()}
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

export default DashboardHeader
