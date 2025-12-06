import { useState, useEffect } from 'react';
import adminAPI from '../../services/adminAPI';
import { useDialog } from '../../context/DialogContext.jsx';

// Placeholder image khi không có ảnh (SVG inline)
const DEFAULT_PRODUCT_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='200' viewBox='0 0 300 200'%3E%3Crect fill='%23e5e7eb' width='300' height='200'/%3E%3Ctext fill='%239ca3af' font-family='Arial' font-size='14' x='50%25' y='50%25' text-anchor='middle' dy='.3em'%3EKhông có ảnh%3C/text%3E%3C/svg%3E";

// Function để loại bỏ HTML tags và chỉ lấy text thuần túy
const stripHtml = (html) => {
  if (!html) return '';
  // Tạo một div tạm để parse HTML
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  // Lấy text content và loại bỏ khoảng trắng thừa
  return (tmp.textContent || tmp.innerText || '').trim();
};

function ProductManagement() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, pending, completed, rejected, cancelled
  const [error, setError] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const { confirm, alert } = useDialog();

  useEffect(() => {
    fetchProducts();
  }, [filter]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      // Nếu filter = 'all' thì không gửi status param
      const params = filter !== 'all' ? { status: filter } : {};
      const response = await adminAPI.getAllProducts(params);
      setProducts(response.data || []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi khi tải danh sách sản phẩm');
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (productId, productTitle) => {
    const confirmed = await confirm({
      icon: '✅',
      title: 'Duyệt sản phẩm',
      message: `Bạn có chắc muốn DUYỆT sản phẩm "${productTitle}"?`,
      confirmText: 'Duyệt ngay',
    });
    if (!confirmed) return;
    
    try {
      await adminAPI.approveProduct(productId);
      await alert({
        icon: '✅',
        title: 'Thành công',
        message: 'Sản phẩm đã được duyệt.',
      });
      fetchProducts();
    } catch (err) {
      await alert({
        icon: '⚠️',
        title: 'Không thể duyệt sản phẩm',
        message: err.response?.data?.message || 'Vui lòng thử lại.',
      });
    }
  };

  const handleReject = async (productId, productTitle) => {
    if (!rejectReason.trim()) {
      await alert({
        icon: '✍️',
        title: 'Thiếu lý do',
        message: 'Vui lòng nhập lý do từ chối trước khi tiếp tục.',
      });
      return;
    }

    const confirmed = await confirm({
      icon: '❌',
      title: 'Từ chối sản phẩm',
      message: `Bạn có chắc muốn TỪ CHỐI sản phẩm "${productTitle}"?`,
      confirmText: 'Từ chối',
    });
    if (!confirmed) return;
    
    try {
      await adminAPI.rejectProduct(productId, rejectReason);
      await alert({
        icon: '❌',
        title: 'Đã từ chối',
        message: 'Sản phẩm đã bị từ chối.',
      });
      setSelectedProduct(null);
      setRejectReason('');
      fetchProducts();
    } catch (err) {
      await alert({
        icon: '⚠️',
        title: 'Không thể từ chối',
        message: err.response?.data?.message || 'Vui lòng thử lại.',
      });
    }
  };

  const handleCancel = async (productId, productTitle) => {
    const confirmed = await confirm({
      icon: '🚫',
      title: 'Hủy sản phẩm',
      message: `Bạn có chắc muốn HỦY sản phẩm "${productTitle}"?\n\nSản phẩm sẽ không hiển thị cho người dùng nhưng vẫn được lưu trong hệ thống.`,
      confirmText: 'Hủy sản phẩm',
      cancelText: 'Giữ lại',
    });
    if (!confirmed) return;
    
    try {
      await adminAPI.cancelProduct(productId);
      await alert({
        icon: '🚫',
        title: 'Đã hủy sản phẩm',
        message: 'Sản phẩm đã được hủy và không hiển thị cho người dùng.',
      });
      fetchProducts();
    } catch (err) {
      await alert({
        icon: '⚠️',
        title: 'Không thể hủy',
        message: err.response?.data?.message || 'Vui lòng thử lại.',
      });
    }
  };

  const handleUncancel = async (productId, productTitle) => {
    const confirmed = await confirm({
      icon: '✅',
      title: 'Gỡ hủy sản phẩm',
      message: `Bạn có chắc muốn GỠ HỦY sản phẩm "${productTitle}"?\n\nSản phẩm sẽ chuyển về trạng thái chờ duyệt và bạn có thể duyệt lại.`,
      confirmText: 'Gỡ hủy',
      cancelText: 'Hủy',
    });
    if (!confirmed) return;
    
    try {
      await adminAPI.uncancelProduct(productId);
      await alert({
        icon: '✅',
        title: 'Đã gỡ hủy sản phẩm',
        message: 'Sản phẩm đã được gỡ hủy và chuyển về trạng thái chờ duyệt.',
      });
      fetchProducts();
    } catch (err) {
      await alert({
        icon: '⚠️',
        title: 'Không thể gỡ hủy',
        message: err.response?.data?.message || 'Vui lòng thử lại.',
      });
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      active: 'bg-green-100 text-green-800', // Giữ để tương thích với dữ liệu cũ
      completed: 'bg-blue-100 text-blue-800',
      rejected: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800',
    };
    const labels = {
      pending: '⏳ Chờ duyệt',
      approved: '✅ Đã duyệt',
      active: '✅ Đã duyệt', // Giữ để tương thích với dữ liệu cũ
      completed: '💰 Đã hoàn thành',
      rejected: '❌ Đã từ chối',
      cancelled: '🚫 Đã hủy',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badges[status] || 'bg-gray-100 text-gray-800'}`}>
        {labels[status] || status}
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
        <h2 className="text-2xl font-bold text-gray-800">Quản lý Sản phẩm</h2>
        <button
          onClick={fetchProducts}
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
      <div className="flex gap-2 flex-wrap">
        {['all', 'pending', 'completed', 'rejected', 'cancelled'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg font-medium ${
              filter === status
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {status === 'all' && '📋 Tất cả'}
            {status === 'pending' && '⏳ Chờ duyệt'}
            {status === 'completed' && '💰 Đã hoàn thành'}
            {status === 'rejected' && '❌ Đã từ chối'}
            {status === 'cancelled' && '🚫 Đã hủy'}
          </button>
        ))}
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500">
            Không có sản phẩm nào
          </div>
        ) : (
          products.map((product) => (
            <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              {/* Product Image */}
              <img
                src={product.thumbnail_url || product.image_url || DEFAULT_PRODUCT_IMAGE}
                alt={product.name || product.title}
                className="w-full h-48 object-cover"
                onError={(e) => { e.target.src = DEFAULT_PRODUCT_IMAGE; }}
              />
              
              {/* Product Info */}
              <div className="p-4 space-y-2">
                <h3 className="font-semibold text-gray-800 line-clamp-2">
                  {product.name || product.title}
                </h3>
                <p className="text-sm text-gray-600 line-clamp-2">
                  {stripHtml(product.description) || 'Không có mô tả'}</p>
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-blue-600">
                    {product.current_price?.toLocaleString('vi-VN')} đ
                  </span>
                  {getStatusBadge(product.status)}
                </div>
                
                {/* Seller Info */}
                <p className="text-xs text-gray-500">
                  Người bán: {product.seller_email || `ID: ${product.seller_id}`}
                </p>

                {/* Actions */}
                <div className="pt-2 space-y-2">
                  {product.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleApprove(product.id, product.name || product.title)}
                        className="w-full px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                      >
                        ✅ Duyệt
                      </button>
                      <button
                        onClick={() => setSelectedProduct(product)}
                        className="w-full px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                      >
                        ❌ Từ chối
                      </button>
                    </>
                  )}
                  {product.status === 'cancelled' ? (
                    <button
                      onClick={() => handleUncancel(product.id, product.name || product.title)}
                      className="w-full px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      ✅ Gỡ hủy
                    </button>
                  ) : (
                    <button
                      onClick={() => handleCancel(product.id, product.name || product.title)}
                      className="w-full px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                    >
                      🚫 Hủy
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Stats */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          📊 Tổng số sản phẩm: <strong>{products.length}</strong>
        </p>
      </div>

      {/* Reject Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4">Từ chối sản phẩm</h3>
            <p className="text-gray-600 mb-4">
              Sản phẩm: <strong>{selectedProduct.name || selectedProduct.title}</strong>
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Nhập lý do từ chối..."
              className="w-full border border-gray-300 rounded px-3 py-2 mb-4"
              rows="4"
            />
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setSelectedProduct(null);
                  setRejectReason('');
                }}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
              >
                Hủy
              </button>
              <button
                onClick={() => handleReject(selectedProduct.id, selectedProduct.name || selectedProduct.title)}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Xác nhận từ chối
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProductManagement;
