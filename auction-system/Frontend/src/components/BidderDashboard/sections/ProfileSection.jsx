import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { authAPI } from '../../../services/api'
import bidderAPI from '../../../services/bidderAPI'

function ProfileSection({ user, onProfileChange }) {
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
  const [upgradeRequest, setUpgradeRequest] = useState(null)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [upgradeReason, setUpgradeReason] = useState('')
  const [requestingUpgrade, setRequestingUpgrade] = useState(false)
  
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
      const [profileData, upgradeData] = await Promise.all([
        authAPI.getProfile(),
        bidderAPI.getUpgradeRequestStatus()
      ])
      
      setProfile(profileData)
      setUpgradeRequest(upgradeData?.data)
      
      setFormData({
        full_name: profileData?.full_name || '',
        phone: profileData?.phone || '',
        address: profileData?.address || '',
        date_of_birth: profileData?.date_of_birth || ''
      })
    } catch (error) {
      console.error('Failed to load profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadRatings = async () => {
    try {
      setLoadingRatings(true)
      const res = await bidderAPI.getMyRatings()
      setRatings(res?.data)
    } catch (error) {
      console.error('Failed to load ratings:', error)
    } finally {
      setLoadingRatings(false)
    }
  }

  const handleRequestUpgrade = async () => {
    if (!upgradeReason.trim()) {
      setMessage({ type: 'error', text: 'Vui lòng nhập lý do muốn trở thành người bán' })
      return
    }

    try {
      setRequestingUpgrade(true)
      const res = await bidderAPI.requestUpgrade(upgradeReason)
      if (res?.success) {
        setUpgradeRequest(res.data)
        setShowUpgradeModal(false)
        setMessage({ type: 'success', text: 'Đã gửi yêu cầu nâng cấp thành công!' })
      } else {
        setMessage({ type: 'error', text: res?.message || 'Có lỗi xảy ra' })
      }
    } catch (error) {
      console.error('Failed to request upgrade:', error)
      setMessage({ type: 'error', text: 'Không thể gửi yêu cầu' })
    } finally {
      setRequestingUpgrade(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      setMessage(null)
      const res = await bidderAPI.updateProfile(formData)
      if (res?.success) {
        // Use server response data instead of local formData
        const updatedProfile = res.data || formData
        setProfile((prev) => ({ ...prev, ...updatedProfile }))
        setFormData({
          full_name: updatedProfile.full_name || '',
          phone: updatedProfile.phone || '',
          address: updatedProfile.address || '',
          date_of_birth: updatedProfile.date_of_birth || ''
        })
        onProfileChange?.(updatedProfile)
        setEditing(false)
        setMessage({ type: 'success', text: 'Cập nhật hồ sơ thành công!' })
      } else {
        setMessage({ type: 'error', text: res?.message || 'Có lỗi xảy ra' })
      }
    } catch (error) {
      console.error('Failed to save profile:', error)
      setMessage({ type: 'error', text: 'Không thể cập nhật hồ sơ' })
    } finally {
      setSaving(false)
    }
  }

  const handleAvatarClick = () => {
    avatarInputRef.current?.click()
  }

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setUploadingAvatar(true)
      setMessage(null)
      const res = await bidderAPI.uploadAvatar(file)
      if (res?.success && res?.data?.avatar_url) {
        setProfile((prev) => ({ ...prev, avatar_url: res.data.avatar_url }))
        onProfileChange?.({ avatar_url: res.data.avatar_url })
        setMessage({ type: 'success', text: 'Cập nhật ảnh đại diện thành công!' })
      } else {
        setMessage({ type: 'error', text: res?.message || 'Có lỗi xảy ra' })
      }
    } catch (error) {
      console.error('Failed to upload avatar:', error)
      setMessage({ type: 'error', text: 'Không thể upload ảnh đại diện' })
    } finally {
      setUploadingAvatar(false)
      e.target.value = ''
    }
  }

  const handleCancel = () => {
    setFormData({
      full_name: profile?.full_name || '',
      phone: profile?.phone || '',
      address: profile?.address || '',
      date_of_birth: profile?.date_of_birth || ''
    })
    setEditing(false)
    setMessage(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {message && (
        <div className={`p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {message.text}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <input
              type="file"
              ref={avatarInputRef}
              onChange={handleAvatarChange}
              accept="image/*"
              className="hidden"
            />
            <button
              type="button"
              onClick={handleAvatarClick}
              disabled={uploadingAvatar}
              className="w-20 h-20 rounded-full overflow-hidden bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-2xl font-bold hover:opacity-90 transition relative group"
            >
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                profile?.full_name?.charAt(0)?.toUpperCase() || profile?.email?.charAt(0)?.toUpperCase() || 'B'
              )}
              <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                <span className="text-white text-xs">📷</span>
              </div>
              {uploadingAvatar && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent"></div>
                </div>
              )}
            </button>
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">{profile?.full_name || 'Bidder'}</h2>
            <p className="text-gray-500">{profile?.email}</p>
            <span className="inline-block mt-1 px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full capitalize">
              {profile?.role || 'bidder'}
            </span>
          </div>
        </div>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Chỉnh sửa
          </button>
        )}
      </div>

      <div className="border-t pt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Họ và tên</label>
            {editing ? (
              <input
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            ) : (
              <p className="text-gray-900 bg-gray-50 px-4 py-2 rounded-lg">{profile?.full_name || '—'}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <p className="text-gray-900 bg-gray-50 px-4 py-2 rounded-lg">{profile?.email || '—'}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Số điện thoại</label>
            {editing ? (
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            ) : (
              <p className="text-gray-900 bg-gray-50 px-4 py-2 rounded-lg">{profile?.phone || '—'}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Ngày sinh</label>
            {editing ? (
              <input
                type="date"
                name="date_of_birth"
                value={formData.date_of_birth}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            ) : (
              <p className="text-gray-900 bg-gray-50 px-4 py-2 rounded-lg">
                {profile?.date_of_birth ? new Date(profile.date_of_birth).toLocaleDateString('vi-VN') : '—'}
              </p>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Địa chỉ</label>
            {editing ? (
              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                rows={2}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            ) : (
              <p className="text-gray-900 bg-gray-50 px-4 py-2 rounded-lg">{profile?.address || '—'}</p>
            )}
          </div>
        </div>

        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-700">Đánh giá</h3>
            <button
              onClick={() => setShowRatings(!showRatings)}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              {showRatings ? 'Ẩn chi tiết' : 'Xem chi tiết'}
            </button>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-green-600 font-medium">👍 {profile?.rating_positive || 0} tích cực</span>
            <span className="text-gray-400">|</span>
            <span className="text-red-600 font-medium">👎 {profile?.rating_negative || 0} tiêu cực</span>
          </div>
        </div>

        {/* Chi tiết ratings */}
        {showRatings && (
          <div className="mt-6 border-t pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Chi tiết đánh giá</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setRatingFilter('all')}
                  className={`px-3 py-1 text-sm rounded-full transition ${
                    ratingFilter === 'all'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Tất cả ({ratings?.summary?.total || 0})
                </button>
                <button
                  onClick={() => setRatingFilter('positive')}
                  className={`px-3 py-1 text-sm rounded-full transition ${
                    ratingFilter === 'positive'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  👍 Tích cực ({ratings?.summary?.positive || 0})
                </button>
                <button
                  onClick={() => setRatingFilter('negative')}
                  className={`px-3 py-1 text-sm rounded-full transition ${
                    ratingFilter === 'negative'
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  👎 Tiêu cực ({ratings?.summary?.negative || 0})
                </button>
              </div>
            </div>

            {loadingRatings ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="space-y-4">
                {(() => {
                  const displayRatings =
                    ratingFilter === 'all'
                      ? ratings?.all
                      : ratingFilter === 'positive'
                      ? ratings?.positive
                      : ratings?.negative
                  
                  if (!displayRatings || displayRatings.length === 0) {
                    return (
                      <div className="text-center py-8 text-gray-500">
                        <p className="text-4xl mb-2">📋</p>
                        <p>Chưa có đánh giá nào</p>
                      </div>
                    )
                  }

                  return displayRatings.map((rating) => (
                    <div
                      key={rating.id}
                      className={`border rounded-lg p-4 ${
                        rating.rating === 'positive'
                          ? 'bg-green-50 border-green-200'
                          : 'bg-red-50 border-red-200'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        {rating.products?.thumbnail_url && (
                          <img
                            src={rating.products.thumbnail_url}
                            alt={rating.products.name}
                            className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <span
                              className={`text-2xl ${
                                rating.rating === 'positive' ? '👍' : '👎'
                              }`}
                            >
                              {rating.rating === 'positive' ? '👍' : '👎'}
                            </span>
                            <span
                              className={`text-sm font-semibold ${
                                rating.rating === 'positive'
                                  ? 'text-green-700'
                                  : 'text-red-700'
                              }`}
                            >
                              {rating.rating === 'positive' ? 'Tích cực' : 'Tiêu cực'}
                            </span>
                          </div>
                          
                          <button
                            onClick={() => navigate(`/products/${rating.product_id}`)}
                            className="font-semibold text-gray-900 hover:text-blue-600 transition text-left mb-1"
                          >
                            {rating.products?.name || 'Sản phẩm'}
                          </button>
                          
                          {rating.comment && (
                            <p className="text-sm text-gray-700 mb-2">
                              💬 {rating.comment}
                            </p>
                          )}
                          
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span>Từ: {rating.rater?.full_name || 'Ẩn danh'}</span>
                            <span>•</span>
                            <span>
                              {new Date(rating.created_at).toLocaleDateString('vi-VN')}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                })()}
              </div>
            )}
          </div>
        )}

        {editing && (
          <div className="mt-6 flex gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
            >
              {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
            <button
              onClick={handleCancel}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
            >
              Hủy
            </button>
          </div>
        )}

        {/* Upgrade Request Section */}
        {profile?.role === 'bidder' && (
          <div className="mt-8 pt-6 border-t">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Nâng cấp tài khoản</h3>
            
            {upgradeRequest && upgradeRequest.status === 'pending' ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">⏳</span>
                  <div>
                    <h4 className="font-semibold text-yellow-800">Yêu cầu đang chờ duyệt</h4>
                    <p className="text-sm text-yellow-700 mt-1">
                      Bạn đã gửi yêu cầu vào ngày {new Date(upgradeRequest.created_at).toLocaleDateString('vi-VN')}.
                      Vui lòng chờ quản trị viên xét duyệt.
                    </p>
                  </div>
                </div>
              </div>
            ) : upgradeRequest && upgradeRequest.status === 'rejected' ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">❌</span>
                    <div>
                      <h4 className="font-semibold text-red-800">Yêu cầu bị từ chối</h4>
                      <p className="text-sm text-red-700 mt-1">
                        Yêu cầu trước đó của bạn đã bị từ chối.
                        {upgradeRequest.admin_note && (
                          <span className="block mt-1 font-medium">
                            Lý do: "{upgradeRequest.admin_note}"
                          </span>
                        )}
                        Bạn có thể gửi lại yêu cầu mới.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowUpgradeModal(true)}
                    className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition whitespace-nowrap ml-4"
                  >
                    Gửi lại yêu cầu
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-blue-800">Trở thành người bán</h4>
                    <p className="text-sm text-blue-700 mt-1">
                      Đăng ký để có thể đăng bán sản phẩm đấu giá trên hệ thống.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowUpgradeModal(true)}
                    className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition"
                  >
                    Đăng ký ngay
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Upgrade Request Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Đăng ký trở thành người bán</h3>
            <p className="text-gray-600 mb-4 text-sm">
              Vui lòng cho chúng tôi biết những loại sản phẩm bạn muốn bán và kinh nghiệm của bạn (nếu có).
            </p>
            
            <textarea
              value={upgradeReason}
              onChange={(e) => setUpgradeReason(e.target.value)}
              placeholder="Ví dụ: Tôi muốn bán các sản phẩm đồ cổ, tranh nghệ thuật. Tôi đã có 5 năm kinh nghiệm sưu tầm và kinh doanh..."
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-6"
            />

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleRequestUpgrade}
                disabled={requestingUpgrade || !upgradeReason.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {requestingUpgrade ? 'Đang gửi...' : 'Gửi yêu cầu'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProfileSection
