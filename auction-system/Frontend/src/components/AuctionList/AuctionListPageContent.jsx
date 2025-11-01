import { useState, useEffect } from 'react'
import api from '../../services/api'

function AuctionListPageContent() {
  const [auctions, setAuctions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAuctions()
  }, [])

  async function loadAuctions() {
    try {
      // TODO: Fetch từ Backend API khi có endpoint /api/products
      // const { data } = await api.get('/products')
      // setAuctions(data.products)
      
      // Tạm thời set empty array
      setAuctions([])
    } catch (err) {
      console.log('Error loading auctions:', err.message)
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
              <div key={auction.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition">
                <div className="h-48 bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-400 text-6xl">🎁</span>
                </div>
                <div className="p-6">
                  <h3 className="font-bold text-xl mb-2">{auction.title}</h3>
                  <p className="text-gray-600 mb-4">{auction.description}</p>
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-sm text-gray-500">Giá hiện tại</div>
                      <div className="text-2xl font-bold text-blue-600">
                        {(auction.current_price || 0).toLocaleString('vi-VN')} đ
                      </div>
                    </div>
                    <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                      Đấu giá
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="text-gray-400 text-6xl mb-4">📦</div>
            <p className="text-gray-600 text-lg">Chưa có sản phẩm đấu giá nào</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default AuctionListPageContent
