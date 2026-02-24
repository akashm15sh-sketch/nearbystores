'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';

interface StoreProduct {
    _id?: string;
    name: string;
    price: number;
    image?: string;
    inStock: boolean;
}

interface StoreData {
    _id: string;
    name: string;
    category: string;
    description: string;
    images: string[];
    icon: string | null;
    approvalStatus: 'pending' | 'approved' | 'rejected';
    currentStatus: 'open' | 'closed' | 'busy';
    location: {
        type: string;
        coordinates: number[];
        address: string;
    };
    schedule: Record<string, { open: string; close: string; isOpen: boolean }>;
    products: StoreProduct[];
    contact: { phone?: string; email?: string; whatsapp?: string };
    paymentMethods: {
        upiId?: string;
        qrCodeUrl?: string;
        razorpayEnabled?: boolean;
        cashOnDelivery?: boolean;
    };
    owner: { username?: string; email?: string; _id?: string };
    createdAt: string;
}

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const CATEGORIES = ['food', 'grocery', 'bakery', 'restaurant', 'pharmacy', 'electronics', 'clothing', 'beauty', 'sports', 'books', 'pets', 'hardware', 'home_decor', 'general', 'other'];

const defaultSchedule: Record<string, { open: string; close: string; isOpen: boolean }> = {
    monday: { open: '09:00', close: '21:00', isOpen: true },
    tuesday: { open: '09:00', close: '21:00', isOpen: true },
    wednesday: { open: '09:00', close: '21:00', isOpen: true },
    thursday: { open: '09:00', close: '21:00', isOpen: true },
    friday: { open: '09:00', close: '21:00', isOpen: true },
    saturday: { open: '09:00', close: '21:00', isOpen: true },
    sunday: { open: '10:00', close: '20:00', isOpen: true },
};

export default function AdminStoresPage() {
    const [stores, setStores] = useState<StoreData[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingStore, setEditingStore] = useState<StoreData | null>(null);
    const [activeTab, setActiveTab] = useState<'info' | 'schedule' | 'products' | 'payments'>('info');
    const [saving, setSaving] = useState(false);
    const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
    const [successMsg, setSuccessMsg] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        fetchStores();
    }, []);

    const fetchStores = async () => {
        setErrorMsg('');
        try {
            const { data } = await api.get('/stores/admin/all');
            setStores(data.stores || []);
        } catch (error: any) {
            console.error('Failed to fetch stores:', error);
            const msg = error.response?.data?.message || error.message || 'Failed to fetch stores';
            const status = error.response?.status;
            if (status === 403) {
                setErrorMsg('Access denied. Make sure you are logged in as an admin.');
            } else if (status === 401) {
                setErrorMsg('Session expired. Please log in again.');
            } else {
                setErrorMsg(`Error loading stores: ${msg}`);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!editingStore) return;
        setSaving(true);
        try {
            await api.put(`/stores/${editingStore._id}`, {
                name: editingStore.name,
                category: editingStore.category,
                description: editingStore.description,
                location: editingStore.location,
                schedule: editingStore.schedule,
                products: editingStore.products,
                contact: editingStore.contact,
                paymentMethods: editingStore.paymentMethods,
                currentStatus: editingStore.currentStatus,
                approvalStatus: editingStore.approvalStatus,
            });
            setSuccessMsg('Store updated successfully!');
            setTimeout(() => setSuccessMsg(''), 3000);
            fetchStores();
            setEditingStore(null);
        } catch (error: any) {
            alert(error.response?.data?.message || 'Failed to update store');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this store? This cannot be undone.')) return;
        try {
            await api.delete(`/stores/${id}`);
            fetchStores();
        } catch (error) {
            alert('Failed to delete store');
        }
    };

    const addProduct = () => {
        if (!editingStore) return;
        setEditingStore({
            ...editingStore,
            products: [...editingStore.products, { name: '', price: 0, inStock: true }],
        });
    };

    const updateProduct = (index: number, field: string, value: any) => {
        if (!editingStore) return;
        const updated = [...editingStore.products];
        (updated[index] as any)[field] = value;
        setEditingStore({ ...editingStore, products: updated });
    };

    const removeProduct = (index: number) => {
        if (!editingStore) return;
        setEditingStore({
            ...editingStore,
            products: editingStore.products.filter((_, i) => i !== index),
        });
    };

    const filteredStores = stores.filter(s => filter === 'all' || s.approvalStatus === filter);

    const statusColors: Record<string, string> = {
        pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        approved: 'bg-green-100 text-green-800 border-green-200',
        rejected: 'bg-red-100 text-red-800 border-red-200',
    };

    const currentStatusColors: Record<string, string> = {
        open: 'text-green-600',
        closed: 'text-red-500',
        busy: 'text-yellow-600',
    };

    if (loading) {
        return <div className="flex items-center justify-center h-full py-20"><div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div></div>;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-slate-800">Store Management</h1>
                <span className="text-sm text-slate-500">{stores.length} total stores</span>
            </div>

            {successMsg && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm font-medium">
                    ✅ {successMsg}
                </div>
            )}

            {errorMsg && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-xl text-sm font-medium flex items-center justify-between">
                    <span>❌ {errorMsg}</span>
                    <button onClick={() => { setLoading(true); fetchStores(); }} className="px-3 py-1 bg-red-100 hover:bg-red-200 rounded-lg text-xs font-semibold transition-colors">
                        Retry
                    </button>
                </div>
            )}

            {/* Filters */}
            <div className="flex gap-2">
                {(['all', 'pending', 'approved', 'rejected'] as const).map(f => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filter === f ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
                    >
                        {f.charAt(0).toUpperCase() + f.slice(1)}
                        {f !== 'all' && <span className="ml-1.5 text-xs opacity-70">({stores.filter(s => s.approvalStatus === f).length})</span>}
                    </button>
                ))}
            </div>

            {/* Store List */}
            <div className="space-y-3">
                {filteredStores.length === 0 ? (
                    <div className="text-center py-16 text-slate-500">No stores match this filter</div>
                ) : filteredStores.map(store => (
                    <div key={store._id} className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-1">
                                    <h3 className="text-lg font-bold text-slate-800">{store.name}</h3>
                                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusColors[store.approvalStatus]}`}>
                                        {store.approvalStatus}
                                    </span>
                                    <span className={`text-xs font-medium ${currentStatusColors[store.currentStatus] || 'text-slate-400'}`}>
                                        ● {store.currentStatus}
                                    </span>
                                </div>
                                <p className="text-sm text-slate-500 mb-1">{store.location?.address || 'No address'}</p>
                                <div className="flex items-center gap-4 text-xs text-slate-400">
                                    <span>📁 {store.category}</span>
                                    <span>📦 {store.products?.length || 0} products</span>
                                    <span>👤 {store.owner?.username || 'Unknown'}</span>
                                    <span>📅 {new Date(store.createdAt).toLocaleDateString()}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 ml-4">
                                <button
                                    onClick={() => { setEditingStore(JSON.parse(JSON.stringify(store))); setActiveTab('info'); }}
                                    className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 text-sm font-medium transition-colors"
                                >
                                    ✏️ Edit
                                </button>
                                <button
                                    onClick={() => handleDelete(store._id)}
                                    className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 text-sm font-medium transition-colors"
                                >
                                    🗑️
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Edit Modal */}
            {editingStore && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
                        {/* Modal Header */}
                        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                            <div>
                                <h2 className="text-xl font-bold text-slate-800">Edit Store</h2>
                                <p className="text-sm text-slate-500">{editingStore.name}</p>
                            </div>
                            <button onClick={() => setEditingStore(null)} className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center hover:bg-slate-300 transition-colors text-slate-600">✕</button>
                        </div>

                        {/* Tabs */}
                        <div className="flex border-b border-slate-200 bg-white">
                            {([
                                { id: 'info', label: '📋 Info' },
                                { id: 'schedule', label: '🕐 Schedule' },
                                { id: 'products', label: '📦 Products' },
                                { id: 'payments', label: '💳 Payments' },
                            ] as const).map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex-1 px-4 py-3 text-sm font-medium transition-all ${activeTab === tab.id ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* Tab Content */}
                        <div className="flex-1 overflow-y-auto p-6">
                            {/* INFO TAB */}
                            {activeTab === 'info' && (
                                <div className="space-y-5">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Store Name</label>
                                            <input type="text" value={editingStore.name} onChange={e => setEditingStore({ ...editingStore, name: e.target.value })} className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                                            <select value={editingStore.category} onChange={e => setEditingStore({ ...editingStore, category: e.target.value })} className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm">
                                                {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                                        <textarea value={editingStore.description || ''} onChange={e => setEditingStore({ ...editingStore, description: e.target.value })} rows={3} className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm resize-none" />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
                                        <input type="text" value={editingStore.location?.address || ''} onChange={e => setEditingStore({ ...editingStore, location: { ...editingStore.location, address: e.target.value } })} className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm" />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Latitude</label>
                                            <input type="number" step="any" value={editingStore.location?.coordinates?.[1] || ''} onChange={e => setEditingStore({ ...editingStore, location: { ...editingStore.location, coordinates: [editingStore.location?.coordinates?.[0] || 0, parseFloat(e.target.value) || 0] } })} className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Longitude</label>
                                            <input type="number" step="any" value={editingStore.location?.coordinates?.[0] || ''} onChange={e => setEditingStore({ ...editingStore, location: { ...editingStore.location, coordinates: [parseFloat(e.target.value) || 0, editingStore.location?.coordinates?.[1] || 0] } })} className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm" />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                                            <input type="tel" value={editingStore.contact?.phone || ''} onChange={e => setEditingStore({ ...editingStore, contact: { ...editingStore.contact, phone: e.target.value } })} className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                                            <input type="email" value={editingStore.contact?.email || ''} onChange={e => setEditingStore({ ...editingStore, contact: { ...editingStore.contact, email: e.target.value } })} className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">WhatsApp</label>
                                            <input type="tel" value={editingStore.contact?.whatsapp || ''} onChange={e => setEditingStore({ ...editingStore, contact: { ...editingStore.contact, whatsapp: e.target.value } })} className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm" />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Approval Status</label>
                                            <select value={editingStore.approvalStatus} onChange={e => setEditingStore({ ...editingStore, approvalStatus: e.target.value as any })} className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm">
                                                <option value="pending">Pending</option>
                                                <option value="approved">Approved</option>
                                                <option value="rejected">Rejected</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Current Status</label>
                                            <select value={editingStore.currentStatus} onChange={e => setEditingStore({ ...editingStore, currentStatus: e.target.value as any })} className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm">
                                                <option value="open">🟢 Open</option>
                                                <option value="busy">🟡 Busy</option>
                                                <option value="closed">🔴 Closed</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* SCHEDULE TAB */}
                            {activeTab === 'schedule' && (
                                <div className="space-y-3">
                                    <p className="text-sm text-slate-500 mb-4">Set opening and closing times for each day of the week.</p>
                                    {DAYS.map(day => {
                                        const sched = editingStore.schedule?.[day] || defaultSchedule[day];
                                        return (
                                            <div key={day} className="flex items-center gap-4 py-3 px-4 bg-slate-50 rounded-lg">
                                                <div className="w-28">
                                                    <span className="text-sm font-semibold text-slate-700 capitalize">{day}</span>
                                                </div>
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={sched.isOpen}
                                                        onChange={e => setEditingStore({
                                                            ...editingStore,
                                                            schedule: { ...editingStore.schedule, [day]: { ...sched, isOpen: e.target.checked } }
                                                        })}
                                                        className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                                                    />
                                                    <span className="text-xs text-slate-500">{sched.isOpen ? 'Open' : 'Closed'}</span>
                                                </label>
                                                {sched.isOpen && (
                                                    <div className="flex items-center gap-2 ml-auto">
                                                        <input
                                                            type="time"
                                                            value={sched.open}
                                                            onChange={e => setEditingStore({
                                                                ...editingStore,
                                                                schedule: { ...editingStore.schedule, [day]: { ...sched, open: e.target.value } }
                                                            })}
                                                            className="px-2 py-1.5 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                                        />
                                                        <span className="text-slate-400 text-xs">to</span>
                                                        <input
                                                            type="time"
                                                            value={sched.close}
                                                            onChange={e => setEditingStore({
                                                                ...editingStore,
                                                                schedule: { ...editingStore.schedule, [day]: { ...sched, close: e.target.value } }
                                                            })}
                                                            className="px-2 py-1.5 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* PRODUCTS TAB */}
                            {activeTab === 'products' && (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm text-slate-500">{editingStore.products?.length || 0} products</p>
                                        <button onClick={addProduct} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                                            + Add Product
                                        </button>
                                    </div>
                                    {editingStore.products?.length === 0 ? (
                                        <div className="text-center py-12 text-slate-400">
                                            <p className="text-4xl mb-2">📦</p>
                                            <p>No products yet. Add your first product!</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {editingStore.products.map((product, idx) => (
                                                <div key={idx} className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
                                                    <div className="flex-1 grid grid-cols-3 gap-3">
                                                        <input
                                                            type="text"
                                                            value={product.name}
                                                            onChange={e => updateProduct(idx, 'name', e.target.value)}
                                                            placeholder="Product name"
                                                            className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                                        />
                                                        <div className="relative">
                                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">₹</span>
                                                            <input
                                                                type="number"
                                                                value={product.price}
                                                                onChange={e => updateProduct(idx, 'price', parseFloat(e.target.value) || 0)}
                                                                placeholder="Price"
                                                                className="w-full pl-7 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                                            />
                                                        </div>
                                                        <label className="flex items-center gap-2 cursor-pointer">
                                                            <input
                                                                type="checkbox"
                                                                checked={product.inStock}
                                                                onChange={e => updateProduct(idx, 'inStock', e.target.checked)}
                                                                className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                                                            />
                                                            <span className={`text-sm ${product.inStock ? 'text-green-600 font-medium' : 'text-red-500'}`}>
                                                                {product.inStock ? 'In Stock' : 'Out of Stock'}
                                                            </span>
                                                        </label>
                                                    </div>
                                                    <button
                                                        onClick={() => removeProduct(idx)}
                                                        className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    >
                                                        🗑️
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* PAYMENTS TAB */}
                            {activeTab === 'payments' && (
                                <div className="space-y-5">
                                    <p className="text-sm text-slate-500 mb-2">Configure accepted payment methods for this store.</p>

                                    {/* Cash on Delivery */}
                                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
                                        <div>
                                            <p className="font-medium text-slate-700">💵 Cash on Delivery</p>
                                            <p className="text-xs text-slate-400">Accept cash payments</p>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={editingStore.paymentMethods?.cashOnDelivery !== false}
                                                onChange={e => setEditingStore({
                                                    ...editingStore,
                                                    paymentMethods: { ...editingStore.paymentMethods, cashOnDelivery: e.target.checked }
                                                })}
                                                className="sr-only peer"
                                            />
                                            <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                        </label>
                                    </div>

                                    {/* Razorpay */}
                                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
                                        <div>
                                            <p className="font-medium text-slate-700">💳 Razorpay Online Payment</p>
                                            <p className="text-xs text-slate-400">Accept card/UPI via Razorpay</p>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={editingStore.paymentMethods?.razorpayEnabled || false}
                                                onChange={e => setEditingStore({
                                                    ...editingStore,
                                                    paymentMethods: { ...editingStore.paymentMethods, razorpayEnabled: e.target.checked }
                                                })}
                                                className="sr-only peer"
                                            />
                                            <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                        </label>
                                    </div>

                                    {/* UPI ID */}
                                    <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                                        <label className="block text-sm font-medium text-slate-700 mb-2">📱 UPI ID (for QR payments)</label>
                                        <input
                                            type="text"
                                            value={editingStore.paymentMethods?.upiId || ''}
                                            onChange={e => setEditingStore({
                                                ...editingStore,
                                                paymentMethods: { ...editingStore.paymentMethods, upiId: e.target.value }
                                            })}
                                            placeholder="store@upi"
                                            className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                        />
                                    </div>

                                    {/* QR Code URL */}
                                    <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                                        <label className="block text-sm font-medium text-slate-700 mb-2">📷 QR Code Image URL</label>
                                        <input
                                            type="url"
                                            value={editingStore.paymentMethods?.qrCodeUrl || ''}
                                            onChange={e => setEditingStore({
                                                ...editingStore,
                                                paymentMethods: { ...editingStore.paymentMethods, qrCodeUrl: e.target.value }
                                            })}
                                            placeholder="https://..."
                                            className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-3">
                            <button onClick={() => setEditingStore(null)} className="px-5 py-2.5 text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 text-sm font-medium transition-colors">
                                Cancel
                            </button>
                            <button onClick={handleSave} disabled={saving} className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium disabled:opacity-50 transition-colors shadow-sm">
                                {saving ? 'Saving...' : '💾 Save Changes'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
