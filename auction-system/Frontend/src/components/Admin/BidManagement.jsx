import { useState, useEffect } from 'react';
import adminAPI from '../../services/adminAPI';
import { useDialog } from '../../context/DialogContext.jsx';

function BidManagement() {
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [stats, setStats] = useState({
    total: 0,
    won: 0,
    disputed: 0,
    revenue: 0,
  });
  const { confirm, alert, prompt } = useDialog();

  useEffect(() => {
    loadBids();
  }, [filterStatus]);

  const loadBids = async () => {
    setLoading(true);
    try {
      const params = filterStatus !== 'all' ? { status: filterStatus } : {};
      const response = await adminAPI.getBidHistory(params);
      setBids(response.data || []);
      
      // Calculate stats
      const allBids = response.data || [];
      setStats({
        total: allBids.length,
        won: allBids.filter(b => b.status === 'won').length,
        disputed: allBids.filter(b => b.status === 'disputed').length,
        revenue: allBids.reduce((sum, b) => sum + (b.amount || 0), 0),
      });
    } catch (err) {
      console.error('Lỗi tải danh sách bids:', err);
      await alert({
        icon: '⚠️',
        title: 'Không thể tải danh sách',
        message: err.response?.data?.message || 'Vui lòng thử lại sau.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBid = async (bid) => {
    const confirmed = await confirm({
      icon: '⚠️',
      title: 'Huỷ bid',
      message: `Bạn có chắc muốn huỷ bid #${bid.id}?`,
      confirmText: 'Huỷ ngay',
    });
    if (!confirmed) return;

    const reason = await prompt({
      icon: '📝',
      title: 'Lý do huỷ bid',
      message: 'Nhập lý do huỷ (ví dụ: nghi ngờ gian lận, spam...).',
      inputPlaceholder: 'Nhập lý do...',
      inputLabel: 'Lý do',
    });
    if (!reason) return;

    try {
      await adminAPI.cancelBid(bid.id, reason);
      await alert({
        icon: '✅',
        title: 'Đã huỷ bid',
        message: 'Bid đã được huỷ thành công.',
      });
      loadBids();
    } catch (err) {
      await alert({
        icon: '⚠️',
        title: 'Không thể huỷ bid',
        message: err.response?.data?.message || 'Vui lòng thử lại.',
      });
    }
  };

  const handleResolveDispute = async (bid, resolution) => {
    const confirmed = await confirm({
      icon: '⚖️',
      title: resolution === 'approve' ? 'Duyệt tranh chấp' : 'Từ chối tranh chấp',
      message: `Bạn có chắc muốn ${
        resolution === 'approve' ? 'DUYỆT' : 'TỪ CHỐI'
      } tranh chấp này?`,
      confirmText: resolution === 'approve' ? 'Duyệt' : 'Từ chối',
    });
    if (!confirmed) return;

    try {
      await adminAPI.resolveDispute(bid.id, resolution);
      await alert({
        icon: '✅',
        title: 'Thành công',
        message: `Đã ${
          resolution === 'approve' ? 'giải quyết' : 'từ chối'
        } tranh chấp.`,
      });
      loadBids();
    } catch (err) {
      await alert({
        icon: '⚠️',
        title: 'Không thể xử lý tranh chấp',
        message: err.response?.data?.message || 'Vui lòng thử lại.',
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">💰 Quản lý Đấu giá</h2>
        <button
          onClick={loadBids}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          🔄 Làm mới
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="text-blue-600 text-2xl mb-1">📊</div>
          <div className="text-2xl font-bold text-gray-800">{stats.total}</div>
          <div className="text-sm text-gray-600">Tổng số Bids</div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="text-green-600 text-2xl mb-1">🏆</div>
          <div className="text-2xl font-bold text-gray-800">{stats.won}</div>
          <div className="text-sm text-gray-600">Đã thắng</div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-red-600 text-2xl mb-1">⚠️</div>
          <div className="text-2xl font-bold text-gray-800">{stats.disputed}</div>
          <div className="text-sm text-gray-600">Tranh chấp</div>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="text-purple-600 text-2xl mb-1">💵</div>
          <div className="text-2xl font-bold text-gray-800">
            {stats.revenue.toLocaleString('vi-VN')} đ
          </div>
          <div className="text-sm text-gray-600">Tổng doanh thu</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Lọc theo trạng thái:</label>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="border border-gray-300 rounded-lg px-4 py-2"
        >
          <option value="all">Tất cả</option>
          <option value="active">Đang hoạt động</option>
          <option value="won">Đã thắng</option>
          <option value="lost">Đã thua</option>
          <option value="cancelled">Đã hủy</option>
          <option value="disputed">Tranh chấp</option>
        </select>
      </div>

      {/* Bids Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="text-center py-8 text-gray-500">Đang tải...</div>
        ) : bids.length === 0 ? (
          <div className="text-center py-8 text-gray-500">Không có bid nào</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sản phẩm</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Người đấu giá</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Giá đấu</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thời gian</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hành động</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {bids.map((bid) => (
                  <tr key={bid.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">#{bid.id?.slice(0, 8)}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {bid.product_title || `Product #${bid.product_id}`}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {bid.bidder_email || `User #${bid.bidder_id}`}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-green-600">
                      {bid.amount?.toLocaleString('vi-VN')} đ
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(bid.created_at).toLocaleString('vi-VN')}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        bid.status === 'active' ? 'bg-blue-100 text-blue-800' :
                        bid.status === 'won' ? 'bg-green-100 text-green-800' :
                        bid.status === 'lost' ? 'bg-gray-100 text-gray-800' :
                        bid.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                        bid.status === 'disputed' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {bid.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex gap-2">
                        {bid.status === 'disputed' && (
                          <>
                            <button
                              onClick={() => handleResolveDispute(bid, 'approve')}
                              className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-xs"
                            >
                              ✅ Duyệt
                            </button>
                            <button
                              onClick={() => handleResolveDispute(bid, 'reject')}
                              className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-xs"
                            >
                              ❌ Từ chối
                            </button>
                          </>
                        )}
                        {(bid.status === 'active' || bid.status === 'won') && (
                          <button
                            onClick={() => handleCancelBid(bid)}
                            className="px-3 py-1 bg-gray-800 text-white rounded hover:bg-gray-900 text-xs"
                          >
                            🚫 Hủy (Gian lận)
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default BidManagement;
