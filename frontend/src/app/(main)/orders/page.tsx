'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import api from '@/lib/api';
import { Order } from '@/types';
import Link from 'next/link';

export default function OrdersPage() {
    const router = useRouter();
    const { isAuthenticated } = useAuthStore();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<string>('all');

    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/login');
            return;
        }
        fetchOrders();
    }, [isAuthenticated, filter]);

    const fetchOrders = async () => {
        try {
            const params = filter !== 'all' ? { status: filter } : {};
            const { data } = await api.get('/orders/my-orders', { params });
            setOrders(data.orders);
        } catch (error) {
            console.error('Failed to fetch orders:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed': return 'badge-success';
            case 'cancelled': return 'badge-danger';
            case 'pending': return 'badge-warning';
            default: return 'badge-primary';
        }
    };

    const getStatusText = (status: string) => {
        return status.replace('_', ' ').toUpperCase();
    };

    return (
        <div className="min-h-screen pb-20">
            <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-4xl mx-auto px-4 py-4">
                    <div className="flex items-center gap-4">
                        <button onClick={() => router.back()} className="text-2xl">
                            ←
                        </button>
                        <h1 className="text-xl font-bold text-gray-800">My Orders</h1>
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 py-6">
                {/* Filter Tabs */}
                <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
                    {['all', 'pending', 'confirmed', 'preparing', 'completed', 'cancelled'].map((status) => (
                        <button
                            key={status}
                            onClick={() => setFilter(status)}
                            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${filter === status
                                ? 'bg-orange-500 text-white shadow-md'
                                : 'bg-white text-gray-700 hover:bg-orange-50 border border-gray-200'
                                }`}
                        >
                            {status === 'all' ? 'All' : getStatusText(status)}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div className="text-center py-12">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent"></div>
                    </div>
                ) : orders.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-xl text-gray-600">No orders found</p>
                        <Link href="/home" className="btn-primary mt-4 inline-block">
                            Start Shopping
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {orders.map((order) => (
                            <div key={order._id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                                <div className="flex items-start justify-between mb-3">
                                    <div>
                                        <h3 className="font-bold text-gray-800">{order.store.name}</h3>
                                        {order.orderToken && (
                                            <p className="text-xs font-mono font-bold text-orange-600 mt-0.5">🎫 {order.orderToken}</p>
                                        )}
                                        <p className="text-sm text-gray-600">
                                            {new Date(order.createdAt).toLocaleDateString('en-IN', {
                                                day: 'numeric',
                                                month: 'short',
                                                year: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </p>
                                    </div>
                                    <span className={`badge ${getStatusColor(order.status)}`}>
                                        {getStatusText(order.status)}
                                    </span>
                                </div>

                                <div className="border-t border-gray-100 pt-3 mb-3">
                                    <div className="space-y-1">
                                        {order.items.map((item, idx) => (
                                            <div key={idx} className="flex justify-between text-sm">
                                                <span className="text-gray-700">
                                                    {item.quantity}x {item.productName}
                                                </span>
                                                <span className="text-gray-900 font-medium">₹{item.subtotal}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex items-center justify-between border-t border-gray-100 pt-3">
                                    <div>
                                        <p className="text-sm text-gray-600">
                                            {order.orderType === 'delivery' ? '🚚 Delivery' : '🏪 Pickup'}
                                        </p>
                                        <p className="text-lg font-bold text-orange-600">₹{order.totalAmount}</p>
                                    </div>

                                    {order.status === 'pending' && (
                                        <button
                                            onClick={async () => {
                                                if (confirm('Cancel this order?')) {
                                                    try {
                                                        await api.patch(`/orders/${order._id}/cancel`, { reason: 'Customer request' });
                                                        fetchOrders();
                                                    } catch (error) {
                                                        alert('Failed to cancel order');
                                                    }
                                                }
                                            }}
                                            className="text-sm text-red-600 hover:underline"
                                        >
                                            Cancel Order
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* Bottom Navigation */}
            <nav className="fixed bottom-0 left-0 right-0 gradient-white border-t border-orange-100 glass-effect z-50">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="flex justify-around py-3">
                        <Link href="/home" className="flex flex-col items-center gap-1 transition-all hover:scale-110">
                            <span className="text-2xl">🏪</span>
                            <span className="text-xs font-medium text-gray-600">Home</span>
                        </Link>
                        <Link href="/orders" className="flex flex-col items-center gap-1 transition-all">
                            <span className="text-2xl">📦</span>
                            <span className="text-xs font-semibold text-orange-600">Orders</span>
                        </Link>
                        <Link href="/map" className="flex flex-col items-center gap-1 transition-all hover:scale-110">
                            <span className="text-2xl">🗺️</span>
                            <span className="text-xs font-medium text-gray-600">Map</span>
                        </Link>
                        <Link href="/profile" className="flex flex-col items-center gap-1 transition-all hover:scale-110">
                            <span className="text-2xl">👤</span>
                            <span className="text-xs font-medium text-gray-600">Profile</span>
                        </Link>
                    </div>
                </div>
            </nav>
        </div>
    );
}
