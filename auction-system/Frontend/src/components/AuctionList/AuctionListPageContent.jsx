import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import guestAPI from '../../services/guestAPI'
import ProductCard from '../GuestHomePage/ProductCard'

function AuctionListPageContent() {
  const [auctions, setAuctions] = useState([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [searchParams, setSearchParams] = useSearchParams()

  const page = parseInt(searchParams.get('page') || '1', 10)
  const limit = parseInt(searchParams.get('limit') || '12', 10)
  const q = searchParams.get('q') || ''
  const category = searchParams.get('category') || ''
  const sort = searchParams.get('sort') || ''

  useEffect(() => {
    loadAuctions()
  }, [page, limit, q, category, sort])

  async function loadAuctions() {
    setLoading(true)
    try {
      const params = { page, limit }
      if (category) params.category = category
      if (sort) params.sort = sort

      let res
      if (q) {
        res = await guestAPI.searchProducts(q, params)
      } else {
        res = await guestAPI.getProducts(params)
      }

      // guestAPI returns { data, meta }
      setAuctions(res?.data || [])
      setTotal(res?.meta?.total || 0)
    } catch (err) {
      console.log('Error loading auctions:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-8">Danh sách đấu giá</h1>
        {auctions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {auctions.map((auction) => (
              <ProductCard key={auction.id} product={auction} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="text-gray-400 text-6xl mb-4">📦</div>
            <p className="text-gray-600 text-lg">Chưa có sản phẩm đấu giá nào</p>
          </div>
        )}

        {/* Pagination simple controls */}
        <div className="mt-8 flex items-center justify-center gap-4">
          <button
            onClick={() => setSearchParams({ ...Object.fromEntries(searchParams), page: Math.max(1, page - 1) })}
            disabled={page <= 1}
            className="px-4 py-2 bg-white border rounded disabled:opacity-50"
          >
            Prev
          </button>
          <div className="px-4 py-2">Trang {page}</div>
          <button
            onClick={() => setSearchParams({ ...Object.fromEntries(searchParams), page: page + 1 })}
            disabled={auctions.length < limit}
            className="px-4 py-2 bg-white border rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  )
}

export default AuctionListPageContent
