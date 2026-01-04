import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { authAPI } from '../../services/api'
import sellerAPI from '../../services/sellerAPI'

function SellerProfileSection({ user, onProfileChange }) {
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const avatarInputRef = useRef(null)
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    address: '',
    date_of_birth: ''
  })
  const [message, setMessage] = useState(null)
  
  // Ratings state
  const [ratings, setRatings] = useState(null)
  const [loadingRatings, setLoadingRatings] = useState(false)
  const [showRatings, setShowRatings] = useState(false)
  const [ratingFilter, setRatingFilter] = useState('all') // 'all', 'positive', 'negative'

  useEffect(() => {
    loadProfile()
    loadRatings()
  }, [])

  const loadProfile = async () => {
    try {
      setLoading(true)
      const profileData = await authAPI.getProfile()
      
      setProfile(profileData)
      
      setFormData({
        full_name: profileData?.full_name || '',
        phone: profileData?.phone || '',
        address: profileData?.address || '',
        date_of_birth: profileData?.date_of_birth || ''
      })
    } catch (error) {
      console.error('Error loading profile:', error)
      setMessage({ type: 'error', text: 'Không thể tải thông tin người dùng' })
    } finally {
      setLoading(false)
    }
  }

  const loadRatings = async () => {
    try {
      setLoadingRatings(true)
      const response = await sellerAPI.getMyRatings()
      setRatings(response.data)
    } catch (error) {
      console.error('Error loading ratings:', error)
      setRatings(null)
    } finally {
      setLoadingRatings(false)
    }
  }

  const handleEditToggle = () => {
    if (editing) {
      // Cancel editing - reset form
      setFormData({
        full_name: profile?.full_name || '',
        phone: profile?.phone || '',
        address: profile?.address || '',
        date_of_birth: profile?.date_of_birth || ''
      })
    }
    setEditing(!editing)
    setMessage(null)
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      setSaving(true)
      setMessage(null)
      
      const payload = {
        full_name: formData.full_name,
        phone: formData.phone,
        address: formData.address,
        date_of_birth: formData.date_of_birth
      }
      
      await sellerAPI.updateProfile(payload)
      
      // Reload profile to get updated data
      const updatedProfile = await authAPI.getProfile()
      setProfile(updatedProfile)
      
      // Call parent handler if provided
      if (onProfileChange) {
        onProfileChange(updatedProfile)
      }
      
      setEditing(false)
      setMessage({ type: 'success', text: 'Cập nhật thông tin thành công!' })
    } catch (error) {
      console.error('Error updating profile:', error)
      setMessage({ type: 'error', text: error.response?.data?.error || 'Không thể cập nhật thông tin' })
    } finally {
      setSaving(false)
    }
  }

  const handleAvatarClick = () => {
    if (!editing) return
    avatarInputRef.current?.click()
  }

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Vui lòng chọn file ảnh' })
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Kích thước ảnh không được vượt quá 5MB' })
      return
    }

    try {
      setUploadingAvatar(true)
      setMessage(null)
      
      const uploadedUrl = await sellerAPI.uploadAvatar(file)
      
      // Reload profile to get updated avatar
      const updatedProfile = await authAPI.getProfile()
      setProfile(updatedProfile)
      
      if (onProfileChange) {
        onProfileChange(updatedProfile)
      }
      
      setMessage({ type: 'success', text: 'Cập nhật ảnh đại diện thành công!' })
    } catch (error) {
      console.error('Error uploading avatar:', error)
      setMessage({ type: 'error', text: error.response?.data?.error || 'Không thể tải ảnh lên' })
    } finally {
      setUploadingAvatar(false)
      // Reset input
      if (avatarInputRef.current) {
        avatarInputRef.current.value = ''
      }
    }
  }

  const getFilteredRatings = () => {
    if (!ratings) return []
    const allRatings = [...(ratings.positive || []), ...(ratings.negative || [])]
    if (ratingFilter === 'positive') return ratings.positive || []
    if (ratingFilter === 'negative') return ratings.negative || []
    return allRatings.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  }

  const formatDate = (dateString) => {
    if (!dateString) return ''
    return new Date(dateString).toLocaleDateString('vi-VN')
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
      </div>
    )
  }

  const filteredRatings = getFilteredRatings()

  return (
    <div className="space-y-6">
      {message && (
        <div className={`p-4 rounded-lg ${
          message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          {message.text}
        </div>
      )}

      {/* Profile Card */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6">
          <div className="flex items-start gap-6">
            {/* Avatar */}
            <div className="relative">
              <div 
                className={`w-24 h-24 rounded-full overflow-hidden bg-slate-200 ${editing ? 'cursor-pointer ring-2 ring-blue-500' : ''}`}
                onClick={handleAvatarClick}
              >
                {uploadingAvatar ? (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : profile?.avatar_url ? (
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
              {editing && (
                <button
                  type="button"
                  onClick={handleAvatarClick}
                  className="absolute bottom-0 right-0 bg-blue-600 text-white rounded-full p-2 shadow-lg hover:bg-blue-700"
                  title="Thay đổi ảnh đại diện"
                >
                  📷
                </button>
              )}
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </div>

            {/* Profile Info */}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-slate-800">
                    {profile?.full_name || 'Chưa cập nhật tên'}
                  </h3>
                  <p className="text-sm text-slate-500">{profile?.email}</p>
                  <p className="text-sm font-medium text-blue-600 mt-1">
                    Vai trò: Người bán
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleEditToggle}
                  className={`px-4 py-2 rounded-lg font-medium ${
                    editing 
                      ? 'bg-slate-200 text-slate-700 hover:bg-slate-300' 
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {editing ? 'Hủy' : 'Chỉnh sửa'}
                </button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 mt-4">
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-xs text-slate-600">Tổng đánh giá</p>
                  <p className="text-lg font-semibold text-slate-800">
                    {(profile?.rating_positive || 0) + (profile?.rating_negative || 0)}
                  </p>
                </div>
                <div className="bg-green-50 rounded-lg p-3">
                  <p className="text-xs text-green-700">Tích cực</p>
                  <p className="text-lg font-semibold text-green-800">
                    {profile?.rating_positive || 0}
                  </p>
                </div>
                <div className="bg-red-50 rounded-lg p-3">
                  <p className="text-xs text-red-700">Tiêu cực</p>
                  <p className="text-lg font-semibold text-red-800">
                    {profile?.rating_negative || 0}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Edit Form */}
        {editing && (
          <form onSubmit={handleSubmit} className="border-t border-slate-200 p-6 bg-slate-50">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Họ và tên
                </label>
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Số điện thoại
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Ngày sinh
                </label>
                <input
                  type="date"
                  name="date_of_birth"
                  value={formData.date_of_birth}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Địa chỉ
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-slate-400"
              >
                {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Ratings Section */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-800">
            Đánh giá từ người mua
          </h3>
          <button
            type="button"
            onClick={() => setShowRatings(!showRatings)}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            {showRatings ? 'Ẩn chi tiết' : 'Xem chi tiết'}
          </button>
        </div>

        {showRatings && (
          <div className="space-y-4">
            {/* Filter Tabs */}
            <div className="flex gap-2 border-b border-slate-200">
              <button
                type="button"
                onClick={() => setRatingFilter('all')}
                className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                  ratingFilter === 'all'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-600 hover:text-slate-800'
                }`}
              >
                Tất cả ({((ratings?.positive?.length || 0) + (ratings?.negative?.length || 0))})
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
                👍 Tích cực ({ratings?.positive?.length || 0})
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
                👎 Tiêu cực ({ratings?.negative?.length || 0})
              </button>
            </div>

            {/* Ratings List */}
            {loadingRatings ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
              </div>
            ) : filteredRatings.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                Chưa có đánh giá nào
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
                      <div 
                        className="w-16 h-16 rounded-lg overflow-hidden bg-slate-200 flex-shrink-0 cursor-pointer hover:opacity-80"
                        onClick={() => navigate(`/product/${rating.product_id}`)}
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

                      {/* Rating Details */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-lg">
                                {rating.rating === 'positive' ? '👍' : '👎'}
                              </span>
                              <span
                                onClick={() => navigate(`/product/${rating.product_id}`)}
                                className="font-medium text-slate-800 hover:text-blue-600 cursor-pointer"
                              >
                                {rating.product_name}
                              </span>
                            </div>
                            {rating.comment && (
                              <p className="text-sm text-slate-700 mt-1">
                                {rating.comment}
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
        )}
      </div>
    </div>
  )
}

export default SellerProfileSection
