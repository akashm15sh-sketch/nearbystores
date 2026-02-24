'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { getImageUrl } from '@/lib/imageUrl';
import Link from 'next/link';

interface Store {
    _id: string;
    name: string;
    category: string;
    description?: string;
    owner: {
        username: string;
        email: string;
    };
    approvalStatus: 'pending' | 'approved' | 'rejected';
    createdAt: string;
    location: {
        address: string;
        coordinates?: number[];
    };
    contact?: {
        phone?: string;
        email?: string;
        whatsapp?: string;
    };
    schedule?: Record<string, { open: string; close: string; isOpen: boolean }>;
    products?: { name: string; price: number; inStock: boolean }[];
    paymentMethods?: {
        upiId?: string;
        cashOnDelivery?: boolean;
        razorpayEnabled?: boolean;
    };
    images?: string[];
}

export default function AdminDashboardPage() {
    const [stats, setStats] = useState({
        totalStores: 0,
        pendingStores: 0,
        totalUsers: 0
    });
    const [pendingStores, setPendingStores] = useState<Store[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedStore, setSelectedStore] = useState<Store | null>(null);
    const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    // Auto-dismiss notification
    useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => setNotification(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [notification]);

    const fetchDashboardData = async () => {
        try {
            const [storesRes, usersRes] = await Promise.all([
                api.get('/stores/admin/all'),
                api.get('/users/admin/all')
            ]);

            const allStores = storesRes.data.stores;
            const pending = allStores.filter((s: Store) => s.approvalStatus === 'pending');

            setStats({
                totalStores: allStores.length,
                pendingStores: pending.length,
                totalUsers: usersRes.data.users.length
            });

            setPendingStores(pending);
        } catch (error) {
            console.error('Failed to fetch admin data', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleApprove = async (storeId: string, e?: React.MouseEvent) => {
        e?.stopPropagation();
        try {
            await api.patch(`/stores/admin/${storeId}/approve`);
            setPendingStores(prev => prev.filter(s => s._id !== storeId));
            setStats(prev => ({
                ...prev,
                pendingStores: prev.pendingStores - 1
            }));
            setSelectedStore(null);
            setNotification({ type: 'success', message: 'Store approved successfully! The partner will be redirected to their dashboard.' });
        } catch (error) {
            console.error(error);
            setNotification({ type: 'error', message: 'Failed to approve store' });
        }
    };

    const handleReject = async (storeId: string, e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (!confirm('Are you sure you want to reject this store?')) return;
        try {
            await api.patch(`/stores/admin/${storeId}/reject`);
            setPendingStores(prev => prev.filter(s => s._id !== storeId));
            setStats(prev => ({
                ...prev,
                pendingStores: prev.pendingStores - 1
            }));
            setSelectedStore(null);
            setNotification({ type: 'success', message: 'Store rejected.' });
        } catch (error) {
            console.error(error);
            setNotification({ type: 'error', message: 'Failed to reject store' });
        }
    };

    if (isLoading) {
        return <div className="flex items-center justify-center h-full py-20"><div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div></div>;
    }

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold text-slate-800">Dashboard Overview</h1>

            {/* Inline Notification — positioned in flow, not floating */}
            {notification && (
                <div className={`px-5 py-3.5 rounded-xl text-sm font-medium flex items-center justify-between transition-all ${notification.type === 'success'
                    ? 'bg-green-50 border border-green-200 text-green-700'
                    : 'bg-red-50 border border-red-200 text-red-700'
                    }`}>
                    <span>{notification.type === 'success' ? '✅' : '❌'} {notification.message}</span>
                    <button onClick={() => setNotification(null)} className="text-sm opacity-60 hover:opacity-100 ml-4">✕</button>
                </div>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-500">Total Revenue</p>
                            <p className="text-2xl font-bold text-slate-800">₹0.00</p>
                        </div>
                        <div className="p-3 bg-green-100 rounded-full text-green-600 font-bold">₹</div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-500">Pending Approvals</p>
                            <p className="text-2xl font-bold text-slate-800">{stats.pendingStores}</p>
                        </div>
                        <div className="p-3 bg-orange-100 rounded-full text-orange-600 font-bold">⚠️</div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-500">Active Stores</p>
                            <p className="text-2xl font-bold text-slate-800">{stats.totalStores - stats.pendingStores}</p>
                        </div>
                        <div className="p-3 bg-blue-100 rounded-full text-blue-600 font-bold">🏪</div>
                    </div>
                </div>
            </div>

            {/* Pending Approvals List */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                    <h2 className="font-bold text-lg text-slate-800">Pending Store Approvals</h2>
                    <Link href="/admin/stores" className="text-sm text-blue-600 hover:text-blue-800 font-medium">View All Stores →</Link>
                </div>

                {pendingStores.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        <p>No pending stores to review. Good job! 🎉</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 text-slate-600 text-xs uppercase font-semibold">
                                <tr>
                                    <th className="px-6 py-3">Store Name</th>
                                    <th className="px-6 py-3">Owner</th>
                                    <th className="px-6 py-3">Category</th>
                                    <th className="px-6 py-3">Date</th>
                                    <th className="px-6 py-3">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {pendingStores.map((store) => (
                                    <tr
                                        key={store._id}
                                        onClick={() => setSelectedStore(store)}
                                        className="hover:bg-blue-50 transition-colors cursor-pointer"
                                    >
                                        <td className="px-6 py-4 font-medium text-blue-600 underline decoration-blue-200 underline-offset-2">{store.name}</td>
                                        <td className="px-6 py-4 text-slate-600">
                                            <div>{store.owner?.username || 'Unknown'}</div>
                                            <div className="text-xs text-slate-400">{store.owner?.email}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs font-medium uppercase">
                                                {store.category}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-500">
                                            {new Date(store.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={(e) => handleApprove(store._id, e)}
                                                    className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 text-sm font-medium transition-colors"
                                                >
                                                    ✓ Approve
                                                </button>
                                                <button
                                                    onClick={(e) => handleReject(store._id, e)}
                                                    className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-sm font-medium transition-colors"
                                                >
                                                    ✕ Reject
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Store Detail Modal */}
            {selectedStore && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedStore(null)}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
                        {/* Header */}
                        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-bold text-slate-800">{selectedStore.name}</h2>
                                <p className="text-sm text-slate-500">Submitted {new Date(selectedStore.createdAt).toLocaleDateString()}</p>
                            </div>
                            <button onClick={() => setSelectedStore(null)} className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center hover:bg-slate-300 text-slate-600">✕</button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-5">
                            {/* Store Images */}
                            {selectedStore.images && selectedStore.images.length > 0 && (
                                <div>
                                    <p className="text-xs font-semibold text-slate-400 uppercase mb-2">Store Photos ({selectedStore.images.length})</p>
                                    <div className="grid grid-cols-3 gap-2">
                                        {selectedStore.images.map((img, i) => (
                                            <img key={i} src={getImageUrl(img)} alt={`${selectedStore.name} ${i + 1}`} className="w-full h-24 object-cover rounded-lg border border-slate-200" />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Owner Info */}
                            <div className="bg-blue-50 rounded-xl p-4">
                                <h3 className="text-sm font-semibold text-blue-800 mb-2">👤 Owner</h3>
                                <p className="text-slate-700 font-medium">{selectedStore.owner?.username || 'Unknown'}</p>
                                <p className="text-sm text-slate-500">{selectedStore.owner?.email}</p>
                            </div>

                            {/* Store Details */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs font-semibold text-slate-400 uppercase mb-1">Category</p>
                                    <p className="text-slate-700 capitalize">{selectedStore.category}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-slate-400 uppercase mb-1">Address</p>
                                    <p className="text-slate-700">{selectedStore.location?.address || 'Not provided'}</p>
                                </div>
                            </div>

                            {selectedStore.description && (
                                <div>
                                    <p className="text-xs font-semibold text-slate-400 uppercase mb-1">Description</p>
                                    <p className="text-slate-700 text-sm">{selectedStore.description}</p>
                                </div>
                            )}

                            {/* Contact */}
                            {selectedStore.contact && (selectedStore.contact.phone || selectedStore.contact.email) && (
                                <div>
                                    <p className="text-xs font-semibold text-slate-400 uppercase mb-2">Contact</p>
                                    <div className="flex flex-wrap gap-3">
                                        {selectedStore.contact.phone && (
                                            <span className="text-sm bg-slate-100 px-3 py-1.5 rounded-lg">📞 {selectedStore.contact.phone}</span>
                                        )}
                                        {selectedStore.contact.email && (
                                            <span className="text-sm bg-slate-100 px-3 py-1.5 rounded-lg">📧 {selectedStore.contact.email}</span>
                                        )}
                                        {selectedStore.contact.whatsapp && (
                                            <span className="text-sm bg-slate-100 px-3 py-1.5 rounded-lg">💬 {selectedStore.contact.whatsapp}</span>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Products */}
                            {selectedStore.products && selectedStore.products.length > 0 && (
                                <div>
                                    <p className="text-xs font-semibold text-slate-400 uppercase mb-2">Products ({selectedStore.products.length})</p>
                                    <div className="space-y-1.5">
                                        {selectedStore.products.slice(0, 10).map((p, i) => (
                                            <div key={i} className="flex items-center justify-between bg-slate-50 px-3 py-2 rounded-lg text-sm">
                                                <span className="text-slate-700">{p.name}</span>
                                                <div className="flex items-center gap-3">
                                                    <span className="font-medium text-slate-800">₹{p.price}</span>
                                                    <span className={`text-xs ${p.inStock ? 'text-green-600' : 'text-red-500'}`}>
                                                        {p.inStock ? '● In Stock' : '● Out'}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                        {selectedStore.products.length > 10 && (
                                            <p className="text-xs text-slate-400 text-center py-1">+ {selectedStore.products.length - 10} more products</p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Payment Methods */}
                            {selectedStore.paymentMethods && (
                                <div>
                                    <p className="text-xs font-semibold text-slate-400 uppercase mb-2">Payment Methods</p>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedStore.paymentMethods.cashOnDelivery !== false && (
                                            <span className="text-xs bg-green-50 text-green-700 px-3 py-1.5 rounded-lg font-medium">💵 Cash on Delivery</span>
                                        )}
                                        {selectedStore.paymentMethods.razorpayEnabled && (
                                            <span className="text-xs bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg font-medium">💳 Razorpay</span>
                                        )}
                                        {selectedStore.paymentMethods.upiId && (
                                            <span className="text-xs bg-purple-50 text-purple-700 px-3 py-1.5 rounded-lg font-medium">📱 UPI: {selectedStore.paymentMethods.upiId}</span>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Schedule */}
                            {selectedStore.schedule && (
                                <div>
                                    <p className="text-xs font-semibold text-slate-400 uppercase mb-2">Schedule</p>
                                    <div className="grid grid-cols-2 gap-1.5">
                                        {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => {
                                            const s = selectedStore.schedule?.[day];
                                            if (!s) return null;
                                            return (
                                                <div key={day} className="flex items-center justify-between bg-slate-50 px-3 py-1.5 rounded text-xs">
                                                    <span className="capitalize font-medium text-slate-600">{day.slice(0, 3)}</span>
                                                    <span className={s.isOpen ? 'text-green-600' : 'text-red-400'}>
                                                        {s.isOpen ? `${s.open}–${s.close}` : 'Closed'}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer Actions */}
                        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
                            <button onClick={() => setSelectedStore(null)} className="px-5 py-2.5 text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 text-sm font-medium">
                                Close
                            </button>
                            <div className="flex gap-2">
                                <button
                                    onClick={(e) => handleReject(selectedStore._id, e)}
                                    className="px-5 py-2.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-sm font-semibold transition-colors"
                                >
                                    ✕ Reject
                                </button>
                                <button
                                    onClick={(e) => handleApprove(selectedStore._id, e)}
                                    className="px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-semibold transition-colors shadow-sm"
                                >
                                    ✓ Approve Store
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
