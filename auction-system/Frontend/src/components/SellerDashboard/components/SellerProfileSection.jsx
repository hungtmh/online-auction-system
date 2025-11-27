import { useEffect, useState } from 'react'
import sellerAPI from '../../../services/sellerAPI'

const SellerProfileSection = ({ onProfileChange }) => {
  const [profile, setProfile] = useState(null)
  const [fullName, setFullName] = useState('')
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  const loadProfile = async () => {
    try {
      setLoading(true)
      const response = await sellerAPI.getProfile()
      if (response?.success) {
        setProfile(response.data)
        setFullName(response.data.full_name)
        onProfileChange?.(response.data)
      } else {
        setStatus({ type: 'error', message: response?.message || 'Không thể tải hồ sơ.' })
      }
    } catch (error) {
      console.error('Error loading seller profile:', error)
      setStatus({ type: 'error', message: 'Không thể tải hồ sơ.' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProfile()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!fullName.trim()) {
      setStatus({ type: 'error', message: 'Tên hiển thị không được để trống.' })
      return
    }

    try {
      setSaving(true)
      setStatus(null)
      const response = await sellerAPI.updateProfile({ full_name: fullName.trim() })
      if (response?.success) {
        setProfile(response.data)
        onProfileChange?.(response.data)
        setStatus({ type: 'success', message: response.message || 'Đã cập nhật hồ sơ.' })
      } else {
        setStatus({ type: 'error', message: response?.message || 'Không thể cập nhật hồ sơ.' })
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      setStatus({ type: 'error', message: 'Không thể cập nhật hồ sơ.' })
    } finally {
      setSaving(false)
    }
  }

  const handleAvatarChange = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    setStatus(null)
    setUploading(true)

    try {
      const response = await sellerAPI.uploadAvatar(file)
      if (response?.success) {
        const updated = { ...profile, avatar_url: response.data.avatar_url }
        setProfile(updated)
        onProfileChange?.(updated)
        setStatus({ type: 'success', message: 'Đã cập nhật ảnh đại diện.' })
      } else {
        setStatus({ type: 'error', message: response?.message || 'Không thể upload ảnh.' })
      }
    } catch (error) {
      console.error('Error uploading avatar:', error)
      setStatus({ type: 'error', message: 'Không thể upload ảnh.' })
    } finally {
      setUploading(false)
      event.target.value = ''
    }
  }

  if (loading) {
    return <p className="text-sm text-slate-500">Đang tải hồ sơ...</p>
  }

  return (
    <div className="space-y-6">
      {status && (
        <div
          className={`rounded-lg border px-4 py-3 text-sm ${
            status.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border-rose-200 bg-rose-50 text-rose-700'
          }`}
        >
          {status.message}
        </div>
      )}

      <div className="flex flex-col gap-6 lg:flex-row">
        <section className="flex-1 rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
          <header className="mb-6">
            <h2 className="text-xl font-semibold text-slate-800">Thông tin hồ sơ</h2>
            <p className="text-sm text-slate-500">Cập nhật tên hiển thị và ảnh đại diện.</p>
          </header>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="flex items-center gap-4">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.full_name}
                  className="h-20 w-20 rounded-full object-cover ring-2 ring-emerald-100"
                />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-2xl font-bold text-emerald-700">
                  {(profile?.full_name || 'S').charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <label className="text-sm font-semibold text-slate-600">Ảnh đại diện</label>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="mt-2 block text-sm"
                  onChange={handleAvatarChange}
                  disabled={uploading}
                />
                <p className="text-xs text-slate-400">Tối đa 2MB. Định dạng: JPG, PNG, WEBP.</p>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-600">Tên hiển thị</label>
              <input
                type="text"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                className="w-full rounded-lg border border-slate-200 px-4 py-2"
                placeholder="Nhập tên hiển thị"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-600">Email</label>
              <input value={profile.email} disabled className="w-full rounded-lg border border-slate-100 bg-slate-50 px-4 py-2 text-slate-500" />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-emerald-500 px-6 py-2 font-semibold text-white hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </form>
        </section>

        <section className="w-full max-w-sm rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-800">Độ uy tín</h3>
          <p className="text-sm text-slate-500">Nhận phản hồi từ bidder sau mỗi phiên đấu giá.</p>

          <div className="mt-6 flex items-center justify-around">
            <div className="text-center">
              <p className="text-3xl font-bold text-emerald-600">{profile?.rating_positive ?? 0}</p>
              <p className="text-sm text-slate-500">Lượt thích</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-rose-500">{profile?.rating_negative ?? 0}</p>
              <p className="text-sm text-slate-500">Lượt không thích</p>
            </div>
          </div>

          <div className="mt-6 rounded-lg bg-slate-50 p-4 text-sm text-slate-600">
            <p>
              Duy trì chất lượng sản phẩm và trải nghiệm để tăng số lượt thích. Phản hồi tích cực giúp nâng cao uy tín của bạn.
            </p>
          </div>
        </section>
      </div>
    </div>
  )
}

export default SellerProfileSection
