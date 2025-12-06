import { useState, useEffect } from 'react';
import adminAPI from '../../services/adminAPI';
import { useDialog } from '../../context/DialogContext.jsx';

function UpgradeRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending'); // pending, approved, rejected, all
  const [error, setError] = useState(null);
  const [selectedRequests, setSelectedRequests] = useState([]);
  const { confirm, alert } = useDialog();

  useEffect(() => {
    fetchRequests();
    setSelectedRequests([]); // Reset selection khi đổi filter
  }, [filter]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      // Nếu filter là 'all', gọi API với status = 'all' hoặc không có filter
      const status = filter === 'all' ? 'all' : filter;
      const response = await adminAPI.getUpgradeRequests(status);
      // Normalize data từ backend (join với profiles)
      const normalizedData = (response.data || []).map(request => ({
        ...request,
        user_email: request.profiles?.email || request.user_email || 'N/A',
        current_role: request.profiles?.role || request.current_role || 'N/A',
        requested_role: request.requested_role || 'seller',
        full_name: request.profiles?.full_name || 'N/A'
      }));
      setRequests(normalizedData);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi khi tải danh sách yêu cầu');
      console.error('Error fetching upgrade requests:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId, userEmail, requestedRole) => {
    const confirmed = await confirm({
      icon: '🚀',
      title: 'Duyệt nâng cấp',
      message: `Bạn có chắc muốn DUYỆT yêu cầu lên "${requestedRole}" cho "${userEmail}"?`,
      confirmText: 'Duyệt yêu cầu',
    });
    if (!confirmed) return;
    
    try {
      await adminAPI.approveUpgrade(requestId);
      // Xóa khỏi selection
      setSelectedRequests(prev => prev.filter(id => id !== requestId));
      // Đợi một chút để backend cập nhật xong
      await new Promise(resolve => setTimeout(resolve, 300));
      // Refresh data
      await fetchRequests();
      await alert({
        icon: '✅',
        title: 'Đã duyệt yêu cầu',
        message: 'User đã được nâng cấp role. Yêu cầu đã được chuyển sang tab "Đã duyệt".',
      });
    } catch (err) {
      await alert({
        icon: '⚠️',
        title: 'Không thể duyệt yêu cầu',
        message: err.response?.data?.message || 'Vui lòng thử lại.',
      });
    }
  };

  const handleReject = async (requestId, userEmail) => {
    const confirmed = await confirm({
      icon: '❌',
      title: 'Từ chối yêu cầu',
      message: `Bạn có chắc muốn TỪ CHỐI yêu cầu của "${userEmail}"?`,
      confirmText: 'Từ chối',
    });
    if (!confirmed) return;
    
    try {
      await adminAPI.rejectUpgrade(requestId);
      // Xóa khỏi selection
      setSelectedRequests(prev => prev.filter(id => id !== requestId));
      // Đợi một chút để backend cập nhật xong
      await new Promise(resolve => setTimeout(resolve, 300));
      // Refresh data
      await fetchRequests();
      await alert({
        icon: '❌',
        title: 'Đã từ chối',
        message: 'Yêu cầu đã bị từ chối. Yêu cầu đã được chuyển sang tab "Đã từ chối".',
      });
    } catch (err) {
      await alert({
        icon: '⚠️',
        title: 'Không thể từ chối',
        message: err.response?.data?.message || 'Vui lòng thử lại.',
      });
    }
  };

  // Xử lý checkbox
  const handleSelectRequest = (requestId) => {
    setSelectedRequests(prev => 
      prev.includes(requestId) 
        ? prev.filter(id => id !== requestId)
        : [...prev, requestId]
    );
  };

  const handleSelectAll = () => {
    const pendingRequests = requests.filter(r => r.status === 'pending').map(r => r.id);
    if (selectedRequests.length === pendingRequests.length) {
      setSelectedRequests([]);
    } else {
      setSelectedRequests(pendingRequests);
    }
  };

  // Xử lý hàng loạt
  const handleBatchApprove = async () => {
    if (selectedRequests.length === 0) {
      await alert({
        icon: '⚠️',
        title: 'Chưa chọn yêu cầu',
        message: 'Vui lòng chọn ít nhất một yêu cầu để phê duyệt.',
      });
      return;
    }

    const confirmed = await confirm({
      icon: '🚀',
      title: 'Phê duyệt hàng loạt',
      message: `Bạn có chắc muốn PHÊ DUYỆT ${selectedRequests.length} yêu cầu đã chọn?`,
      confirmText: 'Phê duyệt tất cả',
    });
    if (!confirmed) return;

    try {
      const count = selectedRequests.length;
      const promises = selectedRequests.map(id => adminAPI.approveUpgrade(id));
      await Promise.all(promises);
      // Đợi một chút để backend cập nhật xong
      await new Promise(resolve => setTimeout(resolve, 300));
      // Clear selection
      setSelectedRequests([]);
      // Refresh data
      await fetchRequests();
      await alert({
        icon: '✅',
        title: 'Đã phê duyệt',
        message: `Đã phê duyệt ${count} yêu cầu thành công. Các yêu cầu đã được chuyển sang tab "Đã duyệt".`,
      });
    } catch (err) {
      await alert({
        icon: '⚠️',
        title: 'Lỗi phê duyệt',
        message: err.response?.data?.message || 'Có lỗi xảy ra khi phê duyệt.',
      });
    }
  };

  const handleBatchReject = async () => {
    if (selectedRequests.length === 0) {
      await alert({
        icon: '⚠️',
        title: 'Chưa chọn yêu cầu',
        message: 'Vui lòng chọn ít nhất một yêu cầu để từ chối.',
      });
      return;
    }

    const confirmed = await confirm({
      icon: '❌',
      title: 'Từ chối hàng loạt',
      message: `Bạn có chắc muốn TỪ CHỐI ${selectedRequests.length} yêu cầu đã chọn?`,
      confirmText: 'Từ chối tất cả',
    });
    if (!confirmed) return;

    try {
      const count = selectedRequests.length;
      const promises = selectedRequests.map(id => adminAPI.rejectUpgrade(id));
      await Promise.all(promises);
      // Đợi một chút để backend cập nhật xong
      await new Promise(resolve => setTimeout(resolve, 300));
      // Clear selection
      setSelectedRequests([]);
      // Refresh data
      await fetchRequests();
      await alert({
        icon: '❌',
        title: 'Đã từ chối',
        message: `Đã từ chối ${count} yêu cầu thành công. Các yêu cầu đã được chuyển sang tab "Đã từ chối".`,
      });
    } catch (err) {
      await alert({
        icon: '⚠️',
        title: 'Lỗi từ chối',
        message: err.response?.data?.message || 'Có lỗi xảy ra khi từ chối.',
      });
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
    };
    const labels = {
      pending: '⏳ Chờ duyệt',
      approved: '✅ Đã duyệt',
      rejected: '❌ Đã từ chối',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badges[status]}`}>
        {labels[status]}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Yêu cầu nâng cấp tài khoản</h2>
        <button
          onClick={fetchRequests}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          🔄 Làm mới
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Filter */}
      <div className="flex gap-2">
        {['pending', 'approved', 'rejected', 'all'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg font-medium ${
              filter === status
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {status === 'pending' && '⏳ Chờ duyệt'}
            {status === 'approved' && '✅ Đã duyệt'}
            {status === 'rejected' && '❌ Đã từ chối'}
            {status === 'all' && '📋 Tất cả'}
          </button>
        ))}
      </div>

      {/* Requests List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left">
                <input
                  type="checkbox"
                  checked={requests.filter(r => r.status === 'pending').length > 0 && 
                          selectedRequests.length === requests.filter(r => r.status === 'pending').length}
                  onChange={handleSelectAll}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  disabled={requests.filter(r => r.status === 'pending').length === 0}
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                User Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Role hiện tại
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Role yêu cầu
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Lý do
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Trạng thái
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Ngày tạo
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {requests.length === 0 ? (
              <tr>
                <td colSpan="8" className="px-6 py-8 text-center text-gray-500">
                  Không có yêu cầu nào
                </td>
              </tr>
            ) : (
              requests.map((request) => (
                <tr key={request.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    {request.status === 'pending' ? (
                      <input
                        type="checkbox"
                        checked={selectedRequests.includes(request.id)}
                        onChange={() => handleSelectRequest(request.id)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                    ) : (
                      <span className="text-gray-300">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {request.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div>
                      <div className="font-medium">{request.user_email || 'N/A'}</div>
                      {request.full_name && request.full_name !== 'N/A' && (
                        <div className="text-xs text-gray-500">{request.full_name}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg font-medium text-xs">
                      {request.current_role?.toUpperCase() || 'N/A'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className="px-3 py-1.5 bg-blue-100 text-blue-800 rounded-lg font-medium text-xs">
                      {request.requested_role?.toUpperCase() || 'SELLER'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                    {request.reason || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(request.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(request.created_at).toLocaleDateString('vi-VN')}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Action Buttons - Chỉ hiển thị khi có yêu cầu pending và có checkbox được chọn */}
      {filter === 'pending' && selectedRequests.length > 0 && (
        <div className="bg-white rounded-lg shadow p-4 border-t-2 border-blue-500">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-700">
                Đã chọn: <strong className="text-blue-600">{selectedRequests.length}</strong> yêu cầu
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleBatchApprove}
                className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium flex items-center gap-2"
              >
                <span>✅</span>
                <span>Phê duyệt ({selectedRequests.length})</span>
              </button>
              <button
                onClick={handleBatchReject}
                className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium flex items-center gap-2"
              >
                <span>❌</span>
                <span>Từ chối ({selectedRequests.length})</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          📊 Tổng số yêu cầu: <strong>{requests.length}</strong>
        </p>
      </div>
    </div>
  );
}

export default UpgradeRequests;
