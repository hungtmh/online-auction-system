import { useState, useEffect } from 'react';
import adminAPI from '../../services/adminAPI';
import { useDialog } from '../../context/DialogContext.jsx';

function SpamManagement() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('pending');
  const [stats, setStats] = useState({
    pending: 0,
    resolved: 0,
    dismissed: 0,
    total: 0
  });
  const [selectedReport, setSelectedReport] = useState(null);
  const { confirm, alert } = useDialog();

  useEffect(() => {
    loadReports();
  }, [filterStatus]);

  const loadReports = async () => {
    setLoading(true);
    try {
      const response = await adminAPI.getSpamReports({ status: filterStatus });
      setReports(response.data || []);
      if (response.stats) {
        setStats(response.stats);
      }
    } catch (err) {
      console.error('Lỗi tải danh sách báo cáo spam:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (report, action) => {
    const actionLabels = {
      warn: 'Cảnh cáo người dùng',
      ban_user: 'Cấm người dùng',
      delete_content: 'Xóa nội dung vi phạm',
      ban_and_delete: 'Cấm người dùng VÀ xóa nội dung'
    };

    const confirmed = await confirm({
      icon: '⚠️',
      title: 'Xử lý báo cáo spam',
      message: `Bạn có chắc muốn thực hiện: "${actionLabels[action]}"?\n\nNgười bị báo cáo: ${report.reported_user?.email || 'N/A'}`,
      confirmText: 'Xác nhận',
    });

    if (!confirmed) return;

    try {
      await adminAPI.resolveSpamReport(report.id, { action });
      await alert({
        icon: '✅',
        title: 'Thành công',
        message: 'Đã xử lý báo cáo spam.',
      });
      setSelectedReport(null);
      loadReports();
    } catch (err) {
      await alert({
        icon: '⚠️',
        title: 'Lỗi',
        message: err.response?.data?.message || 'Không thể xử lý báo cáo.',
      });
    }
  };

  const handleDismiss = async (report) => {
    const confirmed = await confirm({
      icon: '🚫',
      title: 'Bỏ qua báo cáo',
      message: 'Bạn có chắc muốn bỏ qua báo cáo này? (Đánh dấu không phải spam)',
      confirmText: 'Bỏ qua',
    });

    if (!confirmed) return;

    try {
      await adminAPI.dismissSpamReport(report.id, { admin_note: 'Không phải spam' });
      await alert({
        icon: '✅',
        title: 'Đã bỏ qua',
        message: 'Báo cáo đã được đánh dấu là không phải spam.',
      });
      setSelectedReport(null);
      loadReports();
    } catch (err) {
      await alert({
        icon: '⚠️',
        title: 'Lỗi',
        message: err.response?.data?.message || 'Không thể bỏ qua báo cáo.',
      });
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-800',
      resolved: 'bg-green-100 text-green-800',
      dismissed: 'bg-gray-100 text-gray-800',
    };
    const labels = {
      pending: '⏳ Chờ xử lý',
      resolved: '✅ Đã xử lý',
      dismissed: '🚫 Đã bỏ qua',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badges[status]}`}>
        {labels[status]}
      </span>
    );
  };

  const getTypeBadge = (type) => {
    const badges = {
      user: 'bg-blue-100 text-blue-800',
      product: 'bg-purple-100 text-purple-800',
      bid: 'bg-orange-100 text-orange-800',
      message: 'bg-pink-100 text-pink-800',
    };
    const labels = {
      user: '👤 User',
      product: '📦 Sản phẩm',
      bid: '💰 Bid',
      message: '💬 Tin nhắn',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badges[type] || 'bg-gray-100 text-gray-800'}`}>
        {labels[type] || type}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">🚨 Quản lý Spam</h2>
        <button
          onClick={loadReports}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          🔄 Làm mới
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="text-yellow-600 text-2xl mb-1">⏳</div>
          <div className="text-2xl font-bold text-gray-800">{stats.pending}</div>
          <div className="text-sm text-gray-600">Chờ xử lý</div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="text-green-600 text-2xl mb-1">✅</div>
          <div className="text-2xl font-bold text-gray-800">{stats.resolved}</div>
          <div className="text-sm text-gray-600">Đã xử lý</div>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="text-gray-600 text-2xl mb-1">🚫</div>
          <div className="text-2xl font-bold text-gray-800">{stats.dismissed}</div>
          <div className="text-sm text-gray-600">Đã bỏ qua</div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-red-600 text-2xl mb-1">📊</div>
          <div className="text-2xl font-bold text-gray-800">{stats.total}</div>
          <div className="text-sm text-gray-600">Tổng báo cáo</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Lọc theo trạng thái:</label>
        <div className="flex gap-2">
          {['pending', 'resolved', 'dismissed', 'all'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 rounded-lg font-medium ${
                filterStatus === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {status === 'pending' && '⏳ Chờ xử lý'}
              {status === 'resolved' && '✅ Đã xử lý'}
              {status === 'dismissed' && '🚫 Đã bỏ qua'}
              {status === 'all' && '📋 Tất cả'}
            </button>
          ))}
        </div>
      </div>

      {/* Reports Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="text-center py-8 text-gray-500">Đang tải...</div>
        ) : reports.length === 0 ? (
          <div className="text-center py-8 text-gray-500">Không có báo cáo spam nào</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Loại</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Người báo cáo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Người bị báo cáo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lý do</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thời gian</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hành động</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reports.map((report) => (
                  <tr key={report.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">
                      #{report.id?.slice(0, 8)}
                    </td>
                    <td className="px-6 py-4">
                      {getTypeBadge(report.report_type)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {report.reporter?.email || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div>
                        {report.reported_user?.email || 'N/A'}
                        {report.reported_user?.is_banned && (
                          <span className="ml-2 text-xs text-red-600">(Đã bị cấm)</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                      {report.reason || 'Không có lý do'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(report.created_at).toLocaleString('vi-VN')}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(report.status)}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {report.status === 'pending' ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => setSelectedReport(report)}
                            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs"
                          >
                            👁️ Xem
                          </button>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs">
                          {report.action_taken === 'dismissed' ? 'Bỏ qua' : report.action_taken}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-gray-800">Chi tiết báo cáo spam</h3>
                <button
                  onClick={() => setSelectedReport(null)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                {/* Report Info */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold mb-2">Thông tin báo cáo</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Loại:</span>
                      <span className="ml-2">{getTypeBadge(selectedReport.report_type)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Thời gian:</span>
                      <span className="ml-2">{new Date(selectedReport.created_at).toLocaleString('vi-VN')}</span>
                    </div>
                  </div>
                </div>

                {/* Reporter */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="font-semibold mb-2">👤 Người báo cáo</h4>
                  <p className="text-sm">{selectedReport.reporter?.full_name || 'N/A'}</p>
                  <p className="text-sm text-gray-600">{selectedReport.reporter?.email || 'N/A'}</p>
                </div>

                {/* Reported User */}
                <div className="bg-red-50 rounded-lg p-4">
                  <h4 className="font-semibold mb-2">🚨 Người bị báo cáo</h4>
                  <p className="text-sm">{selectedReport.reported_user?.full_name || 'N/A'}</p>
                  <p className="text-sm text-gray-600">{selectedReport.reported_user?.email || 'N/A'}</p>
                  {selectedReport.reported_user?.is_banned && (
                    <p className="text-sm text-red-600 mt-1">⚠️ User này đã bị cấm</p>
                  )}
                </div>

                {/* Reason */}
                <div className="bg-yellow-50 rounded-lg p-4">
                  <h4 className="font-semibold mb-2">📝 Lý do báo cáo</h4>
                  <p className="text-sm text-gray-700">{selectedReport.reason || 'Không có lý do cụ thể'}</p>
                </div>

                {/* Actions */}
                {selectedReport.status === 'pending' && (
                  <div className="border-t pt-4">
                    <h4 className="font-semibold mb-3">⚡ Hành động xử lý</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleResolve(selectedReport, 'warn')}
                        className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600"
                      >
                        ⚠️ Cảnh cáo
                      </button>
                      <button
                        onClick={() => handleResolve(selectedReport, 'delete_content')}
                        className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
                      >
                        🗑️ Xóa nội dung
                      </button>
                      <button
                        onClick={() => handleResolve(selectedReport, 'ban_user')}
                        className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                      >
                        🚫 Cấm user
                      </button>
                      <button
                        onClick={() => handleResolve(selectedReport, 'ban_and_delete')}
                        className="px-4 py-2 bg-red-700 text-white rounded-lg hover:bg-red-800"
                      >
                        ⛔ Cấm + Xóa
                      </button>
                    </div>
                    <button
                      onClick={() => handleDismiss(selectedReport)}
                      className="w-full mt-3 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                    >
                      ✖️ Bỏ qua (Không phải spam)
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SpamManagement;

