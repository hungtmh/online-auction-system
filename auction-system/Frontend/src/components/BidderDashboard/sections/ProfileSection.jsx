import { useState, useEffect, useRef } from 'react'
import { authAPI } from '../../../services/api'
import bidderAPI from '../../../services/bidderAPI'

function ProfileSection({ user, onProfileChange }) {
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

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      setLoading(true)
      const data = await authAPI.getProfile()
      setProfile(data)
      setFormData({
        full_name: data?.full_name || '',
        phone: data?.phone || '',
        address: data?.address || '',
        date_of_birth: data?.date_of_birth || ''
      })
    } catch (error) {
      console.error('Failed to load profile:', error)
    } finally {
      setLoading(false)
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
          <h3 className="text-sm font-medium text-gray-700 mb-2">Đánh giá</h3>
          <div className="flex items-center gap-4">
            <span className="text-green-600 font-medium">👍 {profile?.rating_positive || 0} tích cực</span>
            <span className="text-gray-400">|</span>
            <span className="text-red-600 font-medium">👎 {profile?.rating_negative || 0} tiêu cực</span>
          </div>
        </div>

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
      </div>
    </div>
  )
}

export default ProfileSection
