import { useState } from 'react';
import adminAPI from '../../services/adminAPI';

function ProductApproval({ product, onClose, onSuccess }) {
  const [action, setAction] = useState(null); // 'approve' | 'reject'
  const [rejectReason, setRejectReason] = useState('');
  const [loading, setLoading] = useState(false);

  if (!product) return null;

  const handleApprove = async () => {
    if (!confirm(`Bạn có chắc muốn DUYỆT sản phẩm "${product.title}"?`)) return;

    setLoading(true);
    try {
      await adminAPI.approveProduct(product.id);
      alert('✅ Đã duyệt sản phẩm thành công!');
      onSuccess?.();
      onClose();
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi khi duyệt sản phẩm');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      alert('Vui lòng nhập lý do từ chối!');
      return;
    }

    if (!confirm(`Bạn có chắc muốn TỪ CHỐI sản phẩm "${product.title}"?`)) return;

    setLoading(true);
    try {
      await adminAPI.rejectProduct(product.id, rejectReason);
      alert('❌ Đã từ chối sản phẩm!');
      onSuccess?.();
      onClose();
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi khi từ chối sản phẩm');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`⚠️ BẠN CÓ CHẮC CHẮN muốn XÓA VĨNH VIỄN sản phẩm "${product.title}"? Hành động này không thể hoàn tác!`)) return;

    setLoading(true);
    try {
      await adminAPI.deleteProduct(product.id);
      alert('🗑️ Đã xóa sản phẩm!');
      onSuccess?.();
      onClose();
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi khi xóa sản phẩm');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h3 className="text-xl font-bold text-gray-800">Duyệt Sản phẩm</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
            disabled={loading}
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Product Preview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Image */}
            <div>
              <img
                src={product.image_url || 'https://via.placeholder.com/400x300?text=No+Image'}
                alt={product.title}
                className="w-full h-64 object-cover rounded-lg border border-gray-200"
              />
            </div>

            {/* Details */}
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-600">Tên sản phẩm</label>
                <h4 className="text-xl font-bold text-gray-800">{product.title}</h4>
              </div>

              <div>
                <label className="text-sm text-gray-600">Mô tả</label>
                <p className="text-gray-700">{product.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600">Giá khởi điểm</label>
                  <p className="text-lg font-semibold text-blue-600">
                    {product.starting_price?.toLocaleString('vi-VN')} đ
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Giá hiện tại</label>
                  <p className="text-lg font-semibold text-green-600">
                    {product.current_price?.toLocaleString('vi-VN')} đ
                  </p>
                </div>
                {product.buy_now_price && (
                  <div>
                    <label className="text-sm text-gray-600">Giá mua ngay</label>
                    <p className="text-lg font-semibold text-purple-600">
                      {product.buy_now_price?.toLocaleString('vi-VN')} đ
                    </p>
                  </div>
                )}
                <div>
                  <label className="text-sm text-gray-600">Bước giá</label>
                  <p className="text-gray-800">
                    {product.price_step?.toLocaleString('vi-VN')} đ
                  </p>
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-600">Người bán</label>
                <p className="font-medium text-gray-800">
                  {product.seller_email || `ID: ${product.seller_id}`}
                </p>
              </div>

              <div>
                <label className="text-sm text-gray-600">Thời gian kết thúc</label>
                <p className="font-medium text-gray-800">
                  {new Date(product.end_time).toLocaleString('vi-VN')}
                </p>
              </div>

              <div>
                <label className="text-sm text-gray-600">Trạng thái</label>
                <p>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    product.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    product.status === 'active' ? 'bg-green-100 text-green-800' :
                    product.status === 'sold' ? 'bg-blue-100 text-blue-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {product.status}
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Action Selection */}
          {product.status === 'pending' && !action && (
            <div className="border-t pt-6">
              <h4 className="font-semibold text-gray-800 mb-4">Chọn hành động:</h4>
              <div className="flex gap-4">
                <button
                  onClick={() => setAction('approve')}
                  className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                  disabled={loading}
                >
                  ✅ Duyệt sản phẩm
                </button>
                <button
                  onClick={() => setAction('reject')}
                  className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
                  disabled={loading}
                >
                  ❌ Từ chối sản phẩm
                </button>
              </div>
            </div>
          )}

          {/* Approve Confirmation */}
          {action === 'approve' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h4 className="font-semibold text-green-800 mb-3">Xác nhận duyệt sản phẩm</h4>
              <p className="text-green-700 mb-4">
                Sản phẩm sẽ được hiển thị công khai và người dùng có thể đấu giá.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleApprove}
                  disabled={loading}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {loading ? 'Đang xử lý...' : 'Xác nhận duyệt'}
                </button>
                <button
                  onClick={() => setAction(null)}
                  disabled={loading}
                  className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                >
                  Hủy
                </button>
              </div>
            </div>
          )}

          {/* Reject Form */}
          {action === 'reject' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <h4 className="font-semibold text-red-800 mb-3">Từ chối sản phẩm</h4>
              <p className="text-red-700 mb-4">
                Vui lòng cung cấp lý do từ chối để người bán hiểu và cải thiện.
              </p>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Nhập lý do từ chối (bắt buộc)..."
                className="w-full border border-gray-300 rounded-lg px-4 py-2 mb-4"
                rows="4"
                disabled={loading}
              />
              <div className="flex gap-3">
                <button
                  onClick={handleReject}
                  disabled={loading || !rejectReason.trim()}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {loading ? 'Đang xử lý...' : 'Xác nhận từ chối'}
                </button>
                <button
                  onClick={() => {
                    setAction(null);
                    setRejectReason('');
                  }}
                  disabled={loading}
                  className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                >
                  Hủy
                </button>
              </div>
            </div>
          )}

          {/* Delete Option */}
          <div className="border-t pt-6">
            <button
              onClick={handleDelete}
              disabled={loading}
              className="px-6 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 disabled:opacity-50"
            >
              🗑️ Xóa sản phẩm vi phạm
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProductApproval;
