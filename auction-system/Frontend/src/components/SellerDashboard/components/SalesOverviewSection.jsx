import { useEffect, useState } from 'react'
import sellerAPI from '../../../services/sellerAPI'

const SalesOverviewSection = () => {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await sellerAPI.getSalesStats()
        if (!response?.success) {
          throw new Error(response?.message || 'Không thể tải thống kê.')
        }
        setStats(response.data)
      } catch (err) {
        console.error('Error fetching sales stats:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (loading) {
    return <p className="text-sm text-slate-500">Đang tải thống kê doanh thu...</p>
  }

  if (error) {
    return <p className="text-sm text-red-500">{error}</p>
  }

  const cards = [
    {
      label: 'Tổng sản phẩm',
      value: stats?.totalProducts ?? 0,
      accent: 'text-slate-800'
    },
    {
      label: 'Đang đấu giá',
      value: stats?.activeProducts ?? 0,
      accent: 'text-emerald-600'
    },
    {
      label: 'Đã kết thúc',
      value: stats?.soldProducts ?? 0,
      accent: 'text-slate-600'
    }
  ]

  const revenue = new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0
  }).format(stats?.totalRevenue ?? 0)

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-2xl font-semibold text-slate-800">Tổng quan doanh thu</h2>
        <p className="text-sm text-slate-500">Theo dõi hiệu suất bán hàng và số tiền kiếm được từ các phiên đấu giá.</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        {cards.map((card) => (
          <div key={card.label} className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">{card.label}</p>
            <p className={`mt-3 text-3xl font-bold ${card.accent}`}>{card.value}</p>
          </div>
        ))}
      </div>

      <section className="rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 p-6 text-white shadow-lg">
        <p className="text-sm uppercase tracking-[0.2em] text-white/80">Doanh thu từ đấu giá</p>
        <p className="mt-2 text-4xl font-bold">{revenue}</p>
        <p className="mt-2 text-sm text-white/80">Tổng số tiền nhận được từ các sản phẩm đã hoàn tất.</p>
      </section>
    </div>
  )
}

export default SalesOverviewSection
