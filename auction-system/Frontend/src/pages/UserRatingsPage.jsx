import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import UnifiedNavbar from '../components/common/UnifiedNavbar'
import guestAPI from '../services/guestAPI'

function UserRatingsPage({ user }) {
  const { userId } = useParams()
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [ratings, setRatings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [ratingFilter, setRatingFilter] = useState('all') // 'all', 'positive', 'negative'

  useEffect(() => {
    loadUserRatings()
  }, [userId])

  const loadUserRatings = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Load user profile
      const profileRes = await guestAPI.getUserProfile(userId)
      setProfile(profileRes?.data || profileRes)
      
      // Load ratings
      const ratingsRes = await guestAPI.getUserRatings(userId)
      const ratingsData = ratingsRes?.data || ratingsRes
      setRatings(ratingsData?.ratings || [])
    } catch (err) {
      console.error('Error loading user ratings:', err)
      setError('Không thể tải thông tin đánh giá')
    } finally {
      setLoading(false)
    }
  }

  const getFilteredRatings = () => {
    if (ratingFilter === 'positive') {
      return ratings.filter(r => r.rating === 'positive')
    }
    if (ratingFilter === 'negative') {
      return ratings.filter(r => r.rating === 'negative')
    }
    return ratings
  }

  const formatDate = (dateString) => {
    if (!dateString) return ''
    return new Date(dateString).toLocaleDateString('vi-VN')
  }

  const filteredRatings = getFilteredRatings()
  const positiveCount = ratings.filter(r => r.rating === 'positive').length
  const negativeCount = ratings.filter(r => r.rating === 'negative').length

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <UnifiedNavbar user={user} />
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <UnifiedNavbar user={user} />
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-800">{error}</p>
            <button
              onClick={() => navigate(-1)}
              className="mt-4 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Quay lại
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <UnifiedNavbar user={user} />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate(-1)}
          className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900"
        >
          <span>←</span>
          Quay lại
        </button>

        {/* User Profile Card */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="w-20 h-20 rounded-full overflow-hidden bg-slate-200 flex-shrink-0">
              {profile?.avatar_url ? (
                <img 
                  src={profile.avatar_url} 
                  alt="Avatar" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400 text-3xl">
                  👤
                </div>
              )}
            </div>
            
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-slate-800 mb-1">
                {profile?.full_name || 'Người dùng'}
              </h1>
              <p className="text-sm text-slate-500 mb-3">
                {profile?.role === 'seller' ? 'Seller' : profile?.role === 'bidder' ? 'Bidder' : 'User'}
              </p>
              
              <div className="flex gap-4">
                <div className="bg-slate-50 rounded-lg px-4 py-2">
                  <p className="text-xs text-slate-600">Tổng đánh giá</p>
                  <p className="text-lg font-semibold text-slate-800">
                    {(profile?.rating_positive || 0) + (profile?.rating_negative || 0)}
                  </p>
                </div>
                <div className="bg-green-50 rounded-lg px-4 py-2">
                  <p className="text-xs text-green-700">Tích cực</p>
                  <p className="text-lg font-semibold text-green-800">
                    {profile?.rating_positive || 0}
                  </p>
                </div>
                <div className="bg-red-50 rounded-lg px-4 py-2">
                  <p className="text-xs text-red-700">Tiêu cực</p>
                  <p className="text-lg font-semibold text-red-800">
                    {profile?.rating_negative || 0}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Ratings Section */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <h2 className="text-xl font-bold text-slate-800 mb-4">
            Đánh giá từ người dùng khác
          </h2>

          {/* Filter Tabs */}
          <div className="flex gap-2 border-b border-slate-200 mb-4">
            <button
              type="button"
              onClick={() => setRatingFilter('all')}
              className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                ratingFilter === 'all'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-600 hover:text-slate-800'
              }`}
            >
              Tất cả ({ratings.length})
            </button>
            <button
              type="button"
              onClick={() => setRatingFilter('positive')}
              className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                ratingFilter === 'positive'
                  ? 'border-green-600 text-green-600'
                  : 'border-transparent text-slate-600 hover:text-slate-800'
              }`}
            >
              👍 Tích cực ({positiveCount})
            </button>
            <button
              type="button"
              onClick={() => setRatingFilter('negative')}
              className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                ratingFilter === 'negative'
                  ? 'border-red-600 text-red-600'
                  : 'border-transparent text-slate-600 hover:text-slate-800'
              }`}
            >
              👎 Tiêu cực ({negativeCount})
            </button>
          </div>

          {/* Ratings List */}
          {filteredRatings.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              {ratingFilter === 'all' 
                ? 'Chưa có đánh giá nào' 
                : `Chưa có đánh giá ${ratingFilter === 'positive' ? 'tích cực' : 'tiêu cực'}`
              }
            </div>
          ) : (
            <div className="space-y-3">
              {filteredRatings.map((rating) => (
                <div
                  key={rating.id}
                  className={`border rounded-lg p-4 ${
                    rating.rating === 'positive'
                      ? 'bg-green-50 border-green-200'
                      : 'bg-red-50 border-red-200'
                  }`}
                >
                  <div className="flex gap-4">
                    {/* Product Thumbnail */}
                    {rating.product_id && (
                      <div 
                        className="w-16 h-16 rounded-lg overflow-hidden bg-slate-200 flex-shrink-0 cursor-pointer hover:opacity-80"
                        onClick={() => navigate(`/products/${rating.product_id}`)}
                      >
                        {rating.product_thumbnail_url ? (
                          <img
                            src={rating.product_thumbnail_url}
                            alt={rating.product_name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400">
                            📦
                          </div>
                        )}
                      </div>
                    )}

                    {/* Rating Details */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-lg">
                              {rating.rating === 'positive' ? '👍' : '👎'}
                            </span>
                            {rating.product_id && rating.product_name && (
                              <span
                                onClick={() => navigate(`/products/${rating.product_id}`)}
                                className="font-medium text-slate-800 hover:text-blue-600 cursor-pointer"
                              >
                                {rating.product_name}
                              </span>
                            )}
                          </div>
                          {rating.comment && (
                            <p className="text-sm text-slate-700 mt-1">
                              "{rating.comment}"
                            </p>
                          )}
                        </div>
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            rating.rating === 'positive'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {rating.rating === 'positive' ? 'Tích cực' : 'Tiêu cực'}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <span>
                          Từ: <span className="font-medium">{rating.rater_name || 'Người dùng'}</span>
                        </span>
                        <span>{formatDate(rating.created_at)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default UserRatingsPage
