import { useState, useEffect } from 'react';
import adminAPI from '../../services/adminAPI';
import { useDialog } from '../../context/DialogContext.jsx';

function ExtensionRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [error, setError] = useState(null);
  const [selectedRequests, setSelectedRequests] = useState([]);
  const { confirm, alert } = useDialog();

  useEffect(() => {
    fetchRequests();
    setSelectedRequests([]);
  }, [filter]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const status = filter === 'all' ? 'all' : filter;
      const response = await adminAPI.getExtensionRequests(status);
      
      const normalizedData = (response.data || []).map(request => ({
        ...request,
        user_email: request.user?.email || 'N/A',
        user_name: request.user?.full_name || 'N/A',
        seller_expired_at: request.user?.seller_expired_at || null
      }));
      
      setRequests(normalizedData);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi khi tải danh sách yêu cầu');
      console.error('Error fetching extension requests:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId, userEmail) => {
    const confirmed = await confirm({
      icon: '✅',
      title: 'Duyệt yêu cầu gia hạn',
      message: `Bạn có chắc muốn DUYỆT yêu cầu gia hạn cho "${userEmail}"? Seller sẽ được gia hạn thêm 7 ngày.`,
      confirmText: 'Duyệt yêu cầu',
    });
    if (!confirmed) return;
    
    try {
      await adminAPI.approveExtensionRequest(requestId);
      setSelectedRequests(prev => prev.filter(id => id !== requestId));
      await new Promise(resolve => setTimeout(resolve, 300));
      await fetchRequests();
      await alert({
        icon: '✅',
        title: 'Đã duyệt yêu cầu',
        message: 'Seller đã được gia hạn thêm 7 ngày.',
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
      message: `Bạn có chắc muốn TỪ CHỐI yêu cầu gia hạn của "${userEmail}"?`,
      confirmText: 'Từ chối',
    });
    if (!confirmed) return;
    
    try {
      await adminAPI.rejectExtensionRequest(requestId);
      setSelectedRequests(prev => prev.filter(id => id !== requestId));
      await new Promise(resolve => setTimeout(resolve, 300));
      await fetchRequests();
      await alert({
        icon: '❌',
        title: 'Đã từ chối',
        message: 'Yêu cầu gia hạn đã bị từ chối.',
      });
    } catch (err) {
      await alert({
        icon: '⚠️',
        title: 'Không thể từ chối',
        message: err.response?.data?.message || 'Vui lòng thử lại.',
      });
    }
  };

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
      icon: '✅',
      title: 'Phê duyệt hàng loạt',
      message: `Bạn có muốn phê duyệt ${selectedRequests.length} yêu cầu gia hạn đã chọn?`,
      confirmText: 'Phê duyệt',
    });
    if (!confirmed) return;

    try {
      const promises = selectedRequests.map(id => adminAPI.approveExtensionRequest(id));
      await Promise.all(promises);
      await new Promise(resolve => setTimeout(resolve, 300));
      setSelectedRequests([]);
      await fetchRequests();
      await alert({
        icon: '✅',
        title: 'Đã phê duyệt',
        message: `Đã phê duyệt ${selectedRequests.length} yêu cầu gia hạn thành công.`,
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
      message: `Bạn có muốn từ chối ${selectedRequests.length} yêu cầu gia hạn đã chọn?`,
      confirmText: 'Từ chối',
    });
    if (!confirmed) return;

    try {
      const promises = selectedRequests.map(id => adminAPI.rejectExtensionRequest(id));
      await Promise.all(promises);
      await new Promise(resolve => setTimeout(resolve, 300));
      setSelectedRequests([]);
      await fetchRequests();
      await alert({
        icon: '❌',
        title: 'Đã từ chối',
        message: `Đã từ chối ${selectedRequests.length} yêu cầu gia hạn.`,
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

  const formatExpiredDate = (dateStr) => {
    if (!dateStr) return 'Chưa có';
    const date = new Date(dateStr);
    const now = new Date();
    const isExpired = date < now;
    const formatted = date.toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
    return (
      <span className={isExpired ? 'text-red-600 font-semibold' : 'text-gray-600'}>
        {formatted}
        {isExpired && ' (Đã hết hạn)'}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold text-amber-800">Yêu cầu gia hạn quyền được bán trong 7 ngày</h3>
          <p className="text-sm text-gray-600 mt-1">Quản lý yêu cầu gia hạn từ các seller</p>
        </div>
        <button
          onClick={fetchRequests}
          className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
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
                ? 'bg-amber-600 text-white'
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

      {/* Requests Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden border border-amber-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-amber-50">
            <tr>
              <th className="px-6 py-3 text-left">
                <input
                  type="checkbox"
                  checked={requests.filter(r => r.status === 'pending').length > 0 && 
                          selectedRequests.length === requests.filter(r => r.status === 'pending').length}
                  onChange={handleSelectAll}
                  className="w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
                  disabled={requests.filter(r => r.status === 'pending').length === 0}
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Seller
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Hết hạn hiện tại
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {requests.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                  Không có yêu cầu gia hạn nào
                </td>
              </tr>
            ) : (
              requests.map((request) => (
                <tr key={request.id} className="hover:bg-amber-50/50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    {request.status === 'pending' ? (
                      <input
                        type="checkbox"
                        checked={selectedRequests.includes(request.id)}
                        onChange={() => handleSelectRequest(request.id)}
                        className="w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
                      />
                    ) : (
                      <span className="text-gray-300">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{request.user_email}</div>
                      {request.user_name && request.user_name !== 'N/A' && (
                        <div className="text-xs text-gray-500">{request.user_name}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {formatExpiredDate(request.seller_expired_at)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 max-w-xs">
                    <div className="line-clamp-2" title={request.reason}>
                      {request.reason || 'Không có lý do'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(request.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(request.created_at).toLocaleString('vi-VN', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {request.status === 'pending' ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApprove(request.id, request.user_email)}
                          className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 transition-colors text-xs font-medium"
                        >
                          ✅ Duyệt
                        </button>
                        <button
                          onClick={() => handleReject(request.id, request.user_email)}
                          className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors text-xs font-medium"
                        >
                          ❌ Từ chối
                        </button>
                      </div>
                    ) : (
                      <span className="text-gray-400 text-xs">-</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Batch Actions */}
      {filter === 'pending' && selectedRequests.length > 0 && (
        <div className="bg-amber-50 rounded-lg shadow p-4 border-2 border-amber-400">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-700">
                Đã chọn: <strong className="text-amber-600">{selectedRequests.length}</strong> yêu cầu
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
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <p className="text-sm text-amber-800">
          📊 Tổng số yêu cầu gia hạn: <strong>{requests.length}</strong>
        </p>
      </div>
    </div>
  );
}

export default ExtensionRequests;
