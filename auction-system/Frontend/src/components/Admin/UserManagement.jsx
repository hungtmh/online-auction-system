import { useState, useEffect } from 'react';
import adminAPI from '../../services/adminAPI';
import { useDialog } from '../../context/DialogContext.jsx';

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, bidder, seller, admin
  const [error, setError] = useState(null);
  const { confirm: confirmDialog, alert: showAlert } = useDialog();

  useEffect(() => {
    fetchUsers();
  }, [filter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = filter !== 'all' ? { role: filter } : {};
      // Include cả user đã bị cấm để có thể gỡ cấm
      params.include_deleted = 'true';
      const response = await adminAPI.getAllUsers(params);
      setUsers(response.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi khi tải danh sách users');
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChangeRole = async (userId, newRole) => {
    const confirmed = await confirmDialog({
      icon: '👤',
      title: 'Đổi vai trò',
      message: `Bạn có chắc muốn đổi role thành "${newRole}"?`,
      confirmText: 'Đổi role',
    });
    if (!confirmed) return;
    
    try {
      await adminAPI.updateUserRole(userId, newRole);
      await showAlert({
        icon: '✅',
        title: 'Thành công',
        message: 'Đã thay đổi role thành công!',
      });
      fetchUsers();
    } catch (err) {
      await showAlert({
        icon: '⚠️',
        title: 'Không thể đổi role',
        message: err.response?.data?.message || 'Vui lòng thử lại.',
      });
    }
  };

  const handleBanUser = async (userId, userName) => {
    const confirmed = await confirmDialog({
      icon: '🚫',
      title: 'Cấm user',
      message: `Bạn có chắc muốn cấm user "${userName}"?`,
      confirmText: 'Cấm user',
    });
    if (!confirmed) return;
    
    try {
      await adminAPI.banUser(userId);
      await showAlert({
        icon: '✅',
        title: 'Đã cấm user',
        message: 'User đã bị cấm thành công.',
      });
      fetchUsers();
    } catch (err) {
      await showAlert({
        icon: '⚠️',
        title: 'Không thể cấm user',
        message: err.response?.data?.message || 'Vui lòng thử lại.',
      });
    }
  };

  const handleUnbanUser = async (userId, userName) => {
    const confirmed = await confirmDialog({
      icon: '✅',
      title: 'Hoàn tác cấm',
      message: `Bạn có chắc muốn gỡ cấm user "${userName}"?`,
      confirmText: 'Hoàn tác',
    });
    if (!confirmed) return;
    
    try {
      await adminAPI.unbanUser(userId);
      await showAlert({
        icon: '✅',
        title: 'Đã gỡ cấm user',
        message: 'User đã được gỡ cấm thành công.',
      });
      fetchUsers();
    } catch (err) {
      await showAlert({
        icon: '⚠️',
        title: 'Không thể gỡ cấm user',
        message: err.response?.data?.message || 'Vui lòng thử lại.',
      });
    }
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
        <h2 className="text-2xl font-bold text-gray-800">Quản lý Users</h2>
        <button
          onClick={fetchUsers}
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
        {['all', 'bidder', 'seller', 'admin'].map((role) => (
          <button
            key={role}
            onClick={() => setFilter(role)}
            className={`px-4 py-2 rounded-lg font-medium ${
              filter === role
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {role === 'all' ? 'Tất cả' : role.charAt(0).toUpperCase() + role.slice(1)}
          </button>
        ))}
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Họ tên
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Ngày tạo
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Trạng thái
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Hành động
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                  Không có users nào
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.full_name || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {user.role === 'admin' ? (
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-700">Admin</span>
                        <span className="text-xs text-gray-500" title="Không thể thay đổi role của Admin">
                          🔒
                        </span>
                      </div>
                    ) : (
                    <select
                      value={user.role}
                      onChange={(e) => handleChangeRole(user.id, e.target.value)}
                      className="text-sm border border-gray-300 rounded px-2 py-1"
                        disabled={user.role === 'admin'}
                    >
                      <option value="bidder">Bidder</option>
                      <option value="seller">Seller</option>
                      <option value="admin">Admin</option>
                    </select>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(user.created_at).toLocaleDateString('vi-VN')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {user.is_banned ? (
                      <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                        🚫 Đã bị cấm
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                        ✅ Hoạt động
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                    {user.is_banned ? (
                      <button
                        onClick={() => handleUnbanUser(user.id, user.email)}
                        className="px-3 py-1.5 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium"
                        title="Gỡ cấm user"
                      >
                        ✅ Gỡ cấm
                      </button>
                    ) : (
                    <button
                      onClick={() => handleBanUser(user.id, user.email)}
                        className="px-3 py-1.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium"
                      title="Cấm user"
                    >
                      🚫 Cấm
                    </button>
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
          📊 Tổng số users: <strong>{users.length}</strong>
        </p>
      </div>
    </div>
  );
}

export default UserManagement;
