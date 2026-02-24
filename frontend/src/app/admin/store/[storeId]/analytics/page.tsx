'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import { StoreAnalytics, Order } from '@/types';
import Link from 'next/link';

export default function StoreAnalyticsPage() {
    const params = useParams();
    const router = useRouter();
    const { isAuthenticated, user } = useAuthStore();
    const [analytics, setAnalytics] = useState<StoreAnalytics | null>(null);
    const [orders, setOrders] = useState<Order[]>([]);
    const [period, setPeriod] = useState(30);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'orders'>('overview');

    useEffect(() => {
        if (!isAuthenticated || user?.role !== 'admin') {
            router.push('/home');
            return;
        }
        fetchData();
    }, [params.storeId, period, isAuthenticated, user]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [analyticsRes, ordersRes] = await Promise.all([
                api.get(`/orders/store/${params.storeId}/analytics`, { params: { period } }),
                api.get(`/orders/store/${params.storeId}`)
            ]);

            setAnalytics(analyticsRes.data);
            setOrders(ordersRes.data.orders);
        } catch (error) {
            console.error('Failed to fetch analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (orderId: string, status: string) => {
        try {
            await api.patch(`/orders/${orderId}/status`, { status });
            fetchData();
        } catch (error) {
            alert('Failed to update order status');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent"></div>
            </div>
        );
    }

    if (!analytics) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-gray-600">No analytics data available</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen pb-6">
            <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link href="/admin" className="text-2xl">
                                ←
                            </Link>
                            <h1 className="text-xl font-bold text-gray-800">Store Analytics</h1>
                        </div>

                        <select
                            value={period}
                            onChange={(e) => setPeriod(parseInt(e.target.value))}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                        >
                            <option value={7}>Last 7 days</option>
                            <option value={30}>Last 30 days</option>
                            <option value={90}>Last 90 days</option>
                        </select>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 py-6">
                {/* Tabs */}
                <div className="flex gap-2 mb-6 border-b border-gray-200">
                    {[
                        { id: 'overview', label: '📊 Overview', icon: '📊' },
                        { id: 'products', label: '📦 Products', icon: '📦' },
                        { id: 'orders', label: '🛍️ Orders', icon: '🛍️' }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`px-6 py-3 font-medium transition-all ${activeTab === tab.id
                                ? 'text-orange-600 border-b-2 border-orange-600'
                                : 'text-gray-600 hover:text-orange-600'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Overview Tab */}
                {activeTab === 'overview' && (
                    <div className="space-y-6">
                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                                <p className="text-sm text-gray-600 mb-1">Total Orders</p>
                                <p className="text-3xl font-bold text-gray-800">{analytics.overview.totalOrders}</p>
                            </div>

                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                                <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
                                <p className="text-3xl font-bold text-orange-600">₹{analytics.overview.totalRevenue}</p>
                            </div>

                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                                <p className="text-sm text-gray-600 mb-1">Avg Order Value</p>
                                <p className="text-3xl font-bold text-gray-800">₹{analytics.overview.averageOrderValue.toFixed(0)}</p>
                            </div>

                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                                <p className="text-sm text-gray-600 mb-1">Delivery vs Pickup</p>
                                <p className="text-lg font-bold text-gray-800">
                                    {analytics.overview.deliveryOrders} / {analytics.overview.pickupOrders}
                                </p>
                            </div>
                        </div>

                        {/* Sales Trend */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <h3 className="text-lg font-bold text-gray-800 mb-4">📈 Sales Trend</h3>
                            <div className="space-y-2">
                                {analytics.salesTrend.slice(-14).map((day) => (
                                    <div key={day.date} className="flex items-center gap-4">
                                        <span className="text-sm text-gray-600 w-24">
                                            {new Date(day.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                                        </span>
                                        <div className="flex-1 bg-gray-100 rounded-full h-8 relative">
                                            <div
                                                className="bg-orange-500 h-8 rounded-full flex items-center justify-end px-3"
                                                style={{ width: `${Math.min((day.revenue / Math.max(...analytics.salesTrend.map(d => d.revenue))) * 100, 100)}%` }}
                                            >
                                                <span className="text-sm font-medium text-white">₹{day.revenue}</span>
                                            </div>
                                        </div>
                                        <span className="text-sm text-gray-600 w-16 text-right">{day.orders} orders</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Products Tab */}
                {activeTab === 'products' && (
                    <div className="space-y-6">
                        {/* Top Products */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <h3 className="text-lg font-bold text-gray-800 mb-4">🔥 Top Selling Products</h3>
                            <div className="space-y-3">
                                {analytics.topProducts.map((product, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                                        <div>
                                            <h4 className="font-semibold text-gray-800">{product.name}</h4>
                                            <p className="text-sm text-gray-600">
                                                {product.totalQuantity} units sold • {product.orderCount} orders
                                            </p>
                                        </div>
                                        <p className="text-xl font-bold text-green-600">₹{product.totalRevenue}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Low Demand Products */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <h3 className="text-lg font-bold text-gray-800 mb-4">⚠️ Low Demand Products</h3>
                            <p className="text-sm text-gray-600 mb-4">Consider reducing stock or promoting these items</p>
                            <div className="space-y-3">
                                {analytics.lowDemandProducts.filter(p => p.totalQuantity > 0).map((product, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                        <div>
                                            <h4 className="font-semibold text-gray-800">{product.name}</h4>
                                            <p className="text-sm text-gray-600">
                                                Only {product.totalQuantity} units sold • {product.orderCount} orders
                                            </p>
                                        </div>
                                        <p className="text-lg font-bold text-yellow-600">₹{product.totalRevenue}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Inventory Recommendations */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                            <h3 className="text-lg font-bold text-blue-900 mb-3">💡 Inventory Recommendations</h3>
                            <ul className="space-y-2 text-sm text-blue-800">
                                <li>• Stock up on top {Math.min(3, analytics.topProducts.length)} products to meet demand</li>
                                <li>• Consider promotions for low-demand items to clear inventory</li>
                                <li>• Monitor daily trends to optimize stock levels</li>
                                <li>• Average order contains {analytics.overview.totalOrders > 0 ? (analytics.productDemand.reduce((sum, p) => sum + p.totalQuantity, 0) / analytics.overview.totalOrders).toFixed(1) : '0'} items</li>
                            </ul>
                        </div>
                    </div>
                )}

                {/* Orders Tab */}
                {activeTab === 'orders' && (
                    <div className="space-y-4">
                        {orders.length === 0 ? (
                            <p className="text-center text-gray-600 py-12">No orders yet</p>
                        ) : (
                            orders.map((order) => (
                                <div key={order._id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                                    <div className="flex items-start justify-between mb-3">
                                        <div>
                                            <p className="font-semibold text-gray-800">Order #{order._id.slice(-6)}</p>
                                            <p className="text-sm text-gray-600">
                                                {new Date(order.createdAt).toLocaleString('en-IN')}
                                            </p>
                                            <p className="text-sm text-gray-600 mt-1">
                                                {order.orderType === 'delivery' ? '🚚 Delivery' : '🏪 Pickup'}
                                            </p>
                                        </div>
                                        <p className="text-xl font-bold text-orange-600">₹{order.totalAmount}</p>
                                    </div>

                                    <div className="border-t border-gray-100 pt-3 mb-3">
                                        {order.items.map((item, idx) => (
                                            <p key={idx} className="text-sm text-gray-700">
                                                {item.quantity}x {item.productName}
                                            </p>
                                        ))}
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <select
                                            value={order.status}
                                            onChange={(e) => handleStatusUpdate(order._id, e.target.value)}
                                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500"
                                        >
                                            <option value="pending">Pending</option>
                                            <option value="confirmed">Confirmed</option>
                                            <option value="preparing">Preparing</option>
                                            <option value="ready">Ready</option>
                                            <option value="out_for_delivery">Out for Delivery</option>
                                            <option value="completed">Completed</option>
                                            <option value="cancelled">Cancelled</option>
                                        </select>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}
