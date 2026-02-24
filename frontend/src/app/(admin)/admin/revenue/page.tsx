'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { exportToCSV } from '@/lib/csvExport';

interface RevenueOverview {
    totalRevenue: number;
    totalOrders: number;
    averageOrderValue: number;
    totalStores: number;
}

interface StoreRevenue {
    storeId: string;
    storeName: string;
    storeCategory: string;
    totalRevenue: number;
    totalOrders: number;
    completedOrders: number;
    pendingOrders: number;
}

interface DailyRevenue {
    date: string;
    revenue: number;
    orders: number;
}

interface CategoryRevenue {
    category: string;
    revenue: number;
    orders: number;
}

export default function AdminRevenuePage() {
    const [overview, setOverview] = useState<RevenueOverview | null>(null);
    const [storeRevenue, setStoreRevenue] = useState<StoreRevenue[]>([]);
    const [revenueTrend, setRevenueTrend] = useState<DailyRevenue[]>([]);
    const [categoryBreakdown, setCategoryBreakdown] = useState<CategoryRevenue[]>([]);
    const [period, setPeriod] = useState('30');
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState<'overview' | 'stores' | 'trend'>('overview');

    useEffect(() => {
        fetchRevenue();
    }, [period]);

    const fetchRevenue = async () => {
        setLoading(true);
        try {
            const { data } = await api.get(`/analytics/revenue?period=${period}`);
            setOverview(data.overview);
            setStoreRevenue(data.storeRevenue || []);
            setRevenueTrend(data.revenueTrend || []);
            setCategoryBreakdown(data.categoryBreakdown || []);
        } catch (err) {
            console.error('Failed to fetch revenue:', err);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (n: number) => `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    const maxRevenue = Math.max(...revenueTrend.map(d => d.revenue), 1);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800">💰 Revenue Analytics</h1>
                    <p className="text-sm text-slate-500 mt-1">Track earnings across all stores</p>
                </div>
                <div className="flex items-center gap-2">
                    <select
                        value={period}
                        onChange={e => setPeriod(e.target.value)}
                        className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-medium bg-white text-slate-700"
                    >
                        <option value="7">Last 7 days</option>
                        <option value="30">Last 30 days</option>
                        <option value="90">Last 90 days</option>
                        <option value="365">Last year</option>
                    </select>
                    <button
                        onClick={() => {
                            if (tab === 'overview' && categoryBreakdown.length) {
                                exportToCSV(categoryBreakdown.map(c => ({ Category: c.category, Revenue: c.revenue, Orders: c.orders })), 'category_revenue');
                            } else if (tab === 'stores' && storeRevenue.length) {
                                exportToCSV(storeRevenue.map(s => ({ Store: s.storeName, Category: s.storeCategory, Revenue: s.totalRevenue, TotalOrders: s.totalOrders, Completed: s.completedOrders, Pending: s.pendingOrders })), 'store_revenue');
                            } else if (tab === 'trend' && revenueTrend.length) {
                                exportToCSV(revenueTrend.map(d => ({ Date: d.date, Revenue: d.revenue, Orders: d.orders })), 'daily_revenue');
                            }
                        }}
                        className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-colors flex items-center gap-1.5"
                    >
                        📥 Export CSV
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-16">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent"></div>
                </div>
            ) : (
                <>
                    {/* Stats Cards */}
                    {overview && (
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-5 text-white shadow-lg">
                                <p className="text-emerald-100 text-xs font-medium uppercase tracking-wider">Total Revenue</p>
                                <p className="text-3xl font-extrabold mt-1">{formatCurrency(overview.totalRevenue)}</p>
                            </div>
                            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-5 text-white shadow-lg">
                                <p className="text-blue-100 text-xs font-medium uppercase tracking-wider">Total Orders</p>
                                <p className="text-3xl font-extrabold mt-1">{overview.totalOrders}</p>
                            </div>
                            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-5 text-white shadow-lg">
                                <p className="text-purple-100 text-xs font-medium uppercase tracking-wider">Avg Order Value</p>
                                <p className="text-3xl font-extrabold mt-1">{formatCurrency(overview.averageOrderValue)}</p>
                            </div>
                            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-5 text-white shadow-lg">
                                <p className="text-orange-100 text-xs font-medium uppercase tracking-wider">Active Stores</p>
                                <p className="text-3xl font-extrabold mt-1">{overview.totalStores}</p>
                            </div>
                        </div>
                    )}

                    {/* Tabs */}
                    <div className="flex gap-2">
                        {(['overview', 'stores', 'trend'] as const).map(t => (
                            <button
                                key={t}
                                onClick={() => setTab(t)}
                                className={`px-4 py-2 rounded-xl text-sm font-semibold capitalize transition-all ${tab === t
                                    ? 'bg-emerald-600 text-white shadow-sm'
                                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                                    }`}
                            >
                                {t === 'overview' ? '📊 Categories' : t === 'stores' ? '🏪 Per Store' : '📈 Daily Trend'}
                            </button>
                        ))}
                    </div>

                    {/* Category Breakdown */}
                    {tab === 'overview' && (
                        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                            <h2 className="font-bold text-lg text-slate-800 mb-4">Revenue by Category</h2>
                            {categoryBreakdown.length === 0 ? (
                                <p className="text-slate-400 text-sm">No data for this period</p>
                            ) : (
                                <div className="space-y-3">
                                    {categoryBreakdown.map((cat, i) => {
                                        const maxCatRev = Math.max(...categoryBreakdown.map(c => c.revenue), 1);
                                        const pct = (cat.revenue / maxCatRev) * 100;
                                        return (
                                            <div key={i}>
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="text-sm font-medium text-slate-700">{cat.category}</span>
                                                    <span className="text-sm font-bold text-emerald-600">{formatCurrency(cat.revenue)} <span className="text-slate-400 font-normal">({cat.orders} orders)</span></span>
                                                </div>
                                                <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full transition-all duration-500"
                                                        style={{ width: `${pct}%` }}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Per-Store Revenue */}
                    {tab === 'stores' && (
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-100">
                                <h2 className="font-bold text-lg text-slate-800">Revenue per Store</h2>
                            </div>
                            {storeRevenue.length === 0 ? (
                                <div className="p-8 text-center text-slate-400">No store revenue data</div>
                            ) : (
                                <div className="divide-y divide-slate-100">
                                    {storeRevenue.map((store, i) => (
                                        <div key={store.storeId} className="px-6 py-4 hover:bg-slate-50 transition-colors">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <span className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-sm font-bold">
                                                        {i + 1}
                                                    </span>
                                                    <div>
                                                        <p className="font-bold text-slate-800">{store.storeName}</p>
                                                        <p className="text-xs text-slate-400">{store.storeCategory} • {store.totalOrders} orders</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-bold text-lg text-emerald-600">{formatCurrency(store.totalRevenue)}</p>
                                                    <div className="flex gap-2 text-xs">
                                                        <span className="text-green-600">✅ {store.completedOrders}</span>
                                                        <span className="text-yellow-600">⏳ {store.pendingOrders}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Daily Revenue Trend */}
                    {tab === 'trend' && (
                        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                            <h2 className="font-bold text-lg text-slate-800 mb-4">Daily Revenue Trend</h2>
                            {revenueTrend.length === 0 ? (
                                <p className="text-slate-400 text-sm">No data for this period</p>
                            ) : (
                                <div className="space-y-2">
                                    {revenueTrend.map((day, i) => {
                                        const pct = (day.revenue / maxRevenue) * 100;
                                        return (
                                            <div key={i} className="flex items-center gap-3">
                                                <span className="text-xs text-slate-500 w-20 shrink-0">{new Date(day.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                                                <div className="flex-1 h-6 bg-slate-100 rounded-full overflow-hidden relative">
                                                    <div
                                                        className="h-full bg-gradient-to-r from-blue-400 to-emerald-500 rounded-full transition-all duration-500"
                                                        style={{ width: `${Math.max(pct, 2)}%` }}
                                                    />
                                                </div>
                                                <span className="text-xs font-bold text-slate-700 w-24 shrink-0 text-right">
                                                    {formatCurrency(day.revenue)} <span className="text-slate-400 font-normal">({day.orders})</span>
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
