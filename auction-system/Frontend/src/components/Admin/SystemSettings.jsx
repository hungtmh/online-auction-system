import { useState, useEffect } from 'react';
import adminAPI from '../../services/adminAPI';

function SystemSettings() {
  const [settings, setSettings] = useState({
    system_fee_percent: 5,
    default_auction_duration_days: 7,
    auto_extend_enabled: true,
    auto_extend_minutes: 5,
    min_bid_increment_percent: 5,
  });
  const [emailTemplates, setEmailTemplates] = useState({
    welcome_email: '',
    product_approved: '',
    product_rejected: '',
    bid_won: '',
    bid_outbid: '',
  });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('general'); // 'general' | 'email' | 'backup'

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const response = await adminAPI.getSystemSettings();
      if (response.data) {
        setSettings(response.data.settings || settings);
        setEmailTemplates(response.data.emailTemplates || emailTemplates);
      }
    } catch (err) {
      console.error('Không thể tải cài đặt:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!confirm('Bạn có chắc muốn lưu các thay đổi?')) return;

    setLoading(true);
    try {
      await adminAPI.updateSystemSettings(settings);
      alert('✅ Đã cập nhật cài đặt hệ thống!');
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi khi lưu cài đặt');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEmailTemplates = async () => {
    if (!confirm('Bạn có chắc muốn lưu các mẫu email?')) return;

    setLoading(true);
    try {
      await adminAPI.updateEmailTemplates(emailTemplates);
      alert('✅ Đã cập nhật mẫu email!');
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi khi lưu mẫu email');
    } finally {
      setLoading(false);
    }
  };

  const handleBackupDatabase = async () => {
    if (!confirm('⚠️ Bạn có chắc muốn tạo bản sao lưu database? Thao tác này có thể mất vài phút.')) return;

    setLoading(true);
    try {
      const response = await adminAPI.backupDatabase();
      alert(`✅ Đã tạo bản backup thành công!\n\nFile: ${response.data.filename}\nSize: ${response.data.size}\nThời gian: ${new Date(response.data.timestamp).toLocaleString('vi-VN')}`);
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi khi tạo backup');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">⚙️ Cài đặt Hệ thống</h2>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab('general')}
          className={`px-6 py-3 font-medium ${
            activeTab === 'general'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Cài đặt chung
        </button>
        <button
          onClick={() => setActiveTab('email')}
          className={`px-6 py-3 font-medium ${
            activeTab === 'email'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Mẫu Email
        </button>
        <button
          onClick={() => setActiveTab('backup')}
          className={`px-6 py-3 font-medium ${
            activeTab === 'backup'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Backup & Bảo trì
        </button>
      </div>

      {/* General Settings Tab */}
      {activeTab === 'general' && (
        <div className="bg-white rounded-lg shadow p-6 space-y-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Cài đặt Đấu giá</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* System Fee */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phí hệ thống (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={settings.system_fee_percent}
                onChange={(e) => setSettings({ ...settings, system_fee_percent: parseFloat(e.target.value) })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
                disabled={loading}
              />
              <p className="text-xs text-gray-500 mt-1">Phần trăm hoa hồng từ mỗi giao dịch</p>
            </div>

            {/* Default Auction Duration */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Thời gian đấu giá mặc định (ngày)
              </label>
              <input
                type="number"
                min="1"
                max="30"
                value={settings.default_auction_duration_days}
                onChange={(e) => setSettings({ ...settings, default_auction_duration_days: parseInt(e.target.value) })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
                disabled={loading}
              />
              <p className="text-xs text-gray-500 mt-1">Số ngày mặc định cho một phiên đấu giá</p>
            </div>

            {/* Auto Extend */}
            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={settings.auto_extend_enabled}
                  onChange={(e) => setSettings({ ...settings, auto_extend_enabled: e.target.checked })}
                  className="w-5 h-5"
                  disabled={loading}
                />
                <span className="text-sm font-medium text-gray-700">Bật tự động gia hạn</span>
              </label>
              <p className="text-xs text-gray-500 mt-1">Tự động kéo dài thời gian khi có bid ở phút cuối</p>
            </div>

            {/* Auto Extend Minutes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Thời gian gia hạn (phút)
              </label>
              <input
                type="number"
                min="1"
                max="60"
                value={settings.auto_extend_minutes}
                onChange={(e) => setSettings({ ...settings, auto_extend_minutes: parseInt(e.target.value) })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
                disabled={!settings.auto_extend_enabled || loading}
              />
              <p className="text-xs text-gray-500 mt-1">Số phút tự động thêm khi có bid cuối</p>
            </div>

            {/* Min Bid Increment */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bước giá tối thiểu (%)
              </label>
              <input
                type="number"
                min="1"
                max="50"
                value={settings.min_bid_increment_percent}
                onChange={(e) => setSettings({ ...settings, min_bid_increment_percent: parseInt(e.target.value) })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
                disabled={loading}
              />
              <p className="text-xs text-gray-500 mt-1">Phần trăm tối thiểu tăng giá mỗi lần bid</p>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t">
            <button
              onClick={handleSaveSettings}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Đang lưu...' : '💾 Lưu cài đặt'}
            </button>
          </div>
        </div>
      )}

      {/* Email Templates Tab */}
      {activeTab === 'email' && (
        <div className="bg-white rounded-lg shadow p-6 space-y-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Mẫu Email</h3>

          <div className="space-y-6">
            {/* Welcome Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Chào mừng
              </label>
              <textarea
                value={emailTemplates.welcome_email}
                onChange={(e) => setEmailTemplates({ ...emailTemplates, welcome_email: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
                rows="4"
                placeholder="Chào mừng {{username}} đến với hệ thống đấu giá..."
                disabled={loading}
              />
            </div>

            {/* Product Approved */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Sản phẩm được duyệt
              </label>
              <textarea
                value={emailTemplates.product_approved}
                onChange={(e) => setEmailTemplates({ ...emailTemplates, product_approved: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
                rows="4"
                placeholder="Sản phẩm {{product_name}} của bạn đã được duyệt..."
                disabled={loading}
              />
            </div>

            {/* Product Rejected */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Sản phẩm bị từ chối
              </label>
              <textarea
                value={emailTemplates.product_rejected}
                onChange={(e) => setEmailTemplates({ ...emailTemplates, product_rejected: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
                rows="4"
                placeholder="Sản phẩm {{product_name}} đã bị từ chối. Lý do: {{reason}}..."
                disabled={loading}
              />
            </div>

            {/* Bid Won */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Thắng đấu giá
              </label>
              <textarea
                value={emailTemplates.bid_won}
                onChange={(e) => setEmailTemplates({ ...emailTemplates, bid_won: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
                rows="4"
                placeholder="Chúc mừng! Bạn đã thắng đấu giá {{product_name}}..."
                disabled={loading}
              />
            </div>

            {/* Bid Outbid */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Bị trả giá cao hơn
              </label>
              <textarea
                value={emailTemplates.bid_outbid}
                onChange={(e) => setEmailTemplates({ ...emailTemplates, bid_outbid: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
                rows="4"
                placeholder="Bạn đã bị trả giá cao hơn trong {{product_name}}..."
                disabled={loading}
              />
            </div>
          </div>

          <div className="text-xs text-gray-500 bg-gray-50 p-4 rounded-lg">
            <p className="font-medium mb-2">Các biến có sẵn:</p>
            <ul className="list-disc list-inside space-y-1">
              <li><code>{'{{username}}'}</code> - Tên người dùng</li>
              <li><code>{'{{email}}'}</code> - Email người dùng</li>
              <li><code>{'{{product_name}}'}</code> - Tên sản phẩm</li>
              <li><code>{'{{price}}'}</code> - Giá tiền</li>
              <li><code>{'{{reason}}'}</code> - Lý do từ chối</li>
            </ul>
          </div>

          <div className="flex justify-end pt-4 border-t">
            <button
              onClick={handleSaveEmailTemplates}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Đang lưu...' : '💾 Lưu mẫu email'}
            </button>
          </div>
        </div>
      )}

      {/* Backup Tab */}
      {activeTab === 'backup' && (
        <div className="bg-white rounded-lg shadow p-6 space-y-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Backup & Bảo trì</h3>

          <div className="space-y-4">
            <div className="border border-gray-200 rounded-lg p-6">
              <h4 className="font-semibold text-gray-800 mb-2">Sao lưu Database</h4>
              <p className="text-sm text-gray-600 mb-4">
                Tạo bản sao lưu toàn bộ database. Thao tác này có thể mất vài phút.
              </p>
              <button
                onClick={handleBackupDatabase}
                disabled={loading}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? 'Đang backup...' : '💾 Tạo Backup Ngay'}
              </button>
            </div>

            <div className="border border-gray-200 rounded-lg p-6">
              <h4 className="font-semibold text-gray-800 mb-2">Lịch sử Backup</h4>
              <p className="text-sm text-gray-600 mb-4">
                Danh sách các bản backup gần đây (chức năng đang phát triển)
              </p>
              <div className="text-sm text-gray-500 italic">
                Chưa có bản backup nào
              </div>
            </div>

            <div className="border border-yellow-200 bg-yellow-50 rounded-lg p-6">
              <h4 className="font-semibold text-yellow-800 mb-2">⚠️ Bảo trì Hệ thống</h4>
              <p className="text-sm text-yellow-700 mb-4">
                Các thao tác bảo trì nguy hiểm - chỉ sử dụng khi cần thiết
              </p>
              <div className="space-x-3">
                <button
                  disabled
                  className="px-6 py-2 bg-gray-400 text-white rounded-lg cursor-not-allowed"
                >
                  🧹 Dọn dẹp dữ liệu cũ
                </button>
                <button
                  disabled
                  className="px-6 py-2 bg-gray-400 text-white rounded-lg cursor-not-allowed"
                >
                  🔄 Khôi phục từ backup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SystemSettings;
