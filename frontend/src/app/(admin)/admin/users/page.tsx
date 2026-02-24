'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import dynamic from 'next/dynamic';
import { exportToCSV } from '@/lib/csvExport';

// Dynamically import map to avoid SSR issues with Leaflet
const UserMap = dynamic(() => import('./UserMap'), { ssr: false, loading: () => <div className="h-96 bg-slate-100 rounded-xl animate-pulse flex items-center justify-center text-slate-400">Loading map...</div> });

interface UserInfo {
    _id: string;
    username: string;
    email?: string;
    phone?: string;
    role: string;
    createdAt: string;
}

interface Activity {
    _id: string;
    user: UserInfo;
    userRole: string;
    action: string;
    details: {
        page?: string;
        element?: string;
        storeId?: string;
        productName?: string;
        searchQuery?: string;
    };
    location?: { coordinates: number[] };
    createdAt: string;
}

interface ActiveUser {
    userId: string;
    username: string;
    email: string;
    role: string;
    location: { coordinates: number[] };
    lastAction: string;
    lastPage: string;
    activityCount: number;
    lastSeen: string;
}

interface BehaviorSummary {
    user: UserInfo;
    totalActivities: number;
    actionBreakdown: { action: string; count: number }[];
    pageViews: { page: string; count: number }[];
    clickMap: { element: string; count: number }[];
    dailyActivity: { date: string; count: number }[];
    recentActivities: Activity[];
}

export default function AdminUsersPage() {
    const [tab, setTab] = useState<'users' | 'map' | 'activity'>('users');
    const [users, setUsers] = useState<UserInfo[]>([]);
    const [activities, setActivities] = useState<Activity[]>([]);
    const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([]);
    const [allUsersOnMap, setAllUsersOnMap] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [roleFilter, setRoleFilter] = useState('all');
    const [selectedUser, setSelectedUser] = useState<string | null>(null);
    const [behavior, setBehavior] = useState<BehaviorSummary | null>(null);
    const [behaviorLoading, setBehaviorLoading] = useState(false);

    useEffect(() => {
        fetchUsers();
    }, []);

    useEffect(() => {
        if (tab === 'map') fetchActiveUsers();
        if (tab === 'activity') fetchActivities();
    }, [tab]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/users/admin/all');
            setUsers(data.users || data || []);
        } catch (err) {
            console.error('Failed to fetch users:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchActivities = async () => {
        try {
            const { data } = await api.get('/analytics/activities?limit=200');
            setActivities(data.activities || []);
        } catch (err) {
            console.error('Failed to fetch activities:', err);
        }
    };

    const fetchActiveUsers = async () => {
        try {
            const { data } = await api.get('/analytics/active-users?minutes=60');
            setActiveUsers(data.activeUsers || []);
            setAllUsersOnMap(data.allUsersWithLocation || []);
        } catch (err) {
            console.error('Failed to fetch active users:', err);
        }
    };

    const fetchUserBehavior = async (userId: string) => {
        setSelectedUser(userId);
        setBehaviorLoading(true);
        try {
            const { data } = await api.get(`/analytics/user/${userId}/behavior?days=30`);
            setBehavior(data);
        } catch (err) {
            console.error('Failed to fetch behavior:', err);
        } finally {
            setBehaviorLoading(false);
        }
    };

    const getRoleBadge = (role: string) => {
        const colors: Record<string, string> = {
            customer: 'bg-blue-100 text-blue-700',
            store_owner: 'bg-orange-100 text-orange-700',
            admin: 'bg-red-100 text-red-700'
        };
        return <span className={`px-2 py-0.5 rounded text-xs font-semibold ${colors[role] || 'bg-slate-100 text-slate-700'}`}>{role}</span>;
    };

    const getActionIcon = (action: string) => {
        const icons: Record<string, string> = {
            page_view: '👁️', button_click: '👆', search: '🔍', store_view: '🏪',
            product_view: '📦', add_to_cart: '🛒', order_placed: '✅', order_cancelled: '❌',
            login: '🔑', logout: '🚪', profile_update: '✏️', support_message: '💬',
            store_edit: '🏪', product_update: '📦', order_status_update: '📋'
        };
        return icons[action] || '📌';
    };

    const filteredUsers = roleFilter === 'all' ? users : users.filter(u => u.role === roleFilter);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800">👥 Users & Analytics</h1>
                    <p className="text-sm text-slate-500 mt-1">Monitor users, activity, and behavior</p>
                </div>
                <button
                    onClick={() => {
                        if (tab === 'users' && filteredUsers.length) {
                            exportToCSV(filteredUsers.map(u => ({ Username: u.username, Email: u.email || '', Phone: u.phone || '', Role: u.role, Registered: u.createdAt })), 'users');
                        } else if (tab === 'activity' && activities.length) {
                            exportToCSV(activities.map(a => ({ User: a.user?.username || 'Unknown', Role: a.userRole, Action: a.action, Page: a.details?.page || '', Element: a.details?.element || '', SearchQuery: a.details?.searchQuery || '', Time: a.createdAt })), 'user_activity');
                        } else if (tab === 'map' && activeUsers.length) {
                            exportToCSV(activeUsers.map(u => ({ Username: u.username, Email: u.email, Role: u.role, LastAction: u.lastAction, LastPage: u.lastPage || '', ActivityCount: u.activityCount, LastSeen: u.lastSeen, Lat: u.location?.coordinates?.[1] || 0, Lng: u.location?.coordinates?.[0] || 0 })), 'active_users');
                        }
                    }}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors flex items-center gap-1.5"
                >
                    📥 Export CSV
                </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2">
                {[
                    { id: 'users' as const, label: '👥 All Users', count: users.length },
                    { id: 'map' as const, label: '🗺️ Live Map', count: activeUsers.length },
                    { id: 'activity' as const, label: '📊 Activity Feed', count: activities.length }
                ].map(t => (
                    <button
                        key={t.id}
                        onClick={() => setTab(t.id)}
                        className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${tab === t.id
                            ? 'bg-indigo-600 text-white shadow-md'
                            : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                            }`}
                    >
                        {t.label}
                        {t.count > 0 && (
                            <span className={`px-1.5 py-0.5 rounded-full text-xs ${tab === t.id ? 'bg-white/20' : 'bg-slate-100'
                                }`}>{t.count}</span>
                        )}
                    </button>
                ))}
            </div>

            {/* Users List */}
            {tab === 'users' && (
                <>
                    {/* Role filter */}
                    <div className="flex gap-2">
                        {['all', 'customer', 'store_owner', 'admin'].map(r => (
                            <button
                                key={r}
                                onClick={() => setRoleFilter(r)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize ${roleFilter === r ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 border border-slate-200'
                                    }`}
                            >
                                {r === 'store_owner' ? 'Partner' : r}
                            </button>
                        ))}
                    </div>

                    {loading ? (
                        <div className="text-center py-12"><div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-indigo-500 border-t-transparent"></div></div>
                    ) : (
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="divide-y divide-slate-100">
                                {filteredUsers.map(user => (
                                    <div key={user._id}
                                        className="px-5 py-4 hover:bg-slate-50 transition-colors cursor-pointer flex items-center justify-between"
                                        onClick={() => fetchUserBehavior(user._id)}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                                                {user.username.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-slate-800">{user.username}</p>
                                                <p className="text-xs text-slate-400">{user.email || user.phone || 'No contact'}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {getRoleBadge(user.role)}
                                            <span className="text-xs text-slate-400">{new Date(user.createdAt).toLocaleDateString()}</span>
                                            <span className="text-slate-300">→</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {filteredUsers.length === 0 && <div className="p-8 text-center text-slate-400">No users found</div>}
                        </div>
                    )}
                </>
            )}

            {/* Map */}
            {tab === 'map' && (
                <div className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                            <p className="text-xs text-green-600 font-medium">Active Now</p>
                            <p className="text-2xl font-bold text-green-700">{activeUsers.length}</p>
                        </div>
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                            <p className="text-xs text-blue-600 font-medium">Customers</p>
                            <p className="text-2xl font-bold text-blue-700">{activeUsers.filter(u => u.role === 'customer').length}</p>
                        </div>
                        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                            <p className="text-xs text-orange-600 font-medium">Partners</p>
                            <p className="text-2xl font-bold text-orange-700">{activeUsers.filter(u => u.role === 'store_owner').length}</p>
                        </div>
                        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                            <p className="text-xs text-purple-600 font-medium">All Users on Map</p>
                            <p className="text-2xl font-bold text-purple-700">{allUsersOnMap.length}</p>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
                            <h2 className="font-bold text-slate-700">🗺️ User Activity Map</h2>
                            <button onClick={fetchActiveUsers} className="text-xs text-indigo-600 font-medium hover:underline">🔄 Refresh</button>
                        </div>
                        <UserMap activeUsers={activeUsers} allUsers={allUsersOnMap} />
                    </div>

                    {/* Active users list */}
                    {activeUsers.length > 0 && (
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
                            <div className="px-5 py-3 border-b border-slate-100">
                                <h2 className="font-bold text-slate-700">🟢 Active Users (Last 60 min)</h2>
                            </div>
                            <div className="divide-y divide-slate-50">
                                {activeUsers.map(u => (
                                    <div key={u.userId} className="px-5 py-3 flex items-center justify-between hover:bg-slate-50">
                                        <div className="flex items-center gap-3">
                                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                                            <div>
                                                <p className="font-medium text-slate-800 text-sm">{u.username}</p>
                                                <p className="text-xs text-slate-400">{u.email}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="flex items-center gap-2">
                                                {getRoleBadge(u.role)}
                                                <span className="text-xs text-slate-400">{u.activityCount} actions</span>
                                            </div>
                                            <p className="text-xs text-slate-400 mt-0.5">{getActionIcon(u.lastAction)} {u.lastAction} • {u.lastPage || 'unknown page'}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Activity Feed */}
            {tab === 'activity' && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
                    <div className="px-5 py-3 border-b border-slate-100">
                        <h2 className="font-bold text-slate-700">📊 Recent Activity</h2>
                    </div>
                    {activities.length === 0 ? (
                        <div className="p-8 text-center text-slate-400">No activity tracked yet. Activities will appear as users interact with the app.</div>
                    ) : (
                        <div className="divide-y divide-slate-50 max-h-[600px] overflow-y-auto">
                            {activities.map(a => (
                                <div key={a._id} className="px-5 py-3 hover:bg-slate-50 flex items-start gap-3">
                                    <span className="text-lg">{getActionIcon(a.action)}</span>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="font-medium text-sm text-slate-800">{a.user?.username || 'Unknown'}</span>
                                            {getRoleBadge(a.userRole)}
                                            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">{a.action.replace('_', ' ')}</span>
                                        </div>
                                        <p className="text-xs text-slate-400 mt-0.5">
                                            {a.details?.page && `Page: ${a.details.page}`}
                                            {a.details?.element && ` • Clicked: ${a.details.element}`}
                                            {a.details?.searchQuery && ` • Search: "${a.details.searchQuery}"`}
                                        </p>
                                    </div>
                                    <span className="text-xs text-slate-400 whitespace-nowrap">
                                        {new Date(a.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* User Behavior Detail Modal */}
            {selectedUser && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => { setSelectedUser(null); setBehavior(null); }}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between sticky top-0 z-10">
                            <h2 className="font-bold text-lg text-slate-800">User Behavior Analysis</h2>
                            <button onClick={() => { setSelectedUser(null); setBehavior(null); }} className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-300">✕</button>
                        </div>

                        {behaviorLoading ? (
                            <div className="p-12 text-center"><div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-indigo-500 border-t-transparent"></div></div>
                        ) : behavior ? (
                            <div className="p-6 space-y-6">
                                {/* User Info */}
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold text-xl">
                                        {behavior.user?.username?.charAt(0).toUpperCase() || '?'}
                                    </div>
                                    <div>
                                        <p className="font-bold text-xl text-slate-800">{behavior.user?.username}</p>
                                        <p className="text-sm text-slate-400">{behavior.user?.email || behavior.user?.phone} • {getRoleBadge(behavior.user?.role || '')}</p>
                                        <p className="text-xs text-slate-400 mt-0.5">{behavior.totalActivities} total activities in 30 days</p>
                                    </div>
                                </div>

                                {/* Action Breakdown */}
                                <div>
                                    <h3 className="font-bold text-sm text-slate-700 mb-2">📊 Action Breakdown</h3>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                        {behavior.actionBreakdown.map(a => (
                                            <div key={a.action} className="bg-slate-50 rounded-lg px-3 py-2">
                                                <span className="text-sm">{getActionIcon(a.action)} </span>
                                                <span className="text-xs font-medium text-slate-700">{a.action.replace('_', ' ')}</span>
                                                <span className="block text-lg font-bold text-indigo-600">{a.count}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Pages Visited */}
                                {behavior.pageViews.length > 0 && (
                                    <div>
                                        <h3 className="font-bold text-sm text-slate-700 mb-2">👁️ Pages Visited</h3>
                                        <div className="space-y-1.5">
                                            {behavior.pageViews.slice(0, 10).map(p => {
                                                const maxPV = Math.max(...behavior.pageViews.map(x => x.count), 1);
                                                return (
                                                    <div key={p.page} className="flex items-center gap-2">
                                                        <span className="text-xs text-slate-500 w-32 truncate">{p.page}</span>
                                                        <div className="flex-1 h-4 bg-slate-100 rounded-full overflow-hidden">
                                                            <div className="h-full bg-indigo-400 rounded-full" style={{ width: `${(p.count / maxPV) * 100}%` }} />
                                                        </div>
                                                        <span className="text-xs font-bold text-slate-600 w-8 text-right">{p.count}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Clicks */}
                                {behavior.clickMap.length > 0 && (
                                    <div>
                                        <h3 className="font-bold text-sm text-slate-700 mb-2">👆 Elements Clicked</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {behavior.clickMap.slice(0, 15).map(c => (
                                                <span key={c.element} className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg text-xs font-medium">
                                                    {c.element} <span className="font-bold">({c.count})</span>
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Pages NOT visited (inferred from common pages) */}
                                <div>
                                    <h3 className="font-bold text-sm text-slate-700 mb-2">⚠️ Pages Not Visited</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {['/home', '/orders', '/map', '/profile', '/partner/dashboard'].filter(p => !behavior.pageViews.some(pv => pv.page === p)).map(p => (
                                            <span key={p} className="bg-red-50 text-red-600 px-3 py-1.5 rounded-lg text-xs font-medium">
                                                ❌ {p}
                                            </span>
                                        ))}
                                        {['/home', '/orders', '/map', '/profile', '/partner/dashboard'].every(p => behavior.pageViews.some(pv => pv.page === p)) && (
                                            <span className="text-xs text-green-600 font-medium">✅ User visited all key pages!</span>
                                        )}
                                    </div>
                                </div>

                                {/* Daily Activity */}
                                {behavior.dailyActivity.length > 0 && (
                                    <div>
                                        <h3 className="font-bold text-sm text-slate-700 mb-2">📅 Daily Activity</h3>
                                        <div className="flex items-end gap-1 h-20 overflow-x-auto">
                                            {behavior.dailyActivity.map(d => {
                                                const maxDA = Math.max(...behavior.dailyActivity.map(x => x.count), 1);
                                                const h = (d.count / maxDA) * 100;
                                                return (
                                                    <div key={d.date} className="flex flex-col items-center gap-1" title={`${d.date}: ${d.count} activities`}>
                                                        <div className="w-4 bg-indigo-400 rounded-t" style={{ height: `${Math.max(h, 5)}%` }} />
                                                        <span className="text-[8px] text-slate-400 -rotate-45">{d.date.slice(5)}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Recent Activities */}
                                {behavior.recentActivities.length > 0 && (
                                    <div>
                                        <h3 className="font-bold text-sm text-slate-700 mb-2">🕐 Recent Activity</h3>
                                        <div className="max-h-48 overflow-y-auto space-y-1">
                                            {behavior.recentActivities.slice(0, 20).map(a => (
                                                <div key={a._id} className="flex items-center gap-2 text-xs">
                                                    <span>{getActionIcon(a.action)}</span>
                                                    <span className="text-slate-600">{a.action.replace('_', ' ')}</span>
                                                    {a.details?.page && <span className="text-slate-400">on {a.details.page}</span>}
                                                    <span className="ml-auto text-slate-300">{new Date(a.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="p-8 text-center text-slate-400">No behavior data found</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
