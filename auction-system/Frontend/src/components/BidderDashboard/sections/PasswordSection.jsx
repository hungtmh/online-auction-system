import { useState, useEffect } from 'react'
import { authAPI } from '../../../services/api'

/**
 * PasswordSection - Quản lý mật khẩu theo 3 loại tài khoản:
 * 
 * TH1 (google_only): Đăng nhập Google, chưa có mật khẩu
 *   → Hiển thị thông báo + nút "Tạo mật khẩu mới"
 * 
 * TH2 (local): Đăng nhập email/password, không có Google
 *   → Hiển thị form đổi mật khẩu đầy đủ
 * 
 * TH3 (hybrid): Có cả Google và mật khẩu local
 *   → Hiển thị thông báo + form đổi mật khẩu đầy đủ
 */
function PasswordSection() {
  const [accountInfo, setAccountInfo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [message, setMessage] = useState(null)
  const [saving, setSaving] = useState(false)

  // Form đổi mật khẩu (TH2, TH3)
  const [changeForm, setChangeForm] = useState({
    old_password: '',
    new_password: '',
    confirm_password: ''
  })

  // Form tạo mật khẩu (TH1)
  const [createForm, setCreateForm] = useState({
    new_password: '',
    confirm_password: ''
  })

  useEffect(() => {
    loadAccountType()
  }, [])

  const loadAccountType = async () => {
    try {
      setLoading(true)
      const data = await authAPI.getAccountType()
      setAccountInfo(data)
    } catch (error) {
      console.error('Failed to load account type:', error)
      setMessage({ type: 'error', text: 'Không thể tải thông tin tài khoản' })
    } finally {
      setLoading(false)
    }
  }

  const handleChangeFormInput = (e) => {
    const { name, value } = e.target
    setChangeForm(prev => ({ ...prev, [name]: value }))
  }

  const handleCreateFormInput = (e) => {
    const { name, value } = e.target
    setCreateForm(prev => ({ ...prev, [name]: value }))
  }

  // Đổi mật khẩu (TH2, TH3)
  const handleChangePassword = async (e) => {
    e.preventDefault()
    
    if (changeForm.new_password !== changeForm.confirm_password) {
      setMessage({ type: 'error', text: 'Mật khẩu xác nhận không khớp' })
      return
    }

    if (changeForm.new_password.length < 6) {
      setMessage({ type: 'error', text: 'Mật khẩu mới phải có ít nhất 6 ký tự' })
      return
    }

    try {
      setSaving(true)
      setMessage(null)
      
      const result = await authAPI.changePassword(
        changeForm.old_password,
        changeForm.new_password,
        changeForm.confirm_password
      )

      if (result.success) {
        setMessage({ type: 'success', text: result.message })
        setChangeForm({ old_password: '', new_password: '', confirm_password: '' })
      } else {
        setMessage({ type: 'error', text: result.message })
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Có lỗi xảy ra'
      setMessage({ type: 'error', text: errorMsg })
    } finally {
      setSaving(false)
    }
  }

  // Tạo mật khẩu (TH1)
  const handleCreatePassword = async (e) => {
    e.preventDefault()
    
    if (createForm.new_password !== createForm.confirm_password) {
      setMessage({ type: 'error', text: 'Mật khẩu xác nhận không khớp' })
      return
    }

    if (createForm.new_password.length < 6) {
      setMessage({ type: 'error', text: 'Mật khẩu phải có ít nhất 6 ký tự' })
      return
    }

    try {
      setSaving(true)
      setMessage(null)
      
      const result = await authAPI.createPassword(
        createForm.new_password,
        createForm.confirm_password
      )

      if (result.success) {
        setMessage({ type: 'success', text: result.message })
        setCreateForm({ new_password: '', confirm_password: '' })
        setShowCreateForm(false)
        // Reload account info để cập nhật UI
        loadAccountType()
      } else {
        setMessage({ type: 'error', text: result.message })
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Có lỗi xảy ra'
      setMessage({ type: 'error', text: errorMsg })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const { accountType, hasPassword, hasGoogle, email } = accountInfo || {}

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
        🔐 Quản lý mật khẩu
      </h2>

      {message && (
        <div className={`p-4 rounded-lg ${
          message.type === 'success' 
            ? 'bg-green-50 text-green-700 border border-green-200' 
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message.type === 'success' ? '✅' : '❌'} {message.text}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* TH1: Tài khoản Google, chưa có mật khẩu */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {accountType === 'google_only' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start gap-4">
            <div className="text-3xl">🔗</div>
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900 mb-2">
                Bạn đang đăng nhập bằng Google
              </h3>
              <p className="text-blue-700 mb-4">
                Tài khoản này chưa có mật khẩu cho website. 
                Bạn có thể tạo mật khẩu để đăng nhập bằng email và mật khẩu.
              </p>
              
              {!showCreateForm ? (
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
                >
                  <span>🔑</span> Tạo mật khẩu mới
                </button>
              ) : (
                <form onSubmit={handleCreatePassword} className="mt-4 space-y-4 max-w-md">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mật khẩu mới
                    </label>
                    <input
                      type="password"
                      name="new_password"
                      value={createForm.new_password}
                      onChange={handleCreateFormInput}
                      required
                      minLength={6}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Tối thiểu 6 ký tự"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Xác nhận mật khẩu
                    </label>
                    <input
                      type="password"
                      name="confirm_password"
                      value={createForm.confirm_password}
                      onChange={handleCreateFormInput}
                      required
                      minLength={6}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Nhập lại mật khẩu"
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                    >
                      {saving ? 'Đang tạo...' : 'Tạo mật khẩu'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowCreateForm(false)
                        setCreateForm({ new_password: '', confirm_password: '' })
                        setMessage(null)
                      }}
                      className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                    >
                      Hủy
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* TH3: Tài khoản hybrid (có cả Google và mật khẩu) */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {accountType === 'hybrid' && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">✅</span>
            <div>
              <p className="text-green-800 font-medium">
                Tài khoản này có thể đăng nhập bằng Google
              </p>
              <p className="text-green-600 text-sm">
                Việc đổi mật khẩu không ảnh hưởng đến đăng nhập bằng Google.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* TH2 & TH3: Form đổi mật khẩu (tài khoản đã có mật khẩu) */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {(accountType === 'local' || accountType === 'hybrid') && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            🔄 Đổi mật khẩu
          </h3>

          <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mật khẩu hiện tại <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                name="old_password"
                value={changeForm.old_password}
                onChange={handleChangeFormInput}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Nhập mật khẩu hiện tại"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mật khẩu mới <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                name="new_password"
                value={changeForm.new_password}
                onChange={handleChangeFormInput}
                required
                minLength={6}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Tối thiểu 6 ký tự"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Xác nhận mật khẩu mới <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                name="confirm_password"
                value={changeForm.confirm_password}
                onChange={handleChangeFormInput}
                required
                minLength={6}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Nhập lại mật khẩu mới"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Đang xử lý...
                  </>
                ) : (
                  <>🔒 Đổi mật khẩu</>
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h4 className="text-sm font-medium text-yellow-800 mb-2">💡 Lưu ý bảo mật:</h4>
            <ul className="text-sm text-yellow-700 list-disc list-inside space-y-1">
              <li>Mật khẩu phải có ít nhất 6 ký tự</li>
              <li>Nên sử dụng kết hợp chữ hoa, chữ thường, số và ký tự đặc biệt</li>
              <li>Không sử dụng mật khẩu giống với các tài khoản khác</li>
            </ul>
          </div>
        </div>
      )}

      {/* Thông tin email */}
      <div className="text-sm text-gray-500 mt-4">
        📧 Email đăng nhập: <span className="font-medium text-gray-700">{email}</span>
      </div>
    </div>
  )
}

export default PasswordSection
