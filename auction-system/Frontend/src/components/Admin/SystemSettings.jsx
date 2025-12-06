import { useState, useEffect } from 'react';
import adminAPI from '../../services/adminAPI';
import { useDialog } from '../../context/DialogContext.jsx';

function SystemSettings() {
  const [settings, setSettings] = useState({
    default_auction_duration_days: 7,
    auto_extend_enabled: true,
    auto_extend_minutes: 10,      // Gia hạn thêm 10 phút
    auto_extend_threshold: 5,     // Khi còn 5 phút trước kết thúc
    min_bid_increment_percent: 5,
  });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('general'); // 'general' | 'email' | 'backup'
  const { confirm, alert } = useDialog();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const response = await adminAPI.getSystemSettings();
      if (response.data) {
        setSettings(response.data.settings || settings);
      }
    } catch (err) {
      console.error('Không thể tải cài đặt:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    const confirmed = await confirm({
      icon: '💾',
      title: 'Lưu cài đặt',
      message: 'Bạn có chắc muốn lưu các thay đổi?',
      confirmText: 'Lưu',
    });
    if (!confirmed) return;

    setLoading(true);
    try {
      await adminAPI.updateSystemSettings(settings);
      await alert({
        icon: '✅',
        title: 'Đã lưu',
        message: 'Cài đặt hệ thống đã được cập nhật.',
      });
    } catch (err) {
      await alert({
        icon: '⚠️',
        title: 'Không thể lưu cài đặt',
        message: err.response?.data?.message || 'Vui lòng thử lại.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">⚙️ Cài đặt Hệ thống</h2>

      {/* Tabs - Removed border */}
      <div className="flex mb-6">
        <button
          onClick={() => setActiveTab('general')}
          className={`px-6 py-3 font-medium ${
            activeTab === 'general'
              ? 'text-blue-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          {/* Removed the text 'Cài đặt chung' from the UI. */}
        </button>
      </div>

      {/* General Settings Tab */}
      {activeTab === 'general' && (
        <div className="bg-white rounded-lg shadow p-6 space-y-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Cài đặt Đấu giá</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Auto Extend */}
            <div className="md:col-span-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={settings.auto_extend_enabled === true || settings.auto_extend_enabled === 'true'}
                  onChange={(e) => setSettings({ ...settings, auto_extend_enabled: e.target.checked })}
                  className="w-5 h-5"
                  disabled={loading}
                />
                <span className="text-sm font-medium text-gray-700">Bật tự động gia hạn cho tất cả sản phẩm</span>
              </label>
              <p className="text-xs text-gray-500 mt-1">Khi có lượt đấu giá mới trước thời điểm kết thúc, sản phẩm sẽ tự động gia hạn thêm</p>
            </div>

            {/* Auto Extend Threshold - Ngưỡng kích hoạt */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ⏰ Ngưỡng kích hoạt (phút)
              </label>
              <input
                type="number"
                min="1"
                max="30"
                value={settings.auto_extend_threshold || 5}
                onChange={(e) => setSettings({ ...settings, auto_extend_threshold: parseInt(e.target.value) })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
                disabled={!(settings.auto_extend_enabled === true || settings.auto_extend_enabled === 'true') || loading}
              />
              <p className="text-xs text-gray-500 mt-1">Nếu có bid trong khoảng thời gian này trước khi kết thúc thì sẽ gia hạn</p>
            </div>

            {/* Auto Extend Minutes - Thời gian gia hạn */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ⏱️ Thời gian gia hạn (phút)
              </label>
              <input
                type="number"
                min="1"
                max="60"
                value={settings.auto_extend_minutes || 10}
                onChange={(e) => setSettings({ ...settings, auto_extend_minutes: parseInt(e.target.value) })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
                disabled={!(settings.auto_extend_enabled === true || settings.auto_extend_enabled === 'true') || loading}
              />
              <p className="text-xs text-gray-500 mt-1">Số phút được thêm vào thời gian kết thúc</p>
            </div>

            {/* Min Bid Increment */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                💰 Bước giá tối thiểu (%)
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
              <p className="text-xs text-gray-500 mt-1">Seller phải đặt bước giá ≥ X% của giá khởi điểm. VD: 5% của 1,000,000đ = bước giá tối thiểu 50,000đ</p>
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
    </div>
  );
}

export default SystemSettings;
