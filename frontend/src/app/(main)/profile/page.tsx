'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import Link from 'next/link';

export default function ProfilePage() {
    const router = useRouter();
    const { isAuthenticated, user, logout } = useAuthStore();
    const [preferences, setPreferences] = useState({
        emailNotifications: true,
        whatsappNotifications: false,
        proximityAlerts: true,
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/login');
            return;
        }

        if (user?.preferences) {
            setPreferences(user.preferences);
        }
    }, [isAuthenticated, user, router]);

    const handleUpdatePreferences = async () => {
        setLoading(true);
        setMessage('');

        try {
            await api.put('/auth/preferences', preferences);
            setMessage('Preferences updated successfully!');
            setTimeout(() => setMessage(''), 3000);
        } catch (error) {
            setMessage('Failed to update preferences');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        logout();
        router.push('/login');
    };

    if (!user) return null;

    return (
        <div className="min-h-screen pb-20">
            {/* Header */}
            <header className="gradient-white border-b border-orange-100">
                <div className="max-w-4xl mx-auto px-4 py-4">
                    <h1 className="text-2xl font-bold text-gradient">Profile</h1>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 py-6">
                {/* User Info */}
                <div className="card-gradient p-6 mb-6 animate-fade-in">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-20 h-20 rounded-full gradient-orange flex items-center justify-center text-white text-3xl font-bold">
                            {user.username[0].toUpperCase()}
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-800">@{user.username}</h2>
                            <p className="text-gray-600">{user.email || user.phone}</p>
                            <span className="badge badge-primary mt-2">{user.role}</span>
                        </div>
                    </div>
                </div>

                {/* Notification Preferences */}
                <div className="card-gradient p-6 mb-6 animate-slide-up">
                    <h3 className="text-xl font-bold text-gray-800 mb-4">🔔 Notification Preferences</h3>

                    {message && (
                        <div className={`mb-4 p-3 rounded-lg ${message.includes('success') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                            }`}>
                            {message}
                        </div>
                    )}

                    <div className="space-y-4">
                        <label className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 cursor-pointer hover:border-orange-300 transition-colors">
                            <div>
                                <p className="font-semibold text-gray-800">Email Notifications</p>
                                <p className="text-sm text-gray-600">Receive updates via email</p>
                            </div>
                            <input
                                type="checkbox"
                                checked={preferences.emailNotifications}
                                onChange={(e) => setPreferences({ ...preferences, emailNotifications: e.target.checked })}
                                className="w-6 h-6 text-orange-600 rounded focus:ring-orange-500"
                            />
                        </label>

                        <label className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 cursor-pointer hover:border-orange-300 transition-colors opacity-50">
                            <div>
                                <p className="font-semibold text-gray-800">WhatsApp Notifications</p>
                                <p className="text-sm text-gray-600">Receive updates via WhatsApp (Coming Soon)</p>
                            </div>
                            <input
                                type="checkbox"
                                checked={preferences.whatsappNotifications}
                                onChange={(e) => setPreferences({ ...preferences, whatsappNotifications: e.target.checked })}
                                className="w-6 h-6 text-orange-600 rounded focus:ring-orange-500"
                                disabled
                            />
                        </label>

                        <label className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 cursor-pointer hover:border-orange-300 transition-colors">
                            <div>
                                <p className="font-semibold text-gray-800">Proximity Alerts</p>
                                <p className="text-sm text-gray-600">Get notified when near stores</p>
                            </div>
                            <input
                                type="checkbox"
                                checked={preferences.proximityAlerts}
                                onChange={(e) => setPreferences({ ...preferences, proximityAlerts: e.target.checked })}
                                className="w-6 h-6 text-orange-600 rounded focus:ring-orange-500"
                            />
                        </label>
                    </div>

                    <button
                        onClick={handleUpdatePreferences}
                        className="btn-primary w-full mt-6"
                        disabled={loading}
                    >
                        {loading ? 'Saving...' : 'Save Preferences'}
                    </button>
                </div>

                {/* Admin Panel Link */}
                {user.role === 'admin' && (
                    <Link href="/admin" className="card hover:scale-105 transition-transform p-6 mb-6 block">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-xl font-bold text-gray-800">🔧 Admin Panel</h3>
                                <p className="text-gray-600">Manage stores and users</p>
                            </div>
                            <span className="text-2xl">→</span>
                        </div>
                    </Link>
                )}

                {/* Partner Portal Link */}
                <Link href="/partner/register" className="card hover:scale-105 transition-transform p-6 mb-6 block bg-orange-50 border border-orange-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-xl font-bold text-orange-800">🏪 Become a Partner</h3>
                            <p className="text-orange-600">Register your store and start selling</p>
                        </div>
                        <span className="text-2xl">→</span>
                    </div>
                </Link>

                {/* Partner Login Link */}
                <Link href="/partner/login" className="block text-center text-sm text-gray-500 hover:text-orange-600 mb-6 font-medium">
                    Already a partner? Login here
                </Link>

                {/* Logout */}
                <button
                    onClick={handleLogout}
                    className="btn-secondary w-full"
                >
                    Logout
                </button>
            </main>

            {/* Bottom Navigation */}
            <nav className="fixed bottom-0 left-0 right-0 gradient-white border-t border-orange-100 glass-effect z-50">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="flex justify-around py-3">
                        <Link href="/home" className="flex flex-col items-center gap-1 transition-all hover:scale-110">
                            <span className="text-2xl">🏪</span>
                            <span className="text-xs font-medium text-gray-600">Home</span>
                        </Link>
                        <Link href="/orders" className="flex flex-col items-center gap-1 transition-all hover:scale-110">
                            <span className="text-2xl">📦</span>
                            <span className="text-xs font-medium text-gray-600">Orders</span>
                        </Link>
                        <Link href="/map" className="flex flex-col items-center gap-1 transition-all hover:scale-110">
                            <span className="text-2xl">🗺️</span>
                            <span className="text-xs font-medium text-gray-600">Map</span>
                        </Link>
                        <Link href="/profile" className="flex flex-col items-center gap-1 transition-all">
                            <span className="text-2xl">👤</span>
                            <span className="text-xs font-semibold text-orange-600">Profile</span>
                        </Link>
                    </div>
                </div>
            </nav>
        </div>
    );
}
