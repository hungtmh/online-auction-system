/* eslint-disable react/prop-types */
import React, { useEffect, useState, useCallback } from 'react'
import sellerAPI from '../../../services/sellerAPI'

export default function SellerPermissionRequests({ productId, isSellerOwner }) {
    const [requests, setRequests] = useState([])
    const [loading, setLoading] = useState(true)
    const [processingId, setProcessingId] = useState(null)

    const fetchRequests = useCallback(async () => {
        if (!productId || !isSellerOwner) return
        try {
            const res = await sellerAPI.getBidRequests(productId)
            setRequests(res?.data || [])
        } catch (error) {
            console.error('Error fetching requests', error)
        } finally {
            setLoading(false)
        }
    }, [productId, isSellerOwner])

    useEffect(() => {
        fetchRequests()
    }, [fetchRequests])

    const handleProcess = async (requestId, status) => {
        if (!window.confirm(`Bạn có chắc chắn muốn ${status === 'approved' ? 'phê duyệt' : 'từ chối'} yêu cầu này ? `)) return

        setProcessingId(requestId)
        try {
            await sellerAPI.processBidRequest(requestId, status)
            await fetchRequests()
        } catch (error) {
            alert('Không thể xử lý yêu cầu: ' + (error?.response?.data?.message || error.message))
        } finally {
            setProcessingId(null)
        }
    }

    if (!isSellerOwner) return null
    if (loading) return null
    // Only show if there are requests (or maybe show empty state? usually only if pending exist is better UX to avoid clutter)
    // Let's show if there are ANY requests, so seller sees history too.
    if (requests.length === 0) return null

    const pendingCount = requests.filter(r => r.status === 'pending').length

    return (
        <div className="mt-6 bg-white rounded-2xl shadow-sm border border-amber-100 overflow-hidden">
            <div className="bg-amber-50 px-6 py-4 border-b border-amber-100 flex justify-between items-center">
                <h3 className="font-semibold text-amber-900 flex items-center gap-2">
                    <span>🔒</span> Yêu cầu quyền đấu giá {pendingCount > 0 && <span className="bg-amber-200 text-amber-900 text-xs px-2 py-0.5 rounded-full ml-1">{pendingCount} mới</span>}
                </h3>
            </div>
            <div className="divide-y divide-gray-100 max-h-60 overflow-y-auto">
                {requests.map((req) => (
                    <div key={req.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="font-semibold text-gray-900">{req.bidder?.full_name || 'Ẩn danh'}</span>
                                <span className={`text - xs px - 2 py - 0.5 rounded - full border ${((req.bidder?.rating_positive || 0) / ((req.bidder?.rating_positive || 0) + (req.bidder?.rating_negative || 0))) >= 0.8
                                        ? 'bg-green-100 text-green-700 border-green-200'
                                        : 'bg-gray-100 text-gray-600 border-gray-200'
                                    } `}>
                                    Rating: +{req.bidder?.rating_positive || 0} / -{req.bidder?.rating_negative || 0}
                                </span>
                            </div>
                            <p className="text-xs text-gray-500">
                                Gửi lúc: {new Date(req.created_at).toLocaleString('vi-VN')}
                            </p>
                            {req.status !== 'pending' && (
                                <div className="mt-1">
                                    <span className={`text - xs font - bold uppercase tracking - wider ${req.status === 'approved' ? 'text-green-600' : 'text-red-600'
                                        } `}>
                                        {req.status === 'approved' ? '✓ Đã duyệt' : '✗ Đã từ chối'}
                                    </span>
                                </div>
                            )}
                        </div>

                        {req.status === 'pending' && (
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handleProcess(req.id, 'approved')}
                                    disabled={!!processingId}
                                    className="px-3 py-1.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 shadow-sm shadow-green-200"
                                >
                                    Duyệt
                                </button>
                                <button
                                    onClick={() => handleProcess(req.id, 'rejected')}
                                    disabled={!!processingId}
                                    className="px-3 py-1.5 bg-white border border-red-200 text-red-600 text-sm font-medium rounded-lg hover:bg-red-50 disabled:opacity-50"
                                >
                                    Từ chối
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    )
}
