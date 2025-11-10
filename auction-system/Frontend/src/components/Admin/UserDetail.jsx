import { useState, useEffect } from 'react';
import adminAPI from '../../services/adminAPI';

function UserDetail({ userId, onClose }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (userId) {
      fetchUserDetail();
    }
  }, [userId]);

  const fetchUserDetail = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getUserById(userId);
      setUser(response.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi khi tải thông tin user');
      console.error('Error fetching user detail:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!userId) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h3 className="text-xl font-bold text-gray-800">Chi tiết User</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          ) : user ? (
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <h4 className="font-semibold text-gray-800 mb-3">Thông tin cơ bản</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-600">User ID</label>
                    <p className="font-medium text-gray-800">{user.id}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Email</label>
                    <p className="font-medium text-gray-800">{user.email}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Họ tên</label>
                    <p className="font-medium text-gray-800">{user.full_name || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Role</label>
                    <p className="font-medium">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                        {user.role}
                      </span>
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Số điện thoại</label>
                    <p className="font-medium text-gray-800">{user.phone || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Địa chỉ</label>
                    <p className="font-medium text-gray-800">{user.address || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Ngày tạo</label>
                    <p className="font-medium text-gray-800">
                      {new Date(user.created_at).toLocaleString('vi-VN')}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Cập nhật lần cuối</label>
                    <p className="font-medium text-gray-800">
                      {user.updated_at ? new Date(user.updated_at).toLocaleString('vi-VN') : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Statistics */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-800 mb-3">Thống kê hoạt động</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-white rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {user.product_count || 0}
                    </div>
                    <div className="text-sm text-gray-600">Sản phẩm đăng</div>
                  </div>
                  <div className="bg-white rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {user.bid_count || 0}
                    </div>
                    <div className="text-sm text-gray-600">Lượt đấu giá</div>
                  </div>
                  <div className="bg-white rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {user.win_count || 0}
                    </div>
                    <div className="text-sm text-gray-600">Đấu giá thắng</div>
                  </div>
                </div>
              </div>

              {/* Rating */}
              {user.rating_positive !== undefined && (
                <div className="bg-green-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-800 mb-3">Đánh giá</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-gray-600">👍 Đánh giá tích cực</label>
                      <p className="text-2xl font-bold text-green-600">{user.rating_positive}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">👎 Đánh giá tiêu cực</label>
                      <p className="text-2xl font-bold text-red-600">{user.rating_negative}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Additional Info */}
              {user.bio && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-800 mb-2">Giới thiệu</h4>
                  <p className="text-gray-700">{user.bio}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              Không tìm thấy thông tin user
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

export default UserDetail;
