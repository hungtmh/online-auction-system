import { useState, useEffect } from 'react';
import adminAPI from '../../services/adminAPI';

function UpgradeRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending'); // pending, approved, rejected
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchRequests();
  }, [filter]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getUpgradeRequests(filter);
      setRequests(response.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi khi tải danh sách yêu cầu');
      console.error('Error fetching upgrade requests:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId, userEmail, requestedRole) => {
    if (!confirm(`Bạn có chắc muốn DUYỆT yêu cầu nâng cấp lên "${requestedRole}" cho user "${userEmail}"?`)) return;
    
    try {
      await adminAPI.approveUpgrade(requestId);
      alert('✅ Đã duyệt yêu cầu! User đã được nâng cấp role.');
      fetchRequests();
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi khi duyệt yêu cầu');
    }
  };

  const handleReject = async (requestId, userEmail) => {
    if (!confirm(`Bạn có chắc muốn TỪ CHỐI yêu cầu của user "${userEmail}"?`)) return;
    
    try {
      await adminAPI.rejectUpgrade(requestId);
      alert('❌ Đã từ chối yêu cầu!');
      fetchRequests();
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi khi từ chối yêu cầu');
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
        {['pending', 'approved', 'rejected'].map((status) => (
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
          </button>
        ))}
      </div>

      {/* Requests List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Hành động
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {request.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {request.user_email || `User ID: ${request.user_id}`}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    <span className="px-2 py-1 bg-gray-100 rounded">
                      {request.current_role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded font-medium">
                      {request.requested_role}
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                    {request.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleApprove(request.id, request.user_email, request.requested_role)}
                          className="text-green-600 hover:text-green-900"
                          title="Duyệt"
                        >
                          ✅ Duyệt
                        </button>
                        <button
                          onClick={() => handleReject(request.id, request.user_email)}
                          className="text-red-600 hover:text-red-900"
                          title="Từ chối"
                        >
                          ❌ Từ chối
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

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
