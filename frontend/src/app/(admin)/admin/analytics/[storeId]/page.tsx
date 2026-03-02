'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';

interface AnalyticsData {
    storeName: string;
    period: number;
    overview: { totalOrders: number; totalRevenue: number; avgOrderValue: number; deliveryOrders: number; pickupOrders: number };
    products: { name: string; totalQuantity: number; totalRevenue: number; orderCount: number }[];
    hourlyDistribution: { hour: number; label: string; orders: number; revenue: number }[];
    dayOfWeekDistribution: { day: string; orders: number; revenue: number }[];
    dailyTrend: { date: string; orders: number; revenue: number }[];
    weeklyTrend: { week: string; orders: number; revenue: number }[];
    monthlyTrend: { month: string; orders: number; revenue: number }[];
    topProducts: { name: string; totalQuantity: number; totalRevenue: number; orderCount: number }[];
    lowDemandProducts: { name: string; totalQuantity: number; totalRevenue: number; orderCount: number }[];
}

function SimpleBarChart({ data, labelKey, valueKey, maxVal, color = 'from-blue-500 to-indigo-500' }: { data: any[]; labelKey: string; valueKey: string; maxVal: number; color?: string }) {
    return (
        <div className="flex items-end gap-1 h-40">
            {data.map((item, i) => {
                const pct = maxVal > 0 ? (item[valueKey] / maxVal) * 100 : 0;
                return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                        <div className="relative w-full">
                            <div className={`w-full bg-gradient-to-t ${color} rounded-t-md transition-all hover:opacity-80`}
                                style={{ height: `${Math.max(pct, 2)}%`, minHeight: '4px' }}
                                title={`${item[labelKey]}: ${item[valueKey]}`} />
                        </div>
                        <span className="text-[8px] text-slate-400 truncate max-w-full">{item[labelKey]}</span>
                    </div>
                );
            })}
        </div>
    );
}

export default function StoreAnalyticsPage() {
    const params = useParams();
    const router = useRouter();
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState(30);
    const [error, setError] = useState('');

    const fetchAnalytics = async () => {
        setLoading(true);
        setError('');
        try {
            const { data: res } = await api.get(`/analytics/store/${params.storeId}`, { params: { period } });
            setData(res);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to load analytics');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchAnalytics(); }, [period]);

    const exportCSV = () => {
        if (!data) return;
        const lines: string[] = [];
        lines.push(`Store Analytics Report - ${data.storeName}`);
        lines.push(`Period: Last ${data.period} days`);
        lines.push('');

        lines.push('--- Overview ---');
        lines.push(`Total Orders,${data.overview.totalOrders}`);
        lines.push(`Total Revenue,₹${data.overview.totalRevenue.toFixed(2)}`);
        lines.push(`Average Order Value,₹${data.overview.avgOrderValue.toFixed(2)}`);
        lines.push(`Delivery Orders,${data.overview.deliveryOrders}`);
        lines.push(`Pickup Orders,${data.overview.pickupOrders}`);
        lines.push('');

        lines.push('--- Product Sales ---');
        lines.push('Product,Quantity Sold,Revenue,Order Count');
        data.products.forEach(p => lines.push(`${p.name},${p.totalQuantity},₹${p.totalRevenue.toFixed(2)},${p.orderCount}`));
        lines.push('');

        lines.push('--- Daily Trend ---');
        lines.push('Date,Orders,Revenue');
        data.dailyTrend.forEach(d => lines.push(`${d.date},${d.orders},₹${d.revenue.toFixed(2)}`));
        lines.push('');

        lines.push('--- Hourly Distribution ---');
        lines.push('Hour,Orders,Revenue');
        data.hourlyDistribution.forEach(h => lines.push(`${h.label},${h.orders},₹${h.revenue.toFixed(2)}`));

        const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${data.storeName.replace(/\s+/g, '_')}_analytics_${period}d.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="text-center py-20">
                <div className="text-5xl mb-4">📊</div>
                <p className="text-lg text-red-500 font-medium">{error || 'No data'}</p>
                <button onClick={() => router.back()} className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">← Back</button>
            </div>
        );
    }

    const maxHourlyOrders = Math.max(...data.hourlyDistribution.map(h => h.orders), 1);
    const maxDayOrders = Math.max(...data.dayOfWeekDistribution.map(d => d.orders), 1);

    return (
        <div className="space-y-6 pb-10">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.back()} className="text-slate-500 hover:text-slate-700 text-xl">←</button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">📊 {data.storeName}</h1>
                        <p className="text-sm text-slate-400">Analytics for the last {data.period} days</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <select value={period} onChange={(e) => setPeriod(parseInt(e.target.value))}
                        className="px-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                        <option value={7}>Last 7 days</option>
                        <option value={30}>Last 30 days</option>
                        <option value={90}>Last 90 days</option>
                        <option value={180}>Last 6 months</option>
                        <option value={365}>Last year</option>
                    </select>
                    <button onClick={exportCSV}
                        className="px-5 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg text-sm font-medium hover:shadow-lg transition-all">
                        📥 Export CSV
                    </button>
                </div>
            </div>

            {/* Overview Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {[
                    { label: 'Total Orders', value: data.overview.totalOrders, icon: '📦', bg: 'from-blue-500 to-indigo-500' },
                    { label: 'Revenue', value: `₹${data.overview.totalRevenue.toFixed(0)}`, icon: '💰', bg: 'from-green-500 to-emerald-500' },
                    { label: 'Avg Order', value: `₹${data.overview.avgOrderValue.toFixed(0)}`, icon: '📊', bg: 'from-purple-500 to-violet-500' },
                    { label: 'Delivery', value: data.overview.deliveryOrders, icon: '🚚', bg: 'from-orange-500 to-amber-500' },
                    { label: 'Pickup', value: data.overview.pickupOrders, icon: '🏪', bg: 'from-pink-500 to-rose-500' },
                ].map((card, i) => (
                    <div key={i} className={`bg-gradient-to-br ${card.bg} rounded-2xl p-5 text-white shadow-lg`}>
                        <div className="text-2xl mb-2">{card.icon}</div>
                        <div className="text-2xl font-black">{card.value}</div>
                        <div className="text-xs opacity-80 font-medium mt-1">{card.label}</div>
                    </div>
                ))}
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Hourly Distribution */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-800 mb-4">⏰ Orders by Hour</h3>
                    <SimpleBarChart data={data.hourlyDistribution} labelKey="label" valueKey="orders" maxVal={maxHourlyOrders} color="from-blue-500 to-indigo-500" />
                </div>

                {/* Day of Week */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-800 mb-4">📅 Orders by Day</h3>
                    <SimpleBarChart data={data.dayOfWeekDistribution} labelKey="day" valueKey="orders" maxVal={maxDayOrders} color="from-orange-500 to-amber-500" />
                </div>
            </div>

            {/* Daily Trend */}
            {data.dailyTrend.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-800 mb-4">📈 Daily Revenue Trend</h3>
                    <SimpleBarChart
                        data={data.dailyTrend.slice(-30)}
                        labelKey="date"
                        valueKey="revenue"
                        maxVal={Math.max(...data.dailyTrend.map(d => d.revenue), 1)}
                        color="from-green-500 to-emerald-500"
                    />
                </div>
            )}

            {/* Product Tables */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Top Products */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-800 mb-4">🏆 Top Products</h3>
                    {data.topProducts.length === 0 ? (
                        <p className="text-sm text-slate-400 text-center py-8">No product data</p>
                    ) : (
                        <div className="space-y-3">
                            {data.topProducts.map((p, i) => (
                                <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <span className="text-lg font-bold text-slate-300">#{i + 1}</span>
                                        <div>
                                            <p className="font-semibold text-slate-700 text-sm">{p.name}</p>
                                            <p className="text-xs text-slate-400">{p.totalQuantity} sold · {p.orderCount} orders</p>
                                        </div>
                                    </div>
                                    <span className="font-bold text-green-600 text-sm">₹{p.totalRevenue.toFixed(0)}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Low Demand */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-800 mb-4">📉 Low Demand Products</h3>
                    {data.lowDemandProducts.length === 0 ? (
                        <p className="text-sm text-slate-400 text-center py-8">No product data</p>
                    ) : (
                        <div className="space-y-3">
                            {data.lowDemandProducts.map((p, i) => (
                                <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                                    <div>
                                        <p className="font-semibold text-slate-700 text-sm">{p.name}</p>
                                        <p className="text-xs text-slate-400">{p.totalQuantity} sold · {p.orderCount} orders</p>
                                    </div>
                                    <span className="font-bold text-red-500 text-sm">₹{p.totalRevenue.toFixed(0)}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* All Products Table */}
            {data.products.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-800 mb-4">📋 All Product Sales</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-200">
                                    <th className="text-left py-3 px-4 font-semibold text-slate-600">Product</th>
                                    <th className="text-right py-3 px-4 font-semibold text-slate-600">Qty Sold</th>
                                    <th className="text-right py-3 px-4 font-semibold text-slate-600">Revenue</th>
                                    <th className="text-right py-3 px-4 font-semibold text-slate-600">Orders</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.products.map((p, i) => (
                                    <tr key={i} className="border-b border-slate-100 hover:bg-slate-50">
                                        <td className="py-3 px-4 font-medium text-slate-700">{p.name}</td>
                                        <td className="py-3 px-4 text-right text-slate-600">{p.totalQuantity}</td>
                                        <td className="py-3 px-4 text-right text-green-600 font-semibold">₹{p.totalRevenue.toFixed(0)}</td>
                                        <td className="py-3 px-4 text-right text-slate-500">{p.orderCount}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Monthly Trend */}
            {data.monthlyTrend.length > 1 && (
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-800 mb-4">📅 Monthly Trend (All Time)</h3>
                    <SimpleBarChart
                        data={data.monthlyTrend}
                        labelKey="month"
                        valueKey="revenue"
                        maxVal={Math.max(...data.monthlyTrend.map(m => m.revenue), 1)}
                        color="from-purple-500 to-violet-500"
                    />
                </div>
            )}
        </div>
    );
}
