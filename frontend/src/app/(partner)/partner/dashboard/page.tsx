'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import Link from 'next/link';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

type ScheduleDay = { open: string; close: string; isOpen: boolean };
type Schedule = Record<string, ScheduleDay>;

const defaultSchedule: Schedule = {
    monday: { open: '09:00', close: '21:00', isOpen: true },
    tuesday: { open: '09:00', close: '21:00', isOpen: true },
    wednesday: { open: '09:00', close: '21:00', isOpen: true },
    thursday: { open: '09:00', close: '21:00', isOpen: true },
    friday: { open: '09:00', close: '21:00', isOpen: true },
    saturday: { open: '09:00', close: '21:00', isOpen: true },
    sunday: { open: '10:00', close: '20:00', isOpen: true },
};

interface Store {
    _id: string;
    name: string;
    category: string;
    approvalStatus: 'pending' | 'approved' | 'rejected';
    currentStatus: 'open' | 'closed' | 'busy';
    products: { name: string; price: number; inStock: boolean }[];
    location: { address: string };
    schedule?: Schedule;
}

interface OrderItem { productName: string; quantity: number; price: number; subtotal: number; }
interface Order {
    _id: string;
    orderToken: string;
    items: OrderItem[];
    totalAmount: number;
    status: string;
    paymentMethod: string;
    paymentStatus: string;
    orderType: string;
    deliveryAddress?: string;
    notes?: string;
    createdAt: string;
    customer: { username: string; phone?: string; email?: string };
}

type Tab = 'overview' | 'orders' | 'products' | 'schedule';

const STATUS_FLOW: Record<string, string[]> = {
    pending: ['confirmed', 'cancelled'],
    confirmed: ['preparing', 'cancelled'],
    preparing: ['ready', 'cancelled'],
    ready: ['completed', 'out_for_delivery'],
    out_for_delivery: ['completed'],
    completed: [],
    cancelled: [],
};

const STATUS_LABELS: Record<string, string> = {
    pending: '⏳ Pending',
    confirmed: '✅ Confirmed',
    preparing: '👨‍🍳 Preparing',
    ready: '📦 Ready',
    out_for_delivery: '🚚 Out for Delivery',
    completed: '✔️ Completed',
    cancelled: '❌ Cancelled',
};

const STATUS_COLORS: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700',
    confirmed: 'bg-blue-100 text-blue-700',
    preparing: 'bg-purple-100 text-purple-700',
    ready: 'bg-cyan-100 text-cyan-700',
    out_for_delivery: 'bg-indigo-100 text-indigo-700',
    completed: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700',
};

export default function PartnerDashboard() {
    const router = useRouter();
    const { isAuthenticated, user, _hasHydrated } = useAuthStore();
    const [store, setStore] = useState<Store | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [approvalStatus, setApprovalStatus] = useState<string>('pending');
    const [activeTab, setActiveTab] = useState<Tab>('overview');

    // Orders state
    const [orders, setOrders] = useState<Order[]>([]);
    const [ordersLoading, setOrdersLoading] = useState(false);
    const [orderFilter, setOrderFilter] = useState<string>('all');
    const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

    // Schedule state
    const [editSchedule, setEditSchedule] = useState<Schedule>(defaultSchedule);
    const [savingSchedule, setSavingSchedule] = useState(false);
    const [scheduleMsg, setScheduleMsg] = useState('');

    // Product management state
    const [newProduct, setNewProduct] = useState({ name: '', price: '', inStock: true });
    const [savingProduct, setSavingProduct] = useState(false);
    const [productMsg, setProductMsg] = useState('');

    // Status toggling
    const [togglingStatus, setTogglingStatus] = useState(false);

    useEffect(() => {
        if (!_hasHydrated) return;
        if (!isAuthenticated || user?.role !== 'store_owner') {
            router.push('/partner/login');
            return;
        }
        fetchStoreData();
    }, [_hasHydrated, isAuthenticated, user]);

    const fetchStoreData = async () => {
        try {
            const { data } = await api.get('/stores/my-stores/list');
            if (data.stores && data.stores.length > 0) {
                const myStore = data.stores[0];
                setStore(myStore);
                setApprovalStatus(myStore.approvalStatus);
                if (myStore.schedule) {
                    setEditSchedule({ ...defaultSchedule, ...myStore.schedule });
                }
            }
        } catch (error) {
            console.error('Failed to fetch store data', error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchOrders = useCallback(async (storeId: string) => {
        setOrdersLoading(true);
        try {
            const params = orderFilter !== 'all' ? { status: orderFilter } : {};
            const { data } = await api.get(`/orders/store/${storeId}`, { params });
            setOrders(data.orders || []);
        } catch {
            // Orders endpoint may not return data yet
        } finally {
            setOrdersLoading(false);
        }
    }, [orderFilter]);

    useEffect(() => {
        if (store && approvalStatus === 'approved' && activeTab === 'orders') {
            fetchOrders(store._id);
        }
    }, [store, approvalStatus, activeTab, orderFilter]);

    // Poll for new orders every 30s when on orders tab
    useEffect(() => {
        if (!store || approvalStatus !== 'approved' || activeTab !== 'orders') return;
        const interval = setInterval(() => fetchOrders(store._id), 30000);
        return () => clearInterval(interval);
    }, [store, approvalStatus, activeTab, fetchOrders]);

    // Poll for approval status changes (every 15 seconds if pending)
    useEffect(() => {
        if (approvalStatus !== 'pending') return;
        const interval = setInterval(async () => {
            try {
                const { data } = await api.get('/stores/my-stores/list');
                if (data.stores && data.stores.length > 0 && data.stores[0].approvalStatus !== 'pending') {
                    setStore(data.stores[0]);
                    setApprovalStatus(data.stores[0].approvalStatus);
                }
            } catch { /* ignore */ }
        }, 15000);
        return () => clearInterval(interval);
    }, [approvalStatus]);

    const toggleStoreStatus = async (newStatus: 'open' | 'closed' | 'busy') => {
        if (!store) return;
        setTogglingStatus(true);
        try {
            await api.put(`/stores/my-stores/${store._id}`, { currentStatus: newStatus });
            setStore(prev => prev ? { ...prev, currentStatus: newStatus } : prev);
        } catch (error: any) {
            alert(error.response?.data?.message || 'Failed to update status');
        } finally {
            setTogglingStatus(false);
        }
    };

    const updateOrderStatus = async (orderId: string, newStatus: string) => {
        setUpdatingOrderId(orderId);
        try {
            await api.patch(`/orders/${orderId}/partner-status`, { status: newStatus });
            setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status: newStatus } : o));
        } catch (error: any) {
            alert(error.response?.data?.message || 'Failed to update order status');
        } finally {
            setUpdatingOrderId(null);
        }
    };

    const saveSchedule = async () => {
        if (!store) return;
        setSavingSchedule(true);
        setScheduleMsg('');
        try {
            await api.put(`/stores/my-stores/${store._id}`, { schedule: editSchedule });
            setStore(prev => prev ? { ...prev, schedule: editSchedule } : prev);
            setScheduleMsg('Schedule saved successfully!');
            setTimeout(() => setScheduleMsg(''), 3000);
        } catch {
            setScheduleMsg('Failed to save schedule');
        } finally {
            setSavingSchedule(false);
        }
    };

    const updateScheduleDay = (day: string, field: keyof ScheduleDay, value: string | boolean) => {
        setEditSchedule(prev => ({ ...prev, [day]: { ...prev[day], [field]: value } }));
    };

    // ---- Loading ----
    if (!_hasHydrated || isLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent"></div>
            </div>
        );
    }

    // ---- PENDING ----
    if (approvalStatus === 'pending') {
        return (
            <div className="max-w-2xl mx-auto py-12 text-center">
                <div className="bg-white rounded-3xl p-12 shadow-xl border border-gray-100">
                    <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                        <span className="text-4xl">⏳</span>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-3">Awaiting Approval</h1>
                    <p className="text-gray-500 mb-6 max-w-md mx-auto">
                        Your store <strong className="text-gray-800">{store?.name}</strong> is under review. This page will update automatically.
                    </p>
                    <div className="bg-amber-50 text-amber-700 px-5 py-3 rounded-xl inline-flex items-center gap-2 font-medium">
                        <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></span>
                        Status: Pending Review
                    </div>
                    <div className="mt-8">
                        <Link href="/home" className="text-gray-400 hover:text-gray-700 underline text-sm">Go to Home</Link>
                    </div>
                </div>
            </div>
        );
    }

    // ---- REJECTED ----
    if (approvalStatus === 'rejected') {
        return (
            <div className="max-w-2xl mx-auto py-12 text-center">
                <div className="bg-white rounded-3xl p-12 shadow-xl border border-gray-100">
                    <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <span className="text-4xl">❌</span>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-3">Store Rejected</h1>
                    <p className="text-gray-500 mb-6 max-w-md mx-auto">
                        Your store <strong className="text-gray-800">{store?.name}</strong> was not approved. Please contact support.
                    </p>
                    <div className="bg-red-50 text-red-700 px-5 py-3 rounded-xl inline-flex items-center gap-2 font-medium">
                        <span className="w-2 h-2 bg-red-500 rounded-full"></span>Status: Rejected
                    </div>
                    <div className="mt-8">
                        <Link href="/home" className="text-gray-400 hover:text-gray-700 underline text-sm">Go to Home</Link>
                    </div>
                </div>
            </div>
        );
    }

    // ---- APPROVED DASHBOARD ----
    const currentStatus = store?.currentStatus || 'closed';
    const statusConfig = {
        open: { color: 'bg-green-500', text: 'text-green-700', bg: 'bg-green-50', border: 'border-green-200', label: '🟢 Open' },
        busy: { color: 'bg-yellow-500', text: 'text-yellow-700', bg: 'bg-yellow-50', border: 'border-yellow-200', label: '🟡 Busy' },
        closed: { color: 'bg-red-500', text: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200', label: '🔴 Closed' },
    };

    const pendingOrdersCount = orders.filter(o => o.status === 'pending').length;
    const totalRevenue = orders.filter(o => o.status === 'completed').reduce((s, o) => s + o.totalAmount, 0);

    const filteredOrders = orderFilter === 'all' ? orders : orders.filter(o => o.status === orderFilter);

    return (
        <div className="space-y-5">
            {/* Header Banner */}
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-5 sm:p-6 text-white shadow-lg">
                <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold">Welcome, {user?.username}! 👋</h1>
                        <p className="text-orange-100 mt-1 text-sm sm:text-base">Managing <strong>{store?.name}</strong></p>
                    </div>
                    <div className={`px-3 py-1.5 rounded-full text-sm font-bold ${statusConfig[currentStatus].bg} ${statusConfig[currentStatus].text} ${statusConfig[currentStatus].border} border`}>
                        {statusConfig[currentStatus].label}
                    </div>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
                {(['overview', 'orders', 'products', 'schedule'] as Tab[]).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-all capitalize relative ${activeTab === tab ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        {tab === 'orders' ? '📦 Orders' : tab === 'products' ? '🛍️ Products' : tab === 'schedule' ? '🕐 Schedule' : '📊 Overview'}
                        {tab === 'orders' && pendingOrdersCount > 0 && (
                            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                                {pendingOrdersCount}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* ====== OVERVIEW TAB ====== */}
            {activeTab === 'overview' && (
                <div className="space-y-5">
                    {/* Store Status Toggle */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h2 className="font-bold text-gray-800">Store Status</h2>
                                <p className="text-xs text-gray-400 mt-0.5">Toggle your current availability</p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            {(['open', 'closed', 'busy'] as const).map(s => (
                                <button
                                    key={s}
                                    onClick={() => toggleStoreStatus(s)}
                                    disabled={togglingStatus || currentStatus === s}
                                    className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all ${currentStatus === s
                                        ? `${statusConfig[s].bg} ${statusConfig[s].text} ${statusConfig[s].border} border-2 shadow-sm`
                                        : 'bg-gray-50 text-gray-500 border border-gray-200 hover:bg-gray-100'
                                        } disabled:opacity-60`}
                                >
                                    {s === 'open' ? '🟢 Open' : s === 'closed' ? '🔴 Closed' : '🟡 Busy'}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                            <p className="text-xs text-gray-500 font-medium">New Orders</p>
                            <p className="text-2xl font-bold text-orange-600 mt-1">{pendingOrdersCount}</p>
                        </div>
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                            <p className="text-xs text-gray-500 font-medium">Total Orders</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">{orders.length}</p>
                        </div>
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                            <p className="text-xs text-gray-500 font-medium">Revenue</p>
                            <p className="text-xl font-bold text-green-600 mt-1">₹{totalRevenue.toFixed(0)}</p>
                        </div>
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                            <p className="text-xs text-gray-500 font-medium">Products</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">{store?.products?.length || 0}</p>
                        </div>
                    </div>

                    {/* Pending Orders Quick View */}
                    {pendingOrdersCount > 0 && (
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="font-bold text-amber-800">⚠️ {pendingOrdersCount} New Order{pendingOrdersCount > 1 ? 's' : ''} Waiting!</h3>
                                <button onClick={() => setActiveTab('orders')} className="text-sm text-orange-600 font-semibold hover:underline">
                                    View All →
                                </button>
                            </div>
                            <p className="text-amber-700 text-sm">Customers are waiting for you to confirm their orders.</p>
                        </div>
                    )}
                </div>
            )}

            {/* ====== ORDERS TAB ====== */}
            {activeTab === 'orders' && (
                <div className="space-y-4">
                    {/* Filters */}
                    <div className="flex gap-2 overflow-x-auto pb-1">
                        {['all', 'pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled'].map(s => (
                            <button
                                key={s}
                                onClick={() => setOrderFilter(s)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all border ${orderFilter === s
                                    ? 'bg-orange-500 text-white border-orange-500'
                                    : 'bg-white text-gray-600 border-gray-200 hover:border-orange-300'
                                    }`}
                            >
                                {s === 'all' ? 'All' : STATUS_LABELS[s] || s}
                                {s === 'pending' && pendingOrdersCount > 0 && ` (${pendingOrdersCount})`}
                            </button>
                        ))}
                        <button
                            onClick={() => store && fetchOrders(store._id)}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 whitespace-nowrap"
                        >
                            🔄 Refresh
                        </button>
                    </div>

                    {ordersLoading ? (
                        <div className="py-12 text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-4 border-orange-500 border-t-transparent mx-auto"></div>
                        </div>
                    ) : filteredOrders.length === 0 ? (
                        <div className="bg-white rounded-xl border border-gray-100 p-10 text-center text-gray-400">
                            <div className="text-4xl mb-2">📭</div>
                            <p className="font-medium">No {orderFilter !== 'all' ? orderFilter : ''} orders yet</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {filteredOrders.map(order => {
                                const nextStatuses = STATUS_FLOW[order.status] || [];
                                return (
                                    <div key={order._id} className={`bg-white rounded-xl border shadow-sm overflow-hidden ${order.status === 'pending' ? 'border-amber-300 ring-1 ring-amber-200' : 'border-gray-100'}`}>
                                        {/* Order Header */}
                                        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono text-sm font-bold text-gray-700">{order.orderToken}</span>
                                                <span className="text-gray-400">·</span>
                                                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[order.status]}`}>
                                                    {STATUS_LABELS[order.status] || order.status}
                                                </span>
                                            </div>
                                            <span className="text-xs text-gray-400">
                                                {new Date(order.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                                {' '}
                                                {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                            </span>
                                        </div>

                                        <div className="p-4">
                                            {/* Customer Info */}
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-sm font-bold text-orange-600">
                                                    {order.customer?.username?.[0]?.toUpperCase() || '?'}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-gray-800">{order.customer?.username || 'Anonymous'}</p>
                                                    {order.customer?.phone && <p className="text-xs text-gray-500">{order.customer.phone}</p>}
                                                </div>
                                                <div className="ml-auto text-right">
                                                    <p className="text-xs text-gray-500">{order.orderType === 'delivery' ? '🚚 Delivery' : '🏪 Pickup'}</p>
                                                    <p className="text-sm font-bold text-orange-600">₹{order.totalAmount}</p>
                                                </div>
                                            </div>

                                            {/* Order Items */}
                                            <div className="bg-gray-50 rounded-lg p-3 mb-3 space-y-1">
                                                {order.items.map((item, idx) => (
                                                    <div key={idx} className="flex justify-between text-sm">
                                                        <span className="text-gray-700">{item.quantity}× {item.productName}</span>
                                                        <span className="text-gray-600 font-medium">₹{item.subtotal}</span>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Delivery Address */}
                                            {order.deliveryAddress && (
                                                <p className="text-xs text-gray-500 mb-3">📍 {order.deliveryAddress}</p>
                                            )}

                                            {/* Notes */}
                                            {order.notes && (
                                                <p className="text-xs text-gray-500 italic mb-3">💬 "{order.notes}"</p>
                                            )}

                                            {/* Payment */}
                                            <div className="flex items-center justify-between mb-3">
                                                <span className="text-xs text-gray-500">
                                                    💳 {order.paymentMethod === 'cash' ? 'Cash on Delivery' : order.paymentMethod === 'qr' ? 'UPI/QR' : 'Online'}
                                                </span>
                                                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${order.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                    {order.paymentStatus === 'paid' ? '✓ Paid' : 'Unpaid'}
                                                </span>
                                            </div>

                                            {/* Action Buttons */}
                                            {nextStatuses.length > 0 && (
                                                <div className="flex gap-2 flex-wrap">
                                                    {nextStatuses.map(nextStatus => {
                                                        const isCancelAction = nextStatus === 'cancelled';
                                                        return (
                                                            <button
                                                                key={nextStatus}
                                                                onClick={() => updateOrderStatus(order._id, nextStatus)}
                                                                disabled={updatingOrderId === order._id}
                                                                className={`flex-1 min-w-[120px] py-2 px-3 rounded-lg text-sm font-semibold transition-all disabled:opacity-50 ${isCancelAction
                                                                    ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100'
                                                                    : 'bg-orange-500 text-white hover:bg-orange-600 shadow-sm'
                                                                    }`}
                                                            >
                                                                {updatingOrderId === order._id ? '...' : `→ ${STATUS_LABELS[nextStatus] || nextStatus}`}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* ====== SCHEDULE TAB ====== */}
            {/* ====== PRODUCTS TAB ====== */}
            {activeTab === 'products' && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-5 border-b border-gray-100">
                        <h2 className="text-lg font-bold text-gray-900">🛍️ Manage Products</h2>
                        <p className="text-sm text-gray-500 mt-1">Add, edit, or remove products from your store</p>
                    </div>

                    {/* Add Product Form */}
                    <div className="p-5 bg-gray-50 border-b border-gray-100">
                        <h3 className="text-sm font-semibold text-gray-700 mb-3">Add New Product</h3>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <input
                                type="text"
                                placeholder="Product name"
                                value={newProduct.name}
                                onChange={e => setNewProduct(p => ({ ...p, name: e.target.value }))}
                                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-sm text-gray-800"
                            />
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
                                <input
                                    type="text"
                                    inputMode="decimal"
                                    placeholder="Price"
                                    value={newProduct.price}
                                    onChange={e => {
                                        const val = e.target.value.replace(/[^0-9.]/g, '');
                                        // Remove leading zeros (but keep '0.' for decimals)
                                        const cleaned = val.replace(/^0+(?=\d)/, '');
                                        setNewProduct(p => ({ ...p, price: cleaned }));
                                    }}
                                    className="w-full sm:w-32 px-4 pl-7 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-sm text-gray-800"
                                />
                            </div>
                            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={newProduct.inStock}
                                    onChange={e => setNewProduct(p => ({ ...p, inStock: e.target.checked }))}
                                    className="w-4 h-4 text-orange-600 rounded"
                                />
                                In Stock
                            </label>
                            <button
                                onClick={async () => {
                                    if (!newProduct.name || !newProduct.price || !store) return;
                                    setSavingProduct(true);
                                    try {
                                        const updatedProducts = [...(store.products || []), {
                                            name: newProduct.name,
                                            price: parseFloat(newProduct.price),
                                            inStock: newProduct.inStock
                                        }];
                                        await api.put(`/stores/my-stores/${store._id}`, { products: updatedProducts });
                                        setStore(prev => prev ? { ...prev, products: updatedProducts } : prev);
                                        setNewProduct({ name: '', price: '', inStock: true });
                                        setProductMsg('Product added!');
                                        setTimeout(() => setProductMsg(''), 3000);
                                    } catch (err: any) {
                                        setProductMsg(err.response?.data?.message || 'Failed to add product');
                                    } finally {
                                        setSavingProduct(false);
                                    }
                                }}
                                disabled={savingProduct || !newProduct.name || !newProduct.price}
                                className="px-5 py-2.5 bg-orange-600 text-white rounded-xl hover:bg-orange-700 font-medium text-sm disabled:opacity-50 transition-colors whitespace-nowrap"
                            >
                                {savingProduct ? 'Adding...' : '+ Add'}
                            </button>
                        </div>
                        {productMsg && (
                            <p className={`text-sm mt-2 ${productMsg.includes('Failed') ? 'text-red-600' : 'text-green-600'}`}>{productMsg}</p>
                        )}
                    </div>

                    {/* Product List */}
                    <div className="p-5">
                        {(!store?.products || store.products.length === 0) ? (
                            <p className="text-center text-gray-400 py-8">No products added yet. Add your first product above.</p>
                        ) : (
                            <div className="space-y-2">
                                {store.products.map((product, idx) => (
                                    <div key={idx} className="flex items-center justify-between bg-gray-50 px-4 py-3 rounded-xl border border-gray-100">
                                        <div className="flex items-center gap-3">
                                            <span className={`w-2 h-2 rounded-full ${product.inStock ? 'bg-green-500' : 'bg-red-400'}`}></span>
                                            <span className="font-medium text-gray-800 text-sm">{product.name}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="font-bold text-gray-900 text-sm">₹{product.price}</span>
                                            <button
                                                onClick={async () => {
                                                    if (!store) return;
                                                    const updatedProducts = [...store.products];
                                                    updatedProducts[idx] = { ...updatedProducts[idx], inStock: !updatedProducts[idx].inStock };
                                                    try {
                                                        await api.put(`/stores/my-stores/${store._id}`, { products: updatedProducts });
                                                        setStore(prev => prev ? { ...prev, products: updatedProducts } : prev);
                                                    } catch { /* ignore */ }
                                                }}
                                                className={`text-xs px-2 py-1 rounded-lg font-medium ${product.inStock ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}
                                            >
                                                {product.inStock ? 'In Stock' : 'Out of Stock'}
                                            </button>
                                            <button
                                                onClick={async () => {
                                                    if (!store || !confirm('Remove this product?')) return;
                                                    const updatedProducts = store.products.filter((_, i) => i !== idx);
                                                    try {
                                                        await api.put(`/stores/my-stores/${store._id}`, { products: updatedProducts });
                                                        setStore(prev => prev ? { ...prev, products: updatedProducts } : prev);
                                                    } catch { /* ignore */ }
                                                }}
                                                className="text-xs text-red-400 hover:text-red-600 transition-colors"
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ====== SCHEDULE TAB ====== */}
            {activeTab === 'schedule' && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-100">
                        <h2 className="font-bold text-gray-800">🕐 Store Timings</h2>
                        <p className="text-xs text-gray-400 mt-0.5">Set your opening hours for each day</p>
                    </div>
                    <div className="p-5 space-y-3">
                        {scheduleMsg && (
                            <div className={`text-sm font-medium px-4 py-2 rounded-lg ${scheduleMsg.includes('success') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                {scheduleMsg}
                            </div>
                        )}
                        {DAYS.map(day => {
                            const s = editSchedule[day] || defaultSchedule[day];
                            return (
                                <div key={day} className="flex items-center gap-3 py-3 px-4 bg-gray-50 rounded-lg border border-gray-100 flex-wrap">
                                    <div className="w-24">
                                        <span className="text-sm font-semibold text-gray-700 capitalize">{day}</span>
                                    </div>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={s.isOpen}
                                            onChange={e => updateScheduleDay(day, 'isOpen', e.target.checked)}
                                            className="w-4 h-4 text-orange-600 rounded border-gray-300 focus:ring-orange-500"
                                        />
                                        <span className={`text-xs font-medium ${s.isOpen ? 'text-green-600' : 'text-red-500'}`}>
                                            {s.isOpen ? 'Open' : 'Closed'}
                                        </span>
                                    </label>
                                    {s.isOpen && (
                                        <div className="flex items-center gap-2 ml-auto">
                                            <input
                                                type="time"
                                                value={s.open}
                                                onChange={e => updateScheduleDay(day, 'open', e.target.value)}
                                                className="px-2 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                                            />
                                            <span className="text-gray-400 text-xs">to</span>
                                            <input
                                                type="time"
                                                value={s.close}
                                                onChange={e => updateScheduleDay(day, 'close', e.target.value)}
                                                className="px-2 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                                            />
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                        <div className="flex justify-end pt-2">
                            <button
                                onClick={saveSchedule}
                                disabled={savingSchedule}
                                className="px-6 py-2.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium text-sm disabled:opacity-50 transition-colors shadow-sm"
                            >
                                {savingSchedule ? 'Saving...' : '💾 Save Timings'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
