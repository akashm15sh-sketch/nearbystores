'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { exportToCSV } from '@/lib/csvExport';

interface SupportMessage {
    _id: string;
    senderName: string;
    senderEmail?: string;
    senderPhone?: string;
    senderRole: string;
    message: string;
    contactPreference: string;
    status: string;
    adminNotes?: string;
    adminReply?: string;
    createdAt: string;
}

export default function CustomerCarePage() {
    const [messages, setMessages] = useState<SupportMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [roleFilter, setRoleFilter] = useState('all');
    const [selectedMsg, setSelectedMsg] = useState<SupportMessage | null>(null);
    const [adminNotes, setAdminNotes] = useState('');
    const [adminReply, setAdminReply] = useState('');
    const [updating, setUpdating] = useState(false);

    // Admin contact settings (saved to localStorage)
    const [showSettings, setShowSettings] = useState(false);
    const [adminPhone, setAdminPhone] = useState('');
    const [adminEmail, setAdminEmail] = useState('');
    const [settingsSaved, setSettingsSaved] = useState(false);

    // Load admin contact from localStorage
    useEffect(() => {
        const saved = localStorage.getItem('adminContactSettings');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                setAdminPhone(parsed.phone || '');
                setAdminEmail(parsed.email || '');
            } catch { /* ignore */ }
        }
    }, []);

    useEffect(() => {
        fetchMessages();
    }, [filter]);

    const fetchMessages = async () => {
        setLoading(true);
        try {
            const params = filter !== 'all' ? { status: filter } : {};
            const { data } = await api.get('/support/admin', { params });
            setMessages(data.messages || []);
        } catch (error) {
            console.error('Failed to fetch support messages', error);
        } finally {
            setLoading(false);
        }
    };

    const saveContactSettings = () => {
        localStorage.setItem('adminContactSettings', JSON.stringify({ phone: adminPhone, email: adminEmail }));
        setSettingsSaved(true);
        setTimeout(() => setSettingsSaved(false), 2000);
    };

    const updateMessage = async (id: string, status: string) => {
        setUpdating(true);
        try {
            await api.patch(`/support/admin/${id}`, { status, adminNotes, adminReply });
            setMessages(prev => prev.map(m => m._id === id ? { ...m, status, adminNotes, adminReply } : m));
            setSelectedMsg(null);
            setAdminNotes('');
            setAdminReply('');
        } catch (error) {
            console.error('Failed to update message', error);
        } finally {
            setUpdating(false);
        }
    };

    const sendReplyOnly = async (id: string) => {
        if (!adminReply.trim()) return;
        setUpdating(true);
        try {
            await api.patch(`/support/admin/${id}`, { status: 'in_progress', adminReply, adminNotes });
            setMessages(prev => prev.map(m => m._id === id ? { ...m, status: 'in_progress', adminReply, adminNotes } : m));
            setSelectedMsg(null);
            setAdminReply('');
            setAdminNotes('');
        } catch (error) {
            console.error('Failed to send reply', error);
        } finally {
            setUpdating(false);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'open': return <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold">🔴 Open</span>;
            case 'in_progress': return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-semibold">🟡 In Progress</span>;
            case 'resolved': return <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">🟢 Resolved</span>;
            default: return null;
        }
    };

    const getRoleBadge = (role: string) => {
        return role === 'customer'
            ? <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">Customer</span>
            : <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded text-xs font-medium">Partner</span>;
    };

    const getContactIcon = (pref: string) => {
        switch (pref) {
            case 'call': return '📞';
            case 'email': return '📧';
            default: return '💬';
        }
    };

    // Derived counts
    const customerCount = messages.filter(m => m.senderRole === 'customer').length;
    const partnerCount = messages.filter(m => m.senderRole === 'store_owner').length;
    const openCustomerCount = messages.filter(m => m.senderRole === 'customer' && m.status === 'open').length;
    const openPartnerCount = messages.filter(m => m.senderRole === 'store_owner' && m.status === 'open').length;

    // Filter by role
    const displayMessages = roleFilter === 'all' ? messages : messages.filter(m => m.senderRole === roleFilter);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800">Customer Care</h1>
                    <p className="text-sm text-slate-500 mt-1">Manage support messages from customers and partners</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => {
                            if (displayMessages.length) {
                                exportToCSV(displayMessages.map(m => ({ Name: m.senderName, Role: m.senderRole, Email: m.senderEmail || '', Phone: m.senderPhone || '', Message: m.message, ContactPreference: m.contactPreference, Status: m.status, AdminReply: m.adminReply || '', AdminNotes: m.adminNotes || '', Date: m.createdAt })), 'support_messages');
                            }
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors flex items-center gap-1.5"
                    >
                        📥 Export CSV
                    </button>
                    <button
                        onClick={() => setShowSettings(!showSettings)}
                        className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all flex items-center gap-2"
                    >
                        ⚙️ Contact Settings
                    </button>
                </div>
            </div>

            {/* Role-based notification cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-4 text-white shadow-lg cursor-pointer hover:shadow-xl transition-shadow" onClick={() => setRoleFilter(roleFilter === 'customer' ? 'all' : 'customer')}>
                    <p className="text-blue-100 text-xs font-medium uppercase tracking-wider">👤 Customer Queries</p>
                    <p className="text-3xl font-extrabold mt-1">{customerCount}</p>
                    {openCustomerCount > 0 && <p className="text-xs text-blue-200 mt-1">🔴 {openCustomerCount} open</p>}
                </div>
                <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-4 text-white shadow-lg cursor-pointer hover:shadow-xl transition-shadow" onClick={() => setRoleFilter(roleFilter === 'store_owner' ? 'all' : 'store_owner')}>
                    <p className="text-orange-100 text-xs font-medium uppercase tracking-wider">🏪 Partner Queries</p>
                    <p className="text-3xl font-extrabold mt-1">{partnerCount}</p>
                    {openPartnerCount > 0 && <p className="text-xs text-orange-200 mt-1">🔴 {openPartnerCount} open</p>}
                </div>
                <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-4 text-white shadow-lg">
                    <p className="text-red-100 text-xs font-medium uppercase tracking-wider">🔴 Total Open</p>
                    <p className="text-3xl font-extrabold mt-1">{messages.filter(m => m.status === 'open').length}</p>
                </div>
                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-4 text-white shadow-lg">
                    <p className="text-green-100 text-xs font-medium uppercase tracking-wider">✅ Resolved</p>
                    <p className="text-3xl font-extrabold mt-1">{messages.filter(m => m.status === 'resolved').length}</p>
                </div>
            </div>

            {/* Admin Contact Settings Panel */}
            {showSettings && (
                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                    <h2 className="text-base font-bold text-slate-800 mb-1">Your Contact Info</h2>
                    <p className="text-xs text-slate-400 mb-4">Set the phone and email customers will see when they contact support</p>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="flex-1">
                            <label className="block text-xs font-semibold text-slate-600 mb-1">📞 Admin Phone</label>
                            <input
                                type="tel"
                                value={adminPhone}
                                onChange={e => setAdminPhone(e.target.value)}
                                placeholder="+91 9876543210"
                                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-200 outline-none text-slate-800"
                            />
                        </div>
                        <div className="flex-1">
                            <label className="block text-xs font-semibold text-slate-600 mb-1">📧 Admin Email</label>
                            <input
                                type="email"
                                value={adminEmail}
                                onChange={e => setAdminEmail(e.target.value)}
                                placeholder="admin@nearbystores.com"
                                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-200 outline-none text-slate-800"
                            />
                        </div>
                        <div className="flex items-end">
                            <button
                                onClick={saveContactSettings}
                                className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors whitespace-nowrap"
                            >
                                {settingsSaved ? '✅ Saved!' : '💾 Save'}
                            </button>
                        </div>
                    </div>
                    {(adminPhone || adminEmail) && (
                        <div className="mt-3 p-3 bg-slate-50 rounded-lg text-xs text-slate-500">
                            <strong>Saved contact:</strong> {adminPhone && `📞 ${adminPhone}`} {adminPhone && adminEmail && '•'} {adminEmail && `📧 ${adminEmail}`}
                        </div>
                    )}
                </div>
            )}

            {/* Filters */}
            <div className="flex items-center gap-2 flex-wrap">
                {/* Status filters */}
                {['all', 'open', 'in_progress', 'resolved'].map(f => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${filter === f
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                            }`}
                    >
                        {f === 'in_progress' ? 'In Progress' : f}
                    </button>
                ))}
                <div className="w-px h-6 bg-slate-200"></div>
                {/* Role filters */}
                {[
                    { id: 'all', label: 'All Roles', icon: '👥' },
                    { id: 'customer', label: 'Customers', icon: '👤' },
                    { id: 'store_owner', label: 'Partners', icon: '🏪' }
                ].map(r => (
                    <button
                        key={r.id}
                        onClick={() => setRoleFilter(r.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${roleFilter === r.id
                            ? r.id === 'customer' ? 'bg-blue-600 text-white shadow-sm'
                                : r.id === 'store_owner' ? 'bg-orange-600 text-white shadow-sm'
                                    : 'bg-slate-800 text-white shadow-sm'
                            : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                            }`}
                    >
                        {r.icon} {r.label}
                    </button>
                ))}
            </div>

            {/* Message List */}
            {loading ? (
                <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-blue-500 border-t-transparent"></div>
                </div>
            ) : messages.length === 0 ? (
                <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
                    <div className="text-5xl mb-3">📭</div>
                    <p className="text-lg font-medium text-slate-600">No messages found</p>
                    <p className="text-sm text-slate-400 mt-1">
                        {filter !== 'all' ? 'Try a different filter' : 'No support messages yet'}
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {displayMessages.map(msg => (
                        <div
                            key={msg._id}
                            onClick={() => { setSelectedMsg(msg); setAdminNotes(msg.adminNotes || ''); setAdminReply(msg.adminReply || ''); }}
                            className={`bg-white rounded-xl border p-5 cursor-pointer transition-all hover:shadow-md border-l-4 ${msg.senderRole === 'customer'
                                    ? 'border-l-blue-500' + (msg.status === 'open' ? ' border-t-red-200 border-r-red-200 border-b-red-200' : ' border-t-slate-200 border-r-slate-200 border-b-slate-200')
                                    : 'border-l-orange-500' + (msg.status === 'open' ? ' border-t-red-200 border-r-red-200 border-b-red-200' : ' border-t-slate-200 border-r-slate-200 border-b-slate-200')
                                }`}
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                                        <span className="font-bold text-slate-800">{msg.senderName}</span>
                                        {getRoleBadge(msg.senderRole)}
                                        {getStatusBadge(msg.status)}
                                    </div>
                                    <p className="text-sm text-slate-600 line-clamp-2">{msg.message}</p>
                                    {msg.adminReply && (
                                        <p className="text-xs text-blue-600 mt-1.5 bg-blue-50 px-2 py-1 rounded-lg inline-block">
                                            💬 Replied: {msg.adminReply.substring(0, 80)}{msg.adminReply.length > 80 ? '...' : ''}
                                        </p>
                                    )}
                                    <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                                        <span>{getContactIcon(msg.contactPreference)} Prefers: {msg.contactPreference}</span>
                                        {msg.senderPhone && <span>📱 {msg.senderPhone}</span>}
                                        {msg.senderEmail && <span>📧 {msg.senderEmail}</span>}
                                    </div>
                                </div>
                                <span className="text-xs text-slate-400 whitespace-nowrap">
                                    {new Date(msg.createdAt).toLocaleDateString()} {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Detail Modal */}
            {selectedMsg && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedMsg(null)}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between sticky top-0">
                            <h2 className="font-bold text-lg text-slate-800">Support Message</h2>
                            <button onClick={() => setSelectedMsg(null)} className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center hover:bg-slate-300 text-slate-600">✕</button>
                        </div>

                        <div className="p-6 space-y-4">
                            {/* Sender Info */}
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-slate-800">{selectedMsg.senderName}</span>
                                {getRoleBadge(selectedMsg.senderRole)}
                                {getStatusBadge(selectedMsg.status)}
                            </div>

                            {/* Original Message */}
                            <div className="bg-slate-50 rounded-xl p-4">
                                <p className="text-xs font-semibold text-slate-500 mb-1">Their Message:</p>
                                <p className="text-slate-700 text-sm whitespace-pre-wrap">{selectedMsg.message}</p>
                            </div>

                            {/* Contact Info */}
                            <div className="flex flex-wrap gap-2 text-sm">
                                <span className="bg-slate-100 px-3 py-1.5 rounded-lg text-slate-600">{getContactIcon(selectedMsg.contactPreference)} {selectedMsg.contactPreference}</span>
                                {selectedMsg.senderPhone && (
                                    <a href={`tel:${selectedMsg.senderPhone}`} className="bg-green-50 text-green-700 px-3 py-1.5 rounded-lg hover:bg-green-100 transition-colors">📞 {selectedMsg.senderPhone}</a>
                                )}
                                {selectedMsg.senderEmail && (
                                    <a href={`mailto:${selectedMsg.senderEmail}`} className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors">📧 {selectedMsg.senderEmail}</a>
                                )}
                            </div>

                            {/* Admin Reply */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">💬 Reply to User</label>
                                <textarea
                                    value={adminReply}
                                    onChange={e => setAdminReply(e.target.value)}
                                    placeholder="Type your reply message here..."
                                    rows={3}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-200 outline-none resize-none text-slate-800"
                                />
                            </div>

                            {/* Admin Notes */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">📝 Internal Notes</label>
                                <textarea
                                    value={adminNotes}
                                    onChange={e => setAdminNotes(e.target.value)}
                                    placeholder="Add internal notes (not visible to user)..."
                                    rows={2}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-slate-200 outline-none resize-none text-slate-800 bg-slate-50"
                                />
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 space-y-3 sticky bottom-0">
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-slate-400">{new Date(selectedMsg.createdAt).toLocaleString()}</span>
                            </div>
                            <div className="flex gap-2 flex-wrap">
                                {adminReply.trim() && (
                                    <button
                                        onClick={() => sendReplyOnly(selectedMsg._id)}
                                        disabled={updating}
                                        className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
                                    >
                                        {updating ? 'Sending...' : '💬 Send Reply'}
                                    </button>
                                )}
                                {selectedMsg.status !== 'in_progress' && (
                                    <button
                                        onClick={() => updateMessage(selectedMsg._id, 'in_progress')}
                                        disabled={updating}
                                        className="px-4 py-2.5 bg-yellow-100 text-yellow-700 rounded-xl text-sm font-semibold hover:bg-yellow-200 transition-colors disabled:opacity-50"
                                    >
                                        🟡 In Progress
                                    </button>
                                )}
                                {selectedMsg.status !== 'resolved' && (
                                    <button
                                        onClick={() => updateMessage(selectedMsg._id, 'resolved')}
                                        disabled={updating}
                                        className="px-4 py-2.5 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 transition-colors disabled:opacity-50"
                                    >
                                        ✅ Resolve
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
